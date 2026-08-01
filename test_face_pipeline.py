"""
Complete test of the face recognition pipeline.
Tests: embedding generation, FAISS index, search, matching.
"""
import sys
import os
import json

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from services.ai.matcher import get_matcher, reset_matcher

# Initialize
matcher = get_matcher()
print(f"Initialized: {matcher.initialized}")
print(f"Model: {matcher.embedding_dim}D")

# List of test images
uploads_dir = os.path.join(os.path.dirname(__file__), 'backend', 'uploads')
test_images = [f for f in os.listdir(uploads_dir) if f.endswith(('.jpeg', '.jpg', '.png'))]
print(f"\nFound {len(test_images)} images in uploads/")

# Store embeddings for all non-zero byte images
embeddings_by_person = {
    "test_person_1": [],  # Group large images (196KB+)
    "test_person_2": [],  # Group mid-size (~108KB)
    "test_person_3": [],  # Group small (~40KB)
}

person_names = {
    "test_person_1": "Test Person 1 (Large)",
    "test_person_2": "Test Person 2 (Medium)",
    "test_person_3": "Test Person 3 (Small)",
}

for img_name in sorted(test_images):
    img_path = os.path.join(uploads_dir, img_name)
    file_size = os.path.getsize(img_path)
    
    if file_size < 100:
        print(f"  SKIP {img_name} ({file_size} bytes - too small)")
        continue
    
    result = matcher.process_store_image(img_path)
    
    if result.get("error"):
        print(f"  FAIL {img_name}: {result['error']}")
    else:
        emb = result["embedding"]
        norm = result["embedding_norm"]
        quality = result.get("quality", {}).get("quality_score", 0)
        
        # Assign to person group based on file size
        if file_size > 150000:
            group = "test_person_1"
        elif file_size > 80000:
            group = "test_person_2"
        else:
            group = "test_person_3"
        
        embeddings_by_person[group].append(emb)
        print(f"  OK   {img_name}: norm={norm:.4f}, quality={quality:.2f}, size={file_size} bytes -> {group}")

# Add embeddings to FAISS index
print("\n--- Adding to FAISS index ---")
for person_id, embs in embeddings_by_person.items():
    if embs:
        result = matcher.add_to_index(person_id, embs, person_names[person_id])
        print(f"  Added {person_id}: {result['added_count']} embeddings, total vectors: {result['total_vectors']}")

# Test search with each group
print("\n--- Testing Self-Matching ---")
# Find a test image from each group and search
for person_id, embs in embeddings_by_person.items():
    if not embs:
        continue
    
    # Use first embedding as query
    query_emb = embs[0]
    
    # Search
    import numpy as np
    from services.ai import faiss_index
    results = faiss_index.search_index(matcher.faiss_index, matcher.faiss_id_map, query_emb, top_k=5)
    
    print(f"\n  Query: {person_id} ({person_names[person_id]})")
    for r in results:
        match = "✓ SAME" if r["person_id"] == person_id else "✗ DIFF"
        print(f"    Rank {r.get('embedding_index',0)+1}: {r['person_name'][:30]:30s} sim={r['similarity']:.4f} {match}")

# Debug info
print("\n--- Debug Info ---")
debug = matcher.get_debug_info()
print(f"  Model: {debug['model']['selected']}/{debug['model']['name']}")
print(f"  FAISS: {debug['faiss']['total_vectors']} vectors, {debug['faiss']['total_persons']} persons")
print(f"  Thresholds: match>={debug['thresholds']['match']}, possible>={debug['thresholds']['possible']}")