import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // ดึงข้อมูล user จาก localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // ถ้าไม่มี user -> กลับไปหน้า login
      navigate("/login");
    }
  }, [navigate]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100">
        <p className="text-gray-600">กำลังโหลดข้อมูลผู้ใช้...</p>
      </div>
    );
  }

  return (
    <main className="flex-grow flex items-center justify-center p-6 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          โปรไฟล์ผู้ใช้
        </h1>
        <div className="space-y-4">
          <p>
            <span className="font-semibold text-gray-700">ชื่อผู้ใช้: </span>
            {user.username}
          </p>
          <p>
            <span className="font-semibold text-gray-700">อีเมล: </span>
            {user.email || "ไม่ได้ระบุ"}
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("user");
            navigate("/login");
          }}
          className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all"
        >
          ออกจากระบบ
        </button>
      </div>
    </main>
  );
};

export default Profile;
