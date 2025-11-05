import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "./configurl"; 

const ResetPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  const navigate = useNavigate();

  const showMessage = (msg, type = "success") => {
    setPopupMessage(msg);
    setPopupType(type);
    setShowPopup(true);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    // ถ้า success ให้ไปหน้า OTP
    if (popupType === "success") {
      setTimeout(() => {
        navigate("/reset-otp", { state: { username, email } });
      }, 200);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email) {
      showMessage("Username and email are required", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });

      const data = await res.json();

      if (res.ok) {
        showMessage("OTP has been sent to your email ✅", "success");
      } else {
        showMessage(data.detail || "Failed to send the OTP ❌", "error");
      }
    } catch {
      showMessage("Server connection failed ❌", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center h-full pt-14 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="w-full max-w-md bg-gray-800 bg-opacity-90 rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 space-y-6 text-white border-2 border-gray-800 mx-auto">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
            Reset Password
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm sm:text-base mb-1 text-gray-300">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 placeholder-gray-500 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="block text-sm sm:text-base mb-1 text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 placeholder-gray-500 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
              placeholder="Email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 transition-all"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <p className="text-center text-xs sm:text-sm text-gray-400">
          Remember your password?{" "}
          <a href="/login" className="text-blue-400 hover:underline">Login</a>
        </p>
      </div>

      {/* Popup อยู่ในหน้านี้เลย ✅ */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl text-center shadow-xl border border-yellow-400">
            <p className={`text-lg font-semibold ${popupType === "success" ? "text-green-400" : "text-red-400"}`}>
              {popupMessage}
            </p>
            <button
              onClick={handlePopupClose}
              className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg font-semibold text-black"
            >
              Comfirm
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default ResetPage;
