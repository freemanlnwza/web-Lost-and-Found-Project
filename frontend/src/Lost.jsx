import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, MapPin, Calendar, User } from "lucide-react";

const Lost = ({ currentUserId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActualImage, setShowActualImage] = useState(false);
  const navigate = useNavigate();

 useEffect(() => {
  let isMounted = true;

  const fetchLostItems = async () => {
    setLoading(true);
    setItems([]);

    try {
      const res = await fetch("http://localhost:8000/api/lost-items"); // ไม่ต้องใช้ credentials
      if (!res.ok) throw new Error("Failed to fetch lost items");

      const data = await res.json(); // ✅ ต้องแปลงเป็น json

      if (!isMounted) return;

      // filter เฉพาะถ้ามี currentUserId
      const filteredItems = currentUserId
        ? data.filter((item) => item.user_id !== currentUserId)
        : data;

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
      credentials: "include", // ✅ ส่ง HttpOnly cookie
      body: JSON.stringify({
        user2_id: otherUserId,
        item_id: itemId,
      }),
    });

    if (!res.ok) throw new Error("Failed to start chat");

    const chat = await res.json();
    navigate(`/chat/${chat.chat_id}`, {
      state: { otherUserId, itemImage, itemTitle, ownerUsername },
    });
  } catch (error) {
    console.error("Error starting chat:", error);
    alert("Cannot start chat right now.");
  }
};


  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading lost items...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-165 px-4 sm:px-6 lg:px-8">
      {/* pt-32 เว้นที่บนสำหรับ App header */}

      <div className="max-w-7xl mx-auto">
        {/* Header ของ Lost */}
 <div className="sticky top-16 z-40 bg-gray-900 bg-opacity-90 backdrop-blur-md py-4 px-4 sm:px-6 lg:px-8 rounded-b-3xl shadow-lg flex items-center justify-between flex-wrap gap-3">
  {/* Left: Title */}
  <div className="flex-1 min-w-0">
    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold truncate mb-1">
      Reported Lost Items
    </h1>
    <p className="text-gray-400 text-sm sm:text-base truncate">
      Help reunite lost items with their owners
    </p>
  </div>

  {/* Right: Toggle Button aligned center */}
  <div className="flex-shrink-0 flex items-center">
    <button
      onClick={() => setShowActualImage(!showActualImage)}
      className={`p-3 rounded-full transition-all flex items-center justify-center ${
        showActualImage ? "bg-white" : "bg-yellow-500 hover:bg-yellow-600"
      }`}
      title={showActualImage ? "Show Container-Fit" : "Show Actual Image"}
    >
      <img src="/public/arrow.png" alt="Toggle Image" className="h-4 w-4" />
    </button>
  </div>
</div>

        {/* Items Grid */}
        <div className="pt-20">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gray-900/70 backdrop-blur-lg rounded-3xl border border-gray-700 p-12 max-w-md mx-auto">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-300 text-xl font-medium mb-2">No lost items reported yet</p>
                <p className="text-gray-500">Be the first to report a lost item</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-gray-900 border border-gray-700/50 rounded-3xl shadow-lg overflow-hidden hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative w-full h-48 overflow-hidden rounded-t-3xl bg-gray-800">
                    <img
                      src={showActualImage ? item.original_image_data : item.image_data}
                      alt={item.title}
                      className={showActualImage ? "w-full h-full object-contain" : "w-full h-full object-cover"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-50"></div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-2xl flex-shrink-0">{item.type === "lost" ? "🏷️" : "📦"}</span>
                      <h2 className="text-lg font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </h2>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-sm">
                          <span className="text-gray-500">Category:</span>{" "}
                          <span className="font-medium">{item.category}</span>
                        </span>
                      </div>

                      {item.user_id !== currentUserId && (
                        <div className="flex items-center space-x-2 text-gray-300">
                          <User size={14} className="text-purple-400" />
                          <span className="text-sm">
                            <span className="text-gray-500">Reported by:</span>{" "}
                            <span className="font-medium">{item.username}</span>
                          </span>
                        </div>
                      )}

                      {item.location && (
                        <div className="flex items-center space-x-2 text-gray-300">
                          <MapPin size={14} className="text-green-400" />
                          <span className="text-sm font-medium">{item.location}</span>
                        </div>
                      )}

                      {item.created_at && (
                        <div className="flex items-center space-x-2 text-gray-400">
                          <Calendar size={12} />
                          <span className="text-xs">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        handleChat(item.user_id, item.id, item.username, item.image_data, item.title)
                      }
                      className="w-full py-1.5 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all text-sm flex items-center justify-center"
                    >
                      <MessageCircle className="inline mr-1 w-4 h-4" />
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Lost;
