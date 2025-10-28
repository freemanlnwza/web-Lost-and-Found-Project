import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import { MdOutlineDelete } from "react-icons/md";

// ----------------- Utility -----------------
const escapeHTML = (str) => {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const ChatPage = () => {
  const { chatId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const chatHeader = {
    itemImage: location.state?.itemImage || null,
    itemTitle: location.state?.itemTitle || null,
    ownerUsername: location.state?.ownerUsername || null,
  };

const [popupMsg, setPopupMsg] = useState(null);
const [redirectHome, setRedirectHome] = useState(false);

// ----------------- Utility -----------------
const showPopup = (msg, redirect = false) => {
  setPopupMsg(msg);
  setRedirectHome(redirect);
};

  // ----------------- Fetch Current User -----------------
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/chats/me", {
          credentials: "include", // ใช้ cookie HttpOnly + SameSite
        });
        if (!res.ok) {
          setCurrentUser(null);
          setIsAuthenticated(false);
          return;
        }
        const data = await res.json();
        setCurrentUser(data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("fetchCurrentUser error:", err);
      }
    };
    fetchCurrentUser();
  }, []);

  // ----------------- Fetch Chat Messages -----------------
 useEffect(() => {
  if (!chatId || !currentUser) return;

  const fetchChatMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/chats/${chatId}/messages`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showPopup(
          data.detail || "คุณไม่มีสิทธิ์เข้าถึงห้องนี้",
          true // redirect to /
        );
        return;
      }

      const data = await res.json();
      if (!data.messages) {
        setMessages([]);
        return;
      }

      const mapped = data.messages.map((m) => ({
        id: m.id,
        chat_id: m.chat_id,
        sender_id: m.sender_id,
        message: m.message ?? "",
        created_at: m.created_at,
        username: m.username ?? "Unknown",
        image: m.image ?? null,
        is_sender: m.is_sender,
      }));

      setMessages(mapped);
    } catch (err) {
      console.error("fetchChatMessages error:", err);
      showPopup("เกิดข้อผิดพลาดในการโหลดข้อความ", true);
    } finally {
      setLoading(false);
    }
  };

  fetchChatMessages();
}, [chatId, currentUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // ----------------- Send Message -----------------
  const sendMessage = async () => {
    const text = input.trim();
    if (!text && !imageFile) return;

    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      id: tempId,
      chat_id: chatId,
      message: text,
      created_at: new Date().toISOString(),
      sender_id: currentUser?.id,
      username: currentUser?.username ?? "You",
      image: imageFile ? URL.createObjectURL(imageFile) : null,
      is_sender: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setImageFile(null);

    try {
      const formData = new FormData();
      formData.append("chat_id", chatId);
      formData.append("message", text);

      if (imageFile) {
        // ----------------- File validation -----------------
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (imageFile.size > maxSize) {
          setErrorMsg("ไฟล์ใหญ่เกินไป จำกัด 5MB");
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          return;
        }
        formData.append("image", imageFile);
      }

      const res = await fetch(
        "http://localhost:8000/api/chats/messages/send",
        {
          method: "POST",
          body: formData,
          credentials: "include", // HttpOnly cookie
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.detail || "Failed to send message");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }

      const saved = await res.json();
      const savedNormalized = {
        id: saved.id,
        chat_id: saved.chat_id,
        sender_id: saved.sender_id,
        message: saved.message,
        created_at: saved.created_at,
        username: saved.username,
        image: saved.image_data ?? null,
        is_sender: true,
      };

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? savedNormalized : m))
      );
    } catch (err) {
      console.error("sendMessage error:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setErrorMsg("Failed to send message");
    }
  };

  // ----------------- Delete Message -----------------
// ----------------- State สำหรับ confirm -----------------
const [confirmPopup, setConfirmPopup] = useState(null); 
// confirmPopup = { message: "", onConfirm: () => {} }

const deleteMessage = (id) => {
  setConfirmPopup({
    message: "คุณต้องการลบข้อความนี้หรือไม่?",
    onConfirm: async () => {
      setConfirmPopup(null); // ปิด confirm ก่อนลบ
      try {
        const res = await fetch(
          `http://localhost:8000/api/chats/messages/${id}/delete`,
          { method: "DELETE", credentials: "include" }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showPopup(data.detail || "ลบไม่สำเร็จ");
          return;
        }
        setMessages((prev) => prev.filter((m) => m.id !== id));
      } catch (err) {
        console.error("deleteMessage error:", err);
        showPopup("เกิดข้อผิดพลาดในการลบข้อความ");
      }
    },
  });
};


// ----------------- Handle File Change -----------------
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    showPopup("สามารถส่งได้เฉพาะไฟล์รูปภาพและวิดีโอเท่านั้น");
    e.target.value = null;
    return;
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    showPopup("ไฟล์ใหญ่เกินไป จำกัด 5MB");
    e.target.value = null;
    return;
  }

  setImageFile(file);
};



  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900 text-white z-50">
      {/* Header */}
      <nav className="w-full bg-[#111827] border-b border-gray-800 text-white shadow-md flex-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg border border-black/40">
              <span className="text-black font-bold text-sm">L&F</span>
            </div>
            <span className="text-xl font-extrabold tracking-wide text-white">Lost & Found</span>
          </div>

          <div className="hidden md:flex space-x-6">
            <NavLink to="/" label="Home" />
            <NavLink to="/lost" label="Lost" />
            {isAuthenticated && <NavLink to="/chats" label="Chats" />}
            {!isAuthenticated ? (
              <>
                <NavLink to="/login" label="Login" />
                <NavLink to="/register" label="Register" />
                <NavLink to="/guidebook" label="Guidebook" />
              </>
            ) : (
              <>
                <NavLink to="/profile" label="Profile" />
                <NavLink to="/guidebook" label="Guidebook" />
                <LogoutButton setCurrentUser={setCurrentUser} setIsAuthenticated={setIsAuthenticated} />
              </>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-yellow-400 focus:outline-none">
              {isOpen ? <span className="text-2xl">&#x2715;</span> : <span className="text-2xl">&#9776;</span>}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden bg-[#1a1a1a] border-t border-gray-800 px-4 py-3 space-y-2">
            <NavLink to="/" label="Home" onClick={() => setIsOpen(false)} />
            <NavLink to="/lost" label="Lost" onClick={() => setIsOpen(false)} />
            {isAuthenticated && <NavLink to="/chats" label="Chats" onClick={() => setIsOpen(false)} />}
            {!isAuthenticated ? (
              <>
                <NavLink to="/login" label="Login" onClick={() => setIsOpen(false)} />
                <NavLink to="/register" label="Register" onClick={() => setIsOpen(false)} />
                <NavLink to="/guidebook" label="Guidebook" onClick={() => setIsOpen(false)} />
              </>
            ) : (
              <>
                <NavLink to="/profile" label="Profile" onClick={() => setIsOpen(false)} />
                <NavLink to="/guidebook" label="Guidebook" onClick={() => setIsOpen(false)} />
                <LogoutButton setCurrentUser={setCurrentUser} setIsAuthenticated={setIsAuthenticated} />
              </>
            )}
          </div>
        )}
      </nav>

      {/* Chat Header */}
      <div className="flex-none flex items-center p-4 border-b border-gray-700 justify-between">
        <div className="flex items-center">
          {chatHeader.itemImage && (
            <img src={chatHeader.itemImage} alt={chatHeader.itemTitle} className="w-12 h-12 object-cover rounded" />
          )}
          <div className="flex flex-col ml-3">
            {chatHeader.ownerUsername && <span className="text-lg font-bold">{chatHeader.ownerUsername}</span>}
            <span className="text-xs text-gray-400 font-medium">{chatHeader.itemTitle}</span>
          </div>
        </div>
        <button
          onClick={() => navigate("/chats")}
          className="ml-20 px-3 py-1 bg-blue-700 hover:bg-green-600 rounded text-m font-medium transition"
        >
          Back
        </button>
      </div>

      {/* Messages */}
<div className="flex-1 overflow-y-auto p-4 space-y-2">
  {loading ? (
    <p className="text-gray-300 animate-pulse text-center">
      Loading messages...
    </p>
  ) : messages.length === 0 ? (
    <p className="text-gray-400 text-center mt-4">No messages yet.</p>
  ) : (
    messages.map((m) => {
      const isMine = m.is_sender;
      let bgClass = isMine
        ? "bg-blue-600 text-white rounded-xl px-4 text-center"
        : "bg-green-600 text-white rounded-xl px-4 text-center";

      return (
        <div
          key={m.id}
          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
        >
          {isMine && (
            <MdOutlineDelete
              className="text-white mr-2 mt-3 cursor-pointer hover:text-red-500 transition-colors"
              size={22}
              onClick={() => deleteMessage(m.id)}
            />
          )}

          <div
            className={` px-4 py-2 break-words max-w-[70%] text-lg ${bgClass}`}
          >
            {m.image && (
              <div className=" mb-2 rounded-md p-1 flex justify-center items-center">
                <img
                  src={m.image}
                  alt="sent"
                  className="max-w-[200px] max-h-[200px] rounded-md object-cover"
                />
              </div>
            )}

            {m.message && (
              <span dangerouslySetInnerHTML={{ __html: escapeHTML(m.message) }} />
            )}

            <div className="text-xs text-white mt-1 text-right">
              {m.created_at
                ? new Date(m.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-"}
            </div>
          </div>
        </div>
      );
    })
  )}
  <div ref={bottomRef} />
</div>



      {/* Input Section */}
      <div className="flex-none flex items-center p-4 border-t border-gray-700 space-x-2 bg-gray-800">
        {imageFile && (
          <div className="relative">
            <img src={URL.createObjectURL(imageFile)} alt="preview" className="w-20 h-20 object-cover rounded-lg border border-gray-600" />
            <button
              onClick={() => setImageFile(null)}
              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
            >
              ×
            </button>
          </div>
        )}

        <label className="flex items-center justify-center w-12 h-12 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition">
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <span className="text-yellow-400 text-2xl">📎</span>
        </label>

        <input
          className="flex-grow p-2 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type a message..."
        />

        <button
          onClick={sendMessage}
          className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-600 transition"
        >
          Send
        </button>
      </div>

      {/* Error Popup */}
      {errorMsg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white p-6 rounded-lg max-w-sm text-center">
            <p className="mb-4">{errorMsg}</p>
            <button
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => setErrorMsg(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {popupMsg && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-gray-800 text-white p-6 rounded-lg max-w-sm text-center">
      <p className="mb-4">{popupMsg}</p>
      <button
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        onClick={() => {
          setPopupMsg(null);
          if (redirectHome) navigate("/");
        }}
      >
        OK
      </button>
    </div>
  </div>
)}{confirmPopup && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-gray-800 text-white p-6 rounded-lg max-w-sm text-center">
      <p className="mb-4">{confirmPopup.message}</p>
      <div className="flex justify-center gap-4">
        <button
          className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
          onClick={() => {
            confirmPopup.onConfirm();
          }}
        >
          ลบ
        </button>
        <button
          className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700"
          onClick={() => setConfirmPopup(null)}
        >
          ยกเลิก
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};


// ----------------- Reusable Components -----------------
const NavLink = ({ to, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="block md:inline text-white font-medium px-3 py-2 hover:text-yellow-400 hover:underline underline-offset-4 transition"
  >
    {label}
  </Link>
);

const LogoutButton = ({ setCurrentUser, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    navigate("/");
  };
  return (
    <button
      onClick={handleLogout}
      className="text-white font-medium px-3 py-2 hover:text-yellow-400 hover:underline underline-offset-4 transition"
    >
      Logout
    </button>
  );
};

export default ChatPage;
