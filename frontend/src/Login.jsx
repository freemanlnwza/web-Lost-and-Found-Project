import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { API_URL } from "./configurl"; 

const Popup = ({ message, type = "success", onClose }) => (
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

const Login = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");
  const [showPopup, setShowPopup] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/");
  // lockCountdown: { unlockTime: Date, diff: ms } or null
  const [lockCountdown, setLockCountdown] = useState(null);
  const lockIntervalRef = useRef(null);

  const navigate = useNavigate();

  // generic popup setter (use when you want one-shot messages)
  const showMessageOnce = (msg, type = "success") => {
    setPopupMessage(msg);
    setPopupType(type);
    setShowPopup(true);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    // redirect only on success messages (unchanged behavior)
    if (popupType === "success") {
      navigate(redirectPath);
    }
  };

  // helper to format remaining ms to "Xm Ys"
  const formatRemaining = (diffMs) => {
    const totalSeconds = Math.max(Math.ceil(diffMs / 1000), 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  // Effect: manage countdown interval (update diff every second)
  useEffect(() => {
    // clear previous interval
    if (lockIntervalRef.current) {
      clearInterval(lockIntervalRef.current);
      lockIntervalRef.current = null;
    }

    if (!lockCountdown) return () => {};

    // open popup (error type) and set message once
    setPopupType("error");
    setShowPopup(true);
    setPopupMessage(
      `Account locked. Unlock in ${formatRemaining(lockCountdown.diff)} (until ${lockCountdown.unlockTime.toLocaleTimeString(
        "en-US",
        { hour12: false }
      )})`
    );

    lockIntervalRef.current = setInterval(() => {
      const now = new Date();
      const newDiff = lockCountdown.unlockTime - now;

      if (newDiff <= 0) {
        // unlocked
        clearInterval(lockIntervalRef.current);
        lockIntervalRef.current = null;
        setLockCountdown(null);
        // update popup message to inform user they can try again
        setPopupMessage("You can try login again.");
        setPopupType("error");
        setShowPopup(true);
      } else {
        // update diff in state (so UI can re-render)
        setLockCountdown((prev) => prev && { ...prev, diff: newDiff });
        // update popup text (but don't "open" a new popup)
        setPopupMessage(
          `Account locked. Unlock in ${formatRemaining(newDiff)} (until ${lockCountdown.unlockTime.toLocaleTimeString(
            "en-US",
            { hour12: false }
          )})`
        );
      }
    }, 1000);

    return () => {
      if (lockIntervalRef.current) {
        clearInterval(lockIntervalRef.current);
        lockIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockCountdown]); // re-run when lockCountdown is set/cleared

  // submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // prevent submit while locked
    if (lockCountdown) {
      setPopupType("error");
      setPopupMessage(`Account locked. Unlock in ${formatRemaining(lockCountdown.diff)}.`);
      setShowPopup(true);
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      // try parse JSON if any
      let data = null;
      try {
        data = await res.json();
      } catch (err) {
        // non-json response
      }

      if (res.ok) {
        // success
        setPopupType("success");
        setPopupMessage(`Welcome ${data?.username || username}!`);
        setShowPopup(true);
        localStorage.setItem("user", JSON.stringify(data || { username }));
        setIsAuthenticated(true);
        setRedirectPath(data?.role === "admin" ? "/AdminPage" : "/");
        // ensure any existing lock countdown cleared
        if (lockIntervalRef.current) {
          clearInterval(lockIntervalRef.current);
          lockIntervalRef.current = null;
        }
        setLockCountdown(null);
        return;
      }

      // handle 401
      if (res.status === 401) {
        const msg = data?.detail?.message || data?.detail || data?.message || "Invalid credentials";
        showMessageOnce(msg, "error");
        return;
      }

      // handle 403 (locked)
      if (res.status === 403) {
        // backend may return detail as an object { message, lock_until } or as string
        const lockUntilStr =
          (data && (data.detail?.lock_until || data.lock_until || (typeof data.detail === "object" && data.detail?.lock_until))) ||
          // try headers if backend uses headers
          res.headers.get("X-Lock-Until");

        if (lockUntilStr) {
          // parse
          const unlockTime = new Date(lockUntilStr);
          const diff = unlockTime - new Date();
          if (diff > 0) {
            setLockCountdown({ unlockTime, diff });
            // popup will be shown/updated by effect
            return;
          }
        }

        // fallback message
        const fallback = (data && (data.detail?.message || data.detail)) || "Account temporarily locked. Try later.";
        showMessageOnce(fallback, "error");
        return;
      }

      // other status
      const fallbackOther = (data && (data.detail?.message || data.detail)) || "Failed to login";
      showMessageOnce(fallbackOther, "error");
    } catch (err) {
      console.error("Login error:", err);
      showMessageOnce("Failed to connect.", "error");
    }
  };

  return (
    <main className="flex items-center justify-center h-full pt-14 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="w-full max-w-md sm:max-w-sm md:max-w-md lg:max-w-lg bg-gray-800 bg-opacity-90 rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8 text-white border-2 border-gray-900 mx-auto">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm sm:text-base mb-1 text-gray-300">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 sm:p-3 md:p-3 rounded-lg border border-gray-700 bg-gray-800 placeholder-gray-500 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm sm:text-base"
              placeholder="Username"
              required
              disabled={!!lockCountdown}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm sm:text-base mb-1 text-gray-300">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 sm:p-3 md:p-3 rounded-lg border border-gray-700 bg-gray-800 placeholder-gray-500 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm sm:text-base"
              placeholder="Password"
              required
              disabled={!!lockCountdown}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm gap-2">
            <label className="flex items-center gap-2 text-gray-400">
              <input type="checkbox" className="w-4 h-4 text-blue-500 border-gray-600 bg-gray-800" disabled={!!lockCountdown} />
              Remember me
            </label>
            <a href="reset" className="text-blue-400 hover:underline text-right">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={!!lockCountdown}
            className="w-full py-2 sm:py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Login
          </button>
        </form>

        <p className="text-center text-xs sm:text-sm text-gray-400">Don't have an account? <a href="/register" className="text-blue-400 hover:underline">Register</a></p>
      </div>

      {showPopup && (
        <Popup
          message={lockCountdown ? `Account locked. Unlock in ${formatRemaining(lockCountdown.diff)}` : popupMessage}
          type={popupType}
          onClose={handlePopupClose}
        />
      )}
    </main>
  );
};

export default Login;
