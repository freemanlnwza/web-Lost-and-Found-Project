import torch  # นำเข้า PyTorch สำหรับประมวลผล tensor และโมเดล
from PIL import Image  # นำเข้า PIL สำหรับเปิดและจัดการภาพ
from transformers import CLIPProcessor, CLIPModel  # นำเข้า CLIP processor และ model จาก Hugging Face
import io  # นำเข้า io สำหรับจัดการ stream ของไฟล์
import numpy as np  # นำเข้า NumPy สำหรับการคำนวณทางคณิตศาสตร์

# โหลดโมเดล CLIP และ processor เพียงครั้งเดียวเพื่อใช้ซ้ำ
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", use_fast=False)  # โหลด processor ของ CLIP
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")  # โหลดโมเดล CLIP

def get_text_embedding(text):
    """รับข้อความแล้วคืนค่า embedding เป็น numpy array"""
    # ใช้ processor แปลงข้อความเป็น tensor สำหรับโมเดล
    inputs = processor(text=[text], return_tensors="pt", padding=True)
    with torch.no_grad():  # ปิด gradient เพื่อประหยัดหน่วยความจำ
        embeddings = model.get_text_features(**inputs)  # ดึง embedding ของข้อความ
    return embeddings[0].numpy()  # คืนค่า embedding เป็น numpy array

def get_image_embedding(image_source):
    """
    รับภาพได้ทั้งแบบ path, UploadFile หรือ bytes/io.BytesIO แล้วคืนค่า embedding
    """
    if hasattr(image_source, "file"):  # ถ้าเป็น UploadFile จาก FastAPI
        image_bytes = image_source.file.read()  # อ่าน bytes ของไฟล์
        image_source.file.seek(0)  # รีเซ็ต pointer ของไฟล์กลับไปเริ่มต้น
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")  # เปิดภาพและแปลงเป็น RGB
    elif isinstance(image_source, (bytes, io.BytesIO)):  # ถ้าเป็น bytes หรือ io.BytesIO
        if isinstance(image_source, bytes):
            image_source = io.BytesIO(image_source)  # แปลง bytes เป็น BytesIO
        image = Image.open(image_source).convert("RGB")  # เปิดภาพและแปลงเป็น RGB
    else:  # ถ้าเป็น path ของไฟล์
        image = Image.open(image_source).convert("RGB")  # เปิดภาพและแปลงเป็น RGB

    # ใช้ processor แปลงภาพเป็น tensor สำหรับโมเดล
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():  # ปิด gradient
        embeddings = model.get_image_features(**inputs)  # ดึง embedding ของภาพ
    return embeddings[0].numpy()  # คืนค่า embedding เป็น numpy array

def cosine_similarity(vec1, vec2):
    """คำนวณความคล้ายคลึง (cosine similarity) ระหว่างเวกเตอร์"""
    # สูตร cosine similarity = dot product / (norm ของ vec1 * norm ของ vec2)
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
