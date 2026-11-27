# backend/app/routers/metadata.py
from fastapi import APIRouter, Depends, HTTPException , BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
import os
from datetime import datetime, date, timezone
import re
import threading

from ..database.database import get_db , SessionLocal
from ..database import models
from ..services.embedding_service import extract_vector_from_file_path

router = APIRouter(prefix="/api/metadata", tags=["Tab 1: Metadata & Queue"])


class SubmitCockpitMetadata(BaseModel):
    cropped_product_id: int
    user_id: Optional[int] = None
    username: Optional[str] = "anurag"
    is_backlog: bool = False
    sketch_number: Optional[str] = ""
    auto_generate_sketch: bool = True
    sketch_date: Optional[date] = None
    grade: Optional[str] = None

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

    customer_number: Optional[str] = ""
    market: Optional[str] = "USA"
    is_exclusive: bool = False

    collection: Optional[str] = ""
    remarks: Optional[str] = ""
    assets: Optional[Dict[str, bool]] = {}


def format_diamond_wt(wt: Optional[float]) -> str:
    """Converts diamond weight (e.g. 0.50 -> '050', 1.25 -> '125')."""
    if wt is None:
        return "000"
    return f"{int(round(wt * 100)):03d}"


def build_sketch_number(
    db: Session,
    sketch_date: date,
    main_category_name: str,
    first_category_name: Optional[str],
    serial_num: int,
    diamond_weight: Optional[float],
) -> str:
    """Builds SM LD [YearChar][ProdCode][5DigitSerial]-[DiaWt][SalesCode]."""
    year_offset = sketch_date.year - 2024
    year_char = chr(max(ord("A"), ord("Z") - year_offset))

    mc = db.query(models.MainCategory).filter_by(name=main_category_name).first()
    prod_code = (mc.short_code or "") if mc else ""

    sales_code = ""
    if first_category_name and mc:
        cat = (
            db.query(models.Category)
            .filter_by(name=first_category_name, main_category_id=mc.id)
            .first()
        )
        sales_code = (cat.short_code or "") if cat else ""

    dia_str = format_diamond_wt(diamond_weight)
    return f"SM LD {year_char}{prod_code}{serial_num:05d}-{dia_str}{sales_code}"

_embedding_lock = threading.Lock()

def extract_serial_from_sketch(sketch_str: str, fallback: int) -> int:
    """Extracts the 5-digit serial before '-' (e.g. 'SM LD ZE00006-050HP' -> 6)."""
    match = re.search(r"(\d{5})-", sketch_str or "")
    return int(match.group(1)) if match else fallback

def generate_embedding_background(cropped_product_id: int, image_path: str):
    """Runs SigLIP 2 sequentially in the background with its own DB session."""
    if not image_path or not os.path.exists(image_path):
        return
    with _embedding_lock:
        db = SessionLocal()
        try:
            exists = (
                db.query(models.ProductEmbedding)
                .filter_by(cropped_product_id=cropped_product_id)
                .first()
            )
            if exists:
                return
            vector = extract_vector_from_file_path(image_path)
            db.add(
                models.ProductEmbedding(
                    cropped_product_id=cropped_product_id,
                    embedding_vector=vector.tobytes(),
                    model_version="siglip2-so400m-v1",
                )
            )
            db.commit()
        except Exception as e:
            print(f"Background embedding error for Crop #{cropped_product_id}: {e}")
        finally:
            db.close()
            
            
@router.get("/next-serial")
def get_next_serial(db: Session = Depends(get_db)):
    """Returns the next serial integer for live UI preview."""
    last_serial = db.query(func.max(models.ProductMetadata.serial_number)).scalar() or 0
    return {"next_serial": last_serial + 1}


@router.get("/dropdowns/master")
def get_master_dropdowns(db: Session = Depends(get_db)):
    """Fetches all dropdowns, cascade hierarchies, and short codes from DB."""
    cascade_tree = {}
    main_category_codes = {}
    category_codes = {}

    main_cats = db.query(models.MainCategory).order_by(models.MainCategory.id.asc()).all()

    for mc in main_cats:
        cascade_tree[mc.name] = {}
        main_category_codes[mc.name] = mc.short_code or ""
        category_codes[mc.name] = {}

        categories = (
            db.query(models.Category)
            .filter(models.Category.main_category_id == mc.id)
            .order_by(models.Category.id.asc())
            .all()
        )
        for cat in categories:
            category_codes[mc.name][cat.name] = cat.short_code or ""
            sub1 = [
                s.name
                for s in db.query(models.Subcategory1)
                .filter(models.Subcategory1.category_id == cat.id)
                .all()
            ]
            sub2 = [
                s.name
                for s in db.query(models.Subcategory2)
                .filter(models.Subcategory2.category_id == cat.id)
                .all()
            ]
            cascade_tree[mc.name][cat.name] = {
                "sub1": sub1,
                "sub2": sub2,
            }

    return {
        "cascade": cascade_tree,
        "main_categories": [mc.name for mc in main_cats],
        "main_category_codes": main_category_codes,
        "category_codes": category_codes,
        "metals": [m.name for m in db.query(models.MetalType).all()],
        "diamonds": [d.name for d in db.query(models.DiamondType).all()],
        "shapes": [s.name for s in db.query(models.Shape).all()],
        "cuts": [c.name for c in db.query(models.Cut).all()],
        "colour_stones": [cs.name for cs in db.query(models.ColourStone).all()],
        "markets": [mkt.name for mkt in db.query(models.Market).all()],
        "designers": [des.name for des in db.query(models.Designer).all()],
        "customer_numbers": [cn.name for cn in db.query(models.CustomerNumber).all()],
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
            "status": p.status,
        }
        for p in pending
    ]


@router.post("/submit")
def submit_metadata(payload: SubmitCockpitMetadata,background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Saves metadata, generates multi-user-safe sketch number, activates sketch, and generates embedding."""
    cropped = (
        db.query(models.CroppedProduct)
        .filter(models.CroppedProduct.id == payload.cropped_product_id)
        .first()
    )
    if not cropped:
        raise HTTPException(status_code=404, detail="Cropped sketch not found.")

    if not payload.is_backlog:
        required_checks = {
            "Sketch Date": payload.sketch_date,
            "Grade": payload.grade,
            "Initiation Trigger": payload.initiation_trigger,
            "Creative Designer": payload.creative_designer,
            "Concept Designer 1": payload.concept_designer_1,
            "Main Category": payload.main_category,
            "Category": payload.categories,
            "Metal Type": payload.metal_type,
            "Metal Weight": payload.metal_weight,
            "Diamond Type": payload.diamond_type,
            "Diamond Weight": payload.diamond_weight,
            "Customer Number": payload.customer_number,
            "Market": payload.market,
        }
        missing = [
            label for label, val in required_checks.items()
            if val is None or (isinstance(val, (str, list)) and len(val) == 0)
        ]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing compulsory fields for daily upload: {', '.join(missing)}"
            )
            
    # Lock table briefly so simultaneous LAN submissions get sequential serial numbers
    db.execute(text("LOCK TABLE product_metadata IN SHARE ROW EXCLUSIVE MODE"))
    last_serial = db.query(func.max(models.ProductMetadata.serial_number)).scalar() or 0
    next_serial = last_serial + 1

    effective_date = payload.sketch_date or date.today()
    first_cat = payload.categories[0] if payload.categories else None

    if payload.auto_generate_sketch or not (payload.sketch_number or "").strip():
        final_sketch = build_sketch_number(
            db=db,
            sketch_date=effective_date,
            main_category_name=payload.main_category,
            first_category_name=first_cat,
            serial_num=next_serial,
            diamond_weight=payload.diamond_weight,
        )
        saved_serial = next_serial
    else:
        final_sketch = payload.sketch_number.strip()
        saved_serial = extract_serial_from_sketch(final_sketch, next_serial)

    # Check uniqueness before inserting
    duplicate = db.query(models.ProductMetadata).filter_by(sketch_number=final_sketch).first()
    if duplicate:
        raise HTTPException(status_code=400, detail=f"Sketch number '{final_sketch}' already exists.")

    final_style = (
        payload.style_number.strip()
        if payload.style_number
        else f"ST-{uuid.uuid4().hex[:6].upper()}"
    )

    metadata_entry = models.ProductMetadata(
        cropped_product_id=payload.cropped_product_id,
        serial_number=saved_serial,
        sketch_number=final_sketch,
        sketch_date=effective_date,
        grade=payload.grade,
        is_backlog=payload.is_backlog,
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
        customer_number=payload.customer_number,
        market=payload.market,
        is_exclusive=payload.is_exclusive,
        collection=payload.collection,
        remarks=payload.remarks,
        assets=payload.assets,
    )

    db.add(metadata_entry)
    cropped.status = "ACTIVE"

    if cropped.cropped_image_path:
        background_tasks.add_task(
            generate_embedding_background, cropped.id, cropped.cropped_image_path
        )

    audit = models.AuditLog(
        user_id=payload.user_id,
        username=payload.username,
        action="ACTIVATE_SKETCH",
        style_number=final_style,
        details=f"Tagged {payload.main_category} sketch #{cropped.id} ({final_sketch})",
    )
    db.add(audit)

    db.commit()
    return {
        "message": "Success",
        "sketch_number": final_sketch,
        "style_number": final_style,
        "id": metadata_entry.id,
    }


@router.put("/products/{metadata_id}")
def update_product_metadata(
    metadata_id: int,
    payload: SubmitCockpitMetadata,
    db: Session = Depends(get_db),
):
    """Updates an existing active product's metadata (including exclusivity on Edit Details)."""
    record = (
        db.query(models.ProductMetadata)
        .filter(models.ProductMetadata.id == metadata_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Product metadata not found.")

    record.sketch_number = payload.sketch_number
    if payload.sketch_date:
        record.sketch_date = payload.sketch_date
    record.grade = payload.grade
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
    record.customer_number = payload.customer_number
    record.market = payload.market
    record.is_exclusive = payload.is_exclusive
    record.collection = payload.collection
    record.remarks = payload.remarks
    record.assets = payload.assets
    record.updated_at = datetime.now(timezone.utc)

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