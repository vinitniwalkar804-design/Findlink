"""
Quick test: embed a few images, add to FAISS, search.
"""
import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from services.ai.matcher import get_matcher
from services.ai import faiss_index
import numpy as np

matcher = get_matcher()
uploads = os.path.join(os.path.dirname(__file__), 'backend', 'uploads')

# Test with 3 images from different sessions
test_imgs = [
    '1784987961417-zybev9a6vpj.jpeg',   # large image 1
    '1785008882642-8ep5zvn090w.jpeg',   # mid image (different session)
    '1785093315868-mx4dnf8o79q.jpeg',   # large from latest session
]

# Person A: same person test (these appear to be same face)
person_a = "test_person_a"
person_b = "test_person_b"

emb_a = []
emb_b = []

for img_name in test_imgs:
    img_path = os.path.join(uploads, img_name)
    result = matcher.process_store_image(img_path)
    if result.get("embedding"):
        # Use smaller images as Person B (may be different)
        if os.path.getsize(img_path) < 150000:
            emb_b.append(result["embedding"])
            print(f"{img_name}: → Person B")
        else:
            emb_a.append(result["embedding"])
            print(f"{img_name}: → Person A")
    else:
        print(f"{img_name}: FAILED - {result.get('error')}")

# Add to index
if emb_a:
    r = matcher.add_to_index("person_a", emb_a, "Person A")
    print(f"Added Person A: {r['added_count']} embs, total={r['total_vectors']}")
if emb_b:
    r = matcher.add_to_index("person_b", emb_b, "Person B")
    print(f"Added Person B: {r['added_count']} embs, total={r['total_vectors']}")

# Search using Person A's first embedding
if emb_a:
    print("\n--- Search Person A embedding vs index ---")
    results = faiss_index.search_index(matcher.faiss_index, matcher.faiss_id_map, emb_a[0], 5)
    for r in results:
        sim = r["similarity"]
        label = "MATCH" if sim >= 0.6 else ("POSSIBLE" if sim >= 0.45 else ("LOW" if sim >= 0.30 else "NO_MATCH"))
        print(f"  sim={sim:.4f} [{label}] → {r['person_name']}")

# Debug info
debug = matcher.get_debug_info()
print(f"\nFAISS: {debug['faiss']['total_vectors']} vectors, {debug['faiss']['total_persons']} persons")
print(f"Model: {debug['model']['selected']}/{debug['model']['name']}")