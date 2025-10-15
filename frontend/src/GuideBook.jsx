import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";

const guides = [
    {
        title: "User - ( how to use this website )",
        content: (
            <>
                1. Upload item photo - Take a picture or select one from your gallery. <br />
                2. Specify item category - Choose manually or use AI for automatic classification. <br />
                3. Add a short description - Describe the key characteristics of the lost or found item. <br />
                4. Select post type <br />
                <ul className="ml-6 mt-0 list-disc">
                    <li>Report lost item: Notify of an item that is missing.</li>
                    <li>Found item: Announce an item that has been found.</li>
                </ul>
                5. Confirm information - Press "Confirm" and the data will be sent to the Lost or Found page. <br />
            </>
        ),
    },
    {
        title: "Post / Found / chat - ( main feature )",
        content: (
            <>
                1. The photo sent from the main page via the "Report lost item" or "Found item" button, along with the data and description entered by the user, will appear on the Lost page. <br />
                2. A chat button will be available below the photo and description, allowing users to privately contact the original poster to inquire about the item. <br />
            </>
        ),
    },
    {
        title: "Report - ( how to report )",
        content: (
            <>
                Each post or person in a conversation will have a "Report" button. Clicking it allows the user to enter a description of the issue or what they encountered, along with a confirmation button to submit the complaint.<br />
                This data will be sent to the admin for review and to consider penalizing the offending party. Users who violate the rules or disrupt others will receive a warning notice that includes the information from the submitted complaint.<br />
            </>
        ),
    },
    {
        title: "Community Guidelines - ( Terms of Service )",
        content: (
            <>
                1.Do not share personal information in the chat discussions.<br />
                2.Respect others and engage in constructive and polite conversation.<br />
                3.Do not post illegal or inappropriate items.<br />
                4.Do not post items that do not belong to you (i.e., do not impersonate an owner or finder).<br />
                5.Do not use bots or spam messages in the chat discussions.<br />
                6.Do not use multiple accounts to deceive or scam others.<br />
                7.If you witness an action that violates the rules or disrupts others, please submit a Report.<br />
                8.Violating laws or harassing others may lead to your account being banned or suspended.<br />
                9.We reserve the right to modify or update these guidelines at any time.<br />
                ( By using this service, you agree to accept and comply with these guidelines. )<br />
                ( Please show respect for others, maintain good etiquette, and follow these rules to <br />make this website a pleasant environment for everyone. ) <br />
            </>
        ),
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
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-3xl mx-auto flex items-center justify-between mb-12"
    >
      <div className="flex flex-col items-start">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Lost and Found Guide Book
        </h1>

        <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent -mt-1">
          <br />
          Everything You Need to Know
        </h2>
      </div>

      <motion.button
        whileHover={{ scale: 1.1, rotate: 180 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleDarkMode}
        className={`p-3 rounded-full backdrop-blur-lg transition-all duration-300 shadow-lg ${
          darkMode 
            ? 'bg-gray-700/50 hover:bg-gray-600/50 shadow-blue-500/20' 
            : 'bg-white/50 hover:bg-white/80 shadow-gray-300/50'
        }`}
        title="Toggle Dark/bright Mode"
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