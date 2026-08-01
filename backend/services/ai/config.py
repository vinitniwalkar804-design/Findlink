"""
FindLink AI Configuration
=========================
Central configuration for the face recognition pipeline.
"""

import os

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, '..', '..', 'uploads')
FAISS_DIR = os.path.join(BASE_DIR, '..', '..', 'faiss_index')
INSIGHTFACE_ROOT = os.path.join(os.path.expanduser("~"), ".insightface")

# Ensure directories exist
os.makedirs(FAISS_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

# FAISS Index paths
FAISS_INDEX_PATH = os.path.join(FAISS_DIR, 'faiss.index')
FAISS_ID_MAP_PATH = os.path.join(FAISS_DIR, 'id_map.json')
FAISS_METADATA_PATH = os.path.join(FAISS_DIR, 'metadata.json')

# Embedding dimension (all supported models use 512-D)
EMBEDDING_DIM = 512

# Similarity thresholds
THRESHOLD_MATCH = 0.60     # Cosine similarity >= 0.60 → MATCH
THRESHOLD_POSSIBLE = 0.45  # Cosine similarity 0.45-0.59 → POSSIBLE
THRESHOLD_LOW = 0.30       # Cosine similarity 0.30-0.44 → LOW

# Quality thresholds
BLUR_THRESHOLD = 50.0      # Laplacian variance below this → blurry
MIN_FACE_SIZE = 80         # Minimum face dimension in pixels

# Top K results
TOP_K = 5

# Model selection - can be 'insightface', 'adaface', 'magface'
# Default to insightface buffalo_l which is installed
SELECTED_MODEL = os.environ.get('FACE_MODEL', 'insightface')
MODEL_NAME = os.environ.get('FACE_MODEL_NAME', 'buffalo_l')
EMBEDDING_VERSION = os.environ.get('FACE_EMBEDDING_VERSION', 'v2')

# Detection model
DETECTION_MODEL = 'retinaface'
DETECTION_SIZE = (640, 640)