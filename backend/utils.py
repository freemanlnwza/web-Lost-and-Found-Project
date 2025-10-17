import torch  # สำหรับ PyTorch
from PIL import Image  # สำหรับจัดการภาพ
from transformers import CLIPProcessor, CLIPModel  # สำหรับ CLIP
import io
import numpy as np

# โหลดโมเดลและ processor เพียงครั้งเดียว
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", use_fast=False)
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")

# ===========================
# ฟังก์ชันดึง embedding ข้อความ
# ===========================
def get_text_embedding(text: str) -> np.ndarray:
    """
    รับข้อความแล้วคืนค่า embedding เป็น numpy array
    """
    inputs = processor(text=[text], return_tensors="pt", padding=True)
    with torch.no_grad():
        embeddings = model.get_text_features(**inputs)
    return embeddings[0].numpy()

# ===========================
# ฟังก์ชันดึง embedding ภาพ
# ===========================
def get_image_embedding(image_source) -> np.ndarray:
    """
    รับภาพได้ทั้งแบบ:
      - path
      - UploadFile (FastAPI)
      - bytes หรือ io.BytesIO
    คืนค่า embedding เป็น numpy array
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

# ===========================
# ฟังก์ชันตรวจสอบ embedding ภาพ
# ===========================
def validate_image_embedding(image_bytes: bytes) -> list:
    """
    ตรวจสอบว่า embedding ของภาพถูกสร้างจริง
    - image_bytes: bytes ของภาพ
    คืนค่า embedding เป็น list
    """
    embedding = get_image_embedding(image_bytes)
    if embedding is None:
        raise ValueError("Image embedding is None")
    
    emb_array = np.array(embedding)

    if emb_array.size == 0:
        raise ValueError("Image embedding is empty")
    if not np.issubdtype(emb_array.dtype, np.floating):
        raise ValueError("Image embedding must be float type")
    
    return emb_array.tolist()

# ===========================
# ฟังก์ชันคำนวณ cosine similarity
# ===========================
def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """
    คำนวณ cosine similarity ระหว่างเวกเตอร์ 2 ตัว
    """
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
