"""
Debug script to isolate the hanging issue in face matching.
"""
import sys
import json
import os
import time

print("=== DEBUG FACE MATCH ===", flush=True)

# Step 1: Test imports
print("\n1. Testing imports...", flush=True)
try:
    import cv2
    import numpy as np
    import insightface
    from insightface.app import FaceAnalysis
    print("   ✅ All imports successful", flush=True)
except ImportError as e:
    print(f"   ❌ Import error: {e}", flush=True)
    sys.exit(1)

# Step 2: Test model initialization
print("\n2. Initializing FaceAnalysis...", flush=True)
t0 = time.time()
try:
    app = FaceAnalysis(
        name="buffalo_l",
        root=os.path.join(os.path.expanduser("~"), ".insightface"),
        providers=['CPUExecutionProvider']
    )
    app.prepare(ctx_id=0, det_size=(640, 640))
    print(f"   ✅ Model initialized in {time.time()-t0:.2f}s", flush=True)
except Exception as e:
    print(f"   ❌ Model init error: {e}", flush=True)
    sys.exit(1)

# Step 3: Test reading an image
print("\n3. Testing image read...", flush=True)
test_image = sys.argv[1] if len(sys.argv) > 1 else None
if not test_image or not os.path.exists(test_image):
    # Find a test image from uploads
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    uploads_dir = os.path.join(backend_dir, "uploads")
    for f in os.listdir(uploads_dir):
        if f.lower().endswith(('.jpg', '.jpeg', '.png')):
            test_image = os.path.join(uploads_dir, f)
            break

print(f"   Using image: {test_image}", flush=True)

if not os.path.exists(test_image):
    print(f"   ❌ Image not found: {test_image}", flush=True)
    sys.exit(1)

try:
    img = cv2.imread(test_image)
    if img is None:
        print(f"   ❌ Could not read image", flush=True)
        sys.exit(1)
    print(f"   ✅ Image read successfully: shape={img.shape}, dtype={img.dtype}", flush=True)
except Exception as e:
    print(f"   ❌ Image read error: {e}", flush=True)
    sys.exit(1)

# Step 4: Test face detection (THIS IS WHERE IT HANGS)
print("\n4. Running face detection... (may take a moment)", flush=True)
t1 = time.time()
try:
    faces = app.get(img)
    elapsed = time.time() - t1
    print(f"   ✅ Face detection completed in {elapsed:.2f}s", flush=True)
    print(f"   Faces found: {len(faces)}", flush=True)
    
    for i, face in enumerate(faces):
        bbox = face.bbox
        print(f"   Face {i+1}: bbox={bbox}, det_score={face.det_score:.4f}", flush=True)
        
        # Step 5: Test embedding extraction
        print(f"\n5. Extracting embedding for face {i+1}...", flush=True)
        t2 = time.time()
        try:
            if hasattr(face, 'normed_embedding'):
                emb = face.normed_embedding
                print(f"   ✅ normed_embedding: shape={emb.shape}, dtype={emb.dtype}", flush=True)
            elif hasattr(face, 'embedding'):
                emb = face.embedding
                print(f"   ✅ embedding: shape={emb.shape}, dtype={emb.dtype}", flush=True)
            else:
                print(f"   ❌ No embedding attribute found on face object", flush=True)
                print(f"   Face dir attributes: {[a for a in dir(face) if not a.startswith('_')]}", flush=True)
                sys.exit(1)
            print(f"   ✅ Embedding extracted in {time.time()-t2:.2f}s", flush=True)
            print(f"   Embedding (first 5 values): {emb.tolist()[:5]}", flush=True)
        except Exception as e:
            print(f"   ❌ Embedding extraction error: {e}", flush=True)
            import traceback
            traceback.print_exc()
            sys.exit(1)
except Exception as e:
    elapsed = time.time() - t1
    print(f"   ❌ Face detection error after {elapsed:.2f}s: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n✅ ALL DEBUG STEPS PASSED", flush=True)
print("The issue is NOT in Python, model loading, or embedding extraction.", flush=True)

