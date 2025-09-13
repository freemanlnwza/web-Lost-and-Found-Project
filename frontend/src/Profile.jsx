import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // ดึงข้อมูล user จาก localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error parsing user data:", err);
        localStorage.removeItem("user");
        navigate("/login");
      }
    } else {
      // ถ้าไม่มี user -> กลับไปหน้า login
      navigate("/login");
    }
  }, [navigate]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100">
        <p className="text-gray-600">Loading user data...</p>
      </div>
    );
  }

  return (
    <main className="flex-grow flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Account Profile
        </h1>
        <div className="space-y-4">
          <p>
            <span className="font-semibold text-black">Username: </span>
            {user.username}
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("user");
            navigate("/login");
          }}
          className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all"
        >
          Log Out
        </button>
      </div>
    </main>
  );
};

export default Profile;
