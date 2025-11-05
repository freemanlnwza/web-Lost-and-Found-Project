// PrivacyPolicy.jsx
import React, { useState } from "react";

const PrivacyPolicy = () => {
  const [lang, setLang] = useState("th");

  const toggleLang = () => {
    setLang(lang === "th" ? "en" : "th");
  };

  const t = {
    th: {
      title: "นโยบายความเป็นส่วนตัว – Lost&Found",
      date: "วันที่ประกาศ: 4 พฤศจิกายน 2025",
      sections: [
        { id: "controller", title: "1. ข้อมูลผู้ควบคุมข้อมูลส่วนบุคคล" },
        { id: "personal-data", title: "2. ข้อมูลส่วนบุคคลที่เก็บรวบรวม" },
        { id: "purpose", title: "3. วัตถุประสงค์ในการเก็บรวบรวมและใช้ข้อมูล" },
        { id: "collection", title: "4. วิธีการเก็บรวบรวมข้อมูล" },
        { id: "disclosure", title: "5. การเปิดเผยข้อมูลให้บุคคลภายนอก" },
        { id: "rights", title: "6. สิทธิของเจ้าของข้อมูลส่วนบุคคล" },
        { id: "security", title: "7. การรักษาความปลอดภัยของข้อมูล" },
        { id: "retention", title: "8. การเก็บรักษาข้อมูล" },
        { id: "cookies", title: "9. การใช้ Cookies ที่จำเป็น" },
        { id: "changes", title: "10. การเปลี่ยนแปลงนโยบาย" },
        { id: "contact", title: "11. วิธีติดต่อ" },
      ],
      content: {
        controller: [
          "บริษัท/ผู้ควบคุมข้อมูล: Lost&Found",
          "Email: lfound796@gmail.com",
        ],
        personalData: [
          "ข้อมูลอีเมล",
          "ข้อมูลการสนทนาแชท (ข้อความและภาพ)",
          "รูปภาพของสิ่งของที่หาย",
          "IP Address และข้อมูลอุปกรณ์/เบราว์เซอร์",
        ],
        purpose: [
          "ให้บริการระบบสมัครสมาชิกและล็อกอิน",
          "ระบบแชทและการสนทนา",
          "ระบบโพสต์และรายงาน",
        ],
        collection: [
          "แบบฟอร์มลงทะเบียน",
          "ระบบโพสต์",
          "ระบบแชท",
          "Cookies ที่จำเป็นสำหรับการทำงานของเว็บไซต์",
        ],
        disclosure: [
          "ข้อมูลของคุณอาจถูกเปิดเผยต่อแอดมินเพื่อดูแลระบบเท่านั้น",
          "ข้อมูลจะไม่ถูกขายหรือเผยแพร่ต่อบุคคลภายนอกโดยไม่ได้รับความยินยอม",
        ],
        rights: [
          "คุณมีสิทธิในการ:",
          "ขอเข้าถึงข้อมูลส่วนบุคคล",
          "ขอแก้ไขข้อมูลส่วนบุคคล",
          "ขอให้ลบข้อมูลส่วนบุคคล",
          "ยกเลิกความยินยอมในการเก็บข้อมูล",
          "วิธีการใช้สิทธิ: ติดต่อ lfound796@gmail.com โดยระบุรายละเอียดการร้องขอ",
        ],
        security: [
          "การเข้ารหัสข้อมูล (Encryption)",
          "การจำกัดการเข้าถึงข้อมูลตามสิทธิ์ผู้ใช้",
          "การสำรองข้อมูลและ Audit Log",
          "การใช้ Session Timeout และ Password Policy",
        ],
        retention: [
          "ข้อมูลผู้ใช้จะถูกเก็บรักษาเป็นระยะเวลา 5 ปีหลังเลิกใช้บริการ",
          "หลังหมดระยะเวลา ข้อมูลจะถูกลบอย่างปลอดภัย (Secure Deletion)",
        ],
        cookies: [
          "เว็บไซต์นี้ใช้คุกกี้พื้นฐานที่จำเป็นเพื่อให้ระบบทำงานได้อย่างถูกต้อง",
          "เช่น สำหรับ login, session และความปลอดภัย",
          "ผู้ใช้สามารถปฏิเสธหรือปิดการใช้คุกกี้ได้ในเบราว์เซอร์ของตน แต่บางฟีเจอร์อาจไม่ทำงาน",
        ],
        changes: [
          "หากมีการแก้ไข Privacy Policy เราจะแจ้งให้ผู้ใช้ทราบล่วงหน้า",
        ],
        contact: [
          "หากมีข้อสงสัยเกี่ยวกับ Privacy Policy กรุณาติดต่อ:",
          "Email: lfound796@gmail.com",
        ],
      },
    },
    en: {
      title: "Privacy Policy – Lost&Found",
      date: "Published: November 4, 2025",
      sections: [
        { id: "controller", title: "1. Data Controller" },
        { id: "personal-data", title: "2. Personal Data Collected" },
        { id: "purpose", title: "3. Purpose of Data Collection and Use" },
        { id: "collection", title: "4. Data Collection Methods" },
        { id: "disclosure", title: "5. Data Disclosure" },
        { id: "rights", title: "6. Rights of Data Subjects" },
        { id: "security", title: "7. Data Security" },
        { id: "retention", title: "8. Data Retention" },
        { id: "cookies", title: "9. Necessary Cookies" },
        { id: "changes", title: "10. Changes to Policy" },
        { id: "contact", title: "11. Contact" },
      ],
      content: {
        controller: [
          "Company/Data Controller: Lost&Found",
          "Email: lfound796@gmail.com",
        ],
        personalData: [
          "Email addresses",
          "Chat data (messages and images)",
          "Images of lost items",
          "IP Address and device/browser information",
        ],
        purpose: [
          "Provide membership and login system",
          "Chat and messaging system",
          "Posting and reporting system",
        ],
        collection: [
          "Registration forms",
          "Posting system",
          "Chat system",
          "Necessary cookies for website functionality",
        ],
        disclosure: [
          "Your data may be accessed by admins for system management only",
          "Data will not be sold or disclosed to third parties without consent",
        ],
        rights: [
          "You have the right to:",
          "Access your personal data",
          "Request corrections",
          "Request deletion",
          "Withdraw consent",
          "How to exercise: Contact lfound796@gmail.com with details",
        ],
        security: [
          "Data encryption",
          "Access control based on user roles",
          "Backups and audit logs",
          "Session timeouts and password policies",
        ],
        retention: [
          "User data is retained for 5 years after account closure",
          "Data will be securely deleted after retention period",
        ],
        cookies: [
          "This website uses only necessary cookies for proper functioning",
          "For login, session, and security purposes",
          "Users can refuse or disable cookies in their browser, but some features may not work",
        ],
        changes: [
          "Any changes to the Privacy Policy will be notified to users in advance",
        ],
        contact: [
          "If you have any questions about this Privacy Policy, please contact:",
          "Email: lfound796@gmail.com",
        ],
      },
    },
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 p-5 sm:p-8 md:p-12 mt-4">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl p-6 sm:p-10 space-y-8">
        {/* Language toggle */}
        <div className="flex justify-end">
          <button
            onClick={toggleLang}
            className="border px-4 mt-4 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-500 transition-all"
          >
            {lang === "th" ? "English" : "ไทย"}
          </button>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          {t[lang].title}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 text-center">
          {t[lang].date}
        </p>

        {/* Table of Contents */}
        <section className="bg-blue-50 border border-blue-200 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2 text-blue-700">
            {lang === "th" ? "สารบัญ (Table of Contents)" : "Table of Contents"}
          </h2>
          <ul className="list-decimal list-inside space-y-1 text-sm sm:text-base">
            {t[lang].sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-blue-600 hover:underline hover:text-blue-800"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Content Sections */}
        {t[lang].sections.map((sec, idx) => (
          <section id={sec.id} className="space-y-2 scroll-mt-24" key={sec.id}>
            <h2 className="text-lg sm:text-xl font-semibold border-b pb-1 border-gray-200">
              {sec.title}
            </h2>
            <ul className="list-disc list-inside space-y-1 text-sm sm:text-base leading-relaxed">
              {Object.values(t[lang].content)[idx].map((line, i) => (
                <li key={i}>
                  {line.includes("Email") ? (
                    <a
                      href="mailto:lfound796@gmail.com"
                      className="text-blue-600 hover:underline"
                    >
                      {line}
                    </a>
                  ) : (
                    line
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
};

export default PrivacyPolicy;
