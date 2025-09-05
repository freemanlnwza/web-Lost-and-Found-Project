import { useState, useEffect } from 'react';

const Found = () => {
  const [items, setItems] = useState([
    {
      id: 1,
      image: 'https://source.unsplash.com/400x250/?wallet',
      icon: '👛',
      title: 'กระเป๋าสตางค์',
      description: 'หนังสีดำ มีรอยขีดเล็กๆ',
      time: '2025-08-28 14:30',
      details: 'พบที่สถานีรถไฟฟ้า สามารถติดต่อเจ้าหน้าที่ได้ที่ 02-123-4567',
    },
    {
      id: 2,
      image: 'https://source.unsplash.com/400x250/?keys',
      icon: '🔑',
      title: 'กุญแจ',
      description: 'กุญแจบ้าน 3 ดอก พวงกุญแจการ์ตูน',
      time: '2025-08-28 15:10',
      details: 'พบใกล้สวนสาธารณะ กรุณาติดต่อเพื่อยืนยัน',
    },
  ]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    // fetch('/api/found-items')
    //   .then((res) => res.json())
    //   .then((data) => setItems(data))
    //   .catch((error) => console.error('Error fetching items:', error));
  }, []);

  const handleDetailsClick = (item) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };

  return (
    <main className="flex-grow container mx-auto px-6 py-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">📋 สิ่งของที่เจอ</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:scale-105 transition duration-300"
          >
            <img src={item.image} alt={item.title} className="w-full h-40 object-cover" />
            <div className="p-5">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`text-${item.icon === '👛' ? 'orange' : 'red'}-500 text-xl`}>{item.icon}</span>
                <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
              </div>
              <p className="text-gray-600 text-sm">{item.description}</p>
              <p className="text-gray-500 text-xs mt-2">⏰ เวลาเจอ: {item.time}</p>
              <button
                onClick={() => handleDetailsClick(item)}
                className="mt-4 w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white py-2 rounded-xl font-medium transition-all"
              >
                รายละเอียดเพิ่มเติม
              </button>
              {selectedItem?.id === item.id && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  {item.details}
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