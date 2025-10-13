import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const ListChat = ({ currentUserId }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUserId) return;

    const fetchChats = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/chats/${currentUserId}`);
        if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลแชทได้");
        const data = await res.json();
        setChats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [currentUserId]);

  if (loading) return <div className="p-4 text-center text-gray-600">กำลังโหลด...</div>;

  if (chats.length === 0)
    return (
      <div className="p-4 text-center text-gray-500">
        ยังไม่มีห้องแชท 😅
      </div>
    );

  // ฟังก์ชันเลือกชื่อคู่สนทนา (ไม่ใช่ตัวเราเอง)
  const getChatPartner = (chat) => {
    if (chat.user1_id === currentUserId) {
      return { id: chat.user2_id, username: chat.user2_username };
    }
    return { id: chat.user1_id, username: chat.user1_username };
  };

  return (
    <div className="max-w-xl mx-auto mt-6 p-4">
      <h2 className="text-2xl font-semibold mb-4 text-center">รายการแชทของคุณ 💬</h2>
      <div className="space-y-3">
        {chats.map((chat) => {
          const partner = getChatPartner(chat);
          return (
            <div
              key={chat.chat_id}
              className="flex items-center justify-between bg-white shadow-md p-3 rounded-xl hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/chat/${chat.chat_id}`, { state: { partner } })}
            >
              <div className="flex items-center space-x-3">
                {chat.item_image ? (
                  <img
                    src={chat.item_image}
                    alt="item"
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                    🗨️
                  </div>
                )}
                <div>
                  <p className="font-semibold">{partner.username}</p>
                  {chat.item_title && (
                    <p className="text-sm text-gray-500">
                      เกี่ยวกับ: {chat.item_title}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">
                {new Date(chat.created_at).toLocaleString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "short",
                })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListChat;
