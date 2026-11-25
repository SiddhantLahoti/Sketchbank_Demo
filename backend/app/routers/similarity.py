# backend/app/routers/similarity.py
import os
from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
import numpy as np

from ..database.database import get_db
from ..database import models
from ..services.embedding_service import (
    extract_vector_from_image,
    extract_vector_from_file_path,
    compute_cosine_similarity,
    extract_vector_from_text
)

router = APIRouter(prefix="/api/similarity", tags=["Tab 5: Image Similarity"])

@router.post("/search-by-file")
async def search_by_uploaded_image(
    file: UploadFile = File(...),
    main_category: Optional[str] = Query(None, description="Filter matching styles by category"),
    min_similarity: float = Query(0.60, ge=0.0, le=1.0, description="Minimum match percentage"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Searches catalog using an external sketch, CAD render, or reference photo."""
    # 1. Extract query vector from uploaded file
    file_bytes = await file.read()
    try:
        query_vec = extract_vector_from_image(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

    # 2. Fetch catalog embeddings and join with active products
    query = (
        db.query(models.ProductEmbedding, models.CroppedProduct, models.ProductMetadata)
        .join(models.CroppedProduct, models.ProductEmbedding.cropped_product_id == models.CroppedProduct.id)
        .outerjoin(models.ProductMetadata, models.CroppedProduct.id == models.ProductMetadata.cropped_product_id)
        .filter(models.CroppedProduct.status == "ACTIVE")
    )

    if main_category and main_category.strip():
        query = query.filter(models.ProductMetadata.main_category == main_category.strip())

    records = query.all()
    if not records:
        return {"total_matches": 0, "results": []}

    # 3. Deserialize embeddings into matrix (N, 512)
    embedding_rows = []
    metadata_rows = []

    for emb, cropped, meta in records:
        vec = np.frombuffer(emb.embedding_vector, dtype=np.float32)
        embedding_rows.append(vec)
        metadata_rows.append((cropped, meta))

    catalog_matrix = np.vstack(embedding_rows)

    # 4. Compute cosine similarity in memory (<10ms)
    similarities = compute_cosine_similarity(query_vec, catalog_matrix)

    # 5. Filter, rank, and format results
    results = []
    for idx, score in enumerate(similarities):
        match_score = float(score)
        if match_score >= min_similarity:
            cropped, meta = metadata_rows[idx]
            results.append({
                "similarity_score": round(match_score * 100, 1),
                "cropped_product_id": cropped.id,
                "metadata_id": meta.id if meta else None,
                "style_number": meta.style_number if meta else "Draft",
                "sketch_number": meta.sketch_number if meta else "",
                "main_category": meta.main_category if meta else "Uncategorized",
                "metal_type": meta.metal_type if meta else "",
                "diamond_type": meta.diamond_type if meta else "",
                "creative_designer": meta.creative_designer if meta else "",
                "customer_name": meta.customer_name if meta else "",
                "image_url": f"/storage/cropped_products/{os.path.basename(cropped.cropped_image_path)}",
            })

    # Sort descending by match score
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return {
        "total_matches": len(results),
        "results": results[:limit],
    }

@router.get("/search-by-text")
def search_by_text_prompt(
    q: str = Query(..., min_length=2, description="Natural language description of jewelry"),
    main_category: Optional[str] = Query(None),
    min_similarity: float = Query(0.10, ge=0.0, le=1.0),
    limit: int = Query(24, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Searches catalog images using natural language via SigLIP 2."""
    query_vec = extract_vector_from_text(q)

    query = (
        db.query(models.ProductEmbedding, models.CroppedProduct, models.ProductMetadata)
        .join(models.CroppedProduct, models.ProductEmbedding.cropped_product_id == models.CroppedProduct.id)
        .outerjoin(models.ProductMetadata, models.CroppedProduct.id == models.ProductMetadata.cropped_product_id)
        .filter(models.CroppedProduct.status == "ACTIVE")
    )

    if main_category and main_category.strip():
        query = query.filter(models.ProductMetadata.main_category == main_category.strip())

    records = query.all()
    if not records:
        return {"total_matches": 0, "results": []}

    catalog_matrix = np.vstack([np.frombuffer(r[0].embedding_vector, dtype=np.float32) for r in records])
    similarities = compute_cosine_similarity(query_vec, catalog_matrix)

    results = []
    for idx, score in enumerate(similarities):
        match_score = float(score)
        if match_score >= min_similarity:
            _, cropped, meta = records[idx]
            results.append({
                "similarity_score": round(match_score * 100, 1),
                "cropped_product_id": cropped.id,
                "metadata_id": meta.id if meta else None,
                "style_number": meta.style_number if meta else "Draft",
                "sketch_number": meta.sketch_number if meta else "",
                "main_category": meta.main_category if meta else "Uncategorized",
                "metal_type": meta.metal_type if meta else "",
                "diamond_type": meta.diamond_type if meta else "",
                "creative_designer": meta.creative_designer if meta else "",
                "customer_name": meta.customer_name if meta else "",
                "image_url": f"/storage/cropped_products/{os.path.basename(cropped.cropped_image_path)}",
            })

    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return {"total_matches": len(results), "results": results[:limit]}


@router.get("/by-product/{cropped_product_id}")
def find_similar_to_existing_product(
    cropped_product_id: int,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Finds visually sibling designs in the catalog for an existing product."""
    target_emb = (
        db.query(models.ProductEmbedding)
        .filter(models.ProductEmbedding.cropped_product_id == cropped_product_id)
        .first()
    )
    if not target_emb:
        raise HTTPException(status_code=404, detail="Embedding not found for this product.")

    query_vec = np.frombuffer(target_emb.embedding_vector, dtype=np.float32)

    # Query all active products excluding itself
    records = (
        db.query(models.ProductEmbedding, models.CroppedProduct, models.ProductMetadata)
        .join(models.CroppedProduct, models.ProductEmbedding.cropped_product_id == models.CroppedProduct.id)
        .outerjoin(models.ProductMetadata, models.CroppedProduct.id == models.ProductMetadata.cropped_product_id)
        .filter(models.CroppedProduct.status == "ACTIVE")
        .filter(models.ProductEmbedding.cropped_product_id != cropped_product_id)
        .all()
    )

    if not records:
        return {"results": []}

    embedding_rows = [np.frombuffer(r[0].embedding_vector, dtype=np.float32) for r in records]
    catalog_matrix = np.vstack(embedding_rows)
    scores = compute_cosine_similarity(query_vec, catalog_matrix)

    results = []
    for idx, score in enumerate(scores):
        cropped, meta = records[idx][1], records[idx][2]
        results.append({
            "similarity_score": round(float(score) * 100, 1),
            "cropped_product_id": cropped.id,
            "style_number": meta.style_number if meta else "Draft",
            "sketch_number": meta.sketch_number if meta else "",
            "main_category": meta.main_category if meta else "",
            "image_url": f"/storage/cropped_products/{os.path.basename(cropped.cropped_image_path)}",
        })

    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return {"results": results[:limit]}


@router.post("/backfill")
def backfill_missing_embeddings(db: Session = Depends(get_db)):
    """Generates embeddings for any active cropped sketches missing a vector."""
    active_crops = (
        db.query(models.CroppedProduct)
        .filter(models.CroppedProduct.status == "ACTIVE")
        .all()
    )

    existing_ids = {
        row[0] for row in db.query(models.ProductEmbedding.cropped_product_id).all()
    }

    generated_count = 0
    errors = []

    for crop in active_crops:
        if crop.id in existing_ids:
            continue

        if not crop.cropped_image_path or not os.path.exists(crop.cropped_image_path):
            errors.append(f"Image not found on disk for Crop #{crop.id}")
            continue

        try:
            vector = extract_vector_from_file_path(crop.cropped_image_path)
            record = models.ProductEmbedding(
                cropped_product_id=crop.id,
                embedding_vector=vector.tobytes(),
                model_version="siglip2-base-v1",
            )
            db.add(record)
            generated_count += 1
        except Exception as e:
            errors.append(f"Error embedding Crop #{crop.id}: {str(e)}")

    db.commit()
    return {
        "message": f"Successfully backfilled embeddings for {generated_count} products.",
        "generated_count": generated_count,
        "errors": errors,
    }