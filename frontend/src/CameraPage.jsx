import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdOutlineCameraswitch } from "react-icons/md";
import { API_URL } from "./configurl"; 

// ================= Popup Component =================
const Popup = ({ message, onClose }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fade-in p-4">
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-sm w-full mx-4 border border-gray-700 p-6 animate-scale-in text-center">
      <p className="text-white text-lg mb-4">{message}</p>
      <button
        onClick={onClose}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all flex justify-center items-center gap-2"
      >
        OK
      </button>
    </div>
  </div>
);

const CameraPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const autoStopTimerRef = useRef(null);
  const navigate = useNavigate();

  const [facingMode, setFacingMode] = useState("environment");
  const [showPopup, setShowPopup] = useState(false);

  // ✅ ฟังก์ชัน stop กล้อง + interval
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
  };

  const startCamera = async () => {
    try {
      // Stop previous stream
      const oldStream = videoRef.current?.srcObject;
      if (oldStream) oldStream.getTracks().forEach((t) => t.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      if (videoRef.current) videoRef.current.srcObject = stream;

      // Clear previous detection interval
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);

      // Start detection interval
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
            const res = await fetch(`${API_URL}/detect/frame`, {
              method: "POST",
              body: formData,
              credentials: "include",
            });

            if (!res.ok) return;

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
      }, 800);

      // ✅ Auto-stop camera after 1 minute (60,000 ms)
      autoStopTimerRef.current = setTimeout(() => {
        setShowPopup(true);
        stopCamera();
      }, 60000);
    } catch (err) {
      console.warn("Cannot access camera:", err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = fallbackStream;
      } catch (err2) {
        setShowPopup(true);
        console.error(err2);
      }
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera(); // ❌ ไม่ navigate ตอน unmount
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

    const dataURL = snapCanvas.toDataURL("image/png");
    stopCamera();
    navigate("/", { state: { capturedImage: dataURL } });
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="absolute w-full h-full" />

      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2">
        <button
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-4 border-gray-400 hover:bg-gray-200 shadow"
          onClick={capturePhoto}
        />
      </div>

      <div className="absolute bottom-5 right-5">
        <button
          className="px-4 sm:px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
          onClick={() => {
            stopCamera();
            navigate(-1);
          }}
        >
          Back
        </button>
      </div>

      <div className="absolute bottom-5 left-5">
        <button
          onClick={() => setFacingMode(prev => (prev === "environment" ? "user" : "environment"))}
          className="p-2 sm:p-3 rounded-full bg-transparent border-4 border-white text-white text-2xl sm:text-3xl flex items-center justify-center "
        >
          <MdOutlineCameraswitch />
        </button>
      </div>

      {showPopup && (
        <Popup
          message="Camera has been active for 1 minute. Returning to home."
          onClose={() => navigate("/")}
        />
      )}
    </div>
  );
};

export default CameraPage;
