import { useState } from 'react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: เพิ่ม logic การ login (เช่น fetch API)
    console.log('Login attempt:', { email, password });
    alert('Login functionality to be implemented!');
  };

  return (
    <main className="flex-grow flex items-center justify-center p-6 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">เข้าสู่ระบบ</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">อีเมล</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-pink-500"
              placeholder="example@email.com"
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