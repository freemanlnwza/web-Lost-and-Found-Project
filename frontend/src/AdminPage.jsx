import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Users, FileText, MessageSquare, Trash2, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";


const adminPage = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [messages, setMessages] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = currentUser?.role === "admin";

  // Loading / auth check
  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-400">
        <p>Access denied! Admin only.</p>
        <button
          onClick={() => navigate("/", { replace: true })}
          className="mt-4 px-4 py-2 bg-red-500 rounded text-white"
        >
          Go Home
        </button>
      </div>
    );
  }

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || currentUser?.id;

        if (activeTab === "users") {
          const res = await fetch("http://localhost:8000/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch users");
          setUsers(await res.json());
        } else if (activeTab === "items") {
          const res = await fetch("http://localhost:8000/admin/items", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch items");
          setItems(await res.json());
        } else if (activeTab === "messages") {
          const res = await fetch("http://localhost:8000/admin/messages", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch messages");
          setMessages(await res.json());
        } else if (activeTab === "logs") {
          const res = await fetch("http://localhost:8000/admin/logs", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch logs");
          setLogs(await res.json());
        }
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
        contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    fetchData();
  }, [activeTab, currentUser]);

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setCurrentUser(null);
    navigate("/login", { replace: true });
  };

  // User actions
  const handleMakeAdmin = async (userId) => {
    if (!confirm("Are you sure you want to make this user an admin?")) return;
    try {
      const token = localStorage.getItem("token") || currentUser?.id;
      const res = await fetch(`http://localhost:8000/admin/users/${userId}/make-admin`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: "admin" } : u));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to promote user");
    }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!confirm("Are you sure you want to remove admin role from this user?")) return;
    try {
      const token = localStorage.getItem("token") || currentUser?.id;
      const res = await fetch(`http://localhost:8000/admin/users/${userId}/remove-admin`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: "user" } : u));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to remove admin role");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = localStorage.getItem("token") || currentUser?.id;
      const res = await fetch(`http://localhost:8000/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const token = localStorage.getItem("token") || currentUser?.id;
      const res = await fetch(`http://localhost:8000/admin/items/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setItems(items.filter(i => i.id !== itemId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete item");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      const token = localStorage.getItem("token") || currentUser?.id;
      const res = await fetch(`http://localhost:8000/admin/messages/${messageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMessages(messages.filter(m => m.id !== messageId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete message");
    }
  };

  // Stats
  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "blue" },
    { label: "Total Items", value: items.length, icon: FileText, color: "green" },
    { label: "Total Messages", value: messages.length, icon: MessageSquare, color: "purple" },
    { label: "Admin Actions", value: logs.length, icon: Activity, color: "orange" },
  ];

  const colorMap = {
    blue: "text-blue-400",
    green: "text-green-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 flex flex-col p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className={colorMap[stat.color]} size={40} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto bg-gray-800/50 p-2 rounded-xl">
        {[
          { id: "users", label: "Users", icon: Users },
          { id: "items", label: "Items", icon: FileText },
          { id: "messages", label: "Messages", icon: MessageSquare },
          { id: "logs", label: "Admin Logs", icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap ${
              activeTab === tab.id ? "bg-yellow-500 text-gray-900" : "bg-gray-700/50 hover:bg-gray-600/50"
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        ref={contentRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 overflow-y-auto p-4 bg-gray-800/30 backdrop-blur-lg rounded-2xl border border-gray-700/50"
      >
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === "users" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400">ID</th>
                      <th className="text-left py-3 px-4 text-gray-400">Username</th>
                      <th className="text-left py-3 px-4 text-gray-400">Role</th>
                      <th className="text-left py-3 px-4 text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                        <td className="py-4 px-4">{u.id}</td>
                        <td className="py-4 px-4 font-medium">{u.username}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm ${u.role === 'admin' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td className="py-4 px-4 flex space-x-2">
                          {u.role !== 'admin' ? (
                            <>
                              <button onClick={() => handleMakeAdmin(u.id)} className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">Make Admin</button>
                              <button onClick={() => handleDeleteUser(u.id)} className="text-red-400"><Trash2 size={18} /></button>
                            </>
                          ) : (
                            u.id !== currentUser?.id && (
                              <button onClick={() => handleRemoveAdmin(u.id)} className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-sm">Remove Admin</button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <p className="text-center text-gray-400 py-8">No users found</p>}
              </div>
            )}

            {activeTab === "items" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400">ID</th>
                      <th className="text-left py-3 px-4 text-gray-400">Title</th>
                      <th className="text-left py-3 px-4 text-gray-400">Category</th>
                      <th className="text-left py-3 px-4 text-gray-400">User ID</th>
                      <th className="text-left py-3 px-4 text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(i => (
                      <tr key={i.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                        <td className="py-4 px-4">{i.id}</td>
                        <td className="py-4 px-4 font-medium">{i.title}</td>
                        <td className="py-4 px-4"><span className={`px-3 py-1 rounded-full text-sm ${i.category === 'Lost' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{i.category}</span></td>
                        <td className="py-4 px-4">{i.user_id}</td>
                        <td className="py-4 px-4"><button onClick={() => handleDeleteItem(i.id)} className="text-red-400"><Trash2 size={18} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {items.length === 0 && <p className="text-center text-gray-400 py-8">No items found</p>}
              </div>
            )}

            {activeTab === "messages" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400">ID</th>
                      <th className="text-left py-3 px-4 text-gray-400">Chat ID</th>
                      <th className="text-left py-3 px-4 text-gray-400">Sender ID</th>
                      <th className="text-left py-3 px-4 text-gray-400">Message</th>
                      <th className="text-left py-3 px-4 text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map(m => (
                      <tr key={m.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                        <td className="py-4 px-4">{m.id}</td>
                        <td className="py-4 px-4">{m.chat_id}</td>
                        <td className="py-4 px-4">{m.sender_id}</td>
                        <td className="py-4 px-4 max-w-md truncate">{m.message}</td>
                        <td className="py-4 px-4"><button onClick={() => handleDeleteMessage(m.id)} className="text-red-400"><Trash2 size={18} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {messages.length === 0 && <p className="text-center text-gray-400 py-8">No messages found</p>}
              </div>
            )}

            {activeTab === "logs" && (
              <div className="space-y-3">
                {logs.map(log => (
                  <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-gray-700/30 rounded-xl p-4 border border-gray-700 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-gray-400">by {log.admin_username}</p>
                    </div>
                    <p className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                  </motion.div>
                ))}
                {logs.length === 0 && <p className="text-center text-gray-400 py-8">No admin logs yet</p>}
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Error Popup */}
      {errorMsg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white p-6 rounded-lg max-w-sm text-center">
            <p className="mb-4">{errorMsg}</p>
            <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700" onClick={() => setErrorMsg(null)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default adminPage;
