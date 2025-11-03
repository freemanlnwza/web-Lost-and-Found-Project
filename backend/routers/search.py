from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
import torch
from utils import get_image_embedding, get_text_embedding, cosine_similarity  # ✅ ใช้ fine-tuned CLIP จาก utils.py
from crud import encode_image
from database import get_db
import models, schemas, crud
from transformers import MarianMTModel, MarianTokenizer

device = "cuda" if torch.cuda.is_available() else "cpu"

translation_model_name = "Helsinki-NLP/opus-mt-th-en"
trans_tokenizer = MarianTokenizer.from_pretrained(translation_model_name)
trans_model = MarianMTModel.from_pretrained(translation_model_name).to(device)

router = APIRouter(prefix="/api", tags=["Search"])

def translate_to_english(text: str):
    if any('\u0E00' <= ch <= '\u0E7F' for ch in text):
        inputs = trans_tokenizer(text, return_tensors="pt", padding=True).to(device)
        with torch.no_grad():
            translated = trans_model.generate(**inputs)
        text = trans_tokenizer.decode(translated[0], skip_special_tokens=True)
    return text

@router.post("/search", response_model=list[schemas.ItemOut])
async def search_items(
    text: str = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    top_k: int = Form(5)
):
    if not text and not image:
        raise HTTPException(status_code=400, detail="Provide text or image for search")

    # translate if needed
    if text:
        if any('\u0E00' <= ch <= '\u0E7F' for ch in text):
            inputs = trans_tokenizer(text, return_tensors="pt", padding=True).to(device)
            with torch.no_grad():
                translated = trans_model.generate(**inputs)
            text = trans_tokenizer.decode(translated[0], skip_special_tokens=True)

        # get text embedding (from utils — ensure utils loads finetuned model)
        query_emb = get_text_embedding(text)
        use_text = True
        print("[INFO] Query text (after translate):", text)
    else:
        image_bytes = await image.read()
        query_emb = get_image_embedding(image_bytes)
        use_text = False

    # fetch a reasonable candidate set first (reduce DB cost)
    items = db.query(models.Item).limit(100).all()

    results = []
    query_lower = text.lower() if text else None

    # small epsilon so we never kill sim to 0 completely when there's no text match
    EPS = 0.15

    for i in items:
        item_emb = i.text_embedding if use_text else i.image_embedding
        sim = cosine_similarity(query_emb, item_emb)

        # If text search: softly adjust (don't zero-out)
        if query_lower and use_text:
            combined_text = " ".join(filter(None, [i.title, i.type, i.category])).lower()
            # simple exact-word match factor
            query_words = [w for w in query_lower.split() if w.strip()]
            if len(query_words) == 0:
                match_factor = 0.0
            else:
                match_factor = sum(1 for w in query_words if w in combined_text) / len(query_words)

            # soft scaling: keep a floor (EPS) to preserve embedding signal
            scale = EPS + (1.0 - EPS) * match_factor
            sim = sim * scale

            # debug (optional)
            # print(f"[DEBUG] id={i.id} match_factor={match_factor:.3f} scale={scale:.3f} sim_adj={sim:.4f}")

        results.append({
            "id": i.id, "title": i.title, "type": i.type, "category": i.category,
            "image_data": encode_image(i.image_data, i.image_content_type),
            "boxed_image_data": encode_image(i.boxed_image_data, i.image_content_type),
            "image_filename": i.image_filename,
            "user_id": i.user_id,
            "username": i.user.username if i.user else None,
            "similarity": round(sim, 4)
        })

    # sort and return top_k
    results = sorted(results, key=lambda x: x["similarity"], reverse=True)
    return results[:top_k]
