import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";

const guides = [
  {
    title: "การจัดการผู้ใช้ (User Management)",
    content:
      "ในส่วนนี้คุณสามารถดูข้อมูลผู้ใช้ทั้งหมด เพิ่ม แก้ไข หรือลบบัญชีได้ รวมถึงกำหนดสิทธิ์การเข้าถึงระบบ.",
      
  },
  {
    title: "การจัดการโพสต์ (Post Management)",
    content:
      "ใช้สำหรับเพิ่ม แก้ไข หรือลบโพสต์ภายในเว็บ สามารถจัดหมวดหมู่และตั้งสถานะโพสต์ได้.",
  },
  {
    title: "หน้ารายงาน (Report Page)",
    content:
      "ดูสถิติการใช้งานของผู้ใช้ รายงานปัญหา หรือสรุปกิจกรรมต่าง ๆ ภายในระบบ.",
  },
  {
    title: "บันทึกการทำงานแอดมิน (Admin Log)",
    content:
      "ติดตามทุกการกระทำของแอดมิน เช่น การแก้ไขข้อมูลผู้ใช้ การลบโพสต์ หรือการอัปเดตระบบ.",
  },
];

export default function GuideBook() {
  const [darkMode, setDarkMode] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <div className={`min-h-screen px-4 py-12 transition-all duration-700 rounded-[12rem] ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 text-gray-800'
    }`}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto flex items-center justify-between mb-12"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          📘 Guide Book
        </h1>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleDarkMode}
          className={`p-3 rounded-full backdrop-blur-lg transition-all duration-300 shadow-lg ${
            darkMode 
              ? 'bg-gray-700/50 hover:bg-gray-600/50 shadow-blue-500/20' 
              : 'bg-white/50 hover:bg-white/80 shadow-gray-300/50'
          }`}
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun size={22} className="text-yellow-400" /> : <Moon size={22} className="text-indigo-600" />}
        </motion.button>
      </motion.div>

      {/* Accordion Section */}
      <div className="max-w-3xl mx-auto space-y-6">
        {guides.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className={`rounded-[2rem] overflow-hidden backdrop-blur-md transition-all duration-500 ${
              darkMode 
                ? 'bg-gray-800/50 border border-gray-700/30 hover:bg-gray-800/70 hover:border-gray-600/50 shadow-2xl hover:shadow-blue-500/20' 
                : 'bg-white/70 border border-gray-200/40 hover:bg-white/90 hover:border-gray-300/60 shadow-2xl hover:shadow-blue-300/30'
            }`}
          >
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className={`w-full text-left px-8 py-6 flex justify-between items-center transition-all duration-300 ${
                darkMode
                  ? 'hover:bg-gray-700/30'
                  : 'hover:bg-gray-50/50'
              }`}
            >
              <span className="font-semibold text-lg">{item.title}</span>
              <motion.span
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                className={`text-xl ${darkMode ? 'text-blue-400' : 'text-indigo-600'}`}
              >
                ▼
              </motion.span>
            </motion.button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className={`overflow-hidden`}
                >
                  <div className={`px-8 py-6 leading-relaxed ${
                    darkMode 
                      ? 'bg-gray-900/50 text-gray-300 border-t border-gray-700/50' 
                      : 'bg-gray-50/50 text-gray-700 border-t border-gray-200/50'
                  }`}>
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className={`text-center text-sm mt-16 transition-colors duration-300 ${
          darkMode ? 'text-gray-500' : 'text-gray-400'
        }`}
      >
        © 2025 Lost & Found. All Rights Reserved.
      </motion.p>
    </div>
  );
}