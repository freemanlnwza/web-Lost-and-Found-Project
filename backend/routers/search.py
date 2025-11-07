from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
import string
import requests
import os
import numpy as np

from utils import get_image_embedding, get_text_embedding, cosine_similarity  # ใช้ Hugging Face Inference API
from crud import encode_image
from database import get_db
import models, schemas

HF_TOKEN = os.getenv("HF_TOKEN")

router = APIRouter(prefix="/api", tags=["Search"])

def translate_to_english(text: str):
    """Translate Thai -> English using Hugging Face Inference API"""
    if any('\u0E00' <= ch <= '\u0E7F' for ch in text):
        url = "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-th-en"
        headers = {"Authorization": f"Bearer {HF_TOKEN}"}
        payload = {"inputs": text}
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            translated_text = response.json()[0]['translation_text']
            # ตัด punctuation ที่ปลาย string
            translated_text = translated_text.strip().rstrip(string.punctuation)
            return translated_text
        else:
            print(f"[⚠️ Warning] Translation API error: {response.status_code} {response.text}")
            return text
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
        query_texts = [text]

        # translate to English if contains Thai
        if any('\u0E00' <= ch <= '\u0E7F' for ch in text):
            eng_text = translate_to_english(text)
            query_texts.append(eng_text)

        # normalize all query texts
        query_texts = [normalize_text(t) for t in query_texts]

        # get embeddings for all versions via Hugging Face API
        query_embs = [get_text_embedding(t) for t in query_texts]
        use_text = True
        print("[INFO] Query texts:", query_texts)
    else:
        image_bytes = await image.read()
        query_embs = [get_image_embedding(image_bytes)]
        use_text = False

    # fetch candidate items (limit for performance)
    items = db.query(models.Item).limit(100).all()

    results = []

    for i in items:
        item_emb = i.text_embedding if use_text else i.image_embedding
        sims = []

        # compute similarity for all query versions
        for q_emb, q_text in zip(query_embs, query_texts if use_text else [""]):
            sim = cosine_similarity(q_emb, item_emb)

            if use_text:
                combined_text = " ".join(filter(None, [i.title, i.type, i.category]))
                combined_text = normalize_text(combined_text)
                query_words = [w for w in q_text.split() if w.strip()]
                match_factor = sum(1 for w in query_words if w in combined_text) / len(query_words) if query_words else 0.0
                scale = EPS + (1.0 - EPS) * match_factor
                sim *= scale

            sims.append(sim)

        sim = max(sims)

        results.append({
            "id": i.id,
            "title": i.title,
            "type": i.type,
            "category": i.category,
            "image_data": encode_image(i.original_image_data, i.image_content_type),
            "boxed_image_data": encode_image(i.boxed_image_data, "image/png"),
            "original_image_data": encode_image(i.original_image_data, i.image_content_type),
            "user_id": i.user_id,
            "username": i.user.username if i.user else None,
            "similarity": round(sim, 4)
        })

    # sort and return top_k
    results = sorted(results, key=lambda x: x["similarity"], reverse=True)
    return results[:top_k]
