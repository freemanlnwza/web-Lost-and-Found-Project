import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Users, FileText, MessageSquare, Trash2, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HiArrowRightOnRectangle } from "react-icons/hi2";
import { IoBanSharp } from "react-icons/io5";
const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const contentRef = useRef(null);
  const navigate = useNavigate();
  const useCheckSession = (navigate, currentUser) => {
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("http://localhost:8000/auth/check-session", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          console.warn("Session invalid or expired.");
          localStorage.clear();
          sessionStorage.clear();
          navigate("/login", { replace: true });
          return;
        }

        const data = await res.json();

        if (!data?.user || data.user.role !== "admin") {
          console.warn("Unauthorized access. Admin only.");
          localStorage.clear();
          sessionStorage.clear();
          navigate("/login", { replace: true });
        }
      } catch (err) {
        console.error("Session check error:", err);
        localStorage.clear();
        sessionStorage.clear();
        navigate("/login", { replace: true });
      }
    };

    checkSession();

    // ✅ ตรวจซ้ำทุก 1 นาที (กัน session หมดอายุ)
    const interval = setInterval(checkSession, 60 * 1000);

    return () => clearInterval(interval);
  }, [navigate, currentUser]);
};

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = currentUser?.role === "admin";

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

 useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === "users") {
        res = await fetch("http://localhost:8000/admin/users", {
          credentials: "include", // ✅ สำคัญมาก
        });
        if (!res.ok) throw new Error("Failed to fetch users");
        setUsers(await res.json());
      } else if (activeTab === "items") {
        res = await fetch("http://localhost:8000/admin/items", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch items");
        setItems(await res.json());
      } else if (activeTab === "reports") {
        res = await fetch("http://localhost:8000/admin/reports", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch reports");
        setReports(await res.json());
      }else if (activeTab === "logs") {
        res = await fetch("http://localhost:8000/admin/logs", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch logs");
        setLogs(await res.json());
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  fetchData();
}, [activeTab]);


  const handleLogout = async () => {
    if (!currentUser) return;

    try {
      await fetch("http://localhost:8000/auth/logout", {
      method: "POST",
      credentials: "include", // ✅ ส่ง cookie ไปด้วย
      });

      if (!res.ok) {
        console.error("Logout failed:", await res.text());
      } else {
        console.log("Logout logged successfully");
      }
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      setCurrentUser(null);
      navigate("/login", { replace: true });
    }
  };

const handleMakeAdmin = async (userId) => {
  if (!confirm("Make this user admin?")) return;
  const res = await fetch(`http://localhost:8000/admin/users/${userId}/make-admin`, {
    method: "PATCH",
    credentials: "include", // ✅ ส่ง cookie ไปด้วย
  });
  if (res.ok) {
    setUsers(users.map(u => (u.id === userId ? { ...u, role: "admin" } : u)));
  }
};

const handleRemoveAdmin = async (userId) => {
  if (!confirm("Remove admin role?")) return;
  const res = await fetch(`http://localhost:8000/admin/users/${userId}/remove-admin`, {
    method: "PATCH",
    credentials: "include",
  });
  if (res.ok) {
    setUsers(users.map(u => (u.id === userId ? { ...u, role: "user" } : u)));
  }
};

const handleDeleteUser = async (userId) => {
  if (!confirm("Delete this user?")) return;
  const res = await fetch(`http://localhost:8000/admin/users/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (res.ok) {
    setUsers(users.filter(u => u.id !== userId));
  }
};

const handleDeleteItem = async (itemId) => {
  if (!confirm("Delete this item?")) return;
  const res = await fetch(`http://localhost:8000/admin/items/${itemId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (res.ok) {
    setItems(items.filter(i => i.id !== itemId));
  }
};

const handleDeleteReport = async (reportId) => {
    if (!confirm("Delete this report?")) return;
    const res = await fetch(`http://localhost:8000/admin/reports/${reportId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setReports(reports.filter(r => r.id !== reportId));
    }
  };


const [totalLogs, setTotalLogs] = useState(0);

useEffect(() => {
  const fetchLogCount = async () => {
    const token = localStorage.getItem("token") || currentUser?.id;
    const res = await fetch("http://localhost:8000/admin/logs/count", {
    method: "GET",
    credentials: "include", // ✅ สำคัญ ต้อง include cookie
    });
    if (res.ok) {
      const data = await res.json();
      setTotalLogs(data.total_logs);
    }
  };
  fetchLogCount();
}, [currentUser]);

const stats = [
  { label: "Total Users", value: users.length, icon: Users, color: "blue" },
  { label: "Total Items", value: items.length, icon: FileText, color: "green" },
  { label: "Admin Actions", value: totalLogs, icon: Activity, color: "orange" },
];

  const colorMap = {
    blue: "text-blue-500",
    green: "text-green-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
  };

  // ======= แยก reports ตาม type =======
  const itemReports = reports.filter(r => r.type === "item");
  const chatReports = reports.filter(r => r.type === "chat");

  return (
   <div className="min-h-screen bg-blue-800 text-gray-100 flex flex-col p-4 space-y-4">
  {/* Header */}
  <div className="flex justify-between items-center m-4">
    <h1 className="text-4xl font-bold">Admin Panel</h1>
    <button
      onClick={handleLogout}
      className="p-2 bg-red-500 rounded hover:bg-red-600 flex items-center justify-center"
      title="Logout"
    >
      <HiArrowRightOnRectangle className="text-white w-14 h-10" />
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
        className="bg-white rounded-2xl text-black p-6 border border-blue-800"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-black text-m mb-1">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
          <stat.icon className={colorMap[stat.color]} size={40} />
        </div>
      </motion.div>
    ))}
  </div>

 {/* Tabs */}
<div className="flex flex-wrap sm:flex-nowrap space-x-0 sm:space-x-2 overflow-x-auto bg-white p-2 rounded-xl">
  {[
    { id: "users", label: "Users", icon: Users },
    { id: "items", label: "Items", icon: FileText },
    { id: "reports", label: "Reports", icon: MessageSquare },
    { id: "logs", label: "Admin Logs", icon: Activity },
  ].map(tab => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`flex items-center m-2 space-x-4 px-4 py-2 rounded-xl font-medium whitespace-nowrap min-w-[150px] text-center
        ${activeTab === tab.id ? "bg-yellow-400 text-black" : "bg-blue-800 hover:bg-yellow-400"}
      `}
    >
      <tab.icon size={18} />
      <span className="truncate">{tab.label}</span>
    </button>
  ))}
</div>

{/* Content */}
<motion.div
  key={activeTab}
  ref={contentRef}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="flex-1 overflow-x-auto sm:overflow-x-visible overflow-y-auto p-4 bg-white rounded-2xl border border-blue-800"
>
  {loading ? (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
      <p className="mt-4 text-black">Loading...</p>
    </div>
  ) : (
    <>
      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] sm:min-w-full table-auto">
            <thead>
              <tr className="border-b border-black/40">
                <th className="text-left py-3 px-4 text-black">ID</th>
                <th className="text-left py-3 px-4 text-black">Username</th>
                <th className="text-left py-3 px-4 text-black">Role</th>
                <th className="text-left py-3 px-4 text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
             {users.map(u => (
  <tr key={u.id} className="border-b border-black/40 hover:bg-blue-600/30 text-black">
    <td className="py-4 px-4 font-medium">{u.id}</td>
    <td className="py-4 px-4 font-medium">{u.username}</td>
    <td className="py-4 px-4">
      <span className={`px-4 py-2 rounded-full text-sm ${u.role === 'admin' ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'}`}>
        {u.role || 'user'}
      </span>
    </td>
    <td className="py-4 px-4 flex flex-wrap gap-2">
      {u.role !== 'admin' && (
        <button onClick={() => handleDeleteUser(u.id)} className="text-red-500">
          <Trash2 size={18} />
        </button>
      )}
    </td>
  </tr>
))}

            </tbody>
          </table>
          {users.length === 0 && <p className="text-center text-black py-8">No users found</p>}
        </div>
      )}

      {/* Items Tab */}
      {activeTab === "items" && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] sm:min-w-full table-auto">
            <thead>
              <tr className="border-b border-black/40">
                <th className="text-left py-3 px-4 text-black">ID</th>
                <th className="text-left py-3 px-4 text-black">Image</th>
                <th className="text-left py-3 px-4 text-black">Title</th>
                <th className="text-left py-3 px-4 text-black">Category</th>
                <th className="text-left py-3 px-4 text-black">User ID</th>
                <th className="text-left py-3 px-4 text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className="border-b border-black/40 hover:bg-blue-600/30">
                  <td className="text-black font-medium py-4 px-4">{i.id}</td>
                  <td className="py-4 px-4">
                    {i.image ? (
                      <img src={`data:image/jpeg;base64,${i.image}`} alt={i.title} className="w-16 h-16 object-cover rounded-lg border border-black/40" />
                    ) : <span className="text-black">No image</span>}
                  </td>
                  <td className="text-black py-4 px-4 font-medium">{i.title}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${i.category === "Lost" ? "bg-red-500/20 text-red-500" : "bg-green-500 text-white"}`}>
                      {i.category}
                    </span>
                  </td>
                  <td className="text-black font-medium py-4 px-4">{i.user_id}</td>
                  <td className="py-10 px-4 flex flex-wrap gap-2">
                    <button onClick={() => handleDeleteItem(i.id)} className="text-red-400"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="text-center text-black py-8">No items found</p>}
        </div>
      )}

    {/* Reports Tab */}
{activeTab === "reports" && (
  <div className="space-y-6 p-2">
    {["item", "chat"].map(type => {
      const filteredReports = reports
        .filter(r => r.type === type)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      if (filteredReports.length === 0) return null;

      const typeLabels = {
        item: "📦 Item Reports",
        chat: "💬 Chat Reports",
      };

      return (
        <div key={type}>
          <h3 className="text-lg text-black font-semibold mb-3 border-b border-blue-800 pb-1 w-full">
            {typeLabels[type]} ({filteredReports.length})
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {filteredReports.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-blue-600/30 text-black rounded-xl p-4 border border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
              >
                <div className="flex flex-col sm:flex-row sm:gap-4">
             <p className="flex flex-wrap gap-2">
              <span className="font-medium truncate">
                {r.reporter_username || "Unknown"} Report {r.reported_username || "Unknown"}
              </span>
              <span className="text-medium text-black truncate">
                [ From {r.type === "item"
                  ? `Item: ${r.reported_item_title || "N/A"}`
                  : `Chat: ${r.chat_id || "-"}`} ]
              </span>
            </p>
                  <p className="text-sm text-black truncate mt-1">
                    Reason : <span className="truncate">{r.comment}</span>
                  </p>
                </div>
                <p className="text-sm text-black whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      );
    })}

    {reports.length === 0 && (
      <p className="text-center text-gray-400 py-8">No reports found</p>
    )}
  </div>
)}




      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="space-y-6 p-2">
          {["login", "logout", "delete_user", "delete_post"].map(type => {
            const filteredLogs = logs
              .filter(log => log.action_type === type)
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            if (filteredLogs.length === 0) return null;

            const typeLabels = {
              login: "🟢 Login Logs",
              logout: "🔴 Logout Logs",
              delete_user: "🗑️ Delete User Logs",
              delete_post: "🧾 Delete Post Logs",
            };


            return (
              <div key={type}>
                <h3 className="text-lg text-black font-semibold mb-3 border-b border-blue-800 pb-1 w-full">
                  {typeLabels[type]} ({filteredLogs.length})
                </h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {filteredLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-blue-600/30 text-black rounded-xl p-4 border border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                    >
                      <div>
                        <p className="font-medium truncate">{log.action}</p>
                        <p className="text-sm text-black truncate">
                          by {log.admin_username || log.username} | <span className="italic">{log.action_type}</span>
                        </p>
                      </div>
                      <p className="text-sm text-black whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}

          {logs.length === 0 && <p className="text-center text-gray-400 py-8">No admin logs yet</p>}
        </div>
      )}
    </>
  )}
</motion.div>


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

export default AdminPage;
