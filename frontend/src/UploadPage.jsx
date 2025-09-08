import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UploadPage = () => {
  const [selectedType, setSelectedType] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [preview, setPreview] = useState(null);
  const [uploadedItem, setUploadedItem] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    setIsAuthenticated(!!storedUser);
  }, []);

  const requireLogin = () => {
    if (!isAuthenticated) {
      alert("⚠ กรุณาเข้าสู่ระบบก่อน");
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
      alert("กรุณากรอกข้อมูลให้ครบและเลือกประเภทสิ่งของ");
      return;
    }

    const formData = new FormData();
    formData.append('image', uploadedImage);
    formData.append('title', message);
    formData.append('type', selectedType);
    formData.append('category', category);

    const user = JSON.parse(localStorage.getItem("user"));
    formData.append('user_id', user?.id || 0);

    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setUploadedItem(data);
        alert("อัปโหลดสำเร็จ!");
      } else {
        alert(data.detail || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  return (
    <main className="flex-grow p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
            Upload Image & Message
          </h1>

          {!isAuthenticated && (
            <p className="text-red-500 text-center mb-4">
              ⚠ กรุณาเข้าสู่ระบบก่อนจึงจะใช้งานได้
            </p>
          )}

          {/* Category */}
          <div className="mb-6">
            <label className="block mb-2 font-semibold text-gray-700">Select item type :</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={!isAuthenticated}
              className={`w-full border rounded-xl p-3 focus:ring-2 focus:ring-pink-500 ${
                !isAuthenticated ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
            >
              <option value="">-- SELECT --</option>
              <option value="กระเป๋าตัง">Wallet</option>
              <option value="กุญแจ">Key</option>
              <option value="นาฬิกา">Watch</option>
              <option value="โทรศัพท์มือถือ">Mobile phone</option>
              <option value="รองเท้า">Shoes</option>
              <option value="บัตร">Card</option>
              <option value="อื่นๆ">Other</option>
            </select>
          </div>

          {/* Image upload */}
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
            className={`upload-area p-8 rounded-xl text-center border-2 ${
              isAuthenticated
                ? "border-gray-300 hover:border-orange-500 hover:bg-orange-50 cursor-pointer"
                : "border-gray-200 bg-gray-100 cursor-not-allowed"
            } mb-6 transition-all`}
          >
            {!preview ? (
              <div>
                <p className="text-gray-600 mb-2">Click to select an image</p>
                <p className="text-sm text-gray-400">Or drop files here</p>
              </div>
            ) : (
              <div>
                <img src={preview} alt="Preview" className="mx-auto mb-4 w-32 h-32 object-cover rounded-lg"/>
                <p className="text-sm text-gray-600">คลิกเพื่อเปลี่ยนรูปภาพ</p>
              </div>
            )}
          </div>

          {/* Message */}
          <textarea
            rows="4"
            placeholder="Please describe the lost item..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!isAuthenticated}
            className={`w-full border rounded-xl p-3 focus:ring-2 focus:ring-pink-500 resize-none ${
              !isAuthenticated ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          ></textarea>

          {/* Lost/Found buttons */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              type="button"
              onClick={() => selectType("lost")}
              disabled={!isAuthenticated}
              className={`py-3 rounded-xl text-white font-semibold transition-all ${
                selectedType === "lost" ? "ring-4 ring-pink-300" : ""
              } ${
                !isAuthenticated
                  ? "bg-pink-300 opacity-50 cursor-not-allowed"
                  : "bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
              }`}
            >
              📝 Report lost items
            </button>
            <button
              type="button"
              onClick={() => selectType("found")}
              disabled={!isAuthenticated}
              className={`py-3 rounded-xl text-white font-semibold transition-all ${
                selectedType === "found" ? "ring-4 ring-green-300" : ""
              } ${
                !isAuthenticated
                  ? "bg-green-300 opacity-50 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              🔍 Search lost items
            </button>
          </div>

          {/* Submit */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={submitForm}
              disabled={!isAuthenticated}
              className={`py-3 px-8 rounded-xl text-white font-bold transition-all ${
                !isAuthenticated
                  ? "bg-pink-300 opacity-50 cursor-not-allowed"
                  : "bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
              }`}
            >
              ✅ Confirm
            </button>
          </div>

          {uploadedItem && (
            <div className="mt-8 bg-gray-100 p-4 rounded-xl">
              <h2 className="font-bold mb-2">อัปโหลดสำเร็จ</h2>
              <img
                src={uploadedItem.image_data}
                alt={uploadedItem.title}
                className="w-32 h-32 object-cover rounded-lg mb-2"
              />
              <p className="font-semibold">{uploadedItem.title}</p>
              <p className="text-sm text-gray-500">
                {uploadedItem.type} - {uploadedItem.category}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default UploadPage;
