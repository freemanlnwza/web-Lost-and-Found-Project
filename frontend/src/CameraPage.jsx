import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const CameraPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [detectionPreview, setDetectionPreview] = useState(null);
  const detectionIntervalRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;

        detectionIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || !canvasRef.current) return;
          const width = videoRef.current.videoWidth;
          const height = videoRef.current.videoHeight;
          if (!width || !height) return;

          canvasRef.current.width = width;
          canvasRef.current.height = height;
          const ctx = canvasRef.current.getContext("2d");
          ctx.drawImage(videoRef.current, 0, 0, width, height);

          canvasRef.current.toBlob(async (blob) => {
            if (!blob) return;
            const formData = new FormData();
            formData.append("image", blob, "frame.png");

            try {
              const res = await fetch("http://localhost:8000/detect-frame", {
                method: "POST",
                body: formData,
              });
              const data = await res.json();
              if (res.ok && data.boxed_image) {
                setDetectionPreview(data.boxed_image);
              }
            } catch (err) {
              console.error("Detection error:", err);
            }
          });
        }, 500);
      } catch (err) {
        alert("Unable to access camera.");
        console.error(err);
      }
    };

    startCamera();

    return () => {
      const stream = videoRef.current?.srcObject;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    if (!width || !height) return;

    canvasRef.current.width = width;
    canvasRef.current.height = height;
    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);

      // ส่ง preview ไป UploadPage
      navigate("/", { state: { capturedImage: url } });
    });
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col p-2 md:p-4 gap-2">
      <div className="flex flex-1 gap-2 w-full h-full">
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {detectionPreview ? (
            <img src={detectionPreview} alt="Detection" className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-500">Detecting...</div>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="relative w-full py-4 mt-2 flex flex-col items-center">
        <button
          onClick={capturePhoto}
          className="w-20 h-20 rounded-full bg-white border-4 border-gray-400 hover:bg-gray-200 shadow mb-2"
        />
        <div className="w-full flex justify-end mt-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-red-700 text-white"
          >
            Back
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraPage;
