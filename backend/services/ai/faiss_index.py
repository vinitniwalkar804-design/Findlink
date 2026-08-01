"""
FAISS Index Module
==================
Persistent FAISS vector index for fast face embedding search.

Features:
- IndexFlatIP (inner product = cosine similarity for normalized vectors)
- Persistent save/load from disk
- Add/remove/search operations
- ID mapping for MongoDB integration
- Thread-safe operations
"""
import os
import sys
import json
import numpy as np
import threading

from . import config

_lock = threading.Lock()


def create_index(dimension=512):
    """
    Create a new FAISS index using IndexFlatIP.
    For L2-normalized vectors, inner product = cosine similarity.
    
    Args:
        dimension: Embedding dimension (default: 512)
    
    Returns:
        faiss.Index instance
    """
    import faiss
    index = faiss.IndexFlatIP(dimension)
    return index


def load_index():
    """
    Load the FAISS index from disk.
    
    Returns:
        (index, id_map, metadata) or (None, None, None) if not found
    """
    import faiss
    
    if not os.path.exists(config.FAISS_INDEX_PATH):
        return None, {}, {}
    
    try:
        index = faiss.read_index(config.FAISS_INDEX_PATH)
    except Exception as e:
        print(f"Warning: Failed to load FAISS index: {e}", file=sys.stderr)
        return None, {}, {}
    
    id_map = {}
    metadata = {}
    
    if os.path.exists(config.FAISS_ID_MAP_PATH):
        try:
            with open(config.FAISS_ID_MAP_PATH, 'r') as f:
                id_map = json.load(f)
        except Exception as e:
            print(f"Warning: Failed to load ID map: {e}", file=sys.stderr)
    
    if os.path.exists(config.FAISS_METADATA_PATH):
        try:
            with open(config.FAISS_METADATA_PATH, 'r') as f:
                metadata = json.load(f)
        except Exception as e:
            print(f"Warning: Failed to load metadata: {e}", file=sys.stderr)
    
    return index, id_map, metadata


def save_index(index, id_map, metadata):
    """
    Save the FAISS index and metadata to disk.
    NOTE: Caller must already hold _lock.
    
    Args:
        index: FAISS index instance
        id_map: Dict mapping FAISS vector IDs to MongoDB person IDs
        metadata: Dict with index metadata
    """
    import faiss
    
    faiss.write_index(index, config.FAISS_INDEX_PATH)
    
    with open(config.FAISS_ID_MAP_PATH, 'w') as f:
        json.dump(id_map, f)
    
    with open(config.FAISS_METADATA_PATH, 'w') as f:
        json.dump(metadata, f)


def add_embeddings(index, id_map, metadata, person_id, embeddings, person_name=""):
    """
    Add embeddings for a person to the FAISS index.
    
    Args:
        index: FAISS index instance (may be None if not yet created)
        id_map: Dict mapping FAISS vector IDs to MongoDB person IDs
        metadata: Dict with index metadata
        person_id: MongoDB _id as string
        embeddings: List of embedding vectors (each is list of 512 floats)
        person_name: Person's full name for metadata
    
    Returns:
        (updated_index, updated_id_map, updated_metadata, added_count)
    """
    import faiss
    
    if not embeddings or len(embeddings) == 0:
        return index, id_map, metadata, 0
    
    # Create index if it doesn't exist yet
    if index is None:
        index = create_index(config.EMBEDDING_DIM)
    
    with _lock:
        current_count = index.ntotal
        
        # Convert to numpy array
        emb_array = np.array(embeddings, dtype=np.float32)
        
        # Ensure L2-normalized
        norms = np.linalg.norm(emb_array, axis=1, keepdims=True)
        emb_array = np.where(norms > 0, emb_array / norms, emb_array)
        
        # Add to index
        index.add(emb_array)
        
        # Update ID map
        for i in range(len(embeddings)):
            vector_id = current_count + i
            id_map[str(vector_id)] = {
                "person_id": person_id,
                "person_name": person_name,
                "embedding_index": i,
            }
        
        # Update metadata
        metadata["total_vectors"] = index.ntotal
        metadata["total_persons"] = len(set(
            v["person_id"] for v in id_map.values()
        ))
        metadata["dimension"] = config.EMBEDDING_DIM
        
        # Save
        save_index(index, id_map, metadata)
    
    return index, id_map, metadata, len(embeddings)


def remove_person(index, id_map, metadata, person_id):
    """
    Remove all embeddings for a person from the FAISS index.
    
    Note: FAISS does not support direct removal from IndexFlatIP.
    We rebuild the index excluding the removed person's vectors.
    
    Args:
        index: FAISS index instance (may be None)
        id_map: Dict mapping FAISS vector IDs to MongoDB person IDs
        metadata: Dict with index metadata
        person_id: MongoDB _id as string to remove
    
    Returns:
        (updated_index, updated_id_map, updated_metadata, removed_count)
    """
    import faiss
    
    if index is None:
        return None, {}, {}, 0
    
    with _lock:
        # Find vectors to keep
        vectors_to_keep = []
        new_id_map = {}
        removed_count = 0
        
        for str_id, info in id_map.items():
            if info["person_id"] == person_id:
                removed_count += 1
            else:
                vectors_to_keep.append(int(str_id))
                new_id_map[str(len(new_id_map) - 1)] = info
        
        if removed_count == 0:
            return index, id_map, metadata, 0
        
        # Reconstruct index with remaining vectors
        if len(vectors_to_keep) > 0:
            # Get all vectors
            all_vectors = np.zeros((index.ntotal, config.EMBEDDING_DIM), dtype=np.float32)
            for i in range(index.ntotal):
                x = index.reconstruct(i)
                all_vectors[i] = x
            
            # Keep only non-removed vectors
            keep_indices = [int(k) for k, v in id_map.items() if v["person_id"] != person_id]
            if keep_indices:
                remaining = all_vectors[keep_indices]
                
                # Create new index
                new_index = create_index(config.EMBEDDING_DIM)
                new_index.add(remaining)
                
                # Rebuild ID map with sequential IDs
                final_id_map = {}
                for new_idx, old_str_id in enumerate(keep_indices):
                    final_id_map[str(new_idx)] = id_map[str(old_str_id)]
                
                new_metadata = {
                    "total_vectors": new_index.ntotal,
                    "total_persons": len(set(
                        v["person_id"] for v in final_id_map.values()
                    )),
                    "dimension": config.EMBEDDING_DIM,
                }
                
                save_index(new_index, final_id_map, new_metadata)
                return new_index, final_id_map, new_metadata, removed_count
            else:
                # All vectors removed
                new_index = create_index(config.EMBEDDING_DIM)
                new_metadata = {
                    "total_vectors": 0,
                    "total_persons": 0,
                    "dimension": config.EMBEDDING_DIM,
                }
                save_index(new_index, {}, new_metadata)
                return new_index, {}, new_metadata, removed_count
        else:
            new_index = create_index(config.EMBEDDING_DIM)
            new_metadata = {
                "total_vectors": 0,
                "total_persons": 0,
                "dimension": config.EMBEDDING_DIM,
            }
            save_index(new_index, {}, new_metadata)
            return new_index, {}, new_metadata, removed_count


def search_index(index, id_map, query_embedding, top_k=5):
    """
    Search the FAISS index for the most similar embeddings.
    
    Args:
        index: FAISS index instance
        id_map: Dict mapping FAISS vector IDs to MongoDB person IDs
        query_embedding: Query embedding vector (list of 512 floats)
        top_k: Number of top results to return
    
    Returns:
        List of result dicts sorted by similarity descending
    """
    if index is None or index.ntotal == 0:
        return []
    
    import faiss
    
    # Convert query to numpy array
    query = np.array([query_embedding], dtype=np.float32)
    
    # Ensure normalized
    norm = np.linalg.norm(query)
    if norm > 0:
        query = query / norm
    
    # Search
    k = min(top_k, index.ntotal)
    distances, indices = index.search(query, k)
    
    results = []
    for i in range(k):
        vector_id = int(indices[0][i])
        similarity = float(distances[0][i])
        
        # Clamp similarity to [-1, 1] for cosine similarity
        similarity = max(-1.0, min(1.0, similarity))
        
        str_id = str(vector_id)
        info = id_map.get(str_id, {})
        
        results.append({
            "vector_id": vector_id,
            "person_id": info.get("person_id", "unknown"),
            "person_name": info.get("person_name", ""),
            "similarity": round(similarity, 4),
            "embedding_index": info.get("embedding_index", 0),
        })
    
    return results


def get_index_stats(index, id_map):
    """
    Get statistics about the FAISS index.
    
    Args:
        index: FAISS index instance
        id_map: Dict mapping FAISS vector IDs to MongoDB person IDs
    
    Returns:
        dict with index statistics
    """
    if index is None:
        return {
            "total_vectors": 0,
            "total_persons": 0,
            "dimension": config.EMBEDDING_DIM,
            "index_type": "None",
        }
    
    unique_persons = set()
    for info in id_map.values():
        unique_persons.add(info.get("person_id", ""))
    
    return {
        "total_vectors": index.ntotal,
        "total_persons": len(unique_persons),
        "dimension": config.EMBEDDING_DIM,
        "index_type": type(index).__name__,
    }