from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from ultralytics import YOLO
from PIL import Image
import io
import torch
import os
import models, crud
from crud import get_current_user
from transformers import CLIPModel, CLIPProcessor
from huggingface_hub import hf_hub_download

router = APIRouter(prefix="/detect", tags=["Detect"])

# ===============================
# โหลด YOLOv8 + CLIP Fine-tuned
# ===============================
HF_TOKEN = os.getenv("HF_TOKEN")  # ต้องมีใน .env

# ---- โหลด YOLOv8 จาก Hugging Face (private repo) ----
try:
    print("🚀 Downloading YOLOv8 weights from Hugging Face (private repo)...")
    model_path = hf_hub_download(
        repo_id="freemanlnwza/modelYOLOv8",  # repo ชื่อเต็ม
        filename="weights/best.pt",           # path ใน repo
        token=HF_TOKEN                        # token สำหรับ private access
    )
    yolo_model = YOLO(model_path)
    print("✅ YOLOv8 model loaded successfully.")
except Exception as e:
    print(f"❌ Failed to load YOLOv8 model: {e}")
    raise RuntimeError("Cannot load YOLOv8 model from Hugging Face (check token & repo name).")

# ---- โหลด CLIP fine-tuned ----
try:
    clip_model = CLIPModel.from_pretrained(
        "freemanlnwza/modelCLIPfine-tuned",
        token=HF_TOKEN
    )
    clip_processor = CLIPProcessor.from_pretrained(
        "freemanlnwza/modelCLIPfine-tuned",
        token=HF_TOKEN
    )
    print("✅ CLIP fine-tuned model loaded.")
except Exception as e:
    print(f"⚠️ Failed to load CLIP model: {e}")
    clip_model = None
    clip_processor = None


# ===============================
# Endpoint /frame
# ===============================
@router.post("/frame")
async def detect_frame(
    image: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    # ตรวจสอบไฟล์ภาพ
    if not image.filename.lower().endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(status_code=400, detail="File must be an image (jpg, jpeg, png)")

    # อ่านภาพเป็น PIL
    image_bytes = await image.read()
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # ===============================
    # YOLO detect
    # ===============================
    try:
        results = yolo_model.predict(pil_image)
        detections = []
        if results and len(results[0].boxes) > 0:
            for box in results[0].boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                label = results[0].names[cls]
                detections.append({
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                    "confidence": conf,
                    "label": label
                })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YOLO detection failed: {e}")

    # ===============================
    # CLIP embedding (optional)
    # ===============================
    clip_embedding = None
    if clip_model and clip_processor:
        try:
            inputs = clip_processor(images=pil_image, return_tensors="pt")
            with torch.no_grad():
                clip_embedding = clip_model.get_image_features(**inputs).tolist()
        except Exception as e:
            print(f"[⚠️ Warning] CLIP embedding failed: {e}")

    return {
        "user": current_user.username,
        "detections": detections,
        "clip_embedding": clip_embedding
    }
