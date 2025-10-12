import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ✅ Popup component
const Popup = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-900 p-6 rounded-2xl shadow-2xl w-80 text-center border border-gray-700">
        <p className="text-white mb-4">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 transition-all"
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
  const [showPopup, setShowPopup] = useState(false); // toggle popup

  const navigate = useNavigate();

  const showMessage = (msg) => {
    setPopupMessage(msg);
    setShowPopup(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        showMessage(`Welcome ${data.username}!`);
        localStorage.setItem("user", JSON.stringify(data));
        setIsAuthenticated(true); // App.jsx จะ update currentUser ด้วย useEffect

        setTimeout(() => {
          // ✅ Redirect based on role
          console.log("Login data:", data); // Debug: see what data contains
          
          if (data.role === "admin") {
            console.log("Redirecting to /AdminPage");
            navigate("/AdminPage"); // Admin goes to admin page
          } else {
            console.log("Redirecting to /");
            navigate("/"); // Regular user goes to home
          }
        }, 1500);
      } else {
        showMessage(data.detail || "Invalid username or password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      showMessage("Failed to connect.");
    }
  };

  return (
    <main className="flex items-center justify-center">
      <div className="w-full max-w-md bg-gray-900 backdrop-blur-lg rounded-2xl shadow-2xl p-10 space-y-8 text-white border border-gray-800">
        
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Login</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm mb-2 text-gray-300">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 placeholder-gray-500 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
              placeholder="Username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-2 text-gray-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 placeholder-gray-500 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
              placeholder="Password"
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-400">
              <input type="checkbox" className="w-4 h-4 text-blue-500 border-gray-600 bg-gray-800" />
              Remember me
            </label>
            <a href="#" className="text-blue-400 hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 transition-all"
          >
            Login
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-400 hover:underline">
            Register
          </a>
        </p>
      </div>

      {/* Popup */}
      {showPopup && (
        <Popup message={popupMessage} onClose={() => setShowPopup(false)} />
      )}
    </main>
  );
};

export default Login;