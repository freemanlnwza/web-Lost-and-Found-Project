import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";

const ChatPage = ({ currentUserId }) => {
  const { chatId } = useParams();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState({
    image: location.state?.itemImage || null,
    title: location.state?.itemTitle || null,
  });
  const bottomRef = useRef(null);

  // โหลดข้อความ
  useEffect(() => {
    if (!chatId) return;
    const fetchChat = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/chats/${chatId}/messages`);
        const messagesData = await res.json();
        setMessages(Array.isArray(messagesData) ? messagesData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchChat();
  }, [chatId]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      chat_id: Number(chatId),
      sender_id: Number(currentUserId),
      message: text,
    };

    setMessages((prev) => [
      ...prev,
      { ...newMsg, id: tempId, created_at: new Date().toISOString(), username: "You" },
    ]);
    setInput("");

    try {
      const res = await fetch("http://localhost:8000/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });
      if (!res.ok) throw new Error("Failed to send message");
      const savedMsg = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === tempId ? savedMsg : m)));
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert("Failed to send message");
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
      <div className="flex justify-between items-center mb-4">
        {item && (
          <div className="flex items-center space-x-2">
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="w-12 h-12 object-cover rounded"
              />
            )}
            <span className="text-sm font-semibold">{item.title}</span>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-gray-300 animate-pulse">Loading messages...</p>
      ) : (
        <div className="flex-grow overflow-y-auto mb-4 space-y-2">
          {messages.length === 0 && (
            <p className="text-gray-400 text-center mt-4">No messages yet.</p>
          )}
          {messages.map((m) => {
            const isMine = m.sender_id === Number(currentUserId);
            return (
              <div
                key={m.id}
                className={`flex items-start space-x-2 p-2 max-w-xs rounded break-words ${
                  isMine ? "bg-blue-600 ml-auto flex-row-reverse" : "bg-gray-700"
                }`}
              >
                {m.image_data && (
                  <img
                    src={m.image_data}
                    alt="Item"
                    className="w-16 h-16 object-cover rounded mb-1"
                  />
                )}
                <div className="flex flex-col">
                  
                  <span>{m.message}</span>
                  <div className="text-xs text-gray-300 mt-1">
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString() : "-"}
                  </div>
                </div>
              </div>
            );
          })}
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
