import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, FileText, MessageSquare, Trash2, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HiArrowRightOnRectangle } from "react-icons/hi2";
import { IoSearchCircleSharp } from "react-icons/io5";
import { FaUsers } from "react-icons/fa";
import { CiViewList } from "react-icons/ci";
import { TbMessageReport } from "react-icons/tb";
import { LuNotepadText } from "react-icons/lu";

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

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = currentUser?.role === "admin";

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState({
    type: null, // 'user' | 'item' | 'report' ...
    id: null,
    label: "",
    extra: null, // e.g. username or title
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

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

  // --------------------- Fetch ALL Data on mount (fix stats initial 0) ---------------------
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // fetch in parallel
        const [usersRes, itemsRes, reportsRes, logsCountRes] = await Promise.all([
          fetch(`${API_URL}/admin/users`, { credentials: "include" }),
          fetch(`${API_URL}//admin/items`, { credentials: "include" }),
          fetch(`${API_URL}/admin/reports`, { credentials: "include" }),
          fetch(`${API_URL}/admin/logs/count`, { credentials: "include" }),
        ]);

        if (usersRes.ok) {
          const u = await usersRes.json();
          setUsers(u);
        }

        if (itemsRes.ok) {
          const it = await itemsRes.json();
          setItems(it);
        }

        if (reportsRes.ok) {
          const r = await reportsRes.json();
          setReports(r);
        }

        if (logsCountRes.ok) {
          const data = await logsCountRes.json();
          setTotalLogs(data.total_logs);
        }
      } catch (err) {
        console.error("fetchAll error:", err);
        // keep existing error flow
        setErrorMsg(err.message || "Failed to fetch initial data");
      } finally {
        setLoading(false);
        contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    fetchAll();
    // run only on mount
  }, []);

  // --------------------- Fetch Data per tab (keep existing behavior) ---------------------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let res;
        if (activeTab === "users") {
          res = await fetch(`${API_URL}/admin/users`, {
            credentials: "include",
          });
          if (!res.ok) throw new Error("Failed to fetch users");
          setUsers(await res.json());
        } else if (activeTab === "items") {
          res = await fetch(`${API_URL}/admin/items`, {
            credentials: "include",
          });
          if (!res.ok) throw new Error("Failed to fetch items");
          setItems(await res.json());
        } else if (activeTab === "reports") {
          res = await fetch(`${API_URL}/admin/reports`, {
            credentials: "include",
          });
          if (!res.ok) throw new Error("Failed to fetch reports");
          setReports(await res.json());
        } else if (activeTab === "logs") {
          res = await fetch(`${API_URL}/admin/logs`, {
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

  // --------------------- Logout ---------------------
  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) console.error("Logout failed:", await res.text());
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      setCurrentUser(null);
      navigate("/login", { replace: true });
    }
  };

  // --------------------- Actions (replaced confirm() with popup) ---------------------
  // Open confirm modal for user
  const requestDeleteUser = (userId, username) => {
    setConfirmData({
      type: "user",
      id: userId,
      label: `Delete user "${username}"?`,
      extra: username,
    });
    setConfirmOpen(true);
  };

  // Open confirm modal for item
  const requestDeleteItem = (itemId, title) => {
    setConfirmData({
      type: "item",
      id: itemId,
      label: `Delete item "${title}"?`,
      extra: title,
    });
    setConfirmOpen(true);
  };

  // Generic perform delete based on confirmData
  const performDelete = async () => {
    if (!confirmData?.type || confirmData.id == null) return;
    setConfirmLoading(true);

    try {
      let res;
      if (confirmData.type === "user") {
        res = await fetch(`${API_URL}/admin/users/${confirmData.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          setUsers((prev) => prev.filter((u) => u.id !== confirmData.id));
        } else {
          const txt = await res.text().catch(() => null);
          throw new Error(txt || "Failed to delete user");
        }
      } else if (confirmData.type === "item") {
        res = await fetch(`${API_URL}/admin/items/${confirmData.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          setItems((prev) => prev.filter((i) => i.id !== confirmData.id));
        } else {
          const txt = await res.text().catch(() => null);
          throw new Error(txt || "Failed to delete item");
        }
      } else if (confirmData.type === "report") {
        res = await fetch(`${API_URL}/admin/reports/${confirmData.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          setReports((prev) => prev.filter((r) => r.id !== confirmData.id));
        } else {
          const txt = await res.text().catch(() => null);
          throw new Error(txt || "Failed to delete report");
        }
      } else {
        throw new Error("Unknown delete type");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setErrorMsg(err.message || "Delete failed");
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setConfirmData({ type: null, id: null, label: "", extra: null });
    }
  };

  // --------------------- Log Count (kept) ---------------------
  const [totalLogs, setTotalLogs] = useState(0);
  useEffect(() => {
    const fetchLogCount = async () => {
      const res = await fetch(`${API_URL}/admin/logs/count`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTotalLogs(data.total_logs);
      }
    };
    fetchLogCount();
  }, [currentUser]);

  const colorMap = {
    blue: "text-blue-500",
    green: "text-green-500",
    yellow: "text-yellow-400",
    orange: "text-orange-400",
  };

  // --------------------- Search States ---------------------
  const [searchUsers, setSearchUsers] = useState("");
  const [searchItems, setSearchItems] = useState("");
  const [searchReports, setSearchReports] = useState("");

  const filteredUsers = users.filter((u) =>
    u.username?.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredItems = items.filter((i) =>
    i.title?.toLowerCase().includes(searchItems.toLowerCase())
  );

  const filteredReports = reports.filter(
    (r) =>
      r.reporter_username?.toLowerCase().includes(searchReports.toLowerCase()) ||
      r.reported_username?.toLowerCase().includes(searchReports.toLowerCase())
  );

  // --------------------- Stats (useMemo so it updates with state) ---------------------
  const stats = useMemo(
    () => [
      { label: "Total Users", value: users.length, icon: FaUsers, color: "blue" },
      { label: "Total Items", value: items.length, icon: CiViewList, color: "green" },
      { label: "Total Reports", value: reports.length, icon: TbMessageReport, color: "yellow" },
      { label: "Admin Logs", value: totalLogs, icon: LuNotepadText, color: "orange" },
    ],
    [users.length, items.length, reports.length, totalLogs]
  );

  // --------------------- Render ---------------------
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
        ].map((tab) => (
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
        {/* ---------- USERS ---------- */}
        {activeTab === "users" && (
          <div className="overflow-x-auto">
            <div className="relative mb-4">
              <IoSearchCircleSharp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-2xl pointer-events-none" />
              <input
                type="text"
                placeholder="Search user..."
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                className="w-full p-2 pl-10 rounded-lg border border-gray-400 text-black focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
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
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-black/40 hover:bg-blue-600/30 text-black">
                    <td className="py-4 px-4 font-medium">{u.id}</td>
                    <td className="py-4 px-4 font-medium">{u.username}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-4 py-2 rounded-full text-sm ${
                          u.role === "admin" ? "bg-yellow-500 text-white" : "bg-blue-500 text-white"
                        }`}
                      >
                        {u.role || "user"}
                      </span>
                    </td>
                    <td className="py-4 px-4 flex flex-wrap gap-2">
                      {u.role !== "admin" && (
                        <button
                          onClick={() => requestDeleteUser(u.id, u.username)}
                          className="text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <p className="text-center text-black py-8">No users found</p>}
          </div>
        )}

       {/* ---------- ITEMS ---------- */}
{activeTab === "items" && (
  <div className="overflow-x-auto">
    <div className="relative mb-4">
      <IoSearchCircleSharp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-2xl pointer-events-none" />
      <input
        type="text"
        placeholder="Search item..."
        value={searchItems}
        onChange={(e) => setSearchItems(e.target.value)}
        className="w-full p-2 pl-10 rounded-lg border border-gray-400 text-black focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
    <table className="w-full min-w-[600px] sm:min-w-full table-auto">
      <thead>
        <tr className="border-b border-black/40">
          <th className="text-left py-3 px-4 text-black">ID</th>
          <th className="text-left py-3 px-4 text-black">Image</th>
          <th className="text-left py-3 px-4 text-black">Title</th>
          <th className="text-left py-3 px-4 text-black">Category</th>
          <th className="text-left py-3 px-4 text-black">Username</th>
          <th className="text-left py-3 px-4 text-black">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredItems.map((i) => {
          const user = users.find((u) => u.id === i.user_id);
          const username = user ? user.username : "Unknown";

          return (
            <tr key={i.id} className="border-b border-black/40 hover:bg-blue-600/30">
              <td className="text-black font-medium py-4 px-4">{i.id}</td>
              <td className="py-4 px-4">
                {i.image ? (
                  <img
                    src={`data:image/jpeg;base64,${i.image}`}
                    alt={i.title}
                    className="w-16 h-16 object-cover rounded-lg border border-black/40"
                  />
                ) : (
                  <span className="text-black">No image</span>
                )}
              </td>
              <td className="text-black py-4 px-4 font-medium">{i.title}</td>
              <td className="py-4 px-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    i.category === "Lost" ? "bg-red-500/20 text-red-500" : "bg-green-500 text-white"
                  }`}
                >
                  {i.category}
                </span>
              </td>
              <td className="text-black font-medium py-4 px-4">{username}</td>
              <td className="py-10 px-4 flex flex-wrap gap-2">
                <button onClick={() => requestDeleteItem(i.id, username)} className="text-red-400">
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
    {filteredItems.length === 0 && <p className="text-center text-black py-8">No items found</p>}
  </div>
)}


        {/* ---------- REPORTS ---------- */}
        {activeTab === "reports" && (
          <div className="space-y-6 p-2">
            <div className="relative mb-4">
              <IoSearchCircleSharp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-2xl pointer-events-none" />
              <input
                type="text"
                placeholder="Search report..."
                value={searchReports}
                onChange={(e) => setSearchReports(e.target.value)}
                className="w-full p-2 pl-10 rounded-lg border border-gray-400 text-black focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            {["item", "chat"].map((type) => {
              const filteredByType = filteredReports
                .filter((r) => r.type === type)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

              if (filteredByType.length === 0) return null;

              const typeLabels = {
                item: "📦 Item Reports",
                chat: "💬 Chat Reports",
              };

              return (
                <div key={type}>
                  <h3 className="text-lg text-black font-semibold mb-3 border-b border-blue-800 pb-1 w-full">
                    {typeLabels[type]} ({filteredByType.length})
                  </h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {filteredByType.map((r) => (
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
                              [ From{" "}
                              {r.type === "item" ? `Item: ${r.reported_item_title || "N/A"}` : `Chat: ${r.chat_id || "-"}`}{" "}
                              ]
                            </span>
                          </p>
                          <p className="text-sm text-black truncate mt-1">
                            Reason : <span className="truncate">{r.comment}</span>
                          </p>
                        </div>
                        <p className="text-sm text-black whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
            {filteredReports.length === 0 && <p className="text-center text-gray-400 py-8">No reports found</p>}
          </div>
        )}

        {/* ---------- LOGS ---------- */}
        {activeTab === "logs" && (
          <div className="space-y-6 p-2">
            {["login", "logout", "delete_user", "delete_post"].map((type) => {
              const filteredLogs = logs
                .filter((log) => log.action_type === type)
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
                        <p className="text-sm text-black whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
            {logs.length === 0 && <p className="text-center text-gray-400 py-8">No admin logs yet</p>}
          </div>
        )}
      </motion.div>

      {/* ========== Confirm Delete Modal ========== */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md text-black">
            <h3 className="text-xl font-semibold mb-2">Confirm</h3>
            <p className="mb-4">{confirmData.label}</p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmData({ type: null, id: null, label: "", extra: null });
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                disabled={confirmLoading}
              >
                Cancel
              </button>
              <button
                onClick={performDelete}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  confirmLoading ? "bg-gray-300 cursor-not-allowed" : "bg-red-500 text-white hover:bg-red-600"
                }`}
                disabled={confirmLoading}
              >
                {confirmLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white p-6 rounded-lg max-w-sm text-center">
            <p className="mb-4">{errorMsg}</p>
            <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700" onClick={() => setErrorMsg(null)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
