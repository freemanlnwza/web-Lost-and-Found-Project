import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
import io
import numpy as np

# โหลดโมเดล CLIP เพียงครั้งเดียว
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", use_fast=False)
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")


def get_text_embedding(text):
    """รับข้อความแล้วคืนค่า embedding เป็น numpy array"""
    inputs = processor(text=[text], return_tensors="pt", padding=True)
    with torch.no_grad():
        embeddings = model.get_text_features(**inputs)
    return embeddings[0].numpy()


def get_image_embedding(image_source):
    """
    รับภาพได้ทั้งแบบ path, UploadFile หรือ bytes/io.BytesIO แล้วคืนค่า embedding
    """
    if hasattr(image_source, "file"):  # UploadFile
        image_bytes = image_source.file.read()
        image_source.file.seek(0)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    elif isinstance(image_source, (bytes, io.BytesIO)):
        if isinstance(image_source, bytes):
            image_source = io.BytesIO(image_source)
        image = Image.open(image_source).convert("RGB")
    else:  # path
        image = Image.open(image_source).convert("RGB")

    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        embeddings = model.get_image_features(**inputs)
    return embeddings[0].numpy()


def cosine_similarity(vec1, vec2):
    """คำนวณความคล้ายคลึง (cosine similarity) ระหว่างเวกเตอร์"""
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))


