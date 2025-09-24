import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const UploadPage = () => {
  const [selectedType, setSelectedType] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const [preview, setPreview] = useState(null);
  const [uploadedItem, setUploadedItem] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Popup states
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showMessagePopup, setShowMessagePopup] = useState(false);

  // Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setIsAuthenticated(!!storedUser);
  }, []);

  const requireLogin = () => {
    if (!isAuthenticated) {
      setPopupMessage("⚠ Login required to continue.");
      setShowMessagePopup(true);
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleImageUpload = (event) => {
    if (!requireLogin()) return;
    const file = event.target.files[0];
    if (!file) return;
    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const selectType = (type) => {
    if (!requireLogin()) return;
    setSelectedType(type);
  };

  const submitForm = async () => {
    if (!requireLogin()) return;
    if (!uploadedImage || !message || !selectedType || !category) {
      setPopupMessage("Please complete all fields and select an item category.");
      setShowMessagePopup(true);
      return;
    }

    const formData = new FormData();
    formData.append("image", uploadedImage);
    formData.append("title", message);
    formData.append("type", selectedType);
    formData.append("category", category);

    const user = JSON.parse(localStorage.getItem("user"));
    formData.append("user_id", user?.id || 0);

    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setUploadedItem(data);
        setShowPopup(true);
      } else {
        setPopupMessage(data.detail || "Error occurred.");
        setShowMessagePopup(true);
      }
    } catch (error) {
      setPopupMessage("A connection error occurred.");
      setShowMessagePopup(true);
    }
  };

  // ================= Camera + Object Detection =================
  const openCamera = async () => {
    if (!requireLogin()) return;
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play(); // ✅ ให้ video เล่นแน่นอน
        };
      }
    } catch (err) {
      setPopupMessage("Unable to access camera.");
      setShowMessagePopup(true);
      console.error(err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOpen(false);
  };

  const detectObjects = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const video = videoRef.current;

    // ✅ กันไม่ให้ค่ากลายเป็น 0
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const formData = new FormData();
      formData.append("image", blob, "frame.jpg");

      try {
        const res = await fetch("http://localhost:8000/detect", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.boxed_image_data) {
          const img = new Image();
          img.src = data.boxed_image_data;
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
        }
      } catch (err) {
        console.error("Detection error:", err);
      }
    }, "image/jpeg");
  };
  // ================= useEffect สำหรับ loop detectObjects =================


  useEffect(() => {
    let interval;
    if (isCameraOpen) {
      interval = setInterval(detectObjects, 50);
    }
    return () => clearInterval(interval);
  }, [isCameraOpen]);

  return (
    <main className="flex items-center justify-center">
      <div className="w-full max-w-2xl bg-gray-900 backdrop-blur-lg rounded-2xl shadow-2xl p-6 space-y-6 text-white border border-gray-800">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          Upload Image & Message
        </h1>

        {!isAuthenticated && (
          <p className="text-red-400 text-center">⚠ Please log in to continue.</p>
        )}

        {/* Category */}
        <div className="space-y-2">
          <label className="block text-gray-300">Select item type :</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={!isAuthenticated}
            className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">-- SELECT --</option>
            <option value="Wallet">Wallet</option>
            <option value="Backpack">Backpack</option>
            <option value="Key">Key</option>
            <option value="Watch">Watch</option>
            <option value="Mobile phone">Mobile phone</option>
          </select>
        </div>

        {/* Camera Button */}
        {isAuthenticated && (
          <div className="mb-2">
            <button
              type="button"
              onClick={openCamera}
              className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-700"
            >
              📷 Open Camera
            </button>
          </div>
        )}

        {/* Camera Preview + Detection */}
        {isCameraOpen && (
          <div className="text-center mt-2">
            <video ref={videoRef} autoPlay muted playsInline className="hidden" />
            <canvas
              ref={canvasRef}
              className="mx-auto rounded-lg w-64 h-48 bg-black"
            />
            <div className="mt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={stopCamera}
                className="py-2 px-4 rounded-lg bg-gray-600 hover:bg-gray-700"
              >
                🔙 Back
              </button>
            </div>
          </div>
        )}

        {/* Upload box (ซ่อนเมื่อเปิดกล้อง) */}
        {!isCameraOpen && (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={!isAuthenticated}
              className="hidden"
              id="imageUpload"
            />
            <div
              onClick={() => {
                if (!requireLogin()) return;
                document.getElementById("imageUpload").click();
              }}
              className={`p-6 text-center border-2 border-dashed rounded-lg transition-all cursor-pointer ${
                isAuthenticated
                  ? "border-gray-600 hover:border-violet-400 hover:bg-gray-800"
                  : "border-gray-700 bg-gray-800 opacity-50 cursor-not-allowed"
              }`}
            >
              {!preview ? (
                <p className="text-gray-400">Click or drag file to upload</p>
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  className="mx-auto mb-2 w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-md"
                />
              )}
            </div>
          </>
        )}

        {/* Message */}
        <textarea
          placeholder="Please describe the lost item..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={!isAuthenticated}
          className="w-full p-3 h-24 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:outline-none disabled:opacity-50"
        />

        {/* Lost/Found buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => selectType("lost")}
            disabled={!isAuthenticated}
            className={`py-3 rounded-xl font-semibold text-sm sm:text-base transition-all ${
              selectedType === "lost" ? "ring-2 ring-rose-400" : ""
            } ${
              !isAuthenticated
                ? "bg-gray-700 opacity-50 cursor-not-allowed"
                : "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
            }`}
          >
            📝 Report lost item
          </button>

          <button
            type="button"
            onClick={() => selectType("found")}
            disabled={!isAuthenticated}
            className={`py-3 rounded-xl font-semibold text-sm sm:text-base transition-all ${
              selectedType === "found" ? "ring-2 ring-green-400" : ""
            } ${
              !isAuthenticated
                ? "bg-gray-700 opacity-50 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            }`}
          >
            🔍 Found item
          </button>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={submitForm}
          disabled={!isAuthenticated}
          className="w-full py-3 rounded-full font-semibold text-white 
                     bg-gradient-to-r from-indigo-500 to-blue-600 
                     hover:from-indigo-600 hover:to-blue-700 
                     transition-all disabled:opacity-50"
        >
          Confirm
        </button>

        {/* Popups */}
        {showPopup && uploadedItem && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center relative">
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold text-black">✅ Upload Successful!</h2>
              <p className="text-gray-700">
                Your item has been uploaded successfully.
              </p>
              <div className="mt-4">
                <p className="font-semibold text-black">
                  Title: {uploadedItem.title}
                </p>
                <p className="text-black">Type: {uploadedItem.type}</p>
                <p className="text-black">Category: {uploadedItem.category}</p>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {uploadedItem.boxed_image_data && (
                  <div>
                    <p className="text-sm text-black">Detected</p>
                    <img
                      src={uploadedItem.boxed_image_data}
                      alt="Detected"
                      className="w-28 h-28 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showMessagePopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center relative">
              <button
                onClick={() => setShowMessagePopup(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
              >
                ✕
              </button>
              <p className="text-black">{popupMessage}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default UploadPage;
