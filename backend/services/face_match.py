"""
Face Matching Module using InsightFace (ArcFace)

Usage modes:
  MATCH mode (default):
    python face_match.py --compare <found_photo_path> <embeddings_json> [threshold]
    embeddings_json = [{"_id": "...", "faceEmbedding": [512 floats], "fullName": "..."}, ...]

  STORE mode (compute embedding for storage):
    python face_match.py --store <image_path>
    Returns: {"embedding": [512 floats], "faceCount": N, "error": null}

  DIAGNOSE mode:
    python face_match.py --diagnose <image_path>
    Returns embedding length, norm, and first 5 values
"""

import sys
import json
import os
import contextlib
import traceback

try:
    import cv2
    import numpy as np
    import insightface
    from insightface.app import FaceAnalysis
except ImportError as e:
    result = {"error": f"Python package missing: {e}"}
    print(json.dumps(result))
    sys.exit(0)

# Suppress ONNX/InsightFace verbose logging
os.environ['GLOG_minloglevel'] = '2'


def _read_image(image_path):
    """Read an image file with validation."""
    if not os.path.exists(image_path):
        return None, f"Image file not found: {image_path}"
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None, f"Could not read image: {image_path}"
        return img, None
    except Exception as e:
        return None, f"Error reading image: {str(e)}"


def init_face_analysis():
    """Initialize InsightFace with buffalo_l model on CPU."""
    try:
        with open(os.devnull, 'w') as dn:
            with contextlib.redirect_stdout(dn):
                app = FaceAnalysis(
                    name="buffalo_l",
                    root=os.path.join(os.path.expanduser("~"), ".insightface"),
                    providers=['CPUExecutionProvider']
                )
                app.prepare(ctx_id=0, det_size=(640, 640))
        return app, None
    except Exception as e:
        return None, f"Failed to initialize InsightFace: {str(e)}"


def get_embedding(app, image_path):
    """
    Detect the largest face and return its 512-D L2-normalized embedding.
    Returns: (embedding_list, face_count, error_message)
    """
    img, err = _read_image(image_path)
    if err:
        return None, 0, err

    try:
        faces = app.get(img)
    except Exception as e:
        return None, 0, f"Face detection error: {str(e)}"

    if not faces:
        return None, 0, "No face detected in image."

    # Select largest face by bounding box area
    face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))

    embedding = (
        face.normed_embedding.tolist()
        if hasattr(face, 'normed_embedding')
        else face.embedding.tolist()
    )

    return embedding, len(faces), None


def cosine_similarity(emb1, emb2):
    """Compute cosine similarity between two L2-normalized vectors."""
    e1 = np.array(emb1, dtype=np.float32)
    e2 = np.array(emb2, dtype=np.float32)
    n1 = np.linalg.norm(e1)
    n2 = np.linalg.norm(e2)
    if n1 < 1e-10 or n2 < 1e-10:
        return 0.0
    return float(np.dot(e1, e2) / (n1 * n2))


def match_label(similarity):
    """Classify similarity into a human-readable label."""
    if similarity >= 0.50:
        return "MATCH"
    elif similarity >= 0.30:
        return "POSSIBLE"
    else:
        return "CANDIDATE"


def run_store_mode(image_path):
    """Compute and return embedding for a single image."""
    app, err = init_face_analysis()
    if err:
        return {"error": err}

    embedding, face_count, error_msg = get_embedding(app, image_path)
    if error_msg:
        return {"error": error_msg}

    return {
        "embedding": embedding,
        "faceCount": face_count,
        "error": None,
    }


def run_compare_mode(found_photo_path, missing_embeddings, threshold):
    """
    Compare found person against precomputed embeddings from MongoDB.
    Returns top 5 candidates sorted by similarity.
    """
    app, err = init_face_analysis()
    if err:
        return {"error": err}

    # Get embedding for the found person photo
    found_embedding, face_count, error_msg = get_embedding(app, found_photo_path)
    if error_msg:
        return {"error": error_msg}

    # Compare against each stored embedding
    candidates = []
    for mp in missing_embeddings:
        mp_id = mp.get("_id") or mp.get("id")
        mp_emb = mp.get("faceEmbedding")
        mp_name = mp.get("fullName", "")

        if not mp_id or not mp_emb or not isinstance(mp_emb, list):
            continue

        similarity = cosine_similarity(found_embedding, mp_emb)
        label = match_label(similarity)

        candidates.append({
            "missingPersonId": str(mp_id),
            "similarity": round(similarity, 4),
            "matchLabel": label,
            "fullName": mp_name,
            "matchRank": 0,
        })

    # Sort by similarity descending
    candidates.sort(key=lambda x: x["similarity"], reverse=True)

    # Take top 5
    top = candidates[:5]

    # Assign ranks
    for idx, c in enumerate(top):
        c["matchRank"] = idx + 1

    # Separate MATCHES from candidates for backward compatibility
    matches_only = [c for c in top if c["matchLabel"] == "MATCH"]

    return {
        "matches": matches_only,
        "candidates": top,
        "candidateCount": len(top),
        "totalCompared": len(candidates),
        "foundPersonFaces": face_count,
    }


def run_diagnose_mode(image_path):
    """Print embedding diagnostics for an image."""
    app, err = init_face_analysis()
    if err:
        return {"error": err}

    embedding, face_count, error_msg = get_embedding(app, image_path)
    if error_msg:
        return {"error": error_msg}

    norm = float(np.linalg.norm(np.array(embedding, dtype=np.float32)))
    return {
        "embeddingLength": len(embedding),
        "l2Norm": round(norm, 6),
        "faceCount": face_count,
        "firstFiveValues": [round(v, 6) for v in embedding[:5]],
        "error": None,
    }


def read_json_arg(arg):
    """
    Resolve a command-line JSON argument.

    If arg starts with '@', it is a path to a JSON file (used by the Node.js
    service to pass large embedding payloads without hitting the Windows
    command-line length limit); read and return the file contents. Otherwise
    return the raw string unchanged.
    """
    if isinstance(arg, str) and arg.startswith('@'):
        file_path = arg[1:]
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except OSError as e:
            raise ValueError(f"Could not read embeddings file {file_path}: {e}")
    return arg


def main():
    try:
        _main()
    except Exception:
        # Never hide a Python traceback: print it to stderr and emit a JSON error.
        traceback.print_exc()
        print(json.dumps({"error": "Unexpected error, see stderr traceback"}))
        sys.exit(1)


def _main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: see script header"}))
        sys.exit(0)

    mode = sys.argv[1]

    # --- STORE mode ---
    if mode == "--store":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "--store requires <image_path>"}))
            sys.exit(0)
        result = run_store_mode(sys.argv[2])
        print(json.dumps(result))
        sys.exit(0)

    # --- DIAGNOSE mode ---
    if mode == "--diagnose":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "--diagnose requires <image_path>"}))
            sys.exit(0)
        result = run_diagnose_mode(sys.argv[2])
        print(json.dumps(result))
        sys.exit(0)

    # --- COMPARE mode ---
    if mode == "--compare":
        if len(sys.argv) < 4:
            print(json.dumps({"error": "--compare requires <found_photo> <embeddings_json> [threshold]"}))
            sys.exit(0)

        found_photo_path = sys.argv[2]
        threshold = 0.50

        try:
            missing_embeddings = json.loads(read_json_arg(sys.argv[3]))
        except json.JSONDecodeError as e:
            print(json.dumps({"error": f"Invalid JSON: {str(e)}"}))
            sys.exit(0)

        if len(sys.argv) >= 5:
            try:
                threshold = float(sys.argv[4])
            except ValueError:
                pass

        result = run_compare_mode(found_photo_path, missing_embeddings, threshold)
        print(json.dumps(result))
        sys.exit(0)

    # --- Unknown mode ---
    print(json.dumps({"error": f"Unknown mode: {mode}. Use --store, --compare, or --diagnose."}))
    sys.exit(0)


if __name__ == "__main__":
    main()
