# backend/app/routers/metadata.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import os 
from datetime import datetime , timezone 
from ..database.database import get_db
from ..database import models

from ..services.embedding_service import extract_vector_from_file_path

router = APIRouter(prefix="/api/metadata", tags=["Tab 1: Metadata & Queue"])

class SubmitCockpitMetadata(BaseModel):
    cropped_product_id: int
    user_id: Optional[int] = None
    username: Optional[str] = "anurag"

    sketch_number: Optional[str] = ""
    style_number: Optional[str] = ""
    initiation_type: Optional[str] = "Internal"
    initiation_trigger: Optional[str] = "Merchandiser"
    creative_designer: Optional[str] = "Anurag"
    concept_designer_1: Optional[str] = "Sandip"
    concept_designer_2: Optional[str] = ""

    main_category: str = "Ring"
    categories: List[str] = []
    subcategory_1: List[str] = []
    subcategory_2: List[str] = []

    metal_type: Optional[str] = "Yellow gold"
    metal_weight: Optional[float] = None
    diamond_type: Optional[str] = "LGD"
    diamond_weight: Optional[float] = None
    shapes: List[str] = []
    cuts: List[str] = []
    colour_stones: List[str] = []

    total_weight_designer_1: Optional[str] = "Raju"
    total_weight_1: Optional[float] = None
    total_weight_designer_2: Optional[str] = ""
    total_weight_2: Optional[float] = None

    customer_name: Optional[str] = "Signet"
    customer_number: Optional[str] = ""
    market: Optional[str] = "USA"
    is_exclusive: bool = False

    collection: Optional[str] = ""
    remarks: Optional[str] = ""
    assets: Optional[Dict[str, bool]] = {}

@router.get("/dropdowns/master")
def get_master_dropdowns(db: Session = Depends(get_db)):
    """Fetches all dropdowns and cascade hierarchies directly from DB rows."""
    cascade_tree = {}
    main_cats = db.query(models.MainCategory).all()

    for mc in main_cats:
        cascade_tree[mc.name] = {}
        # Query Category table directly using main_category_id
        categories = db.query(models.Category).filter(models.Category.main_category_id == mc.id).all()
        for cat in categories:
            sub1 = [s.name for s in db.query(models.Subcategory1).filter(models.Subcategory1.category_id == cat.id).all()]
            sub2 = [s.name for s in db.query(models.Subcategory2).filter(models.Subcategory2.category_id == cat.id).all()]
            cascade_tree[mc.name][cat.name] = {
                "sub1": sub1,
                "sub2": sub2,
            }

    return {
        "cascade": cascade_tree,
        "main_categories": [mc.name for mc in main_cats],
        "metals": [m.name for m in db.query(models.MetalType).all()],
        "diamonds": [d.name for d in db.query(models.DiamondType).all()],
        "shapes": [s.name for s in db.query(models.Shape).all()],
        "cuts": [c.name for c in db.query(models.Cut).all()],
        "colour_stones": [cs.name for cs in db.query(models.ColourStone).all()],
        "markets": [mkt.name for mkt in db.query(models.Market).all()],
        "designers": [des.name for des in db.query(models.Designer).all()],
        "customers": [cust.name for cust in db.query(models.Customer).all()],  # <-- Added from DB
    }

@router.get("/pending-products")
def get_pending_products(db: Session = Depends(get_db)):
    """Fetches all sketches currently waiting in the left-hand pending queue."""
    pending = (
        db.query(models.CroppedProduct)
        .filter(models.CroppedProduct.status == "PENDING")
        .order_by(models.CroppedProduct.id.asc())
        .all()
    )
    return [
        {
            "id": p.id,
            "pdf_id": p.pdf_id,
            "page_number": p.page_number,
            "image_url": f"/storage/cropped_products/{p.cropped_image_path.split(os.sep)[-1]}",
            "status": p.status
        }
        for p in pending
    ]

@router.post("/submit")
def submit_metadata(payload: SubmitCockpitMetadata, db: Session = Depends(get_db)):
    """Saves the cockpit metadata, activates the sketch, generates visual embedding, and records the audit log."""
    cropped = db.query(models.CroppedProduct).filter(models.CroppedProduct.id == payload.cropped_product_id).first()
    if not cropped:
        raise HTTPException(status_code=404, detail="Cropped sketch not found.")

    final_style = payload.style_number.strip() if payload.style_number else f"ST-{uuid.uuid4().hex[:6].upper()}"

    metadata_entry = models.ProductMetadata(
        cropped_product_id=payload.cropped_product_id,
        sketch_number=payload.sketch_number or f"SK-{cropped.id}",
        style_number=final_style,
        initiation_type=payload.initiation_type,
        initiation_trigger=payload.initiation_trigger,
        creative_designer=payload.creative_designer,
        concept_designer_1=payload.concept_designer_1,
        concept_designer_2=payload.concept_designer_2,
        main_category=payload.main_category,
        categories=payload.categories,
        subcategory_1=payload.subcategory_1,
        subcategory_2=payload.subcategory_2,
        metal_type=payload.metal_type,
        metal_weight=payload.metal_weight,
        diamond_type=payload.diamond_type,
        diamond_weight=payload.diamond_weight,
        shapes=payload.shapes,
        cuts=payload.cuts,
        colour_stones=payload.colour_stones,
        total_weight_designer_1=payload.total_weight_designer_1,
        total_weight_1=payload.total_weight_1,
        total_weight_designer_2=payload.total_weight_designer_2,
        total_weight_2=payload.total_weight_2,
        customer_name=payload.customer_name,
        customer_number=payload.customer_number,
        market=payload.market,
        is_exclusive=payload.is_exclusive,
        collection=payload.collection,
        remarks=payload.remarks,
        assets=payload.assets
    )

    db.add(metadata_entry)
    cropped.status = "ACTIVE"

    # Automatically generate visual vector embedding
    if cropped.cropped_image_path and os.path.exists(cropped.cropped_image_path):
        existing_emb = db.query(models.ProductEmbedding).filter_by(cropped_product_id=cropped.id).first()
        if not existing_emb:
            try:
                vector = extract_vector_from_file_path(cropped.cropped_image_path)
                db.add(
                    models.ProductEmbedding(
                        cropped_product_id=cropped.id,
                        embedding_vector=vector.tobytes(),
                        model_version="resnet18-v1",
                    )
                )
            except Exception as e:
                # Log warning so metadata submission succeeds even if image reading fails
                print(f"Warning: Could not auto-generate embedding for Crop #{cropped.id}: {e}")

    # Audit Trail
    audit = models.AuditLog(
        user_id=payload.user_id,
        username=payload.username,
        action="ACTIVATE_SKETCH",
        style_number=final_style,
        details=f"Tagged {payload.main_category} sketch #{cropped.id}"
    )
    db.add(audit)

    db.commit()
    return {"message": "Success", "style_number": final_style, "id": metadata_entry.id}



@router.put("/products/{metadata_id}")
def update_product_metadata(
    metadata_id: int,
    payload: SubmitCockpitMetadata,
    db: Session = Depends(get_db),
):
    """Updates an existing active product's metadata and logs the audit trail."""
    record = db.query(models.ProductMetadata).filter(models.ProductMetadata.id == metadata_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Product metadata not found.")

    # Apply updates
    record.sketch_number = payload.sketch_number
    record.style_number = payload.style_number
    record.initiation_type = payload.initiation_type
    record.initiation_trigger = payload.initiation_trigger
    record.creative_designer = payload.creative_designer
    record.concept_designer_1 = payload.concept_designer_1
    record.concept_designer_2 = payload.concept_designer_2
    record.main_category = payload.main_category
    record.categories = payload.categories
    record.subcategory_1 = payload.subcategory_1
    record.subcategory_2 = payload.subcategory_2
    record.metal_type = payload.metal_type
    record.metal_weight = payload.metal_weight
    record.diamond_type = payload.diamond_type
    record.diamond_weight = payload.diamond_weight
    record.shapes = payload.shapes
    record.cuts = payload.cuts
    record.colour_stones = payload.colour_stones
    record.total_weight_designer_1 = payload.total_weight_designer_1
    record.total_weight_1 = payload.total_weight_1
    record.total_weight_designer_2 = payload.total_weight_designer_2
    record.total_weight_2 = payload.total_weight_2
    record.customer_name = payload.customer_name
    record.customer_number = payload.customer_number
    record.market = payload.market
    record.is_exclusive = payload.is_exclusive
    record.collection = payload.collection
    record.remarks = payload.remarks
    record.assets = payload.assets
    record.updated_at = datetime.now(timezone.utc)

    # Audit Trail
    audit = models.AuditLog(
        user_id=payload.user_id,
        username=payload.username,
        action="UPDATE_METADATA",
        style_number=record.style_number,
        details=f"Updated metadata for style {record.style_number} by {payload.username}",
    )
    db.add(audit)

    db.commit()
    db.refresh(record)
    return {"message": "Updated successfully", "style_number": record.style_number}