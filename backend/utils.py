# ✅ utils.py - ไม่ import torch ที่ top level

from PIL import Image
import io
import numpy as np
import os
import logging

logger = logging.getLogger(__name__)

HF_TOKEN = os.getenv("HF_TOKEN")
finetuned_repo = "freemanlnwza/modelCLIPfine-tuned"

# ❌ อย่าทำแบบนี้ (Top-level import)
# import torch                                    ← ลบออก!
# from transformers import CLIPProcessor, CLIPModel  ← ลบออก!
# device = "cuda" if torch.cuda.is_available() else "cpu"  ← ลบออก!

# ✅ Global cache (Lazy load)
_finetuned_processor = None
_finetuned_model = None
_device = None

# ===============================
# Helper function - ดึง device
# ===============================
def get_device():
    """✅ ดึง device (lazy load torch)"""
    global _device
    
    if _device is not None:
        return _device
    
    try:
        import torch
        _device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"📱 Using device: {_device}")
        return _device
    except Exception as e:
        logger.error(f"❌ Error detecting device: {e}")
        return "cpu"

# ===============================
# Lazy Load CLIP Model
# ===============================
def get_finetuned_clip():
    """✅ ดึง fine-tuned CLIP model (lazy load)"""
    global _finetuned_processor, _finetuned_model
    
    # ถ้า load แล้ว ให้ return cache
    if _finetuned_processor is not None and _finetuned_model is not None:
        return _finetuned_processor, _finetuned_model
    
    if not HF_TOKEN:
        logger.error("❌ HF_TOKEN not set")
        raise ValueError("HF_TOKEN not configured")
    
    try:
        logger.info("📥 Loading fine-tuned CLIP from Hugging Face...")
        
        # ✅ Import torch ที่นี่ (lazy load!)
        import torch
        from transformers import CLIPProcessor, CLIPModel
        
        device = get_device()
        
        _finetuned_processor = CLIPProcessor.from_pretrained(
            finetuned_repo,
            token=HF_TOKEN
        )
        
        _finetuned_model = CLIPModel.from_pretrained(
            finetuned_repo,
            token=HF_TOKEN
        ).to(device)
        
        logger.info("✅ Fine-tuned CLIP loaded from HF successfully")
        return _finetuned_processor, _finetuned_model
        
    except Exception as e:
        logger.error(f"❌ Failed to load fine-tuned CLIP: {str(e)}")
        _finetuned_processor = None
        _finetuned_model = None
        raise

# ===============================
# Get Text Embedding
# ===============================
def get_text_embedding(text: str) -> np.ndarray:
    """
    ✅ รับข้อความแล้วคืนค่า embedding เป็น numpy array
    - Import torch เมื่อต้องใช้เท่านั้น
    """
    if not text:
        logger.warning("⚠️  Empty text provided")
        return None
    
    try:
        # ✅ Import torch ที่นี่
        import torch
        
        processor, model = get_finetuned_clip()
        
        logger.info(f"🧠 Generating text embedding for: {text[:50]}...")
        
        inputs = processor(text=[text], return_tensors="pt", padding=True)
        
        with torch.no_grad():
            embeddings = model.get_text_features(**inputs)
            logger.debug(f"[INFO] Embedding shape: {embeddings.shape}")
        
        result = embeddings[0].cpu().numpy()
        logger.info(f"✅ Text embedding generated (dim: {len(result)})")
        return result
        
    except Exception as e:
        logger.error(f"❌ Error generating text embedding: {str(e)}")
        return None

# ===============================
# Get Image Embedding
# ===============================
def get_image_embedding(image_source) -> np.ndarray:
    """
    ✅ รับภาพได้ทั้งแบบ:
      - path (str)
      - UploadFile (FastAPI)
      - bytes หรือ io.BytesIO
    
    คืนค่า embedding เป็น numpy array
    - Import torch เมื่อต้องใช้เท่านั้น
    """
    try:
        # ✅ Import torch ที่นี่
        import torch
        
        processor, model = get_finetuned_clip()
        
        # ✅ Parse image source
        if hasattr(image_source, "file"):  # UploadFile (FastAPI)
            logger.info("📷 Processing UploadFile...")
            image_bytes = image_source.file.read()
            image_source.file.seek(0)
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            
        elif isinstance(image_source, (bytes, io.BytesIO)):  # bytes or BytesIO
            logger.info("📷 Processing bytes/BytesIO...")
            if isinstance(image_source, bytes):
                image_source = io.BytesIO(image_source)
            image = Image.open(image_source).convert("RGB")
            
        else:  # path (str)
            logger.info(f"📷 Processing image from path: {image_source}")
            image = Image.open(image_source).convert("RGB")
        
        logger.debug(f"Image size: {image.size}")
        
        inputs = processor(images=image, return_tensors="pt")
        
        with torch.no_grad():
            embeddings = model.get_image_features(**inputs)
        
        result = embeddings[0].cpu().numpy()
        logger.info(f"✅ Image embedding generated (dim: {len(result)})")
        return result
        
    except Exception as e:
        logger.error(f"❌ Error generating image embedding: {str(e)}")
        return None

# ===============================
# Validate Image Embedding
# ===============================
def validate_image_embedding(image_bytes: bytes) -> list:
    """✅ ตรวจสอบ image embedding"""
    try:
        embedding = get_image_embedding(image_bytes)
        
        if embedding is None:
            logger.error("❌ Image embedding is None")
            raise ValueError("Image embedding is None")
        
        emb_array = np.array(embedding)
        
        if emb_array.size == 0:
            logger.error("❌ Image embedding is empty")
            raise ValueError("Image embedding is empty")
        
        if not np.issubdtype(emb_array.dtype, np.floating):
            logger.error("❌ Image embedding must be float type")
            raise ValueError("Image embedding must be float type")
        
        logger.info(f"✅ Image embedding validated (shape: {emb_array.shape})")
        return emb_array.tolist()
        
    except Exception as e:
        logger.error(f"❌ Validation error: {str(e)}")
        return None

# ===============================
# Cosine Similarity
# ===============================
def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """
    ✅ คำนวณ cosine similarity ระหว่าง 2 vectors
    - ไม่ต้อง torch (ใช้ numpy)
    """
    try:
        vec1 = np.array(vec1)
        vec2 = np.array(vec2)
        
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            logger.warning("⚠️  Zero norm vector")
            return 0.0
        
        similarity = np.dot(vec1, vec2) / (norm1 * norm2)
        return float(similarity)
        
    except Exception as e:
        logger.error(f"❌ Error calculating cosine similarity: {str(e)}")
        return 0.0

# ===============================
# Startup Check
# ===============================
logger.info("[✅ DEBUG] utils.py loaded successfully")
logger.info("[ℹ️ NOTE] Models will be lazy-loaded on first use")