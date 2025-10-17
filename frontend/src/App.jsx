import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom"; // นำเข้า React Router สำหรับ routing
import { useState, useEffect } from "react"; // นำเข้า useState และ useEffect จาก React
import UploadPage from "./UploadPage.jsx"; // นำเข้า component หน้า UploadPage
import CameraPage from "./CameraPage.jsx"; // นำเข้า component หน้า CameraPage
import ChatPage from "./ChatPage.jsx"; // นำเข้า component หน้า ChatPage
import Lost from "./Lost.jsx"; // นำเข้า component หน้า Lost
import Login from "./Login.jsx"; // นำเข้า component หน้า Login
import Register from "./Register.jsx"; // นำเข้า component หน้า Register
import Profile from "./Profile.jsx"; // นำเข้า component หน้า Profile
import SearchPage from "./SearchPage.jsx"; // นำเข้า component หน้า SearchPage
import GuideBook from "./GuideBook.jsx"; // นำเข้า component หน้า GuideBook
import AdminPage from "./AdminPage.jsx"; // นำเข้า component หน้า AdminPage
import ListChat from "./ListChat.jsx"; // นำเข้า component หน้า ListChat

// Wrapper สำหรับ Router
function AppWrapper() {
  return (
    <Router> {/* สร้าง Router รอบ App */}
      <App /> {/* แสดง App component ภายใน Router */}
    </Router>
  );
}

function App() {
  // state เก็บข้อมูลผู้ใช้งานปัจจุบันจาก localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("user"); // อ่าน user จาก localStorage
    return saved ? JSON.parse(saved) : null; // แปลง JSON หรือ null ถ้าไม่มี
  });

  const [isAuthenticated, setIsAuthenticated] = useState(!!currentUser); // เช็คว่าผู้ใช้ล็อกอินแล้วหรือไม่
  const [isOpen, setIsOpen] = useState(false); // state สำหรับเมนู mobile
  const hideHeaderRoutes = ["/camera","adminpage"]; // เส้นทางที่ซ่อน header
  const location = useLocation(); // ใช้เพื่อดึง path ปัจจุบัน
  const shouldHideHeader = hideHeaderRoutes.includes(location.pathname); // เช็คว่าต้องซ่อน header หรือไม่

  // useEffect สำหรับโหลด user ใหม่เมื่อ isAuthenticated เปลี่ยน
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-100"> {/* container หลักของ App */}
      {/* Navbar */}
      {!shouldHideHeader && ( // แสดง navbar ถ้า path ไม่อยู่ใน hideHeaderRoutes
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#111827] border-b border-gray-800 shadow-md text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg border border-black/40">
                  <span className="text-black font-bold text-sm">L&F</span> {/* โลโก้ย่อ */}
                </div>
                <span className="text-xl font-extrabold tracking-wide text-white">Lost & Found</span> {/* ชื่อเว็บไซต์ */}
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex space-x-6"> {/* เมนูสำหรับ desktop */}
                <NavLink to="/" label="Home" />
                <NavLink to="/lost" label="Lost" />

                {!isAuthenticated ? ( // ถ้าไม่ล็อกอิน
                  <>
                    <NavLink to="/guidebook" label="Guidebook" />
                    <NavLink to="/login" label="Login" />
                    <NavLink to="/register" label="Register" />
                  </>
                ) : ( // ถ้าล็อกอินแล้ว
                  <>
                    <NavLink to="/chats" label="Chats" />
                    <NavLink to="/profile" label="Profile" />
                    <NavLink to="/guidebook" label="Guidebook" />
                    <LogoutButton setIsAuthenticated={setIsAuthenticated} setCurrentUser={setCurrentUser} /> {/* ปุ่ม logout */}
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button onClick={() => setIsOpen(!isOpen)} className="text-yellow-400 focus:outline-none">
                  {isOpen ? <span className="text-2xl">&#x2715;</span> : <span className="text-2xl">&#9776;</span>} {/* icon เปิด/ปิด menu */}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="md:hidden bg-[#1a1a1a] border-t border-gray-800 px-4 py-3 space-y-2">
              <NavLink to="/" label="Home" onClick={() => setIsOpen(false)} />
              <NavLink to="/lost" label="Lost" onClick={() => setIsOpen(false)} />

              {!isAuthenticated ? (
                <>
                  <NavLink to="/guidebook" label="Guidebook" onClick={() => setIsOpen(false)} />
                  <NavLink to="/login" label="Login" onClick={() => setIsOpen(false)} />
                  <NavLink to="/register" label="Register" onClick={() => setIsOpen(false)} />
                </>
              ) : (
                <>
                  <NavLink to="/chats" label="Chats" onClick={() => setIsOpen(false)} />
                  <NavLink to="/profile" label="Profile" onClick={() => setIsOpen(false)} />
                  <NavLink to="/guidebook" label="Guidebook" onClick={() => setIsOpen(false)} />
                  <LogoutButton setIsAuthenticated={setIsAuthenticated} setCurrentUser={setCurrentUser} />
                </>
              )}
            </div>
          )}
        </nav>
      )}

      {/* Content */}
      
      <main
        className={`flex-1 flex ${!shouldHideHeader ? "pt-14 bg-[#111827]" : "bg-black"} justify-center items-center`}
      >
        {shouldHideHeader ? ( // ถ้า path ต้องซ่อน header
          <Routes>
            <Route path="/camera" element={<CameraPage />} />
            <Route path="/adminpage" element={<AdminPage />} />
          </Routes>
        ) : ( // path ปกติ
          <div className="w-full max-w-6xl text-white py-10">
            <Routes>
              <Route path="/" element={<UploadPage />} />
              <Route path="/lost" element={<Lost currentUserId={currentUser?.id} />} />
              <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/camera" element={<CameraPage />} />
              <Route path="/searchItem" element={<SearchPage />} />
              <Route path="/chat/:chatId" element={<ChatPage currentUserId={currentUser?.id} />} />
              <Route path="/guidebook" element={<GuideBook />} />
              <Route path="/adminpage" element={<AdminPage />} />
              <Route path="/chats" element={<ListChat currentUserId={currentUser?.id} />} />
            </Routes>
          </div>
        )}
      </main>

      {/* Footer */}
      {!shouldHideHeader && (
        <footer className="bg-[#111827] border-t border-gray-800 text-gray-400 shadow-inner">
          <div className="max-w-6xl mx-auto px-4 text-center py-3">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-md border border-black/40">
                <span className="text-black font-bold text-xs">L&F</span> {/* โลโก้ footer */}
              </div>
              <span className="text-base font-extrabold text-white">Lost & Found</span> {/* ชื่อเว็บไซต์ footer */}
            </div>
            <p className="text-gray-500 text-sm">&copy; 2025 Lost & Found. All Rights Reserved.</p> {/* ข้อความลิขสิทธิ์ */}
          </div>
        </footer>
      )}
    </div>
  );
}

// NavLink component สำหรับลิงก์ navigation
const NavLink = ({ to, label, onClick }) => (
  <Link
    to={to} // path ที่ต้องการไป
    onClick={onClick} // ฟังก์ชันเมื่อคลิก (ใช้ปิด mobile menu)
    className="block md:inline text-white font-medium px-3 py-2 hover:text-yellow-400 hover:underline underline-offset-4 transition"
  >
    {label} {/* แสดงชื่อเมนู */}
  </Link>
);

// Logout button component
const LogoutButton = ({ setIsAuthenticated, setCurrentUser }) => {
  const navigate = useNavigate(); // ใช้ navigate เปลี่ยน path หลัง logout
  const handleLogout = () => {
    localStorage.clear(); // ล้าง localStorage
    sessionStorage.clear(); // ล้าง sessionStorage
    setIsAuthenticated(false); // อัปเดต state
    setCurrentUser(null); // ล้างข้อมูลผู้ใช้
    navigate("/login", { replace: true }); // เปลี่ยนไปหน้า login
  };
  return (
    <button
      onClick={handleLogout} // เมื่อคลิก logout
      className="block md:inline text-white font-medium px-3 py-2 hover:text-red-400 hover:underline underline-offset-4 transition"
    >
      Logout
    </button>
  );
};

export default AppWrapper; // ส่งออก AppWrapper เป็น default
