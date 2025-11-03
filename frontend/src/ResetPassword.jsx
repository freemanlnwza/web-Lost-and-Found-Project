import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email;

  // popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  const showMessage = (msg, type = "success") => {
    setPopupMessage(msg);
    setPopupType(type);
    setShowPopup(true);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    if (popupType === "success") {
      navigate("/login");
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!email) return showMessage("Email not provided", "error");
  if (password !== confirmPassword) return showMessage("Passwords do not match ❌", "error");

  // Strong Password Regex
  const strongPasswordRegex =  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
  if (!strongPasswordRegex.test(password)) {
    return showMessage(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character ❌",
      "error"
    );
  }

  setLoading(true);
  try {
    const res = await fetch("http://127.0.0.1:8000/auth/reset-password/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, new_password: password })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage("Password changed successfully ✅", "success");
    } else {
      showMessage(data.detail || "Unable to change the password ❌", "error");
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
            Create New Password
          </h1>
          <p className="text-gray-400 text-sm mt-1">For Account:</p>
          <p className="text-yellow-400 text-sm break-words">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm mb-1 text-gray-300">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:outline-none"
              placeholder="New Password"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-300">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:outline-none"
              placeholder="Confirm Password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 transition-all"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Popup */}
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
              Confirm
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default ResetPasswordPage;
