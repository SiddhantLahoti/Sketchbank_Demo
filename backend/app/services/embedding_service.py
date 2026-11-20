# backend/app/services/embedding_service.py
import io
import os
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import numpy as np

# 1. Image Preprocessing Pipeline
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

# 2. Singleton Model Loader (ResNet-18 Feature Extractor)
_model = None

def get_vision_model():
    global _model
    if _model is None:
        # Load weights and strip final classification layer to get raw features
        weights = models.ResNet18_Weights.DEFAULT
        resnet = models.resnet18(weights=weights)
        resnet.fc = torch.nn.Identity()
        resnet.eval()
        _model = resnet
    return _model

def extract_vector_from_image(image_bytes: bytes) -> np.ndarray:
    """Extracts a normalized 512-dim feature vector from raw image bytes."""
    model = get_vision_model()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = preprocess(image).unsqueeze(0)  # Shape: [1, 3, 224, 224]

    with torch.no_grad():
        features = model(tensor).squeeze().numpy()  # Shape: [512]

    # Normalize vector to unit length for fast cosine similarity
    norm = np.linalg.norm(features)
    if norm > 0:
        features = features / norm
    return features.astype(np.float32)

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