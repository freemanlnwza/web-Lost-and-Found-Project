import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

const ChatPage = ({ currentUserId }) => {
  const { chatId } = useParams(); // URL มี chatId
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  // โหลดข้อความทั้งหมดเมื่อเข้าแชท
  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/chats/${chatId}/messages`);
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [chatId]);

  // ส่งข้อความ
const sendMessage = async () => {
  if (!input.trim()) return;

  const tempId = `temp-${Date.now()}`;
  const newMsg = {
    chat_id: Number(chatId),
    sender_id: Number(currentUserId),
    message: input,
  };

  // แสดงข้อความชั่วคราวทันที
  setMessages((prev) => [
    ...prev,
    { ...newMsg, id: tempId, created_at: new Date().toISOString() },
  ]);
  setInput("");

  try {
    const res = await fetch("http://localhost:8000/api/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // ส่ง JSON
      },
      body: JSON.stringify(newMsg),
    });

    if (!res.ok) throw new Error("Failed to send");

    const savedMsg = await res.json();

    // แทนที่ข้อความชั่วคราวด้วยข้อความจริง
    setMessages((prev) =>
      prev.map((m) => (m.id === tempId ? savedMsg : m))
    );
  } catch (err) {
    console.error("Send failed:", err);
    // ลบข้อความชั่วคราวถ้าส่งไม่สำเร็จ
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  }
};


  // Scroll อัตโนมัติเมื่อมีข้อความใหม่
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl mb-4">Chat Room #{chatId}</h1>

      {loading ? (
        <p>Loading messages...</p>
      ) : (
        <div className="flex-grow overflow-y-auto mb-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`mb-2 p-2 max-w-xs rounded ${
                m.sender_id === Number(currentUserId)
                  ? "bg-blue-600 ml-auto"
                  : "bg-gray-700"
              }`}
            >
              {m.message}
              <div className="text-xs text-gray-300">
                {new Date(m.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="flex space-x-2">
        <input
          className="flex-grow p-2 rounded bg-gray-800"
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
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
