import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";

// ✅ Popup component
const Popup = ({ message, type = "success", onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-3xl shadow-2xl w-96 text-center border border-gray-700 transform animate-scale-in">
        {/* Icon */}
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

        {/* Message */}
        <h3 className={`text-xl font-bold mb-2 ${
          type === "success" ? "text-green-400" : "text-red-400"
        }`}>
          {type === "success" ? "Success!" : "Error"}
        </h3>
        <p className="text-gray-300 mb-6">{message}</p>

        {/* Button */}
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

const Login = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [popupMessage, setPopupMessage] = useState(""); // ข้อความ popup
  const [popupType, setPopupType] = useState("success"); // ✅ เพิ่ม type
  const [showPopup, setShowPopup] = useState(false); // toggle popup
  const [redirectPath, setRedirectPath] = useState("/"); // ✅ เก็บ path ที่จะ redirect

  const navigate = useNavigate();

  const showMessage = (msg, type = "success") => {
    setPopupMessage(msg);
    setPopupType(type); // ✅ เซ็ต type
    setShowPopup(true);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    // ✅ เฉพาะตอน success ถึงจะ redirect
    if (popupType === "success") {
      navigate(redirectPath);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        body: formData,
        credentials: "include", 
      });

      const data = await res.json();

      if (res.ok) {
        showMessage(`Welcome ${data.username}!`, "success"); // ✅ ส่ง type
        localStorage.setItem("user", JSON.stringify(data));
        setIsAuthenticated(true); // App.jsx จะ update currentUser ด้วย useEffect

        // ✅ เซ็ต redirect path ตาม role
        if (data.role === "admin") {
          console.log("Will redirect to /AdminPage");
          setRedirectPath("/AdminPage"); // Admin goes to admin page
        } else {
          console.log("Will redirect to /");
          setRedirectPath("/"); // Regular user goes to home
        }
        // ✅ ลบ setTimeout ออก - ให้กดปุ่ม OK แทน
      } else {
        showMessage(data.detail || "Invalid username or password.", "error"); // ✅ ส่ง type เป็น error
      }
    } catch (error) {
      console.error("Login error:", error);
      showMessage("Failed to connect.", "error"); // ✅ ส่ง type เป็น error
    }
  };

  return (
 <main className="flex items-center justify-center h-full pt-14 px-4 sm:px-6 lg:px-8 bg-gray-900">
  <div
    className="
      w-full 
      max-w-md 
      sm:max-w-sm 
      md:max-w-md 
      lg:max-w-lg
      bg-gray-800 bg-opacity-90 
      rounded-2xl 
      shadow-2xl 
      p-6 sm:p-8 md:p-10 
      space-y-6 sm:space-y-8 
      text-white 
      border-2 border-yellow-500 
      mx-auto
    "
  >
    {/* Title */}
    <div className="text-center">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Login</h1>
    </div>

    {/* Form */}
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      <div>
        <label htmlFor="username" className="block text-sm sm:text-base mb-1 text-gray-300">
          Username
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 sm:p-3 md:p-3 rounded-lg border border-gray-700 bg-gray-800 placeholder-gray-500 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm sm:text-base"
          placeholder="Username"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm sm:text-base mb-1 text-gray-300">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 sm:p-3 md:p-3 rounded-lg border border-gray-700 bg-gray-800 placeholder-gray-500 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm sm:text-base"
          placeholder="Password"
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm gap-2">
        <label className="flex items-center gap-2 text-gray-400">
          <input type="checkbox" className="w-4 h-4 text-blue-500 border-gray-600 bg-gray-800" />
          Remember me
        </label>
        <a href="reset" className="text-blue-400 hover:underline text-right">
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        className="w-full py-2 sm:py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 transition-all text-sm sm:text-base"
      >
        Login
      </button>
    </form>

    {/* Register link */}
    <p className="text-center text-xs sm:text-sm text-gray-400">
      Don't have an account?{" "}
      <a href="/register" className="text-blue-400 hover:underline">
        Register
      </a>
    </p>
  </div>
   {/* ✅ เพิ่ม animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>

  {/* Popup */}
  {showPopup && (
    <Popup 
      message={popupMessage} 
      type={popupType}
      onClose={handlePopupClose} 
    />
  )}
</main>

  );
};

export default Login;