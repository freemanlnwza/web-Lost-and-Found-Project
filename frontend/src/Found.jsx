import { useState, useEffect } from 'react';

const Found = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFoundItems = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/found-items');
        const data = await res.json();
        setItems(data);
      } catch (error) {
        console.error('Error fetching found items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFoundItems();
  }, []);

  const handleDetailsClick = (item) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };

  if (loading) {
    return (
      <main className="flex-grow flex items-center justify-center p-6">
        <p className="text-gray-700 text-lg">กำลังโหลดรายการสิ่งของที่เจอ...</p>
      </main>
    );
  }

  return (
    <main className="flex-grow p-6 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">📋 สิ่งของที่เจอ</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:scale-105 transition duration-300"
          >
            <img
              src={item.image_data}
              alt={item.title}
              className="w-full h-40 object-cover"
            />
            <div className="p-5">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">
                  {item.type === 'found' ? '📦' : '❓'}
                </span>
                <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
              </div>
              <p className="text-gray-600 text-sm">หมวดหมู่: {item.category}</p>
              <p className="text-gray-500 text-xs mt-2">ผู้ใช้งาน ID: {item.user_id}</p>
              <button
                onClick={() => handleDetailsClick(item)}
                className="mt-4 w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white py-2 rounded-xl font-medium transition-all"
              >
                รายละเอียดเพิ่มเติม
              </button>
              {selectedItem?.id === item.id && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  {/* แสดงรายละเอียดเพิ่มเติม ถ้ามี */}
                  ID ของผู้โพสต์: {item.user_id}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Found;
