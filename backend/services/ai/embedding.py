"""
Embedding Module
================
Generates face embeddings using the selected recognition model.

Currently uses InsightFace buffalo_l (ArcFace) as the primary model,
which provides state-of-the-art accuracy with 512-D embeddings.

Features:
- Generates normalized embeddings from face images
- Multiple model support (insightface primary)
- Inference timing
- Embedding validation
"""
import os
import sys
import time
import numpy as np
from contextlib import redirect_stdout, redirect_stderr

# Suppress verbose logging
os.environ['GLOG_minloglevel'] = '3'


def init_model(model_type='insightface', model_name='buffalo_l'):
    """
    Initialize the face recognition model.
    
    Args:
        model_type: 'insightface' (primary), 'adaface', 'magface'
        model_name: Model name within the type
    
    Returns:
        (model, embedding_dim, error_message)
    """
    if model_type == 'insightface':
        return _init_insightface(model_name)
    else:
        # Fallback to insightface
        return _init_insightface('buffalo_l')


def _init_insightface(model_name='buffalo_l'):
    """Initialize InsightFace model. All init logging goes to stderr, never stdout."""
    import insightface
    from insightface.app import FaceAnalysis
    
    try:
        # Redirect all stdout during model init to prevent breaking JSON output
        with open(os.devnull, 'w') as devnull:
            with redirect_stdout(devnull):
                app = FaceAnalysis(
                    name=model_name,
                    root=os.path.join(os.path.expanduser("~"), ".insightface"),
                    providers=['CPUExecutionProvider']
                )
                app.prepare(ctx_id=0, det_size=(640, 640))
        return app, 512, None
    except Exception as e:
        return None, 0, f"Failed to initialize InsightFace {model_name}: {str(e)}"


def get_embedding(app, image_rgb):
    """
    Generate a normalized embedding for the largest face in the image.
    
    Args:
        app: Initialized FaceAnalysis instance
        image_rgb: RGB image as numpy array
    
    Returns:
        (embedding_list, embedding_norm, inference_time_ms, error_message)
        embedding_list: 512-D normalized embedding
        embedding_norm: L2 norm of the embedding (should be ~1.0)
    """
    try:
        faces = app.get(image_rgb)
    except Exception as e:
        return None, 0, 0, f"Face detection/recognition error: {str(e)}"
    
    if not faces:
        return None, 0, 0, "No face detected in image."
    
    # Select the largest face
    face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
    
    t0 = time.time()
    
    # Get the embedding (normed_embedding is already L2-normalized)
    if hasattr(face, 'normed_embedding') and face.normed_embedding is not None:
        embedding = face.normed_embedding.astype(np.float32)
    elif hasattr(face, 'embedding') and face.embedding is not None:
        embedding = face.embedding.astype(np.float32)
        # L2 normalize
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
    else:
        return None, 0, 0, "No embedding found in face data."
    
    inference_time = (time.time() - t0) * 1000
    
    # Verify normalization
    embedding_norm = float(np.linalg.norm(embedding))
    
    # Get face size info
    bbox = face.bbox.astype(int)
    face_size = (bbox[2] - bbox[0], bbox[3] - bbox[1])
    
    return embedding.tolist(), embedding_norm, round(inference_time, 2), None, face_size


def get_embeddings_batch(app, image_paths):
    """
    Generate embeddings for multiple images.
    
    Args:
        app: Initialized FaceAnalysis instance
        image_paths: List of image paths
    
    Returns:
        List of dicts with embedding results
    """
    import cv2
    
    results = []
    for path in image_paths:
        if not os.path.exists(path):
            results.append({
                "image_path": path,
                "error": f"File not found: {path}",
                "embedding": None,
            })
            continue
        
        try:
            img = cv2.imread(path)
            if img is None:
                results.append({
                    "image_path": path,
                    "error": "Could not read image",
                    "embedding": None,
                })
                continue
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        except Exception as e:
            results.append({
                "image_path": path,
                "error": str(e),
                "embedding": None,
            })
            continue
        
        emb, norm, inf_time, error, face_size = get_embedding(app, img_rgb)
        
        results.append({
            "image_path": path,
            "embedding": emb,
            "norm": norm,
            "inference_time_ms": inf_time,
            "error": error,
            "face_size": face_size,
        })
    
    return results