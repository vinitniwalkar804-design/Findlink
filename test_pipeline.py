"""Quick pipeline test: store embedding, add to FAISS, search."""
import sys, os, json, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from services.ai.matcher import get_matcher
from services.ai import faiss_index

matcher = get_matcher()
uploads = os.path.join(os.path.dirname(__file__), 'backend', 'uploads')

# Test images - two likely same person from different sessions (large 196KB)
img1 = os.path.join(uploads, '1784987961417-zybev9a6vpj.jpeg')
img2 = os.path.join(uploads, '1784988690405-c7l465z36qc.jpeg')
img3 = os.path.join(uploads, '1785008943336-rb2rhp5cgwr.jpeg')  # different person (40KB)

print("=== Step 1: Generate embeddings ===")
r1 = matcher.process_store_image(img1)
print(f"  Image1 (PersonA): ok={r1['error'] is None}, norm={r1.get('embedding_norm')}")

r2 = matcher.process_store_image(img2)
print(f"  Image2 (PersonA): ok={r2['error'] is None}, norm={r2.get('embedding_norm')}")

r3 = matcher.process_store_image(img3)
print(f"  Image3 (PersonB): ok={r3['error'] is None}, norm={r3.get('embedding_norm')}")

if not all([r1.get('embedding'), r2.get('embedding'), r3.get('embedding')]):
    print("FAILED: Could not generate embeddings")
    sys.exit(1)

print("\n=== Step 2: Add to FAISS index ===")
add1 = matcher.add_to_index("person_a", [r1['embedding'], r2['embedding']], "Person A")
print(f"  Added Person A: {add1['added_count']} vectors, total={add1['total_vectors']}")

add2 = matcher.add_to_index("person_b", [r3['embedding']], "Person B")
print(f"  Added Person B: {add2['added_count']} vectors, total={add2['total_vectors']}")

print("\n=== Step 3: Search with Image1 (Person A) ===")
results = faiss_index.search_index(matcher.faiss_index, matcher.faiss_id_map, r1['embedding'], 5)
for r in results:
    label = "MATCH" if r['similarity'] >= 0.6 else ("POSSIBLE" if r['similarity'] >= 0.45 else "LOW")
    match_str = "✓ SAME" if r['person_id'] == 'person_a' else "✗ DIFF"
    print(f"  {match_str} sim={r['similarity']:.4f} [{label}] → {r['person_name']}")

print("\n=== Step 4: Search with Image3 (Person B) ===")
results2 = faiss_index.search_index(matcher.faiss_index, matcher.faiss_id_map, r3['embedding'], 5)
for r in results2:
    label = "MATCH" if r['similarity'] >= 0.6 else ("POSSIBLE" if r['similarity'] >= 0.45 else "LOW")
    match_str = "✓ SAME" if r['person_id'] == 'person_b' else "✗ DIFF"
    print(f"  {match_str} sim={r['similarity']:.4f} [{label}] → {r['person_name']}")

print("\n=== Step 5: Test via service.py (Node.js integration) ===")
os.system(f'python backend/services/ai/service.py --store "{img1}" 2>nul')
print("  Store: OK")

print("\n=== Summary ===")
debug = matcher.get_debug_info()
print(f"  Model: {debug['model']['selected']}/{debug['model']['name']}")
print(f"  FAISS: {debug['faiss']['total_vectors']} vectors, {debug['faiss']['total_persons']} persons")
print(f"  Thresholds: MATCH>={debug['thresholds']['match']}")