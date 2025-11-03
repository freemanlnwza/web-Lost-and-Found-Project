import torch  # นำเข้า PyTorch สำหรับประมวลผล tensor และโมเดล
from PIL import Image  # นำเข้า PIL สำหรับเปิดและจัดการภาพ
from transformers import CLIPProcessor, CLIPModel  # นำเข้า CLIP processor และ model จาก Hugging Face
import io  # นำเข้า io สำหรับจัดการ stream ของไฟล์
import numpy as np  # นำเข้า NumPy สำหรับการคำนวณทางคณิตศาสตร์
import os

device = "cuda" if torch.cuda.is_available() else "cpu" # ตรวจสอบ device

base_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", use_fast=False) # โหลด processor ของ CLIP
base_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device) # โหลดโมเดล CLIP

# ======================================================
# โหลด fine-tuned CLIP ถ้ามี
# ======================================================
finetuned_path = "finetuned_clip_optimized"
if os.path.exists(finetuned_path):
    try:
        print("✅ Loading fine-tuned CLIP...")
        finetuned_processor = CLIPProcessor.from_pretrained(finetuned_path)
        finetuned_model = CLIPModel.from_pretrained(finetuned_path).to(device)
        use_finetuned = True
        print("✅ Fine-tuned CLIP loaded.")
    except Exception as e:
        print(f"[⚠️ Warning] Failed to load fine-tuned CLIP: {e}")
        finetuned_processor = None
        finetuned_model = None
        use_finetuned = False
else:
    print("[ℹ️ Info] Fine-tuned CLIP not found. Using base CLIP only.")
    finetuned_processor = None
    finetuned_model = None
    use_finetuned = False

# ======================================================
# ฟังก์ชัน embedding
# ======================================================
def get_text_embedding(text):
    """รับข้อความแล้วคืนค่า embedding เป็น numpy array"""
    # ✅ เลือกว่าจะใช้ fine-tuned หรือ base model
    processor = finetuned_processor if use_finetuned else base_processor
    model = finetuned_model if use_finetuned else base_model

    # ใช้ processor แปลงข้อความเป็น tensor สำหรับโมเดล
    inputs = processor(text=[text], return_tensors="pt", padding=True)
    with torch.no_grad():  # ปิด gradient เพื่อประหยัดหน่วยความจำ
        embeddings = model.get_text_features(**inputs)  # ดึง embedding ของข้อความ
        print(f"[INFO] Embedding shape: {embeddings.shape}")
    return embeddings[0].numpy()  # คืนค่า embedding เป็น numpy array

def get_image_embedding(image_source):
    """
    รับภาพได้ทั้งแบบ path, UploadFile หรือ bytes/io.BytesIO แล้วคืนค่า embedding
    """
    processor = finetuned_processor if use_finetuned else base_processor #สร้าง image embedding (ใช้ fine-tuned ถ้ามี)
    model = finetuned_model if use_finetuned else base_model

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

print("[DEBUG] utils.py loaded and ready (fine-tuned connected)" if use_finetuned else "[DEBUG] utils.py loaded (base only)")
