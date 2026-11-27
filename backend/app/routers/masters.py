# backend/app/routers/masters.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database.database import get_db
from ..database import models

router = APIRouter(prefix="/api/masters", tags=["Master Dropdowns"])

ENTITY_MAP = {
    "designers": models.Designer,
    "main_categories": models.MainCategory,
    "categories": models.Category,
    "subcategories_1": models.Subcategory1,
    "subcategories_2": models.Subcategory2,
    "metal_types": models.MetalType,
    "diamond_types": models.DiamondType,
    "shapes": models.Shape,
    "cuts": models.Cut,
    "colour_stones": models.ColourStone,
    "customer_numbers": models.CustomerNumber,
    "markets": models.Market,
}

class MasterItemPayload(BaseModel):
    name: str
    short_code: Optional[str] = None
    main_category_id: Optional[int] = None
    category_id: Optional[int] = None

def get_model(entity: str):
    model = ENTITY_MAP.get(entity)
    if not model:
        raise HTTPException(status_code=404, detail=f"Unknown master entity: {entity}")
    return model

@router.get("/{entity}")
def list_items(entity: str, db: Session = Depends(get_db)):
    model = get_model(entity)
    rows = db.query(model).order_by(model.id.asc()).all()
    result = []
    for r in rows:
        item = {"id": r.id, "name": r.name}
        if hasattr(r, "short_code"):
            item["short_code"] = r.short_code or ""
        if hasattr(r, "main_category_id"):
            item["main_category_id"] = r.main_category_id
        if hasattr(r, "category_id"):
            item["category_id"] = r.category_id
        result.append(item)
    return result

@router.post("/{entity}")
def create_item(entity: str, payload: MasterItemPayload, db: Session = Depends(get_db)):
    model = get_model(entity)
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Name cannot be empty.")

    kwargs = {"name": clean_name}
    if hasattr(model, "short_code"):
        kwargs["short_code"] = (payload.short_code or "").strip().upper() or None
    if hasattr(model, "main_category_id") and payload.main_category_id:
        kwargs["main_category_id"] = payload.main_category_id
    if hasattr(model, "category_id") and payload.category_id:
        kwargs["category_id"] = payload.category_id

    obj = model(**kwargs)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return {"id": obj.id, "name": obj.name}

@router.put("/{entity}/{item_id}")
def update_item(entity: str, item_id: int, payload: MasterItemPayload, db: Session = Depends(get_db)):
    model = get_model(entity)
    obj = db.query(model).filter(model.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Item not found.")

    obj.name = payload.name.strip()
    if hasattr(obj, "short_code"):
        obj.short_code = (payload.short_code or "").strip().upper() or None
    if hasattr(obj, "main_category_id") and payload.main_category_id is not None:
        obj.main_category_id = payload.main_category_id
    if hasattr(obj, "category_id") and payload.category_id is not None:
        obj.category_id = payload.category_id

    db.commit()
    return {"message": "Updated", "id": obj.id}

@router.delete("/{entity}/{item_id}")
def delete_item(entity: str, item_id: int, db: Session = Depends(get_db)):
    model = get_model(entity)
    obj = db.query(model).filter(model.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Item not found.")
    db.delete(obj)
    db.commit()
    return {"message": "Deleted"}