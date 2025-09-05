import { useState } from 'react';

const Lost = () => {
  const [items] = useState([
    {
      id: 1,
      image: 'https://source.unsplash.com/400x250/?smartphone',
      icon: '📱',
      title: 'โทรศัพท์มือถือ',
      location: 'หอพัก ABC',
      date: '25 ม.ค. 2568',
      contact: '089-123-4567',
    },
    {
      id: 2,
      image: 'https://source.unsplash.com/400x250/?wallet',
      icon: '👛',
      title: 'กระเป๋าสตางค์',
      location: 'รถเมล์สาย 44',
      date: '20 ม.ค. 2568',
      contact: 'Line ID: wallet123',
    },
    {
      id: 3,
      image: 'https://source.unsplash.com/400x250/?keys',
      icon: '🔑',
      title: 'กุญแจรถ',
      location: 'ลานจอดรถห้าง XYZ',
      date: '15 ม.ค. 2568',
      contact: '091-555-8888',
    },
  ]);

  return (
    <main className="flex-grow p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-10">📋 รายการของหาย</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:scale-105 transition duration-300"
            >
              <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`text-${item.icon === '📱' ? 'pink' : item.icon === '👛' ? 'orange' : 'red'}-500 text-2xl`}>
                    {item.icon}
                  </span>
                  <h2 className="text-xl font-semibold text-gray-800">{item.title}</h2>
                </div>
                <p className="text-gray-600 mb-4">หายที่: {item.location} เมื่อวันที่ {item.date}</p>
                <p className="text-gray-700 font-medium">ติดต่อ: {item.contact}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Lost;