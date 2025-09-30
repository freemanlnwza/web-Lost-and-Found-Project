import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const CameraPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const navigate = useNavigate();

  const [facingMode, setFacingMode] = useState("environment");

  const startCamera = async () => {
    try {
      const oldStream = videoRef.current?.srcObject;
      if (oldStream) oldStream.getTracks().forEach((t) => t.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false,
      });

      if (videoRef.current) videoRef.current.srcObject = stream;

      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);

      detectionIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const width = videoRef.current.videoWidth;
        const height = videoRef.current.videoHeight;
        if (!width || !height) return;

        canvasRef.current.width = width;
        canvasRef.current.height = height;
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, width, height);

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

            if (!res.ok) {
              console.error("Server error:", res.status);
              return;
            }

            const data = await res.json();

            if (data.detections) {
              data.detections.forEach((det) => {
                ctx.strokeStyle = det.label === "person" ? "red" : "lime";
                ctx.lineWidth = 3;
                ctx.strokeRect(det.x1, det.y1, det.x2 - det.x1, det.y2 - det.y1);

                ctx.fillStyle = "rgba(0,0,0,0.6)";
                ctx.fillRect(det.x1, det.y1 - 20, 120, 20);
                ctx.fillStyle = "white";
                ctx.font = "14px Arial";
                ctx.fillText(
                  `${det.label} ${(det.confidence * 100).toFixed(1)}%`,
                  det.x1 + 5,
                  det.y1 - 5
                );
              });
            }
          } catch (err) {
            console.error("Detection error:", err);
          }
        });
      }, 800); // เว้น 0.8 วินาทีเพื่อลดโหลด CPU
    } catch (err) {
      console.warn("Cannot access camera:", err);
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
  }, [facingMode]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
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
      <video ref={videoRef} autoPlay playsInline muted className="absolute w-full h-full object-cover" />
      <canvas ref={canvasRef} className="absolute w-full h-full" />

      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2">
        <button
          onClick={capturePhoto}
          className="w-20 h-20 rounded-full bg-white border-4 border-gray-400 hover:bg-gray-200 shadow"
        />
      </div>

      <div className="absolute bottom-5 right-5">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-red-700 text-white"
        >
          Back
        </button>
      </div>

      <div className="absolute bottom-5 left-5">
        <button
          onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-800 text-white"
        >
          Switch Camera
        </button>
      </div>
    </div>
  );
};

export default CameraPage;
