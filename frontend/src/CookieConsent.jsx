import { useState, useEffect } from "react";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  const [lang, setLang] = useState("en"); // "en" or "th"

  // Load language & show banner only once
  useEffect(() => {
    const savedLang = localStorage.getItem("cookie_lang");
    if (savedLang) setLang(savedLang);

    // show banner only if not seen before
    const bannerSeen = localStorage.getItem("cookie_banner_seen");
    if (!bannerSeen) setVisible(true);
  }, []);

  const toggleLang = () => {
    const newLang = lang === "en" ? "th" : "en";
    setLang(newLang);
    localStorage.setItem("cookie_lang", newLang);
  };

  const closeBanner = () => {
    setVisible(false);
    localStorage.setItem("cookie_banner_seen", "true");
  };

  const t = {
    en: {
      bannerTitle: "This website uses necessary cookies",
      bannerText:
        "We use cookies to ensure the website functions properly, such as secure login, posting, and chat functionality. These cookies cannot be disabled.",
      bannerPrivacy: "Privacy Policy",
      langSwitch: "ภาษาไทย",
      close: "Close",
    },
    th: {
      bannerTitle: "เว็บไซต์นี้ใช้คุกกี้พื้นฐานที่จำเป็น",
      bannerText:
        "เราใช้คุกกี้เพื่อให้เว็บไซต์ทำงานได้อย่างถูกต้อง เช่น การเข้าสู่ระบบ ระบบโพสต์ และระบบแชท คุกกี้เหล่านี้ไม่สามารถปิดการใช้งานได้",
      bannerPrivacy: "นโยบายความเป็นส่วนตัว",
      langSwitch: "English",
      close: "ปิด",
    },
  };

  return (
    <>
      {visible && (
        <div className="fixed bottom-0 left-0 w-full bg-white shadow-md border-t border-gray-200 z-40">
          <div className="max-w-5xl mx-auto p-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-800 text-sm leading-relaxed">
              <p className="font-semibold text-black mb-1">{t[lang].bannerTitle}</p>
              <p>
                {t[lang].bannerText}{" "}
                <a
                  href="/pdpa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {t[lang].bannerPrivacy}
                </a>
                .
              </p>
            </div>

            <div className="flex gap-3 items-center">
              <button
                onClick={toggleLang}
                className="text-gray-500 text-sm border px-2 py-1 rounded hover:bg-gray-200"
              >
                {t[lang].langSwitch}
              </button>
              <button
                onClick={closeBanner}
                className="bg-blue-500 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-600"
              >
                {t[lang].close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieBanner;
