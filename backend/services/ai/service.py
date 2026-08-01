"""
FindLink AI Service - CLI Entry Point
======================================
Node.js communicates with Python through this script.
All output to stdout is valid JSON.
All logging goes to stderr.

Usage:
    python service.py --store <image_path>
    python service.py --compare <found_photo_path> [top_k]
    python service.py --add <person_id> <embeddings_json> [person_name]
    python service.py --remove <person_id>
    python service.py --debug
    python service.py --rebuild-index
"""
import sys
import json
import os
import traceback

# Ensure the parent directory is in the path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.matcher import get_matcher, reset_matcher


def handle_store(image_path):
    """Process an image for storage (missing person registration)."""
    matcher = get_matcher()
    result = matcher.process_store_image(image_path)
    return result


def handle_compare(found_photo_path, top_k=5):
    """Process a found person image and search against FAISS index."""
    matcher = get_matcher()
    result = matcher.process_found_image(found_photo_path)
    return result


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


def handle_add(person_id, embeddings_json, person_name=""):
    """Add embeddings to the FAISS index."""
    try:
        embeddings = json.loads(read_json_arg(embeddings_json))
    except json.JSONDecodeError as e:
        return {"error": f"Invalid embeddings JSON: {str(e)}"}
    
    matcher = get_matcher()
    result = matcher.add_to_index(person_id, embeddings, person_name)
    return result


def handle_remove(person_id):
    """Remove a person from the FAISS index."""
    matcher = get_matcher()
    result = matcher.remove_from_index(person_id)
    return result


def handle_debug():
    """Get debug information about the face recognition system."""
    matcher = get_matcher()
    result = matcher.get_debug_info()
    return result


def handle_rebuild_index():
    """Reset the matcher (forces FAISS index reload on next call)."""
    reset_matcher()
    matcher = get_matcher()
    return {
        "status": "reloaded",
        "total_vectors": matcher.faiss_index.ntotal if matcher.faiss_index else 0,
        "total_persons": matcher.faiss_metadata.get("total_persons", 0),
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python service.py <mode> [args...]"}))
        sys.exit(0)
    
    mode = sys.argv[1]
    
    try:
        if mode == "--store":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "--store requires <image_path>"}))
                sys.exit(0)
            result = handle_store(sys.argv[2])
        
        elif mode == "--compare":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "--compare requires <found_photo_path> [top_k]"}))
                sys.exit(0)
            top_k = int(sys.argv[3]) if len(sys.argv) >= 4 else 5
            result = handle_compare(sys.argv[2], top_k)
        
        elif mode == "--add":
            if len(sys.argv) < 4:
                print(json.dumps({"error": "--add requires <person_id> <embeddings_json> [person_name]"}))
                sys.exit(0)
            person_name = sys.argv[4] if len(sys.argv) >= 5 else ""
            result = handle_add(sys.argv[2], sys.argv[3], person_name)
        
        elif mode == "--remove":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "--remove requires <person_id>"}))
                sys.exit(0)
            result = handle_remove(sys.argv[2])
        
        elif mode == "--debug":
            result = handle_debug()
        
        elif mode == "--rebuild-index":
            result = handle_rebuild_index()
        
        else:
            result = {"error": f"Unknown mode: {mode}. Use --store, --compare, --add, --remove, --debug, or --rebuild-index."}
        
        print(json.dumps(result))
    
    except Exception as e:
        # Never hide a Python traceback: print it to stderr and emit a JSON error.
        traceback.print_exc()
        print(json.dumps({"error": f"Unexpected error: {str(e)}. See stderr for full traceback."}))
        sys.exit(1)


if __name__ == "__main__":
    main()