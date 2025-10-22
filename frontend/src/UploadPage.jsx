import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

// ===================== Popup Component =====================
const Popup = ({ type = "success", message, onClose, uploadedItem }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 border border-gray-700 transform animate-scale-in overflow-hidden">
        {/* Header */}
        <div className={`p-6 ${
          type === "success" ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20" :
          type === "error" ? "bg-gradient-to-r from-red-500/20 to-rose-500/20" :
          "bg-gradient-to-r from-yellow-500/20 to-orange-500/20"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {type === "success" ? (
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-400" size={28} />
                </div>
              ) : type === "error" ? (
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <XCircle className="text-red-400" size={28} />
                </div>
              ) : (
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-yellow-400" size={28} />
                </div>
              )}
              <h2 className={`text-2xl font-bold ${
                type === "success" ? "text-green-400" :
                type === "error" ? "text-red-400" :
                "text-yellow-400"
              }`}>
                {type === "success" ? "Success!" : type === "error" ? "Error" : "Notice"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {uploadedItem ? (
            <div className="space-y-4">
              {Array.isArray(uploadedItem) ? (
                uploadedItem.map((item, idx) => (
                  <div key={idx} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-gray-400">Title</p>
                        <p className="text-white font-semibold">{item.title}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Type</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          item.type === "lost" 
                            ? "bg-red-500/20 text-red-400" 
                            : "bg-green-500/20 text-green-400"
                        }`}>
                          {item.type}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-400">Category</p>
                        <p className="text-white font-semibold">{item.category}</p>
                      </div>
                    </div>
                    {item.boxed_image_data && (
                      <img
                        src={item.boxed_image_data}
                        alt="Detected result"
                        className="w-full rounded-lg object-contain bg-gray-900"
                      />
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-400">Title</p>
                      <p className="text-white font-semibold">{uploadedItem.title}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Type</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        uploadedItem.type === "lost" 
                          ? "bg-red-500/20 text-red-400" 
                          : "bg-green-500/20 text-green-400"
                      }`}>
                        {uploadedItem.type}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-400">Category</p>
                      <p className="text-white font-semibold">{uploadedItem.category}</p>
                    </div>
                  </div>
                  {uploadedItem.boxed_image_data && (
                    <img
                      src={uploadedItem.boxed_image_data}
                      alt="Detected result"
                      className="w-full rounded-lg object-contain bg-gray-900"
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-300 text-center">{message}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-800/50 border-t border-gray-700">
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all transform hover:scale-105 active:scale-95 ${
              type === "success"
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/50"
                : type === "error"
                ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/50"
                : "bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 shadow-lg shadow-yellow-500/50"
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// ===================== UploadPage =====================
const UploadPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const [selectedType, setSelectedType] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const [preview, setPreview] = useState(null);
  const [uploadedItem, setUploadedItem] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("success");
  const [popupMessage, setPopupMessage] = useState("");
  const [showMessagePopup, setShowMessagePopup] = useState(false);

  // ===================== Load User and Camera Preview =====================
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setIsAuthenticated(!!storedUser);

    if (location.state?.capturedImage && !uploadedImage) {
      const captured = location.state.capturedImage;

      if (captured.startsWith("data:")) {
        fetch(captured)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], "captured.png", { type: blob.type });
            setUploadedImage(file);
            setPreview(captured);
          })
          .catch(() => {
            setPopupMessage("Image can't upload, please try new Image.");
            setPopupType("error");
            setShowMessagePopup(true);
          });
      } else {
        setPreview(captured);
      }

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, uploadedImage]);

  // ===================== Login Requirement =====================
  const requireLogin = () => {
    if (!isAuthenticated) {
      setPopupMessage("⚠ Login required to continue.");
      setPopupType("warning");
      setShowMessagePopup(true);
      navigate("/login");
      return false;
    }
    return true;
  };

  // ===================== Handle Image Upload =====================
  const handleImageUpload = (fileOrDataURL) => {
    if (!requireLogin()) return;
    if (!fileOrDataURL) return;

    if (typeof fileOrDataURL === "string" && fileOrDataURL.startsWith("data:")) {
      fetch(fileOrDataURL)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "captured.png", { type: blob.type });
          setUploadedImage(file);
          setPreview(fileOrDataURL);
        })
        .catch(() => {
          setPopupMessage("Image can't upload, please try new Image.");
          setPopupType("error");
          setShowMessagePopup(true);
        });
    } else {
      setUploadedImage(fileOrDataURL);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(fileOrDataURL);
    }
  };

  const onFileChange = (e) => handleImageUpload(e.target.files[0]);

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireLogin()) return;
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  };

  const selectType = (type) => {
    if (!requireLogin()) return;
    setSelectedType(type);
  };

  const resetForm = () => {
    setSelectedType("");
    setUploadedImage(null);
    setMessage("");
    setCategory("");
    setPreview(null);
    navigate(location.pathname, { replace: true, state: {} });
  };

  // ===================== Submit Form =====================
  const submitForm = async () => {
    if (!requireLogin()) return;

    let imageFile = uploadedImage;
    if (!imageFile && preview) {
      try {
        const res = await fetch(preview);
        const blob = await res.blob();
        imageFile = new File([blob], "upload.png", { type: blob.type });
        setUploadedImage(imageFile);
      } catch (err) {
        setPopupMessage("Image can't upload, please try new Image.");
        setPopupType("error");
        setShowMessagePopup(true);
        return;
      }
    }

    if (!imageFile || !message || !selectedType || !category) {
      setPopupMessage("Please complete all fields and select an item category.");
      setPopupType("warning");
      setShowMessagePopup(true);
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("title", message);
    formData.append("type", selectedType);
    formData.append("category", category);
    const user = JSON.parse(localStorage.getItem("user"));
    formData.append("user_id", user?.id || 0);

    try {
      const res = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setPopupMessage("Image can't upload, please try new Image.");
        setPopupType("error");
        setShowMessagePopup(true);
        return;
      }

      const data = await res.json();
      setUploadedItem(data);
      setPopupType("success");
      setShowPopup(true);
      resetForm();
    } catch (error) {
      setPopupMessage("Image can't upload, please try new Image.");
      setPopupType("error");
      setShowMessagePopup(true);
    }
  };

  // ===================== Fetch Found Items =====================
  const fetchFoundItems = async () => {
    if (!requireLogin()) return;

    try {
      let imageFile = uploadedImage;

      if (!imageFile && preview) {
        const res = await fetch(preview);
        const blob = await res.blob();
        imageFile = new File([blob], "capture.png", { type: blob.type });
      }

      if (!message && !imageFile) {
        setPopupMessage("Please provide text or image for search.");
        setPopupType("warning");
        setShowMessagePopup(true);
        return;
      }

      const formData = new FormData();
      if (message) formData.append("text", message);
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch("http://localhost:8000/api/search", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      navigate("/searchItem", { state: { foundItems: data } });
    } catch (err) {
      setPopupMessage("Search failed, please try again.");
      setPopupType("error");
      setShowMessagePopup(true);
    }
  };

  // ===================== UI =====================
  return (
    <main className="flex items-center justify-center h-full pt-16">
      <div className="w-full max-w-xl bg-gray-800 bg-opacity-90 rounded-2xl shadow-2xl p-6 space-y-4 text-white border-2 border-yellow-500 mx-auto">


        <h1 className="text-2xl sm:text-3xl font-bold text-center">Upload Image & Message</h1>

        {!isAuthenticated && (
          <p className="text-red-400 text-center">⚠ Please log in to continue.</p>
        )}

        {/* Category select */}
        <div className="space-y-2">
          <label className="block text-gray-300">Select item category :</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={!isAuthenticated}
            className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none disabled:opacity-50"
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
          <button
            onClick={() => navigate("/camera")}
            className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-700"
          >
            📷 Open Camera
          </button>
        )}

        {/* Upload File / Drag & Drop */}
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          ref={fileInputRef}
          className="hidden"
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={`p-6 text-center border-2 border-dashed rounded-lg cursor-pointer ${
            isAuthenticated
              ? "border-gray-600 hover:border-violet-400 hover:bg-gray-800"
              : "border-gray-700 bg-gray-800 opacity-50 cursor-not-allowed"
          }`}
        >
          {!preview ? (
            <p className="text-gray-400">Click or drag file to upload / Capture from Camera</p>
          ) : (
            <img
              src={preview}
              alt="Preview"
              className="mx-auto mb-2 w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-md"
            />
          )}
        </div>

        {/* Message */}
        <textarea
          placeholder="Please describe the lost item..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={!isAuthenticated}
          className="w-full p-3 h-24 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:outline-none disabled:opacity-50"
        />

        {/* Select Type */}
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
            onClick={fetchFoundItems}
            disabled={!isAuthenticated}
            className={`py-3 rounded-xl font-semibold text-sm sm:text-base transition-all ${
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
          className="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 transition-all disabled:opacity-50"
        >
          Confirm Upload
        </button>

        {/* Popups */}
        {showPopup && (
          <Popup
            type={popupType}
            uploadedItem={uploadedItem}
            onClose={() => setShowPopup(false)}
          />
        )}

        {showMessagePopup && (
          <Popup
            type={popupType}
            message={popupMessage}
            onClose={() => setShowMessagePopup(false)}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
      `}</style> 
    </main>
  );
};

export default UploadPage;
