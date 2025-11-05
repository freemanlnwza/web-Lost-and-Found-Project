import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

// ===================== Popup Component =====================
const Popup = ({ type = "success", message, onClose, uploadedItem }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fade-in p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl w-full sm:max-w-xl md:max-w-2xl transform animate-scale-in overflow-hidden border border-gray-700">
        {/* Header */}
        <div
          className={`p-4 sm:p-6 flex items-center justify-between ${
            type === "success"
              ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20"
              : type === "error"
              ? "bg-gradient-to-r from-red-500/20 to-rose-500/20"
              : "bg-gradient-to-r from-yellow-500/20 to-orange-500/20"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                type === "success"
                  ? "bg-green-500/20"
                  : type === "error"
                  ? "bg-red-500/20"
                  : "bg-yellow-500/20"
              }`}
            >
              {type === "success" ? (
                <CheckCircle className="text-green-400" size={24} />
              ) : type === "error" ? (
                <XCircle className="text-red-400" size={24} />
              ) : (
                <AlertCircle className="text-yellow-400" size={24} />
              )}
            </div>
            <h2
              className={`text-lg sm:text-2xl font-bold ${
                type === "success"
                  ? "text-green-400"
                  : type === "error"
                  ? "text-red-400"
                  : "text-yellow-400"
              }`}
            >
              {type === "success" ? "Success!" : type === "error" ? "Error" : "Notice"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XCircle size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {uploadedItem ? (
            <div className="space-y-4">
              {(Array.isArray(uploadedItem) ? uploadedItem : [uploadedItem]).map((item, idx) => (
                <div
                  key={idx}
                  className="relative bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden w-full flex flex-col sm:flex-row"
                >
                  {/* Left side: Title + Category */}
                  <div className="w-full sm:w-[40%] p-4 flex flex-col justify-center gap-2">
                    <p className="text-white font-semibold text-sm sm:text-sm">Title : {item.title}</p>
                    <p className="text-white font-semibold text-sm sm:text-sm">Category : {item.category}</p>
                  </div>

                  {/* Right side: Image */}
                  {item.boxed_image_data && (
                    <div className="w-full sm:w-[60%] flex justify-center items-center p-4">
                      <img
                        src={item.boxed_image_data}
                        alt="Detected result"
                        className="w-full h-80 sm:h-96 object-contain bg-gray-900 rounded-xl"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-300 text-center">{message}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-gray-800/50 border-t border-gray-700">
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

  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("success");
  const [popupMessage, setPopupMessage] = useState("");
  const [showMessagePopup, setShowMessagePopup] = useState(false);

  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Lock ปุ่ม
  const [cooldown, setCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [showCooldownPopup, setShowCooldownPopup] = useState(false);

  useEffect(() => {
  let timer;
  if (cooldown && cooldownTime > 0) {
    timer = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }
  return () => clearInterval(timer);
}, [cooldown, cooldownTime]);
  // ===================== Load Camera Preview =====================
  useEffect(() => {
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
          setPopupMessage("Cannot load captured image, please retake.");
          setPopupType("error");
          setShowMessagePopup(true);
        });
    }

    navigate(location.pathname, { replace: true, state: {} });
  }
}, [location.state, navigate, uploadedImage]);


  // ===================== Handle Upload =====================
  const handleImageUpload = (fileOrDataURL) => {
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
  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const onDrop = (e) => { e.preventDefault(); e.stopPropagation(); handleImageUpload(e.dataTransfer.files[0]); };
  const selectType = (type) => setSelectedType(type);
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
  if (isSubmitting || cooldown) {
    setPopupMessage("Please wait before uploading again.");
    setPopupType("warning");
    setShowCooldownPopup(true); // ✅ แสดง popup คูลดาวน์
    return;
  }

  // ตรวจสอบข้อมูลก่อนส่ง
  if (!uploadedImage && !message) {
    setPopupMessage("Please select an image or enter a description.");
    setPopupType("warning");
    setShowMessagePopup(true);
    return;
  }

  setIsSubmitting(true);

  const formData = new FormData();
  formData.append("image", uploadedImage);
  formData.append("title", message);
  formData.append("type", selectedType);
  formData.append("category", category);
  const user = JSON.parse(localStorage.getItem("user"));
  formData.append("user_id", user?.id || 0);

  try {
    const res = await fetch("http://localhost:8000/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();
    setUploadedItem(data);
    setPopupType("success");
    setShowPopup(true);

    // ✅ เริ่มคูลดาวน์ 1 นาที (60 วินาที)
    setCooldown(true);
    setCooldownTime(60);
  } catch {
    setPopupMessage("Upload failed, please try again.");
    setPopupType("error");
    setShowMessagePopup(true);
  } finally {
    setIsSubmitting(false);
  }
};


  // ===================== Fetch Found Items =====================
  const fetchFoundItems = async () => {
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
        credentials: "include",
      });

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      navigate("/searchItem", { state: { foundItems: data } });
    } catch {
      setPopupMessage("Search failed, please try again.");
      setPopupType("error");
      setShowMessagePopup(true);
    }
  };

  const user = JSON.parse(localStorage.getItem("user"));

return (
  <main className="flex items-center justify-center h-full pt-24 pb-10 bg-gray-900">
    <div className="w-full max-w-xl bg-gray-800 bg-opacity-90 rounded-2xl shadow-xl p-6 sm:p-8 space-y-5 text-white border border-gray-700 mx-auto animate-scale-in">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-white drop-shadow-lg">
        Upload Image & Message
      </h1>

      {/* Category */}
      <div className="space-y-2">
        <label className="block text-gray-300 text-base sm:text-lg">
          Select item category :
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-3 rounded-xl border border-gray-700 bg-gray-900 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm sm:text-base"
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
      {user && (
        <button
          onClick={() => navigate("/camera")}
          className="w-full py-2.5 rounded-xl text-base font-semibold bg-green-600 hover:bg-green-700 transition-all"
        >
          📷 Open Camera
        </button>
      )}

      {/* Upload File */}
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
        className="p-6 text-center border-2 border-dashed rounded-xl cursor-pointer border-gray-600 hover:border-violet-400 hover:bg-gray-800 transition-all"
      >
        {!preview ? (
          <p className="text-gray-400 text-base sm:text-lg">
            Click or drag file to upload
          </p>
        ) : (
          <img
            src={preview}
            alt="Preview"
            className="mx-auto mb-3 w-36 h-36 sm:w-44 sm:h-44 object-cover rounded-xl shadow-md"
          />
        )}
      </div>

      {/* Message */}
      <textarea
        placeholder="Please describe the lost item..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-3 h-28 rounded-xl border border-gray-700 bg-gray-900 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm sm:text-base"
      />

      {/* Select Type */}
      {user && (
        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => {
              selectType("lost");
              setShowConfirmPopup(true);
            }}
            disabled={isSubmitting || cooldown}
            className={`w-full py-3 rounded-2xl font-semibold text-base transition-all ${
              selectedType === "lost" ? "ring-2 ring-rose-400" : ""
            } bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            📝 Report lost item
          </button>
        </div>
      )}

      {/* Found item */}
      <button
        type="button"
        onClick={fetchFoundItems}
        className="w-full py-3 rounded-2xl font-semibold text-base transition-all bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
      >
        🔍 Found item
      </button>

      {/* Confirm Popup */}
      {showConfirmPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fade-in">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-700 p-5 animate-scale-in text-center">
            <h2 className="text-xl font-bold text-yellow-400 mb-3">
              Confirm Report
            </h2>
            <p className="text-gray-300 mb-5">
              Are you sure you want to report this as a lost item?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (isSubmitting) return;
                  setShowConfirmPopup(false);
                  submitForm();
                }}
                className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                ✅ Confirm
              </button>
              <button
                onClick={() => setShowConfirmPopup(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-all"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Popups */}
        {showPopup && (
          <Popup
            type={popupType}
            uploadedItem={uploadedItem}
            onClose={() => {
              setShowPopup(false);
              resetForm();
            }}
          />
        )}

        {showMessagePopup && (
          <Popup type={popupType} message={popupMessage} onClose={() => setShowMessagePopup(false)} />
        )}
      </div>

      {showCooldownPopup && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fade-in">
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-sm w-full mx-4 border border-gray-700 p-6 animate-scale-in text-center">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">Cooldown Active</h2>
      <p className="text-gray-300 mb-6">
        Please wait <span className="text-yellow-400 font-bold">{cooldownTime}s</span> before uploading again.
      </p>
      <button
        onClick={() => setShowCooldownPopup(false)}
        className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition-all"
      >
        OK
      </button>
    </div>
  </div>
)}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.4s ease-out; }
      `}</style>
    </main>
  );
};

export default UploadPage;
