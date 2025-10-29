import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";

// ====================== Popup Component ======================
const Popup = ({ message, type = "success", onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-3xl shadow-2xl w-96 text-center border border-gray-700 transform animate-scale-in">
        <div className="mb-4 flex justify-center">
          {type === "success" ? (
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center animate-bounce-in">
              <CheckCircle className="text-green-400" size={48} />
            </div>
          ) : (
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center animate-bounce-in">
              <XCircle className="text-red-400" size={48} />
            </div>
          )}
        </div>
        <h3 className={`text-xl font-bold mb-2 ${type === "success" ? "text-green-400" : "text-red-400"}`}>
          {type === "success" ? "Success!" : "Error"}
        </h3>
        <p className="text-gray-300 mb-6">{message}</p>

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-xl font-semibold text-white transition-all transform hover:scale-105 active:scale-95 ${
            type === "success"
              ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/50"
              : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/50"
          }`}
        >
          OK
        </button>
      </div>
    </div>
  );
};

// ====================== Register Component ======================
const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [strongPassword, setStrongPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");
  const [showPopup, setShowPopup] = useState(false);

  const navigate = useNavigate();

  // ====================== ฟังก์ชันเคลียร์ฟอร์ม ======================
  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setStrongPassword("");
  };

  // เคลียร์ฟอร์มอัตโนมัติเมื่อโหลดหน้า
  useEffect(() => {
    resetForm();
  }, []);

  const showMessage = (msg, type = "success") => {
    setPopupMessage(msg);
    setPopupType(type);
    setShowPopup(true);
  };

  const handlePopupClose = () => setShowPopup(false);

  const fetchStrongPassword = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/auth/strong-password");
      const data = await res.json();
      if (res.ok) setStrongPassword(data.password);
    } catch (error) {
      console.error(error);
      showMessage("Failed to generate strong password.", "error");
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!email.match(/@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com)$/)) {
      return showMessage("Email must be Gmail / Outlook / Yahoo / Hotmail", "error");
    }

    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!strongRegex.test(password)) {
      return showMessage("Password is not strong enough.", "error");
    }

    if (password !== confirmPassword) {
      return showMessage("Passwords do not match.", "error");
    }

    if (loading) return; // ✅ ป้องกัน double submit

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.detail || "Failed to send OTP.", "error");
        return;
      }

      resetForm(); // ✅ เคลียร์ฟอร์มหลังส่ง OTP สำเร็จ

      navigate("/otp", { state: { username, email } });
    } catch (error) {
      console.error(error);
      showMessage("Connection error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center h-full pt-14 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="w-full max-w-md sm:max-w-sm md:max-w-md lg:max-w-lg bg-gray-800 bg-opacity-90 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8 text-white border-2 border-yellow-500 mx-auto">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Register</h1>
        </div>

        <form onSubmit={handleSendOtp} className="space-y-4 sm:space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm mb-1 text-gray-300">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
              placeholder="Username"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm mb-1 text-gray-300">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-1 text-gray-300">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
              placeholder="••••••••"
              required
            />
            {strongPassword && <p className="text-sm text-green-400 mt-1">Suggested strong password: {strongPassword}</p>}
           
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm mb-1 text-gray-300">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white 
                       bg-gradient-to-r from-indigo-500 to-blue-600 
                       hover:from-indigo-600 hover:to-blue-700 
                       transition-all 
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      </div>

      {showPopup && <Popup message={popupMessage} type={popupType} onClose={handlePopupClose} />}
    </main>
  );
};

export default Register;
