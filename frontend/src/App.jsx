import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import UploadPage from "./UploadPage.jsx";
import Found from "./Found.jsx";
import Lost from "./Lost.jsx";
import Login from "./Login.jsx";
import Register from "./Register.jsx";
import Profile from "./Profile.jsx";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("user"));
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900 font-sans text-gray-100">

        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#111827] border-b border-gray-800 shadow-md text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">

              {/* Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-500 
                                rounded-lg flex items-center justify-center shadow-lg border border-black/40">
                  <span className="text-black font-bold text-sm">L&F</span>
                </div>
                <span className="text-xl font-extrabold tracking-wide text-white">Lost & Found</span>
              </div>

              {/* Menu desktop */}
              <div className="hidden md:flex space-x-6">
                <NavLink to="/" label="Home" />
                <NavLink to="/lost" label="Lost" />
                <NavLink to="/found" label="Found" />
                <NavLink to="/support" label="Support" />
                {!isAuthenticated ? (
                  <>
                    <NavLink to="/login" label="Login" />
                    <NavLink to="/register" label="Register" />
                  </>
                ) : (
                  <>
                    <NavLink to="/profile" label="Profile" />
                    <LogoutButton setIsAuthenticated={setIsAuthenticated} />
                  </>
                )}
              </div>

              {/* Hamburger icon */}
              <div className="md:hidden">
                <button onClick={() => setIsOpen(!isOpen)} className="text-yellow-400 focus:outline-none">
                  {isOpen ? <span className="text-2xl">&#x2715;</span> : <span className="text-2xl">&#9776;</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {isOpen && (
            <div className="md:hidden bg-[#1a1a1a] border-t border-gray-800 px-4 py-3 space-y-2">
              <NavLink to="/" label="Home" onClick={() => setIsOpen(false)} />
              <NavLink to="/lost" label="Lost" onClick={() => setIsOpen(false)} />
              <NavLink to="/found" label="Found" onClick={() => setIsOpen(false)} />
              <NavLink to="/support" label="Support" onClick={() => setIsOpen(false)} />
              {!isAuthenticated ? (
                <>
                  <NavLink to="/login" label="Login" onClick={() => setIsOpen(false)} />
                  <NavLink to="/register" label="Register" onClick={() => setIsOpen(false)} />
                </>
              ) : (
                <>
                  <NavLink to="/profile" label="Profile" onClick={() => setIsOpen(false)} />
                  <LogoutButton setIsAuthenticated={setIsAuthenticated} />
                </>
              )}
            </div>
          )}
        </nav>
        <br>
        </br>
        <br />
        
       

        {/* Content */}
       <main className="flex-1 flex items-center justify-center px-4 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100">
  <div className="w-full max-w-6xl text-black py-10">
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
      <Route path="/register" element={<Register />} />
      <Route path="/lost" element={<Lost />} />
      <Route path="/found" element={<Found />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  </div>
</main>

        {/* Footer */}
        <footer className="bg-[#111827] border-t border-gray-800 text-gray-400 shadow-inner">
          <div className="max-w-6xl mx-auto px-4 text-center py-3">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-yellow-500 
                              rounded-lg flex items-center justify-center shadow-md border border-black/40">
                <span className="text-black font-bold text-xs">L&F</span>
              </div>
              <span className="text-base font-extrabold text-white">Lost & Found</span>
            </div>
            <p className="text-gray-500 text-sm">&copy; 2025 Lost & Found. All Rights Reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

// NavLink component
const NavLink = ({ to, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="block md:inline text-white font-medium px-3 py-2 hover:text-yellow-400 hover:underline underline-offset-4 transition"
  >
    {label}
  </Link>
);

// Logout button
const LogoutButton = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    navigate("/");
  };
  return (
    <button
      onClick={handleLogout}
      className="block md:inline text-white font-medium px-3 py-2 hover:text-red-400 hover:underline underline-offset-4 transition"
    >
      Logout
    </button>
  );
};

export default App;
