import { useState, useEffect } from 'react';

const Lost = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLostItems = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/lost-items');
        const data = await res.json();
        setItems(data);
      } catch (error) {
        console.error('Error fetching lost items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLostItems();
  }, []);

  if (loading) {
    return (
      <main className="flex-grow flex items-center justify-center p-6">
        <p className="text-gray-700 text-lg">กำลังโหลดรายการของหาย...</p>
      </main>
    );
  }

  return (
    <main className="flex-grow p-6 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-10">📋 รายการของหาย</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:scale-105 transition duration-300"
            >
              <img
                src={`data:${item.image_content_type};base64,${item.image_data}`} // 👈 รองรับ base64 + MIME type
                alt={item.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl">
                    {item.type === 'lost' ? '📱' : '📦'}
                  </span>
                  <h2 className="text-xl font-semibold text-gray-800">{item.title}</h2>
                </div>
                <p className="text-gray-600 mb-4">
                  หมวดหมู่: {item.category}
                </p>
                <p className="text-gray-700 font-medium">
                  ผู้ใช้งาน: {item.user.username} {/* 👈 แก้จาก user_id.username */}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Lost;
