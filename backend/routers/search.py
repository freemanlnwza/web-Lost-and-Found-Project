from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
import torch
from utils import get_image_embedding, get_text_embedding, cosine_similarity  # ✅ ใช้ fine-tuned CLIP จาก utils.py
from crud import encode_image
from database import get_db
import models, schemas, crud
from transformers import MarianMTModel, MarianTokenizer
import string

device = "cuda" if torch.cuda.is_available() else "cpu"

translation_model_name = "Helsinki-NLP/opus-mt-th-en"
trans_tokenizer = MarianTokenizer.from_pretrained(translation_model_name)
trans_model = MarianMTModel.from_pretrained(translation_model_name).to(device)

router = APIRouter(prefix="/api", tags=["Search"])

def translate_to_english(text: str):
    """แปลไทยเป็นอังกฤษ และตัด punctuation ที่ปลายคำ"""
    if any('\u0E00' <= ch <= '\u0E7F' for ch in text):
        inputs = trans_tokenizer(text, return_tensors="pt", padding=True).to(device)
        with torch.no_grad():
            translated = trans_model.generate(**inputs)
        text = trans_tokenizer.decode(translated[0], skip_special_tokens=True)
        # ตัด punctuation ที่ปลาย string
        text = text.strip().rstrip(string.punctuation)
    return text

def normalize_text(text: str) -> str:
    """Lowercase และลบ punctuation + extra spaces"""
    return text.lower().translate(str.maketrans("", "", string.punctuation)).strip()

@router.post("/search", response_model=list[schemas.ItemOut])
async def search_items(
    text: str = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    top_k: int = Form(5)
):
    if not text and not image:
        raise HTTPException(status_code=400, detail="Provide text or image for search")

    EPS = 0.15  # small epsilon so we never kill sim to 0 completely when there's no text match

    if text:
        # Keep original Thai text
        query_texts = [text]

        # translate to English if contains Thai
        if any('\u0E00' <= ch <= '\u0E7F' for ch in text):
            eng_text = translate_to_english(text)
            query_texts.append(eng_text)  # add English version

        # normalize all query texts
        query_texts = [normalize_text(t) for t in query_texts]

        # get embeddings for all versions
        query_embs = [get_text_embedding(t) for t in query_texts]
        use_text = True
        print("[INFO] Query texts:", query_texts)
    else:
        image_bytes = await image.read()
        query_embs = [get_image_embedding(image_bytes)]
        use_text = False

    # fetch a reasonable candidate set first (reduce DB cost)
    items = db.query(models.Item).limit(100).all()

    results = []

    for i in items:
        item_emb = i.text_embedding if use_text else i.image_embedding
        sims = []

        # compute similarity for all query versions (Thai + English)
        for q_emb, q_text in zip(query_embs, query_texts if use_text else [""]):
            sim = cosine_similarity(q_emb, item_emb)

            # If text search: softly adjust (don't zero-out)
            if use_text:
                combined_text = " ".join(filter(None, [i.title, i.type, i.category]))
                combined_text = normalize_text(combined_text)
                query_words = [w for w in q_text.split() if w.strip()]
                if len(query_words) == 0:
                    match_factor = 0.0
                else:
                    match_factor = sum(1 for w in query_words if w in combined_text) / len(query_words)
                scale = EPS + (1.0 - EPS) * match_factor
                sim = sim * scale

                # debug (optional)
                # print(f"[DEBUG] id={i.id} q_text={q_text} match_factor={match_factor:.3f} scale={scale:.3f} sim_adj={sim:.4f}")

            sims.append(sim)

        sim = max(sims)  # take highest similarity from all query versions

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

    # sort and return top_k
    results = sorted(results, key=lambda x: x["similarity"], reverse=True)
    return results[:top_k]
