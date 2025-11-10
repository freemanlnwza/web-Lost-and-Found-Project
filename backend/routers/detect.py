from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from PIL import Image
import io
import os
import models, crud
from crud import get_current_user
from huggingface_hub import hf_hub_download
import logging

router = APIRouter(prefix="/detect", tags=["Detect"])

logger = logging.getLogger(__name__)

# ===============================
# Global cache (ไม่โหลดซ้ำ)
# ===============================
_yolo_model = None
_clip_model = None
_clip_processor = None

HF_TOKEN = os.getenv("HF_TOKEN")

# ===============================
# Lazy Load Function - YOLO
# ===============================
def get_yolo_model():
    """Lazy load YOLO model - ดึงจาก HF เมื่อต้องการใช้เท่านั้น"""
    global _yolo_model
    
    if _yolo_model is not None:
        return _yolo_model
    
    if not HF_TOKEN:
        logger.error("❌ HF_TOKEN not set")
        raise HTTPException(status_code=503, detail="HF_TOKEN not configured")
    
    try:
        logger.info("📥 Downloading YOLO model from HuggingFace...")
        from ultralytics import YOLO
        
        # ดึง best.pt จาก private HF repo
        yolo_weights = hf_hub_download(
            repo_id="freemanlnwza/modelYOLOv8",
            filename="weights/best.pt",
            token=HF_TOKEN,
            cache_dir="./models"
        )
        
        _yolo_model = YOLO(yolo_weights)
        logger.info("✅ YOLO model loaded successfully")
        return _yolo_model
        
    except Exception as e:
        logger.error(f"❌ Error loading YOLO: {str(e)}")
        raise HTTPException(status_code=503, detail=f"YOLO model failed to load: {str(e)}")

# ===============================
# Lazy Load Function - CLIP
# ===============================
def get_clip_models():
    """Lazy load CLIP model + processor - ส่งคืน (model, processor) หรือ (None, None)"""
    global _clip_model, _clip_processor
    
    if _clip_model is not None and _clip_processor is not None:
        return _clip_model, _clip_processor
    
    if not HF_TOKEN:
        logger.warning("⚠️  HF_TOKEN not set - CLIP models will be skipped")
        return None, None
    
    try:
        logger.info("📥 Downloading CLIP model from HuggingFace...")
        # ✅ Import torch ที่นี่ (lazy load!)
        import torch
        from transformers import CLIPModel, CLIPProcessor
        
        # ✅ ใช้ token= (ไม่ใช่ use_auth_token=)
        _clip_model = CLIPModel.from_pretrained(
            "freemanlnwza/modelCLIPfine-tuned",
            token=HF_TOKEN,
            trust_remote_code=True,
            torch_dtype=torch.float32  # ✅ ใช้ torch ที่ import ข้างบน
        )
        
        _clip_processor = CLIPProcessor.from_pretrained(
            "freemanlnwza/modelCLIPfine-tuned",
            token=HF_TOKEN,
            trust_remote_code=True
        )
        
        logger.info("✅ CLIP model loaded successfully")
        return _clip_model, _clip_processor
        
    except Exception as e:
        logger.error(f"❌ Error loading CLIP: {str(e)}")
        _clip_model = None
        _clip_processor = None
        return None, None

# ===============================
# Endpoint /frame
# ===============================
@router.post("/frame")
async def detect_frame(
    image: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    """
    ตรวจจับวัตถุจากภาพ + ดึง CLIP embedding
    - ดึง YOLO + CLIP เมื่อต้องการใช้เท่านั้น (lazy load)
    - ต้องมี HF_TOKEN สำหรับ private models
    """
    
    # ✅ ตรวจสอบไฟล์ภาพ
    if not image.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    if not image.filename.lower().endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(
            status_code=400, 
            detail="File must be an image (jpg, jpeg, png)"
        )

    # ✅ อ่านภาพเป็น PIL
    try:
        image_bytes = await image.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        logger.error(f"❌ Error reading image: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    # ===============================
    # YOLO detection (lazy load)
    # ===============================
    detections = []
    try:
        yolo_model = get_yolo_model()  # ✅ ดึง model เมื่อต้องใช้
        
        logger.info("🔍 Running YOLO detection...")
        results = yolo_model.predict(pil_image, conf=0.5, verbose=False)
        
        # ✅ ตรวจสอบว่า results มี boxes ไหม
        if results and len(results) > 0 and len(results[0].boxes) > 0:
            for box in results[0].boxes:
                try:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])
                    label = results[0].names[cls]
                    
                    detections.append({
                        "x1": round(x1, 2),
                        "y1": round(y1, 2),
                        "x2": round(x2, 2),
                        "y2": round(y2, 2),
                        "confidence": round(conf, 4),
                        "label": label
                    })
                except Exception as e:
                    logger.warning(f"⚠️  Error processing box: {str(e)}")
                    continue
                
            logger.info(f"✅ Found {len(detections)} objects")
        else:
            logger.info("⚠️  No objects detected")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ YOLO error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Detection error: {str(e)}")

    # ===============================
    # CLIP embedding (lazy load + optional)
    # ===============================
    clip_embedding = None
    try:
        clip_model, clip_processor = get_clip_models()  # ✅ ดึง model เมื่อต้องใช้
        
        # ✅ ตรวจสอบว่า clip model load ได้ไหม
        if clip_model is not None and clip_processor is not None:
            logger.info("🧠 Generating CLIP embedding...")
            
            try:
                # ✅ Import torch ที่นี่ (lazy load!)
                import torch
                
                inputs = clip_processor(
                    images=pil_image, 
                    return_tensors="pt"
                )
                
                with torch.no_grad():
                    # ✅ ได้ embedding เป็น tensor
                    embedding = clip_model.get_image_features(**inputs)
                    # ✅ Normalize embedding
                    embedding = embedding / embedding.norm(p=2, dim=-1, keepdim=True)
                    # ✅ Convert to list
                    clip_embedding = embedding[0].tolist()
                    
                logger.info(f"✅ CLIP embedding generated (dim: {len(clip_embedding)})")
            except Exception as e:
                logger.warning(f"⚠️  CLIP embedding generation failed: {str(e)}")
                clip_embedding = None
        else:
            logger.warning("⚠️  CLIP model not available")
            
    except Exception as e:
        logger.warning(f"⚠️  CLIP embedding skipped: {str(e)}")
        clip_embedding = None

    return {
        "user": current_user.username,
        "detections": detections,
        "detections_count": len(detections),
        "clip_embedding": clip_embedding if clip_embedding else None,
        "embedding_dim": len(clip_embedding) if clip_embedding else None
    }

# ===============================
# Endpoint /status
# ===============================
@router.get("/status")
async def model_status(current_user: models.User = Depends(get_current_user)):
    """✅ ตรวจสอบสถานะ Models"""
    
    yolo_loaded = _yolo_model is not None
    clip_loaded = _clip_model is not None
    
    return {
        "user": current_user.username,
        "yolo": {
            "status": "✅ Loaded" if yolo_loaded else "❌ Not loaded",
            "note": "Will load on first use" if not yolo_loaded else "Ready to use"
        },
        "clip": {
            "status": "✅ Loaded" if clip_loaded else "❌ Not loaded",
            "note": "Will load on first use" if not clip_loaded else "Ready to use"
        },
        "hf_token": "✅ Set" if HF_TOKEN else "❌ Missing",
    }

# ===============================
# Endpoint /preload (optional)
# ===============================
@router.post("/preload")
async def preload_models(current_user: models.User = Depends(get_current_user)):
    """
    ✅ Preload models ตั้งแต่ตอนเริ่มต้น (optional)
    ใช้ถ้าต้องการ warmup เมื่อ API start
    """
    
    logger.info("🔄 Preloading models...")
    
    results = {
        "yolo": None,
        "clip": None
    }
    
    # ✅ Preload YOLO
    try:
        get_yolo_model()
        results["yolo"] = "✅ YOLO preloaded"
    except Exception as e:
        results["yolo"] = f"❌ YOLO preload failed: {str(e)}"
    
    # ✅ Preload CLIP
    try:
        clip_model, clip_processor = get_clip_models()
        if clip_model and clip_processor:
            results["clip"] = "✅ CLIP preloaded"
        else:
            results["clip"] = "⚠️  CLIP skipped (HF_TOKEN missing)"
    except Exception as e:
        results["clip"] = f"❌ CLIP preload failed: {str(e)}"
    
    return results