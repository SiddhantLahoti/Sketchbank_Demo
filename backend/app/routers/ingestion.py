# backend/app/routers/ingestion.py
import os
import shutil
import uuid
from PIL import Image
from pdf2image import convert_from_path
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

from ..database.database import get_db
from ..database import models
from ..services.vision import detect_sketches

router = APIRouter(prefix="/api/ingestion", tags=["Tab 1: Ingestion & Autocropping"])

# 1. Base storage location on T: drive from .env
BASE_STORAGE = os.getenv("STORAGE_DIR", "storage")
RAW_UPLOADS_DIR = os.path.join(BASE_STORAGE, "raw_uploads")
TEMP_PAGES_DIR = os.path.join(BASE_STORAGE, "temp_pages")
CROPPED_DIR = os.path.join(BASE_STORAGE, "cropped_products")

os.makedirs(RAW_UPLOADS_DIR, exist_ok=True)
os.makedirs(TEMP_PAGES_DIR, exist_ok=True)
os.makedirs(CROPPED_DIR, exist_ok=True)

class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int

class ConfirmCropsRequest(BaseModel):
    file_id: Optional[int] = None
    page_number: int = 1
    page_image_path: str
    boxes: List[BoundingBox]
    user_id: Optional[int] = None

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["pdf", "png", "jpg", "jpeg"]:
        raise HTTPException(status_code=400, detail="Only PDF, PNG, JPG, and JPEG files are supported.")

    unique_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    saved_file_path = os.path.normpath(os.path.join(RAW_UPLOADS_DIR, unique_filename))

    # Force Windows to create raw_uploads on T: drive right before writing
    os.makedirs(os.path.dirname(saved_file_path), exist_ok=True)

    with open(saved_file_path, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)

    upload_record = models.UploadedPDF(
        file_name=file.filename,
        file_path=saved_file_path,
        uploaded_by_user_id=user_id
    )
    db.add(upload_record)
    db.commit()
    db.refresh(upload_record)

    page_results = []
    if ext == "pdf":
        pages = convert_from_path(saved_file_path, dpi=150)
    else:
        pages = [Image.open(saved_file_path).convert("RGB")]

    for page_num, page_image in enumerate(pages, start=1):
        print(f"[Ingestion] Detecting sketches on page {page_num}/{len(pages)}...")
        temp_page_name = f"{upload_record.id}_page_{page_num}.png"
        temp_page_path = os.path.normpath(os.path.join(TEMP_PAGES_DIR, temp_page_name))
        
        # Force Windows to create temp_pages on T: drive right before writing
        os.makedirs(os.path.dirname(temp_page_path), exist_ok=True)
        page_image.save(temp_page_path, "PNG")

        detected_boxes = detect_sketches(page_image)

        page_results.append({
            "page_number": page_num,
            "page_image_path": temp_page_path,
            "page_image_url": f"/storage/temp_pages/{temp_page_name}",
            "original_width": page_image.width,
            "original_height": page_image.height,
            "boxes": detected_boxes
        })

    return {
        "file_id": upload_record.id,
        "filename": file.filename,
        "total_pages": len(page_results),
        "pages": page_results
    }

@router.post("/confirm-crops")
async def confirm_crops(payload: ConfirmCropsRequest, db: Session = Depends(get_db)):
    if not os.path.exists(payload.page_image_path):
        raise HTTPException(status_code=404, detail="Source page image not found on server.")

    full_page = Image.open(payload.page_image_path)
    created_crops = []

    for box in payload.boxes:
        cropped = full_page.crop((box.x1, box.y1, box.x2, box.y2))
        crop_filename = f"crop_{uuid.uuid4().hex[:8]}.png"
        crop_path = os.path.normpath(os.path.join(CROPPED_DIR, crop_filename))
        
        # Ensure cropped_products folder exists on T: drive before saving
        os.makedirs(os.path.dirname(crop_path), exist_ok=True)
        
        cropped.save(crop_path, "PNG")

        crop_entry = models.CroppedProduct(
            pdf_id=payload.file_id,
            page_number=payload.page_number,
            cropped_image_path=crop_path,
            status="PENDING",
            created_by_user_id=payload.user_id
        )
        db.add(crop_entry)
        db.flush()

        created_crops.append({
            "id": crop_entry.id,
            "image_url": f"/storage/cropped_products/{crop_filename}",
            "status": crop_entry.status
        })

    db.commit()
    return {
        "message": f"Successfully cropped {len(created_crops)} items.",
        "crops": created_crops
    }