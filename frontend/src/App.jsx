import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import UploadPage from './UploadPage.jsx';
import Found from './Found.jsx';
import Lost from './Lost.jsx';
import Login from './Login.jsx';
import Register from './Register.jsx';


function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 flex flex-col font-noto-sans-thai">
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-gray-800/95 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">L&F</span>
                </div>
                <span className="text-xl font-bold text-white">Lost & Found</span>
              </div>
              <div className="hidden md:flex space-x-8">
                <Link to="/" className="text-white font-medium px-3 py-2 transition-all hover:text-amber-300 hover:translate-y-[-2px] relative">
                  Home
                  <span className="absolute bottom-[-8px] left-1/2 w-0 h-0.75 bg-gradient-to-r from-pink-500 to-orange-500 transition-all transform -translate-x-1/2 rounded" />
                </Link>
                <Link to="/login" className="text-white font-medium px-3 py-2 transition-all hover:text-amber-300 hover:translate-y-[-2px] relative">
                  Login
                  <span className="absolute bottom-[-8px] left-1/2 w-0 h-0.75 bg-gradient-to-r from-pink-500 to-orange-500 transition-all transform -translate-x-1/2 rounded" />
                </Link>
                <Link to="/register" className="text-white font-medium px-3 py-2 transition-all hover:text-amber-300 hover:translate-y-[-2px] relative">
                  Register
                  <span className="absolute bottom-[-8px] left-1/2 w-0 h-0.75 bg-gradient-to-r from-pink-500 to-orange-500 transition-all transform -translate-x-1/2 rounded" />
                </Link>
                <Link to="/lost" className="text-white font-medium px-3 py-2 transition-all hover:text-amber-300 hover:translate-y-[-2px] relative">
                  Lost
                  <span className="absolute bottom-[-8px] left-1/2 w-0 h-0.75 bg-gradient-to-r from-pink-500 to-orange-500 transition-all transform -translate-x-1/2 rounded" />
                </Link>
                <Link to="/found" className="text-white font-medium px-3 py-2 transition-all hover:text-amber-300 hover:translate-y-[-2px] relative">
                  Found
                  <span className="absolute bottom-[-8px] left-1/2 w-0 h-0.75 bg-gradient-to-r from-pink-500 to-orange-500 transition-all transform -translate-x-1/2 rounded" />
                </Link>
                <Link to="/support" className="text-white font-medium px-3 py-2 transition-all hover:text-amber-300 hover:translate-y-[-2px] relative">
                  Support
                  <span className="absolute bottom-[-8px] left-1/2 w-0 h-0.75 bg-gradient-to-r from-pink-500 to-orange-500 transition-all transform -translate-x-1/2 rounded" />
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/lost" element={<Lost />} />
          <Route path="/found" element={<Found />} />
        </Routes>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-20">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">L&F</span>
                </div>
                <span className="text-xl font-bold">Lost & Found</span>
              </div>
              <p className="text-gray-400">ระบบค้นหาของหายที่ทันสมัยและมีประสิทธิภาพ</p>
            </div>
            <div className="border-t border-gray-700 pt-6">
              <p className="text-gray-400">&copy; 2025 Lost & Found. สงวนลิขสิทธิ์.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

// ฟอนต์ Noto Sans Thai
const fontNotoSansThai = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap');
  body {
    font-family: 'Noto Sans Thai', sans-serif;
  }
`;
const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(fontNotoSansThai);
document.adoptedStyleSheets = [styleSheet];

export default App;