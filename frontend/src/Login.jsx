import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // สร้าง FormData สำหรับ POST
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const res = await fetch('http://localhost:8000/login', {
        method: 'POST',
        body: formData,
        credentials: 'include', // ถ้าต้องการ cookies/session
      });

      const data = await res.json();

      if (res.ok) {
        // Login สำเร็จ
        alert(`ยินดีต้อนรับ ${data.username}!`);
        // เก็บ user info หรือ token ใน localStorage/sessionStorage ถ้าต้องการ
        localStorage.setItem('user', JSON.stringify(data));
        // ไปหน้า UploadPage หรือหน้าแรก
        navigate('/');
      } else {
        // Login ล้มเหลว
        alert(data.detail || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center p-6 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">เข้าสู่ระบบ</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">ชื่อผู้ใช้งาน</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-pink-500"
              placeholder="John"
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
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl transition-all"
          >
            เข้าสู่ระบบ
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          ยังไม่มีบัญชี? <a href="/register" className="text-pink-500 hover:underline">สมัครสมาชิก</a>
        </p>
      </div>
    </main>
  );
};

export default Login;
