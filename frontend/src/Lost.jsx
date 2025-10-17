import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, MapPin, Calendar, User } from "lucide-react";

const Lost = ({ currentUserId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true; // ป้องกัน memory leak

    const fetchLostItems = async () => {
      setLoading(true);
      setItems([]); // ล้าง state ก่อน fetch
      try {
        const res = await fetch("http://localhost:8000/api/lost-items");
        const data = await res.json();

        if (!isMounted) return;

        // กรองโพสต์ของตัวเอง
        const filteredItems = data.filter(
          (item) => item.user_id !== currentUserId
        );
        setItems(filteredItems);
      } catch (error) {
        console.error("Error fetching lost items:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLostItems();

    return () => {
      isMounted = false;
    };
  }, [currentUserId]);

  const handleChat = async (otherUserId, itemId, ownerUsername, itemImage, itemTitle) => { 
    try {
      const res = await fetch("http://localhost:8000/api/chats/get-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user1_id: currentUserId,
          user2_id: otherUserId,
          item_id: itemId,
        }),
      });

      if (!res.ok) throw new Error("Failed to start chat");

      const chat = await res.json();

      navigate(`/chat/${chat.chat_id}`, {
        state: {
          currentUserId,
          otherUserId,
          itemImage,
          itemTitle,
          ownerUsername,
        },
      });
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Cannot start chat right now.");
    }
  };

  if (loading) {
    return (
      <main key={currentUserId} className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading lost items...</p>
        </div>
      </main>
    );
  }

  return (
   <main
  key={currentUserId}
  className="
    min-h-screen
    bg-gray-800 bg-opacity-90
    text-white
    py-12 px-4 sm:px-6 lg:px-8
    duration-700
    rounded-2xl
    shadow-2xl
    border-2 border-yellow-500
    mx-auto
  ">
  {/* เนื้อหาภายใน main */}

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Reported Lost Items
          </h1>
          <p className="text-gray-400 text-lg">
            Help reunite lost items with their owners
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl border border-gray-700 p-12 max-w-md mx-auto">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-300 text-xl font-medium mb-2">
                No lost items reported yet
              </p>
              <p className="text-gray-500">
                Be the first to report a lost item
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <div
      key={item.id}
      className="group relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-3xl shadow-xl overflow-hidden
                 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 transition-all duration-300"
    >
      {/* container fixed size */}
  <div className="relative w-full h-64 overflow-hidden rounded-3xl bg-gray-800">
  <img
    src={item.original_image_data || item.image_data}
    alt={item.title}
    className="absolute top-0 left-0 w-full h-full object-cover" 
  />
  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
  <div className="absolute top-4 right-4">
  </div>
</div>


                <div className="p-6 space-y-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-3xl flex-shrink-0">
                      {item.type === "lost" ? "🏷️" : "📦"}
                    </span>
                    <h2 className="text-xl font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h2>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm">
                        <span className="text-gray-500">Category:</span>{" "}
                        <span className="font-medium">{item.category}</span>
                      </span>
                    </div>

                    {item.user_id !== currentUserId && (
                      <div className="flex items-center space-x-2 text-gray-300">
                        <User size={16} className="text-purple-400" />
                        <span className="text-sm">
                          <span className="text-gray-500">Reported by:</span>{" "}
                          <span className="font-medium">{item.username}</span>
                        </span>
                      </div>
                    )}

                    {item.location && (
                      <div className="flex items-center space-x-2 text-gray-300">
                        <MapPin size={16} className="text-green-400" />
                        <span className="text-sm font-medium">{item.location}</span>
                      </div>
                    )}

                    {item.created_at && (
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Calendar size={14} />
                        <span className="text-xs">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto">
                    <button  
                      onClick={() => handleChat(
                        item.user_id,
                        item.id,
                        item.username,
                        item.image_data, 
                        item.title
                      )}
                      className="w-full py-2 rounded-lg font-semibold text-white 
                                bg-gradient-to-r from-green-500 to-emerald-600 
                                hover:from-green-600 hover:to-emerald-700 transition-all"
                    >
                      💬 Chat
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Lost;
