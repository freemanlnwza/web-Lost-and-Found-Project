from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
import numpy as np, io
import crud, models, schemas
from utils import get_text_embedding, get_image_embedding
from crud import encode_image
from database import get_db

router = APIRouter(prefix="/api", tags=["Search"])

@router.post("/search", response_model=list[schemas.ItemOut])
async def search_items(
    text: str = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    top_k: int = Form(5)
):
    if not text and not image:
        raise HTTPException(status_code=400, detail="Provide text or image for search")

    if text:
        query_emb = get_text_embedding(text)
        field = models.Item.text_embedding
    else:
        image_bytes = await image.read()
        query_emb = get_image_embedding(image_bytes)
        field = models.Item.image_embedding

    items = db.query(models.Item).order_by(field.l2_distance(query_emb)).limit(top_k).all()

    def cosine_similarity(a, b):
        a, b = np.array(a), np.array(b)
        denom = (np.linalg.norm(a) * np.linalg.norm(b))
        return float(np.dot(a, b) / denom) if denom != 0 else 0.0

    results = []
    for i in items:
        item_emb = i.text_embedding if text else i.image_embedding
        sim = cosine_similarity(query_emb, item_emb)
        results.append({
            "id": i.id,
            "title": i.title,
            "type": i.type,
            "category": i.category,
            "image_data": encode_image(i.original_image_data, i.image_content_type),  # <-- ใช้ภาพเต็ม
            "boxed_image_data": encode_image(i.boxed_image_data, "image/png"),       # ภาพกรอบยังเก็บไว้
            "original_image_data": encode_image(i.original_image_data, i.image_content_type),  # ส่งกลับด้วย
            "user_id": i.user_id,
            "username": i.user.username if i.user else None,
            "similarity": round(sim, 4)
        })
    return results
