import torch  # นำเข้า PyTorch สำหรับประมวลผล tensor และโมเดล
from PIL import Image  # นำเข้า PIL สำหรับเปิดและจัดการภาพ
from transformers import CLIPProcessor, CLIPModel  # นำเข้า CLIP processor และ model จาก Hugging Face
import io  # นำเข้า io สำหรับจัดการ stream ของไฟล์
import numpy as np  # นำเข้า NumPy สำหรับการคำนวณทางคณิตศาสตร์
import os

device = "cuda" if torch.cuda.is_available() else "cpu"  # ตรวจสอบ device

# ======================================================
# โหลด base CLIP
# ======================================================
base_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", use_fast=False)
base_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)

# ======================================================
# โหลด fine-tuned CLIP จาก Hugging Face (private repo)
# ======================================================
HF_TOKEN = os.getenv("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")  # สำหรับ private repo
finetuned_repo = "freemanlnwza/modelCLIPfine-tuned"

try:
    print("✅ Loading fine-tuned CLIP from Hugging Face...")
    finetuned_processor = CLIPProcessor.from_pretrained(
        finetuned_repo,
        use_auth_token=HF_TOKEN
    )
    finetuned_model = CLIPModel.from_pretrained(
        finetuned_repo,
        use_auth_token=HF_TOKEN
    ).to(device)
    use_finetuned = True
    print("✅ Fine-tuned CLIP loaded from HF.")
except Exception as e:
    print(f"[⚠️ Warning] Failed to load fine-tuned CLIP: {e}")
    finetuned_processor = None
    finetuned_model = None
    use_finetuned = False

# ======================================================
# ฟังก์ชัน embedding
# ======================================================
def get_text_embedding(text):
    """รับข้อความแล้วคืนค่า embedding เป็น numpy array"""
    processor = finetuned_processor if use_finetuned else base_processor
    model = finetuned_model if use_finetuned else base_model

    inputs = processor(text=[text], return_tensors="pt", padding=True)
    with torch.no_grad():
        embeddings = model.get_text_features(**inputs)
        print(f"[INFO] Embedding shape: {embeddings.shape}")
    return embeddings[0].numpy()

def get_image_embedding(image_source):
    """
    รับภาพได้ทั้งแบบ:
      - path
      - UploadFile (FastAPI)
      - bytes หรือ io.BytesIO
    คืนค่า embedding เป็น numpy array
    """
    processor = finetuned_processor if use_finetuned else base_processor
    model = finetuned_model if use_finetuned else base_model

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
# ฟังก์ชันตรวจสอบ embedding
# ===========================
def validate_image_embedding(image_bytes: bytes) -> list:
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
# ฟังก์ชัน cosine similarity
# ===========================
def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

print("[DEBUG] utils.py loaded and ready (fine-tuned connected)" if use_finetuned else "[DEBUG] utils.py loaded (base only)")
