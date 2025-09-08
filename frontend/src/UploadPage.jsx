import { useState } from 'react';

const UploadPage = () => {
  const [selectedType, setSelectedType] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [preview, setPreview] = useState(null);
  const [uploadedItem, setUploadedItem] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploadedImage(file);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const selectType = (type) => {
    setSelectedType(type);
  };

  const submitForm = async () => {
    if (!uploadedImage || !message || !selectedType || !category) {
      alert("กรุณากรอกข้อมูลให้ครบและเลือกประเภทสิ่งของ");
      return;
    }

    const formData = new FormData();
    formData.append('image', uploadedImage);
    formData.append('title', message);
    formData.append('type', selectedType);
    formData.append('category', category);
    formData.append('user_id', 1); // ตัวอย่าง user_id สำหรับทดสอบ

    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setUploadedItem(data); // เก็บ item response
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

          {/* เลือกประเภท */}
          <div className="mb-6">
            <label htmlFor="category" className="block mb-2 font-semibold text-gray-700">
              Select item type :
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border-gray-300 border rounded-xl p-3 focus:ring-2 focus:ring-pink-500"
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

          {/* Upload รูป */}
          <div className="mb-6">
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <div
              id="uploadArea"
              onClick={() => document.getElementById('imageUpload').click()}
              className="upload-area cursor-pointer p-8 rounded-xl text-center border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-all"
            >
              {!preview ? (
                <div>
                  <p className="text-gray-600 mb-2">Click to select an image</p>
                  <p className="text-sm text-gray-400">Or drop files here</p>
                </div>
              ) : (
                <div>
                  <img src={preview} className="preview-image mx-auto mb-4" alt="Preview" />
                  <p className="text-sm text-gray-600">คลิกเพื่อเปลี่ยนรูปภาพ</p>
                </div>
              )}
            </div>
          </div>

          {/* ข้อความ */}
          <div className="mb-6">
            <textarea
              rows="4"
              placeholder="Please describe the lost item..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border-gray-300 border rounded-xl p-3 focus:ring-2 focus:ring-pink-500 resize-none"
            ></textarea>
          </div>

          {/* ปุ่มประเภท lost / found */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => selectType('lost')}
              className={`bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-semibold py-3 rounded-xl transition-all ${
                selectedType === 'lost' ? 'ring-4 ring-pink-300' : ''
              }`}
            >
              📝 Report lost items
            </button>
            <button
              type="button"
              onClick={() => selectType('found')}
              className={`bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-all ${
                selectedType === 'found' ? 'ring-4 ring-green-300' : ''
              }`}
            >
              🔍 Search lost items
            </button>
          </div>

          {/* ปุ่ม submit */}
          <div className="text-center">
            <button
              type="button"
              onClick={submitForm}
              className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-all"
            >
              ✅ Confirm
            </button>
          </div>

          {/* แสดง item หลัง upload */}
          {uploadedItem && (
            <div className="mt-8 bg-gray-100 p-4 rounded-xl">
              <h2 className="font-bold mb-2">อัปโหลดสำเร็จ</h2>
              <img
                src={uploadedItem.image_data}
                className="w-32 h-32 object-cover rounded-lg mb-2"
                alt={uploadedItem.title}
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
