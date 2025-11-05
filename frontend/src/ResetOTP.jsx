import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { API_URL } from "./configurl"; 

const ResetOTPPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState(""); // แยก error เหมือน otp.jsx
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [popup, setPopup] = useState({ show: false, type: "success", message: "" });

  if (!email) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p className="text-red-400 text-lg">⚠️ Invalid access. Please request OTP first.</p>
      </div>
    );
  }

  const handleConfirmOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (attempts >= 5) {
      setPopup({
        show: true,
        type: "error",
        message: "You have entered the OTP too many times! Please try again",
      });
      setTimeout(() => navigate("/login"), 2500);
      return;
    }

    setLoading(true);
    setDisabled(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.detail === "OTP Expired") {
          setPopup({ show: true, type: "error", message: "OTP Expired! Please try again" });
          setTimeout(() => navigate("/login"), 2500);
          return;
        }

        setError(data.detail || "Invalid OTP. Please try again.");
        setDisabled(false);
        setAttempts(prev => prev + 1);
        return;
      }

      // ✅ OTP ถูกต้อง
      setPopup({ show: true, type: "success", message: "OTP verified! Redirecting to reset password..." });
      setTimeout(() => navigate("/reset-password", { state: { email } }), 2500);

    } catch (err) {
      console.error(err);
      setError("Connection error. Please try again.");
      setDisabled(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-800 text-white space-y-6">
        <h1 className="text-2xl font-bold text-center mb-4">Reset Password OTP</h1>
        <p className="text-center text-gray-300">
          Enter the OTP sent to <span className="text-yellow-400">{email}</span>
        </p>

        <form onSubmit={handleConfirmOtp} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm mb-1 text-gray-300">OTP Code</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none text-center tracking-widest text-lg"
              placeholder="••••••"
              disabled={disabled}
              required
            />
            {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || disabled}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>

      {/* Popup Success / Error */}
      {popup.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-3xl shadow-2xl w-96 text-center border border-gray-700 transform animate-scale-in">
            <div className="mb-4 flex justify-center">
              {popup.type === "success" ? (
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center animate-bounce-in">
                  <CheckCircle className="text-green-400" size={48} />
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center animate-bounce-in">
                  <XCircle className="text-red-400" size={48} />
                </div>
              )}
            </div>
            <h3 className={`text-xl font-bold mb-2 ${popup.type === "success" ? "text-green-400" : "text-red-400"}`}>
              {popup.type === "success" ? "Success!" : "Error"}
            </h3>
            <p className="text-gray-300 mb-6">{popup.message}</p>
          </div>
        </div>
      )}
    </main>
  );
};

export default ResetOTPPage;
