# backend/app/services/embedding_service.py
import io
import os
import torch
import numpy as np
from PIL import Image
from transformers import AutoProcessor, AutoModel
import glob

# Point to your local folder (can be inside backend/, project root, or via .env)
MODEL_CACHE_DIR = os.getenv(
    "SIGLIP2_MODEL_DIR",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../models--google--siglip2-so400m-patch14-384")),
)
_model = None
_processor = None


def _resolve_model_path(base_dir: str) -> str:
    """Finds the snapshot folder inside a Hugging Face models--* cache directory."""
    if os.path.exists(os.path.join(base_dir, "config.json")):
        return base_dir
    snapshots = glob.glob(os.path.join(base_dir, "snapshots", "*"))
    if snapshots:
        return snapshots[0]
    raise FileNotFoundError(f"Could not find model snapshot inside: {base_dir}")

def get_siglip2():
    global _model, _processor
    if _model is None or _processor is None:
        model_path = _resolve_model_path(MODEL_CACHE_DIR)
        _processor = AutoProcessor.from_pretrained(model_path, local_files_only=True)
        _model = AutoModel.from_pretrained(model_path, local_files_only=True)
        _model.eval()
    return _model, _processor


def extract_vector_from_image(image_bytes: bytes) -> np.ndarray:
    """Extracts a normalized 768-dim SigLIP 2 vector from raw image bytes."""
    model, processor = get_siglip2()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")

    with torch.no_grad():
        outputs = model.get_image_features(**inputs)
        features = outputs if isinstance(outputs, torch.Tensor) else outputs.pooler_output
        features = features / features.norm(dim=-1, keepdim=True)

    return features.squeeze().cpu().numpy().astype(np.float32)

def extract_vector_from_text(query_text: str) -> np.ndarray:
    """Extracts a normalized 768-dim SigLIP 2 vector from a natural language prompt."""
    model, processor = get_siglip2()
    clean_text = query_text.strip().lower()
    inputs = processor(
        text=[clean_text],
        padding="max_length",
        max_length=64,
        truncation=True,
        return_tensors="pt",
    )

    with torch.no_grad():
        outputs = model.get_text_features(**inputs)
        features = outputs if isinstance(outputs, torch.Tensor) else outputs.pooler_output
        features = features / features.norm(dim=-1, keepdim=True)

    return features.squeeze().cpu().numpy().astype(np.float32)

def extract_vector_from_file_path(file_path: str) -> np.ndarray:
    """Extracts a normalized 512-dim vector from a file on disk."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    with open(file_path, "rb") as f:
        return extract_vector_from_image(f.read())

def compute_cosine_similarity(query_vec: np.ndarray, catalog_vecs: np.ndarray) -> np.ndarray:
    """
    Computes dot-product cosine similarity between a single query vector 
    and an (N, 512) catalog matrix. Returns similarity scores in range [-1.0, 1.0].
    """
    return np.dot(catalog_vecs, query_vec)