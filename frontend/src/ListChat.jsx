import { useEffect, useState } from "react";
import { MessageCircle, Image as ImageIcon } from "lucide-react";
import { MdDeleteOutline } from "react-icons/md"; // ✅ เพิ่มไอคอนลบ
import { useNavigate } from "react-router-dom";

const ListChat = ({ currentUserId }) => {
  const [chats, setChats] = useState([]);
  const [userItems, setUserItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ โหลดรายการแชท
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
    return () => (isMounted = false);
  }, [currentUserId]);

  // ✅ โหลดโพสต์ของ user
  useEffect(() => {
    if (!currentUserId) return;

    const fetchUserItems = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/items/user/${currentUserId}`);
        if (!res.ok) throw new Error("Unable to retrieve user items");
        const data = await res.json();
        setUserItems(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserItems();
  }, [currentUserId]);

  if (loading)
    return (
      <div className="flex justify-center items-center text-gray-400">
        Loading chats...
      </div>
    );

  const getChatPartner = (chat) => {
    if (chat.user1_id === currentUserId) {
      return { id: chat.user2_id, username: chat.user2_username };
    }
    return { id: chat.user1_id, username: chat.user1_username };
  };

  return (
    <div className="flex bg-gray-900 text-white h-full pt-16">
      {/* 🔹 ฝั่งซ้าย: โพสต์ของ user */}
      <div className="w-full sm:w-1/2 border-r border-white/40 p-5 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-5">My Posts</h2>

        {userItems.length === 0 ? (
          <p className="text-gray-400">You haven’t posted anything yet 😅</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userItems.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 rounded-xl p-3 hover:bg-gray-700 cursor-pointer transition flex flex-col"
              >
                {item.image_data ? (
                  <img
                    src={item.image_data}
                    alt={item.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-700 rounded-lg flex justify-center items-center">
                    <ImageIcon size={32} className="text-gray-400" />
                  </div>
                )}
                <p className="mt-2 font-medium truncate">{item.title}</p>
                <p className="text-sm text-gray-400">{item.category}</p>

                {/* 🔹 ปุ่มลบใช้ไอคอน MdDeleteOutline */}
                <div className="flex justify-end ">
                  <button
                    onClick={async () => {
                      if (window.confirm(`Delete "${item.title}" ?`)) {
                        try {
                          const res = await fetch(
                            `http://localhost:8000/api/items/${item.id}`,
                            { method: "DELETE" }
                          );
                          if (res.ok) {
                            setUserItems((prev) =>
                              prev.filter((i) => i.id !== item.id)
                            );
                          } else {
                            alert("Failed to delete item");
                          }
                        } catch (err) {
                          console.error(err);
                          alert("Error deleting item");
                        }
                      }
                    }}
                    className="text-red-500 hover:text-red-600 text-xl transition"
                    title="Delete item"
                  >
                    <MdDeleteOutline />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔹 ฝั่งขวา: รายการแชท */}
      <div className="w-full sm:w-1/2 overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 z-20 px-5 pt-4 pb-6 border-b border-white/50">
          <h2 className="text-2xl font-bold">Messages</h2>
        </div>

        {chats.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-gray-400 p-5">
            No messages 😅
          </div>
        ) : (
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

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{partner.username}</p>

                    {chat.item_title && (
                      <>
                        <p className="text-sm text-white/80 truncate hidden sm:block">
                          {chat.item_title}
                        </p>
                        <p className="text-sm text-white/80 truncate block sm:hidden">
                          {partner.username} - {chat.item_title}
                        </p>
                      </>
                    )}
                  </div>

                  {/* เวลา */}
                  <p className="text-xs text-white whitespace-nowrap hidden sm:block">
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
        )}
      </div>
    </div>
  );
};

export default ListChat;
