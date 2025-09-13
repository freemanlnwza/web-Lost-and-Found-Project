import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert("Registration failed: " + (errorData.detail || "Unknown error"));
        return;
      }

      const data = await response.json();
      alert("Registration successful!");
      navigate("/login");
    } catch (error) {
      console.error("Error:", error);
      alert("Error: " + error.message);
    }
  };

  return (
    <main className="flex items-center justify-center ">
      <div className="w-full max-w-md bg-gray-900 backdrop-blur-lg rounded-2xl shadow-2xl p-10 space-y-8 text-white border border-gray-800">
        
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Register</h1>
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
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm mb-2 text-gray-300">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 placeholder-gray-500 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 transition-all"
          >
            Register
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-gray-400">
          Have an account?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Log In
          </a>
        </p>
      </div>
    </main>
  );
};

export default Register;
