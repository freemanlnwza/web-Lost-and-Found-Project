import { useEffect, useState, useRef } from "react"; 
import { MessageCircle, Image as ImageIcon } from "lucide-react"; 
import { MdDeleteOutline, MdOutlineReportProblem } from "react-icons/md"; 
import { useNavigate } from "react-router-dom";

const ListChat = () => {
  const [chats, setChats] = useState([]); 
  const [userItems, setUserItems] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [reportingChat, setReportingChat] = useState(null);
  const [reportComment, setReportComment] = useState(""); 
  const [submitting, setSubmitting] = useState(false);
  const [reportError, setReportError] = useState("");
  const [deletingItem, setDeletingItem] = useState(null); 
  const [leftWidth, setLeftWidth] = useState(50); // default left panel width
  const dividerRef = useRef(null);
  const isResizing = useRef(false);
  const textareaRef = useRef(null);
  const navigate = useNavigate();
  const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;
  const [reportSuccess, setReportSuccess] = useState(false);
  // Fetch chats
  useEffect(() => {
    let isMounted = true;
    const fetchChats = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/chats/me", { credentials: "include" });
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
  }, []);

  // Fetch user items
  useEffect(() => {
    const fetchUserItems = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/items/user", { credentials: "include" });
        if (!res.ok) throw new Error("Unable to retrieve user items");
        const data = await res.json();
        setUserItems(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserItems();
  }, []);

  useEffect(() => {
    if (reportingChat && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [reportingChat]);
  // ---------------- Resize divider ----------------
useEffect(() => {
  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth >= 20 && newWidth <= 80) setLeftWidth(newWidth);
  };

  const handleTouchMove = (e) => {
    if (!isResizing.current) return;
    const touch = e.touches[0];
    const newWidth = (touch.clientX / window.innerWidth) * 100;
    if (newWidth >= 20 && newWidth <= 80) setLeftWidth(newWidth);
  };

  const stopResize = () => {
    isResizing.current = false;
  };

  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", stopResize);

  window.addEventListener("touchmove", handleTouchMove);
  window.addEventListener("touchend", stopResize);

  return () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", stopResize);

    window.removeEventListener("touchmove", handleTouchMove);
    window.removeEventListener("touchend", stopResize);
  };
}, []);


  // Resize divider
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth >= 20 && newWidth <= 80) setLeftWidth(newWidth);
    };
    const handleMouseUp = () => (isResizing.current = false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const getChatPartner = (chat) => {
    if (!currentUserId) return { id: chat.user2_id, username: chat.user2_username };
    return chat.user1_id === currentUserId
      ? { id: chat.user2_id, username: chat.user2_username }
      : { id: chat.user1_id, username: chat.user1_username };
  };

  const handleReportClick = (chat) => {
    setReportingChat(chat);
    setReportComment("");
    setReportError("");
  };

 // ====================
// submitReport function
// ====================
const submitReport = async () => {
  if (!currentUserId || !reportingChat) return;
  setSubmitting(true);
  setReportError("");

  try {
    const payload = {
      item_id: null,
      chat_id: reportingChat.chat_id ? Number(reportingChat.chat_id) : null,
      type: "chat",
      comment: (reportComment || "An issue has been detected").trim(),
    };

    const res = await fetch("http://localhost:8000/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errText = "Report failed";
      try {
        const errJson = await res.json();
        if (errJson && errJson.detail) errText = errJson.detail;
      } catch {}
      setReportError(errText);
      throw new Error(errText);
    }

    // แทน alert ให้เป็น popup
    setReportingChat(null);
    setReportComment("");
    setReportSuccess(true); // ✅ แสดง popup
  } catch (err) {
    console.error(err);
    if (!reportError) setReportError("Report failed. Please try again");
  } finally {
    setSubmitting(false);
  }
};


  const handleDeleteItem = async (item) => {
    try {
      const res = await fetch(`http://localhost:8000/api/items/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setUserItems((prev) => prev.filter((i) => i.id !== item.id));

        window.location.reload();
      } else {
        alert("Failed to delete item");
      }
    } catch (err) {
      alert("Error deleting item");
      console.error(err);
    } finally {
      setDeletingItem(null);
    }
  };

  if (loading)
    return <div className="flex justify-center items-center text-gray-400">Loading chats...</div>;

  return (
    <div className="flex bg-gray-900 text-white h-screen pt-16">
      {/* Left: User posts */}
       {/* Left Panel */}
  <div
    className="border-r border-white/40 p-5 overflow-y-auto"
    style={{
      width: `${leftWidth}%`,
      maxHeight: "calc(100vh - 4rem)",
    }}
  >
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

            <div className="flex justify-end">
              <button
                onClick={() => setDeletingItem(item)}
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

  {/* Divider + Shrink/Expand Buttons */}
 {/* Divider + Shrink/Expand Buttons */}
<div className="relative flex items-center">
  {/* Divider เส้นตรงกลาง */}
  <div
  ref={dividerRef}
  onMouseDown={() => (isResizing.current = true)}
  onTouchStart={() => (isResizing.current = true)}
  className="cursor-col-resize w-1 bg-white/40 h-full relative"
>
    {/* Shrink Left */}
    <div
      onClick={() => setLeftWidth((prev) => Math.max(prev - 5, 20))}
      className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 flex items-center justify-center text-white text-xs cursor-pointer"
      title="Shrink Left"
    >
   
    </div>
  </div>
</div>


  {/* Right Panel */}
  <div
    className="overflow-y-auto"
    style={{
      width: `${100 - leftWidth}%`,
      maxHeight: "calc(100vh - 4rem)",
    }}
  >
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

             <div
  className="flex-1 min-w-0"
  onClick={() =>
    navigate(`/chat/${chat.chat_id}`, {
      state: {
        otherUserId: partner.id,
        ownerUsername: partner.username,
        itemImage: chat.item_image || null,
        itemTitle: chat.item_title || null,
      },
    })
  }
>
  <p className="font-medium truncate">{partner.username}</p>
  {chat.item_title && (
    <p className="text-sm text-white/80 truncate">{chat.item_title}</p>
  )}
  {/* เพิ่มเวลาแสดงบน mobile */}
  <p className="text-xs text-white/70 truncate sm:hidden mt-1">
    {new Date(chat.created_at).toLocaleString("en-EN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    })}
  </p>
</div>

{/* เวลาเดิมสำหรับ desktop */}
<p className="text-xs text-white whitespace-nowrap hidden sm:block">
  {new Date(chat.created_at).toLocaleString("en-EN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  })}
</p>


              <button
                onClick={() => handleReportClick(chat)}
                className="ml-2 text-yellow-500 hover:bg-white hover:text-red-600 p-1.5 rounded-full transition"
                title="Report chat"
              >
                <MdOutlineReportProblem size={22} />
              </button>
            </div>
          );
        })}
      </div>
    )}
  </div>

      {/* Delete Popup */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setDeletingItem(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-white">Delete Item</h2>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete "{deletingItem.title}"?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDeleteItem(deletingItem)}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setDeletingItem(null)}
                className="flex-1 py-2 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Popup */}
      {reportingChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setReportingChat(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-white">Report Chat</h2>
            <p className="text-gray-300 mb-2">
              Chat with: {getChatPartner(reportingChat).username}
            </p>
            <textarea
              ref={textareaRef}
              className="w-full p-2 rounded-lg bg-gray-800 text-white resize-none mb-2"
              placeholder="Enter your comment..."
              rows={4}
              value={reportComment}
              onChange={(e) => setReportComment(e.target.value)}
            ></textarea>
            {reportError && <p className="text-sm text-rose-400 mb-3">{reportError}</p>}
            <button
              onClick={submitReport}
              disabled={submitting}
              className={`w-full py-2 rounded-lg text-black font-semibold transition-all ${
                submitting
                  ? "bg-yellow-300 cursor-not-allowed opacity-80"
                  : "bg-yellow-500 hover:bg-yellow-600"
              }`}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </div>
      )}

            {/* Report Success Popup */}
      {reportSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-sm relative">
            <button
              onClick={() => setReportSuccess(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-white">Report Submitted ✅</h2>
            <p className="text-gray-300 mb-4">Your report has been successfully submitted.</p>
            <button
              onClick={() => setReportSuccess(false)}
              className="w-full py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ListChat;
