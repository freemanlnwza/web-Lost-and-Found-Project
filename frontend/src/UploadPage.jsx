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
      alert("⚠ Login required to continue.");
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
      alert("Please complete all fields and select an item category.");
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
        alert("Upload successful!");
      } else {
        alert(data.detail || "Error occurred.");
      }
    } catch (error) {
      alert("A connection error occurred.");
    }
  };

  // ================= Camera functions =================
  const openCamera = async () => {
    if (!requireLogin()) return;
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Unable to access camera.");
      console.error(err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, width, height);
    canvasRef.current.toBlob((blob) => {
      const file = new File([blob], "camera_capture.png", { type: "image/png" });
      setUploadedImage(file);
      const url = URL.createObjectURL(blob);
      setPreview(url);
      setIsCameraOpen(false);

      // Stop camera stream
      const stream = videoRef.current.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
    });
  };

  return (
    <main className="flex items-center justify-center">
      <div className="w-full max-w-2xl bg-gray-900 backdrop-blur-lg rounded-2xl shadow-2xl p-6 space-y-6 text-white border border-gray-800">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">Upload Image & Message</h1>

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

        {/* Upload image box */}
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

        {/* Camera Preview */}
        {isCameraOpen && (
          <div className="text-center mt-2">
            <video ref={videoRef} autoPlay className="mx-auto rounded-lg w-64 h-48 bg-black" />
            <div className="mt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={capturePhoto}
                className="py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700"
              >
                📸 Capture
              </button>
              <button
                type="button"
                onClick={() => {
                  // ปิดกล้องและกลับไปกล่อง upload
                  const stream = videoRef.current?.srcObject;
                  if (stream) {
                    const tracks = stream.getTracks();
                    tracks.forEach((track) => track.stop());
                  }
                  if (videoRef.current) videoRef.current.srcObject = null;
                  setIsCameraOpen(false);
                }}
                className="py-2 px-4 rounded-lg bg-gray-600 hover:bg-gray-700"
              >
                🔙 Back
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
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

        {/* Uploaded result */}
        {uploadedItem && (
          <div className="mt-6 space-y-4 text-center">
            <h2 className="text-xl font-bold">Uploaded Item</h2>
            <p>Title: {uploadedItem.title}</p>
            <p>Type: {uploadedItem.type}</p>
            <p>Category: {uploadedItem.category}</p>

            <div className="flex justify-center gap-4 mt-2">
              {/* Original image */}
              {uploadedItem.image_data && (
                <div>
                  <p className="text-sm">Original</p>
                  <img
                    src={uploadedItem.image_data}
                    alt="Original"
                    className="w-28 h-28 object-cover rounded-md"
                  />
                </div>
              )}
              {/* Boxed image */}
              {uploadedItem.boxed_image_data && (
                <div>
                  <p className="text-sm">Detected</p>
                  <img
                    src={uploadedItem.boxed_image_data}
                    alt="Detected"
                    className="w-28 h-28 object-cover rounded-md"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default UploadPage;
