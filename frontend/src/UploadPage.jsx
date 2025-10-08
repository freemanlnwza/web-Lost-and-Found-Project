import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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

  // ===================== Drag & Drop =====================
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

  // ===================== Select Type =====================
  const selectType = (type) => {
    if (!requireLogin()) return;
    setSelectedType(type);
  };

  // ===================== Reset Form =====================
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
        setShowMessagePopup(true);
        return;
      }
    }

    if (!imageFile || !message || !selectedType || !category) {
      setPopupMessage("Please complete all fields and select an item category.");
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
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setPopupMessage("Image can't upload, please try new Image.");
        setShowMessagePopup(true);
        return;
      }

      const data = await res.json();
      setUploadedItem(data);
      setShowPopup(true);
      resetForm();
    } catch (error) {
      setPopupMessage("Image can't upload, please try new Image.");
      setShowMessagePopup(true);
    }
  };

  // ===================== Fetch Found Items =====================
const fetchFoundItems = async () => {
  if (!requireLogin()) return;

  try {
    const formData = new FormData();
    if (message) formData.append("text", message);
    if (uploadedImage) formData.append("image", uploadedImage);

    const res = await fetch("http://localhost:8000/search", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Search failed");
    }

    const data = await res.json();

    // ✅ แทนที่จะ show popup -> ไปหน้าใหม่ /result พร้อมส่ง data
    navigate("/searchItem", { state: { foundItems: data } });

  } catch (err) {
    setPopupMessage("Search failed, please try again.");
    setShowMessagePopup(true);
  }
};

  // ===================== UI =====================
  return (
    <main className="flex items-center justify-center">
      <div className="w-full max-w-xl bg-gray-900 backdrop-blur-lg rounded-2xl shadow-2xl p-6 space-y-4 text-white border border-gray-800">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          Upload Image & Message
        </h1>

        {!isAuthenticated && (
          <p className="text-red-400 text-center">
            ⚠ Please log in to continue.
          </p>
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
            <p className="text-gray-400">
              Click or drag file to upload / Capture from Camera
            </p>
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
            onClick={fetchFoundItems} // เรียก endpoint /search
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
        {showPopup && uploadedItem && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center relative">
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold text-black">✅ Result</h2>
              <div className="mt-3 text-center text-gray-800">
                {Array.isArray(uploadedItem) ? (
                  uploadedItem.map((item, idx) => (
                    <div key={idx} className="mb-3">
                      <p><strong>Title:</strong> {item.title}</p>
                      <p><strong>Type:</strong> {item.type}</p>
                      <p><strong>Category:</strong> {item.category}</p>
                      {item.boxed_image_data && (
                        <img
                          src={item.boxed_image_data}
                          alt="Detected result"
                          className="mx-auto mt-1 rounded-lg w-64 h-48 object-contain"
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <>
                    <p><strong>Title:</strong> {uploadedItem.title}</p>
                    <p><strong>Type:</strong> {uploadedItem.type}</p>
                    <p><strong>Category:</strong> {uploadedItem.category}</p>
                    {uploadedItem.boxed_image_data && (
                      <img
                        src={uploadedItem.boxed_image_data}
                        alt="Detected result"
                        className="mx-auto mt-1 rounded-lg w-64 h-48 object-contain"
                      />
                    )}
                  </>
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
