import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, MapPin, Calendar, User } from "lucide-react";
import { MdOutlineReportProblem } from "react-icons/md";

const Lost = ({ currentUserId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActualImage, setShowActualImage] = useState(false);
  const [reportingItem, setReportingItem] = useState(null); // สำหรับ popup
  const [reportComment, setReportComment] = useState("");   // ช่องกรอก comment
  const [submitting, setSubmitting] = useState(false); // ป้องกันส่งซ้ำ
  const [reportError, setReportError] = useState(""); // ข้อความ error จาก backend
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    setFilteredItems(items);
  }, [items]);

  const handleFilterChange = (query) => {
    if (!query.trim()) {
      setFilteredItems(items);
    } else {
      const lowerQuery = query.toLowerCase();
      const result = items.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerQuery) ||
          item.category.toLowerCase().includes(lowerQuery)
      );
      setFilteredItems(result);
    }
  };


  useEffect(() => {
    let isMounted = true;

    const fetchLostItems = async () => {
      setLoading(true);
      setItems([]);

      try {
        const res = await fetch("http://localhost:8000/api/lost-items");
        if (!res.ok) throw new Error("Failed to fetch lost items");
        const data = await res.json();

        if (!isMounted) return;

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
        credentials: "include",
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

  const handleReportClick = (item) => {
    setReportingItem(item);
    setReportComment("");
    setReportError("");
  };

  // autofocus textarea when popup opens
  useEffect(() => {
    if (reportingItem && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [reportingItem]);

  const submitReport = async () => {
    // ตรวจสอบก่อนส่ง
    if (!currentUserId) {
      setReportError("กรุณาเข้าสู่ระบบเพื่อรายงานเนื้อหา");
      return;
    }
    if (!reportingItem) return;

    setReportError("");
    setSubmitting(true);

    try {
      // สร้าง payload ให้แน่นอนว่า item_id เป็น number
      const payload = {
        item_id: Number(reportingItem.id),
        type: "item",
        comment: (reportComment || "พบสิ่งผิดปกติ").trim(),
      };

      // debug console (ลบได้ใน production)
      // console.log("Report payload:", payload);

      const res = await fetch("http://localhost:8000/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // parse detail ถ้ามี
        let errText = "Report failed";
        try {
          const errJson = await res.json();
          if (errJson && errJson.detail) errText = errJson.detail;
        } catch (e) {
          // ignore parse error
        }

        // 401 => ไม่ได้ล็อกอิน / session หมด
        if (res.status === 401) {
          setReportError("คุณยังไม่ได้ล็อกอินหรือ session หมดอายุ กรุณาล็อกอินใหม่");
        } else {
          setReportError(errText);
        }

        throw new Error(errText);
      }

      // success
      // (คุณอาจเปลี่ยนเป็น popup success แทน alert)
      alert("Report submitted successfully ✅");
      setReportingItem(null); // ปิด popup
      setReportComment("");
      setReportError("");
    } catch (error) {
      console.error("Error reporting item:", error);
      // ถ้า setReportError ก่อนหน้าไม่ได้ตั้งค่า ก็แสดง generic
      if (!reportError) setReportError("ไม่สามารถรายงานได้ในขณะนี้ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading lost items...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-165 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
<div className="sticky top-16 z-40 bg-gray-900 bg-opacity-90 backdrop-blur-md py-4 px-4 sm:px-6 lg:px-8 rounded-b-3xl shadow-lg flex items-center justify-between flex-wrap gap-3">
  {/* ซ้าย: Title */}
  <div className="flex-1 min-w-0">
    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold truncate mb-1">
      Reported Lost Items
    </h1>
    <p className="text-gray-400 text-sm sm:text-base truncate">
      Help reunite lost items with their owners
    </p>
  </div>

  {/* กลาง: Search / Filter */}
  <div className="flex-shrink-0 w-full sm:w-auto flex items-center justify-center sm:justify-end gap-2 sm:mx-4">
    <input
      type="text"
      placeholder="Search by title..."
      className="px-3 py-1.5 rounded-lg bg-gray-800 text-white text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-56"
      onChange={(e) => handleFilterChange(e.target.value)}
    />
  </div>

  {/* ขวา: ปุ่ม toggle */}
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
                <p className="text-gray-300 text-xl font-medium mb-2">
                  No lost items reported yet
                </p>
                <p className="text-gray-500">Be the first to report a lost item</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-gray-900 border border-gray-700/50 rounded-3xl shadow-lg overflow-hidden hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative w-full h-48 overflow-hidden rounded-t-3xl bg-gray-800">
                    <img
                      src={showActualImage ? item.original_image_data : item.image_data}
                      alt={item.title}
                      className={
                        showActualImage
                          ? "w-full h-full object-contain"
                          : "w-full h-full object-cover"
                      }
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-50"></div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-2xl flex-shrink-0">
                        {item.type === "lost" ? "🏷️" : "📦"}
                      </span>
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

                      {/* Reported by + ปุ่ม Report */}
                      {item.user_id !== currentUserId && (
                        <div className="flex items-center justify-between text-gray-300">
                          <div className="flex items-center space-x-2">
                            <User size={14} className="text-purple-400" />
                            <span className="text-sm">
                              <span className="text-gray-500">Reported by:</span>{" "}
                              <span className="font-medium">{item.username}</span>
                            </span>
                          </div>

                          {currentUserId && (
                            <button
                              onClick={() => handleReportClick(item)}
                              className="p-1.5 rounded-full text-yellow-500 hover:bg-white hover:text-red-600 transition-all"
                              title="Report this item"
                            >
                              <MdOutlineReportProblem size={22} />
                            </button>
                          )}
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
                          <span className="text-xs">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {currentUserId && (
                    <button
                      onClick={() =>
                        handleChat(item.user_id, item.id, item.username, item.image_data, item.title)
                      }
                      className="w-full py-1.5 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all text-sm flex items-center justify-center"
                    >
                      <MessageCircle className="inline mr-1 w-4 h-4" />
                      Chat
                    </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          
          )}
        </div>

        {/* ================== Report Popup ================== */}
        {reportingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-md relative">
              {/* ปุ่มปิด */}
              <button
                onClick={() => setReportingItem(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold"
              >
                &times;
              </button>

              <h2 className="text-xl font-bold mb-4 text-white">Report Item</h2>
              <p className="text-gray-300 mb-2">Item: {reportingItem.title}</p>

              <textarea
                ref={textareaRef}
                className="w-full p-2 rounded-lg bg-gray-800 text-white resize-none mb-2"
                placeholder="Enter your comment..."
                rows={4}
                value={reportComment}
                onChange={(e) => setReportComment(e.target.value)}
              ></textarea>

              {/* แสดงข้อความ error จาก backend ถ้ามี */}
              {reportError && (
                <p className="text-sm text-rose-400 mb-3">{reportError}</p>
              )}

              <button
                onClick={submitReport}
                disabled={submitting}
                className={`w-full py-2 rounded-lg text-black font-semibold transition-all ${
                  submitting ? "bg-yellow-300 cursor-not-allowed opacity-80" : "bg-yellow-500 hover:bg-yellow-600"
                }`}
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Lost;
