import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const CameraPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const navigate = useNavigate();

  // State สำหรับกล้อง: "environment" = กล้องหลัง, "user" = กล้องหน้า
  const [facingMode, setFacingMode] = useState("environment");

  const startCamera = async () => {
    try {
      // หยุดกล้องเดิมก่อน
      const oldStream = videoRef.current?.srcObject;
      if (oldStream) oldStream.getTracks().forEach((t) => t.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: facingMode } },
        audio: false
      });

      if (videoRef.current) videoRef.current.srcObject = stream;

      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);

      detectionIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const width = videoRef.current.videoWidth;
        const height = videoRef.current.videoHeight;
        if (!width || !height) return;

        // ตั้งค่า canvas overlay
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, width, height);

        // สร้างภาพจาก video เพื่อส่งไป backend
        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = width;
        tmpCanvas.height = height;
        tmpCanvas.getContext("2d").drawImage(videoRef.current, 0, 0, width, height);

        tmpCanvas.toBlob(async (blob) => {
          if (!blob) return;
          const formData = new FormData();
          formData.append("image", blob, "frame.jpg");

          try {
            const res = await fetch("http://localhost:8000/detect-frame", {
              method: "POST",
              body: formData,
            });
            const data = await res.json();

            if (res.ok && data.detections) {
              data.detections.forEach((det) => {
                ctx.strokeStyle = det.label === "person" ? "red" : "green";
                ctx.lineWidth = 3;
                ctx.strokeRect(det.x1, det.y1, det.x2 - det.x1, det.y2 - det.y1);

                ctx.fillStyle = "rgba(0,0,0,0.6)";
                ctx.fillRect(det.x1, det.y1 - 20, 120, 20);
                ctx.fillStyle = "white";
                ctx.font = "14px Arial";
                ctx.fillText(`${det.label} ${(det.confidence * 100).toFixed(1)}%`, det.x1 + 5, det.y1 - 5);
              });
            }
          } catch (err) {
            console.error("Detection error:", err);
          }
        });
      }, 500);

    } catch (err) {
      console.warn("Cannot access camera with facingMode:", facingMode, err);
      // fallback เป็นกล้อง default
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = fallbackStream;
      } catch (err2) {
        alert("Unable to access camera.");
        console.error(err2);
      }
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      const stream = videoRef.current?.srcObject;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]); // เรียก startCamera ใหม่เมื่อเปลี่ยนกล้อง

  // ถ่ายภาพ snapshot
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    if (!width || !height) return;

    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = width;
    snapCanvas.height = height;
    const ctx = snapCanvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    snapCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      navigate("/", { state: { capturedImage: url } });
    });
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      {/* กล้อง */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute w-full h-full object-cover"
      />
      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute w-full h-full"
      />
      {/* ปุ่มถ่าย */}
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2">
        <button
          onClick={capturePhoto}
          className="w-20 h-20 rounded-full bg-white border-4 border-gray-400 hover:bg-gray-200 shadow"
        />
      </div>

      {/* ปุ่ม Back */}
      <div className="absolute bottom-5 right-5">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-red-700 text-white"
        >
          Back
        </button>
      </div>

      {/* ปุ่มสลับกล้อง */}
      <div className="absolute bottom-5 left-5">
        <button
          onClick={() => setFacingMode(prev => prev === "environment" ? "user" : "environment")}
          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-800 text-white"
        >
          Switch Camera
        </button>
      </div>
    </div>
  );
};

export default CameraPage;
