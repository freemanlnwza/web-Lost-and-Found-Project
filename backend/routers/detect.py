from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from ultralytics import YOLO
from PIL import Image
import io
import torch
import os
import models, crud
from crud import get_current_user
from transformers import CLIPModel, CLIPProcessor

router = APIRouter(prefix="/detect", tags=["Detect"])

# ===============================
# โหลด YOLOv8 + CLIP Fine-tuned
# ===============================
HF_TOKEN = os.getenv("HF_TOKEN")  # สำหรับ private repo

# YOLOv8
yolo_model = YOLO("freemanlnwza/modelYOLOv8/weights/best.pt")  # path หรือ HuggingFace repo

# CLIP fine-tuned
clip_model = CLIPModel.from_pretrained(
    "freemanlnwza/modelCLIPfine-tuned",
    use_auth_token=HF_TOKEN
)
clip_processor = CLIPProcessor.from_pretrained(
    "freemanlnwza/modelCLIPfine-tuned",
    use_auth_token=HF_TOKEN
)

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

    # ===============================
    # CLIP embedding (optional)
    # ===============================
    try:
        inputs = clip_processor(images=pil_image, return_tensors="pt")
        with torch.no_grad():
            clip_embedding = clip_model.get_image_features(**inputs).tolist()
    except Exception as e:
        clip_embedding = None  # ถ้า error ให้เป็น None

    return {
        "user": current_user.username,
        "detections": detections,
        "clip_embedding": clip_embedding
    }
