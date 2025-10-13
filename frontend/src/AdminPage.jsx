import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FileText, MessageSquare, Trash2, Shield, Activity } from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [messages, setMessages] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
    
    // Check if user is admin
    if (user.role !== "admin") {
      alert("Access denied! Admin only.");
      window.location.href = "/";
      return;
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || currentUser?.id;
      
      if (activeTab === "users") {
        const res = await fetch("http://localhost:8000/admin/users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        } else {
          console.error("Failed to fetch users");
        }
      } else if (activeTab === "items") {
        const res = await fetch("http://localhost:8000/admin/items", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data);
        } else {
          console.error("Failed to fetch items");
        }
      } else if (activeTab === "messages") {
        const res = await fetch("http://localhost:8000/admin/messages", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        } else {
          console.error("Failed to fetch messages");
        }
      } else if (activeTab === "logs") {
        const res = await fetch("http://localhost:8000/admin/logs", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAdminLogs(data);
        } else {
          console.error("Failed to fetch logs");
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async (userId) => {
    if (!confirm("Are you sure you want to make this user an admin?")) return;
    
    try {
      const token = localStorage.getItem("token") || currentUser?.id;
      const res = await fetch(`http://localhost:8000/admin/users/${userId}/make-admin`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: 'admin' } : u));
        alert("User promoted to admin successfully!");
        loadData(); // Reload to update logs
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to promote user");
      }
    } catch (error) {
      console.error("Error promoting user:", error);
      alert("Failed to promote user");
    }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!confirm("Are you sure you want to remove admin role from this user?")) return;
    
    try {
      const token = localStorage.getItem("token") || currentUser?.id;
      const res = await fetch(`http://localhost:8000/admin/users/${userId}/remove-admin`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: 'user' } : u));
        alert("Admin role removed successfully!");
        loadData(); // Reload to update logs
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to remove admin role");
      }
    } catch (error) {
      console.error("Error removing admin role:", error);
      alert("Failed to remove admin role");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user? This will also delete all their items and messages.")) return;
    
    try {
      const token = localStorage.getItem("token") || currentUser?.id;
      const res = await fetch(`http://localhost:8000/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
        alert("User deleted successfully!");
        loadData(); // Reload to update logs
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const token = localStorage.getItem("token") || currentUser?.id;
      const res = await fetch(`http://localhost:8000/admin/items/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setItems(items.filter(i => i.id !== itemId));
        alert("Item deleted successfully!");
        loadData(); // Reload to update logs
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    
    try {
      const token = localStorage.getItem("token") || currentUser?.id;
      const res = await fetch(`http://localhost:8000/admin/messages/${messageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setMessages(messages.filter(m => m.id !== messageId));
        alert("Message deleted successfully!");
        loadData(); // Reload to update logs
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }
  };

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "blue" },
    { label: "Total Items", value: items.length, icon: FileText, color: "green" },
    { label: "Total Messages", value: messages.length, icon: MessageSquare, color: "purple" },
    { label: "Admin Actions", value: adminLogs.length, icon: Activity, color: "orange" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="text-yellow-400" size={36} />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-400 mt-1">Welcome, {currentUser?.username}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className={`text-${stat.color}-400`} size={40} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "users", label: "Users", icon: Users },
          { id: "items", label: "Items", icon: FileText },
          { id: "messages", label: "Messages", icon: MessageSquare },
          { id: "logs", label: "Admin Logs", icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-yellow-500 text-gray-900"
                : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50"
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/30 backdrop-blur-lg rounded-2xl border border-gray-700/50 p-6"
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
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                        <td className="py-4 px-4">{user.id}</td>
                        <td className="py-4 px-4 font-medium">{user.username}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            user.role === 'admin' 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            {user.role !== 'admin' ? (
                              <>
                                <button
                                  onClick={() => handleMakeAdmin(user.id)}
                                  className="px-3 py-1 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg transition-colors text-sm"
                                  title="Promote to Admin"
                                >
                                  Make Admin
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            ) : (
                              user.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleRemoveAdmin(user.id)}
                                  className="px-3 py-1 bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 rounded-lg transition-colors text-sm"
                                  title="Remove Admin Role"
                                >
                                  Remove Admin
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No users found</p>
                )}
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
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                        <td className="py-4 px-4">{item.id}</td>
                        <td className="py-4 px-4 font-medium">{item.title}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            item.category === 'Lost' 
                              ? 'bg-red-500/20 text-red-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-400">{item.user_id}</td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {items.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No items found</p>
                )}
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
                    {messages.map((msg) => (
                      <tr key={msg.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                        <td className="py-4 px-4">{msg.id}</td>
                        <td className="py-4 px-4">{msg.chat_id}</td>
                        <td className="py-4 px-4">{msg.sender_id}</td>
                        <td className="py-4 px-4 max-w-md truncate">{msg.message}</td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {messages.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No messages found</p>
                )}
              </div>
            )}

            {activeTab === "logs" && (
              <div className="space-y-3">
                {adminLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-700/30 rounded-xl p-4 border border-gray-700 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-gray-400">by {log.admin_username}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </motion.div>
                ))}
                {adminLogs.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No admin logs yet</p>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}