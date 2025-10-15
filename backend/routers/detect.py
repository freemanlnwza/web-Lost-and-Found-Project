from fastapi import APIRouter, UploadFile, File
from ultralytics import YOLO
from PIL import Image
import io

router = APIRouter(prefix="/detect", tags=["Detect"])

yolo_model = YOLO("best.pt")

@router.post("/frame")
async def detect_frame(image: UploadFile = File(...)):
    image_bytes = await image.read()
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
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
                "confidence": conf, "label": label
            })
    return {"detections": detections}
