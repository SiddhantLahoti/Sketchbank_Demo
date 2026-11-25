# backend/app/services/embedding_service.py
import io
import os
import torch
import numpy as np
from PIL import Image
from transformers import AutoProcessor, AutoModel

MODEL_ID = "google/siglip2-base-patch16-224"
_model = None
_processor = None

def get_siglip2():
    global _model, _processor
    if _model is None or _processor is None:
        _processor = AutoProcessor.from_pretrained(MODEL_ID)
        _model = AutoModel.from_pretrained(MODEL_ID)
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