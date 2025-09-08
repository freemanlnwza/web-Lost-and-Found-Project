import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('รหัสผ่านไม่ตรงกัน!');
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
        alert("สมัครไม่สำเร็จ: " + (errorData.detail || "Unknown error"));
        return;
      }

      const data = await response.json();
      console.log("Register success:", data);
      alert("สมัครสมาชิกสำเร็จ!");
      navigate("/login"); // ไปหน้า login หลังสมัครเสร็จ
    } catch (error) {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center p-6 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">สมัครสมาชิก</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">ชื่อผู้ใช้</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-pink-500"
              placeholder="username"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-pink-500"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-pink-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl transition-all"
          >
            สมัครสมาชิก
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          มีบัญชีอยู่แล้ว? <a href="/login" className="text-pink-500 hover:underline">เข้าสู่ระบบ</a>
        </p>
      </div>
    </main>
  );
};

export default Register;
