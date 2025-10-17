import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ListChat = ({ currentUserId }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUserId) return;

    let isMounted = true;

    const fetchChats = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/chats/${currentUserId}`);
        if (!res.ok) throw new Error("Unable to retrieve chat data");
        const data = await res.json();
        if (isMounted) setChats(data);
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchChats();

    return () => {
      isMounted = false;
    };
  }, [currentUserId]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">
        Loading chats...
      </div>
    );

  if (chats.length === 0)
    return (
      <div className="flex flex-col justify-center items-center h-screen text-gray-400">
        No messages 😅
      </div>
    );

  // เลือกคู่สนทนา (ไม่ใช่ตัวเราเอง)
  const getChatPartner = (chat) => {
    if (chat.user1_id === currentUserId) {
      return { id: chat.user2_id, username: chat.user2_username };
    }
    return { id: chat.user1_id, username: chat.user1_username };
  };

  return (
    <div className="flex justify-end bg-gray-900 text-white min-h-screen">
      <div className="w-[500px] border-l border-gray-800 shadow-lg bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 z-20 px-5 pt-4 pb-6 border-b border-white/40">
          <h2 className="text-2xl font-bold">Messages</h2>
        </div>

        {/* Chat List */}
        <div className="divide-y divide-gray-800">
          {chats.map((chat) => {
            const partner = getChatPartner(chat);

            return (
              <div
                key={chat.chat_id}
                onClick={() =>
                  navigate(`/chat/${chat.chat_id}`, {
                    state: {
                      currentUserId,
                      otherUserId: partner.id,
                      ownerUsername: partner.username,
                      itemImage: chat.item_image || null,
                      itemTitle: chat.item_title || null,
                    },
                  })
                }
                className="flex items-center gap-3 p-4 hover:bg-gray-800 cursor-pointer transition-colors duration-200"
              >
                {/* Avatar หรือ Item Image */}
                {chat.item_image ? (
                  <img
                    src={chat.item_image}
                    alt="item"
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-gray-300">
                    <MessageCircle size={22} />
                  </div>
                )}

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{partner.username}</p>
                  {chat.item_title && (
                    <p className="text-sm text-white/80 truncate">{chat.item_title}</p>
                  )}
                </div>

                {/* เวลา */}
                <p className="text-xs text-white whitespace-nowrap">
                  {new Date(chat.created_at).toLocaleString("en-EN", {
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
    </div>
  );
};

export default ListChat;
