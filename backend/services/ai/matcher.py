"""
Matching Module
===============
Orchestrates the full face matching pipeline:
1. Load/detect model and FAISS index on startup
2. Detect faces in query image
3. Generate embeddings
4. Search FAISS index
5. Aggregate results by person
6. Return top-5 candidates with similarity scores

All output to stdout is valid JSON. All logging goes to stderr.
"""
import os
import sys
import json
import time
import numpy as np
import cv2

from . import config
from . import face_detector
from . import quality
from . import embedding
from . import faiss_index


class FaceMatcher:
    """
    Central face matching service.
    Manages the detector, recognition model, and FAISS index lifecycle.
    """
    
    def __init__(self):
        self.detector = None
        self.model = None
        self.embedding_dim = 0
        self.faiss_index = None
        self.faiss_id_map = {}
        self.faiss_metadata = {}
        self.initialized = False
        self.init_errors = []
    
    def initialize(self):
        """Initialize all components: detector, model, FAISS index."""
        errors = []
        
        # Initialize detector
        self.detector, err = face_detector.init_detector()
        if err:
            errors.append(err)
        else:
            print(f"[AI] Detector initialized", file=sys.stderr)
        
        # Initialize recognition model
        self.model, self.embedding_dim, err = embedding.init_model(
            config.SELECTED_MODEL, config.MODEL_NAME
        )
        if err:
            errors.append(err)
        else:
            print(f"[AI] Model initialized: {config.SELECTED_MODEL}/{config.MODEL_NAME} (dim={self.embedding_dim})", file=sys.stderr)
        
        # Load FAISS index
        self.faiss_index, self.faiss_id_map, self.faiss_metadata = faiss_index.load_index()
        print(f"[AI] FAISS index loaded: {self.faiss_index.ntotal if self.faiss_index else 0} vectors, "
              f"{self.faiss_metadata.get('total_persons', 0)} persons", file=sys.stderr)
        
        if errors:
            self.init_errors = errors
            self.initialized = False
            return False
        
        self.initialized = True
        return True
    
    def process_store_image(self, image_path):
        """
        Process a single image for storage (missing person registration).
        
        Args:
            image_path: Absolute path to the image
        
        Returns:
            dict with keys: embedding, quality_score, face_count, error
        """
        if not self.initialized or not self.model:
            return {"error": "Model not initialized", "embedding": None}
        
        if not os.path.exists(image_path):
            return {"error": f"Image file not found: {image_path}", "embedding": None}
        
        # Read image
        try:
            img = cv2.imread(image_path)
            if img is None:
                return {"error": f"Could not read image: {image_path}", "embedding": None}
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        except Exception as e:
            return {"error": f"Error reading image: {str(e)}", "embedding": None}
        
        # Detect faces
        try:
            faces = self.model.get(img_rgb)
        except Exception as e:
            return {"error": f"Face detection error: {str(e)}", "embedding": None}
        
        if not faces:
            return {"error": "No face detected in image.", "embedding": None, "face_count": 0}
        
        # Select largest face
        face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
        
        # Get face crop for quality check
        bbox = face.bbox.astype(int)
        x1, y1, x2, y2 = max(0, bbox[0]), max(0, bbox[1]), bbox[2], bbox[3]
        face_crop = img_rgb[y1:y2, x1:x2]
        face_size = (x2 - x1, y2 - y1)
        
        # Quality check
        quality_result = quality.check_image_quality(face_crop, face_size)
        
        if not quality_result["is_acceptable"]:
            return {
                "error": f"Image quality too low (score: {quality_result['quality_score']}). Warnings: {quality_result['warnings']}",
                "embedding": None,
                "face_count": len(faces),
                "quality": quality_result,
            }
        
        # Get embedding
        t0 = time.time()
        if hasattr(face, 'normed_embedding') and face.normed_embedding is not None:
            emb = face.normed_embedding.astype(np.float32).tolist()
        elif hasattr(face, 'embedding') and face.embedding is not None:
            emb_raw = face.embedding.astype(np.float32)
            norm = np.linalg.norm(emb_raw)
            emb = (emb_raw / norm if norm > 0 else emb_raw).tolist()
        else:
            return {"error": "No embedding data available", "embedding": None, "face_count": len(faces)}
        
        inference_time = (time.time() - t0) * 1000
        emb_norm = float(np.linalg.norm(np.array(emb)))
        
        return {
            "embedding": emb,
            "embedding_norm": round(emb_norm, 6),
            "inference_time_ms": round(inference_time, 2),
            "face_count": len(faces),
            "quality": quality_result,
            "error": None,
        }
    
    def process_found_image(self, image_path):
        """
        Process a found person image and search against FAISS index.
        
        Args:
            image_path: Absolute path to the image
        
        Returns:
            dict with match results
        """
        if not self.initialized or not self.model:
            return {"error": "Model not initialized"}
        
        if not os.path.exists(image_path):
            return {"error": f"Image file not found: {image_path}"}
        
        # Read image
        try:
            img = cv2.imread(image_path)
            if img is None:
                return {"error": f"Could not read image: {image_path}"}
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        except Exception as e:
            return {"error": f"Error reading image: {str(e)}"}
        
        # Detect faces
        try:
            faces = self.model.get(img_rgb)
        except Exception as e:
            return {"error": f"Face detection error: {str(e)}"}
        
        if not faces:
            return {"error": "No face detected in image.", "face_count": 0}
        
        # Select largest face
        face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
        
        # Get face crop for quality check
        bbox = face.bbox.astype(int)
        x1, y1, x2, y2 = max(0, bbox[0]), max(0, bbox[1]), bbox[2], bbox[3]
        face_crop = img_rgb[y1:y2, x1:x2]
        face_size = (x2 - x1, y2 - y1)
        
        # Quality check
        quality_result = quality.check_image_quality(face_crop, face_size)
        
        # Get embedding
        t0 = time.time()
        if hasattr(face, 'normed_embedding') and face.normed_embedding is not None:
            query_embedding = face.normed_embedding.astype(np.float32)
        elif hasattr(face, 'embedding') and face.embedding is not None:
            emb_raw = face.embedding.astype(np.float32)
            norm = np.linalg.norm(emb_raw)
            query_embedding = emb_raw / norm if norm > 0 else emb_raw
        else:
            return {"error": "No embedding data available", "face_count": len(faces)}
        
        inference_time = (time.time() - t0) * 1000
        
        # Search FAISS
        search_results = faiss_index.search_index(
            self.faiss_index, self.faiss_id_map,
            query_embedding.tolist(), top_k=config.TOP_K
        )
        
        # Aggregate results by person (take best similarity per person)
        person_aggregated = {}
        for r in search_results:
            pid = r["person_id"]
            if pid not in person_aggregated or r["similarity"] > person_aggregated[pid]["similarity"]:
                person_aggregated[pid] = {
                    "person_id": pid,
                    "person_name": r["person_name"],
                    "similarity": r["similarity"],
                }
        
        # Sort by similarity descending
        candidates = sorted(person_aggregated.values(), key=lambda x: x["similarity"], reverse=True)
        
        # Assign match labels
        for idx, c in enumerate(candidates):
            c["match_rank"] = idx + 1
            if c["similarity"] >= config.THRESHOLD_MATCH:
                c["match_label"] = "MATCH"
            elif c["similarity"] >= config.THRESHOLD_POSSIBLE:
                c["match_label"] = "POSSIBLE"
            elif c["similarity"] >= config.THRESHOLD_LOW:
                c["match_label"] = "LOW"
            else:
                c["match_label"] = "NO_MATCH"
        
        query_norm = float(np.linalg.norm(query_embedding))
        
        return {
            "query_embedding_norm": round(query_norm, 6),
            "inference_time_ms": round(inference_time, 2),
            "face_count": len(faces),
            "quality": quality_result,
            "candidates": candidates[:config.TOP_K],
            "candidate_count": min(len(candidates), config.TOP_K),
            "total_searched": self.faiss_index.ntotal if self.faiss_index else 0,
            "total_persons_in_index": self.faiss_metadata.get("total_persons", 0),
            "error": None,
        }
    
    def add_to_index(self, person_id, embeddings, person_name=""):
        """
        Add a person's embeddings to the FAISS index.
        
        Args:
            person_id: MongoDB _id as string
            embeddings: List of embedding vectors
            person_name: Person's name
        
        Returns:
            dict with added_count
        """
        index, id_map, metadata, added = faiss_index.add_embeddings(
            self.faiss_index, self.faiss_id_map, self.faiss_metadata,
            person_id, embeddings, person_name
        )
        self.faiss_index = index
        self.faiss_id_map = id_map
        self.faiss_metadata = metadata
        return {"added_count": added, "total_vectors": index.ntotal}
    
    def remove_from_index(self, person_id):
        """
        Remove a person's embeddings from the FAISS index.
        
        Args:
            person_id: MongoDB _id as string
        
        Returns:
            dict with removed_count
        """
        index, id_map, metadata, removed = faiss_index.remove_person(
            self.faiss_index, self.faiss_id_map, self.faiss_metadata,
            person_id
        )
        self.faiss_index = index
        self.faiss_id_map = id_map
        self.faiss_metadata = metadata
        return {"removed_count": removed, "total_vectors": index.ntotal}
    
    def get_debug_info(self):
        """
        Get debug information about the face recognition system.
        
        Returns:
            dict with debug info
        """
        stats = faiss_index.get_index_stats(self.faiss_index, self.faiss_id_map)
        
        return {
            "model": {
                "selected": config.SELECTED_MODEL,
                "name": config.MODEL_NAME,
                "embedding_dimension": self.embedding_dim,
                "version": config.EMBEDDING_VERSION,
            },
            "faiss": stats,
            "thresholds": {
                "match": config.THRESHOLD_MATCH,
                "possible": config.THRESHOLD_POSSIBLE,
                "low": config.THRESHOLD_LOW,
            },
            "quality": {
                "blur_threshold": config.BLUR_THRESHOLD,
                "min_face_size": config.MIN_FACE_SIZE,
            },
            "initialized": self.initialized,
            "init_errors": self.init_errors,
        }


# Global singleton instance
_matcher = None

def get_matcher():
    """Get or create the global FaceMatcher singleton."""
    global _matcher
    if _matcher is None:
        _matcher = FaceMatcher()
        _matcher.initialize()
    return _matcher


def reset_matcher():
    """Reset the global matcher (e.g., after index changes)."""
    global _matcher
    _matcher = None