import { useState } from 'react';

const UploadPage = () => {
  const [selectedType, setSelectedType] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [matches, setMatches] = useState([]);
  const [preview, setPreview] = useState(null);

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

    try {
      const res = await fetch('/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok) {
        setMatches(data.matches || []);
      } else {
        alert(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const displayMatches = (matches) => {
    return matches.map((m) => {
      const filename = m.image_path.split(/[\\/]/).pop();
      return (
        <div key={filename} className="bg-white p-2 rounded-xl shadow hover:scale-105 transition text-center">
          <img src={`/static/uploads/${filename}`} className="w-full h-32 object-cover rounded-lg mb-2" alt={m.title} />
          <p className="font-semibold">{m.title}</p>
          <p className="text-sm text-gray-500">{m.type} - similarity: {(m.similarity * 100).toFixed(1)}%</p>
        </div>
      );
    });
  };

  return (
    <main className="flex-grow p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">อัปโหลดรูปและข้อความ</h1>

          <div className="mb-6">
            <label htmlFor="category" className="block mb-2 font-semibold text-gray-700">เลือกประเภทสิ่งของ:</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border-gray-300 border rounded-xl p-3 focus:ring-2 focus:ring-pink-500"
            >
              <option value="">-- กรุณาเลือก --</option>
              <option value="กระเป๋าตัง">กระเป๋าตัง</option>
              <option value="กุญแจ">กุญแจ</option>
              <option value="นาฬิกา">นาฬิกา</option>
              <option value="โทรศัพท์มือถือ">โทรศัพท์มือถือ</option>
              <option value="รองเท้า">รองเท้า</option>
              <option value="บัตร">บัตร</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>

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
              {!preview && (
                <div id="uploadContent">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-gray-600 mb-2">คลิกเพื่อเลือกรูปภาพ</p>
                  <p className="text-sm text-gray-400">หรือลากไฟล์มาวางที่นี่</p>
                </div>
              )}
              {preview && (
                <div id="imagePreview">
                  <img id="previewImg" src={preview} className="preview-image mx-auto mb-4" alt="Preview" />
                  <p className="text-sm text-gray-600">คลิกเพื่อเปลี่ยนรูปภาพ</p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <textarea
              id="messageText"
              rows="4"
              placeholder="ชื่อของหัวข้อรูปภาพ..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border-gray-300 border rounded-xl p-3 focus:ring-2 focus:ring-pink-500 resize-none"
            ></textarea>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => selectType('post')}
              className={`bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-semibold py-3 rounded-xl transition-all ${selectedType === 'post' ? 'ring-4 ring-pink-300' : ''}`}
            >
              📝 Post
            </button>
            <button
              type="button"
              onClick={() => selectType('found')}
              className={`bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-all ${selectedType === 'found' ? 'ring-4 ring-green-300' : ''}`}
            >
              🔍 Found
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={submitForm}
              className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-all"
            >
              ✅ ยืนยัน
            </button>
          </div>

          {matches.length > 0 && (
            <div id="matchesContainer" className="mt-8">
              <h2 className="text-xl font-bold mb-4">รายการที่จับคู่ได้</h2>
              <div id="matchesGrid" className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {displayMatches(matches)}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default UploadPage;