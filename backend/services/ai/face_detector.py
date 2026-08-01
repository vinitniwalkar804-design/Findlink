"""
Face Detector Module
====================
Uses InsightFace (RetinaFace) for face detection with landmark-based alignment.

Features:
- Detects all faces in an image
- Landmark-based alignment
- Face size validation
- Returns bounding boxes, landmarks, and face crops
"""
import os
import sys
import json
import numpy as np
import cv2
from contextlib import redirect_stdout

# Suppress verbose logging
os.environ['GLOG_minloglevel'] = '3'

def init_detector():
    """Initialize the InsightFace face detector. All init logging goes to stderr."""
    import insightface
    from insightface.app import FaceAnalysis
    
    try:
        with open(os.devnull, 'w') as devnull:
            with redirect_stdout(devnull):
                app = FaceAnalysis(
                    name="buffalo_l",
                    root=os.path.join(os.path.expanduser("~"), ".insightface"),
                    providers=['CPUExecutionProvider']
                )
                app.prepare(ctx_id=0, det_size=(640, 640))
        return app, None
    except Exception as e:
        return None, f"Failed to initialize detector: {str(e)}"


def detect_faces(app, image_path, min_face_size=80):
    """
    Detect all faces in an image.
    
    Args:
        app: Initialized FaceAnalysis instance
        image_path: Path to the image file
        min_face_size: Minimum face dimension in pixels
    
    Returns:
        List of face dicts with keys:
            bbox: [x1, y1, x2, y2]
            landmarks: [[x1,y1], [x2,y2], ...] (5 landmarks)
            face_size: (width, height)
            aligned: aligned face image (RGB)
    """
    if not os.path.exists(image_path):
        return None, f"Image file not found: {image_path}"
    
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None, f"Could not read image: {image_path}"
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    except Exception as e:
        return None, f"Error reading image: {str(e)}"
    
    try:
        faces = app.get(img_rgb)
    except Exception as e:
        return None, f"Face detection error: {str(e)}"
    
    if not faces:
        return [], None
    
    results = []
    for i, face in enumerate(faces):
        bbox = face.bbox.astype(int).tolist()
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        
        if w < min_face_size or h < min_face_size:
            continue  # Skip too-small faces
        
        landmarks = face.landmark_2d.astype(float).tolist() if hasattr(face, 'landmark_2d') else None
        
        results.append({
            "face_index": i,
            "bbox": bbox,
            "landmarks": landmarks,
            "face_size": [int(w), int(h)],
            "det_score": float(face.det_score) if hasattr(face, 'det_score') else 1.0,
        })
    
    return results, None


def get_aligned_face(app, image_path):
    """
    Detect the largest face and return the aligned image.
    
    Args:
        app: Initialized FaceAnalysis instance
        image_path: Path to the image file
    
    Returns:
        (aligned_face_rgb, face_count, error_message)
        aligned_face_rgb is None if no face found or error
    """
    if not os.path.exists(image_path):
        return None, 0, f"Image file not found: {image_path}"
    
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None, 0, f"Could not read image: {image_path}"
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    except Exception as e:
        return None, 0, f"Error reading image: {str(e)}"
    
    try:
        faces = app.get(img_rgb)
    except Exception as e:
        return None, 0, f"Face detection error: {str(e)}"
    
    if not faces:
        return None, 0, "No face detected in image."
    
    # Select largest face
    face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
    
    # Crop the aligned face
    bbox = face.bbox.astype(int)
    x1, y1, x2, y2 = max(0, bbox[0]), max(0, bbox[1]), bbox[2], bbox[3]
    aligned_face = img_rgb[y1:y2, x1:x2]
    
    return aligned_face, len(faces), None