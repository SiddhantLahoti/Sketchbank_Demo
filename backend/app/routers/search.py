# backend/app/routers/search.py
import os
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, cast, String
from typing import Optional, List
from ..database.database import get_db
from ..database import models

router = APIRouter(prefix="/api/search", tags=["Catalog & Textual Search"])

@router.get("/products")
def search_products(
    q: Optional[str] = Query(None, description="Free text search across style, sketch, remarks, collection"),
    main_category: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    metal_type: Optional[str] = Query(None),
    diamond_type: Optional[str] = Query(None),
    creative_designer: Optional[str] = Query(None),
    customer_name: Optional[str] = Query(None),
    market: Optional[str] = Query(None),
    is_exclusive: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.ProductMetadata, models.CroppedProduct)
        .join(models.CroppedProduct, models.ProductMetadata.cropped_product_id == models.CroppedProduct.id)
        .filter(models.CroppedProduct.status == "ACTIVE")
    )

    # 1. Global Keyword Search
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                models.ProductMetadata.style_number.ilike(term),
                models.ProductMetadata.sketch_number.ilike(term),
                models.ProductMetadata.collection.ilike(term),
                models.ProductMetadata.remarks.ilike(term),
                models.ProductMetadata.customer_name.ilike(term),
                models.ProductMetadata.customer_number.ilike(term),
            )
        )

    # 2. Strict Attribute Filters
    if main_category:
        query = query.filter(models.ProductMetadata.main_category == main_category)
    if metal_type:
        query = query.filter(models.ProductMetadata.metal_type == metal_type)
    if diamond_type:
        query = query.filter(models.ProductMetadata.diamond_type == diamond_type)
    if creative_designer:
        query = query.filter(models.ProductMetadata.creative_designer == creative_designer)
    if customer_name:
        query = query.filter(models.ProductMetadata.customer_name == customer_name)
    if market:
        query = query.filter(models.ProductMetadata.market == market)
    if is_exclusive is not None:
        query = query.filter(models.ProductMetadata.is_exclusive == is_exclusive)

    # 3. JSON Array Filters (e.g., categories)
    if category:
        query = query.filter(cast(models.ProductMetadata.categories, String).ilike(f'%"{category}"%'))

    # Pagination & Ordering
    total_count = query.count()
    results = (
        query.order_by(models.ProductMetadata.updated_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []
    for meta, cropped in results:
        items.append({
            "metadata_id": meta.id,
            "cropped_product_id": cropped.id,
            "style_number": meta.style_number,
            "sketch_number": meta.sketch_number,
            "main_category": meta.main_category,
            "categories": meta.categories or [],
            "subcategory_1": meta.subcategory_1 or [],
            "subcategory_2": meta.subcategory_2 or [],
            "metal_type": meta.metal_type,
            "metal_weight": meta.metal_weight,
            "diamond_type": meta.diamond_type,
            "diamond_weight": meta.diamond_weight,
            "shapes": meta.shapes or [],
            "cuts": meta.cuts or [],
            "colour_stones": meta.colour_stones or [],
            "creative_designer": meta.creative_designer,
            "concept_designer_1": meta.concept_designer_1,
            "concept_designer_2": meta.concept_designer_2,
            "total_weight_designer_1": meta.total_weight_designer_1,
            "total_weight_1": meta.total_weight_1,
            "total_weight_designer_2": meta.total_weight_designer_2,
            "total_weight_2": meta.total_weight_2,
            "customer_name": meta.customer_name,
            "customer_number": meta.customer_number,
            "market": meta.market,
            "is_exclusive": meta.is_exclusive,
            "collection": meta.collection,
            "remarks": meta.remarks,
            "assets": meta.assets or {},
            "image_url": f"/storage/cropped_products/{os.path.basename(cropped.cropped_image_path)}",
            "updated_at": meta.updated_at.isoformat() if meta.updated_at else None,
        })

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "products": items,
    }