import { Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const guidesData = {
  th: [
    {
      title: "เว็บไซต์ - (วิธีใช้เว็บไซต์นี้)",
      content: (
        <>
        เว็บไซต์นี้เหมาะสำหรับผู้คนที่ต้องการที่จะหาของที่ตัวเองได้ทำหายไป หรือ พบของที่อาจมีคุณค่าต่อคนบางคนที่อาจจะลืมหรือทำหล่นหายไป <br />
        เว็บไซต์นี้เลยจะเป็นตัวเชื่อมปัญหาให้กับทางออก โดยให้ผู้ใช้งานเว็บนี้สามารถหาของหายได้ด้วยรูปภาพ และ ข้อความ แบบไม่ต้อง login <br />
        แต่บางฟีเจอร์อาจไม่สามารถเข้าถึงได้ ถ้าไม่ได้ register / login จึงอยากแนะนำให้ผู้ที่จะเข้ามาใช้เว็บนี้เข้าสู่ระบบเพื่อปลดล๊อคการใช้งานเว็บอย่างมีประสิทธิภาพสูงที่สุด <br />
        โดยหลังจากเข้าสู่ระบบแล้วผู้ใช้จะสามารถทำได้ตามที่ระบุนี้เลย <br />
          <ul className="ml-6 mt-0 list-disc">
            <li>ระบบแจ้งหาของหาย: แจ้งสิ่งของที่หายรูปร่าง,สี และ ประเภท</li>
            <li>ระบบค้นหาของ: ไว้หาสิ่งของที่ต้องการโดยจะโชว์สิ่งที่ใกล้เคียงกับที่กรอกที่สุด5ตัวเลือก</li>
            <li>ระบบแชท และ ลบโพสต์: พูดคุยกับผู้ที่พบของที่ต้องการ และ สามารถลบโพสต์ ที่โพสต์ผิดได้</li>
            <li>ระบบรายงาน: หากพบการละเมิดเช่น โดนคุกคาม หรือ นำรูปภาพไปใช้ในทางที่ไม่ดี สามารถแจ้งไปยัง<br />แอดมินได้</li>
            <li>ระบบโปรไฟล์: สามารถเช็คและดูได้ว่าบัญชีที่เราใช้งานสมัครด้วยอีเมลอะไรอยู่</li>
          </ul>
        </>
      ),
    },
    {
      title: "แจ้งของหาย / ค้นหาของ / แชทคุย - (ฟีเจอร์หลัก)",
      content: (
        <>
        แจ้งของหาย <br />
          1. ใส่รูปภาพโดยสามารถเลือกรูปภาพที่มีในเครื่องหรือถ่ายสิ่งของที่พบเจอและมีฟีเจอร์สำหรับถ่ายรูปคือมีการจับรูปภาพโดยอัตโนมัติด้วย YOLOv8 และจากนั้นกรอกข้อมูลและเลือกประเภทของที่ผู้ใช้ต้องการจะแจ้งของหายในหน้า Home <br />
          2. หลังจากนั้นกดไปที่ Report lost item เพื่อนำข้อมูลที่ผู้ใช้กรอกไปโชว์ไว้ในหน้า Lost <br />
        <br />
        ค้นหาของ <br />
        มี2วิธีในการค้นหาของที่หายผ่านเว็บไซต์นี้ <br />
          1. เลือกอย่างใดอย่างนึงโดย กรอกข้อความ หรือ ใส่รูปภาพ หลังจากนั้นให้กดไปที่ Found item สิ่งของที่ผู้ใช้ที่ได้ทำของหายจะโชว์มาทั้งหมด5อย่างที่ใกล้เคียงกับที่กรอกไปมากที่สุดโดยใช้ค่าความเหมือนเป็นตัววัด ผ่าน Model CLIP <br />
          2. กดไปที่หน้า Lost ตรงแท็บเมนูด้านบน โดยสามารถค้นหาของได้ในหน้า Lost ตรง Search bar และจะมีปุ่มให้กดขยายเพื่อดูรูปหลักก่อนที่จะถูก AI ตัดภาพให้ถ้าเลือกถ่ายรูปจากกล้อง<br />
        <br />
        แชทคุย <br />
          1. ในหน้า Lost จะตรงสิ่งของที่ถูกพบจะสามารถพูดคุยกับผู้คนที่แจ้งของหายได้โดยจะมีปุ่ม chat หลังจากกดไปแล้วจะเด้งเข้าหน้าแชทไปทันที เพื่อให้ไปพูดคุยและถามข้อมูลเกี่ยวกับสิ่งของที่พบเจอว่าสิ่งของที่เจอตรงกับที่ได้โพสต์ลงในที่แจ้งของหายไหม <br />
          2. หน้า Chats ตรงแท็บเมนูด้านบนหลังจากกดไปจะแสดงแชทที่ผู้ใช้ได้คุยกับคนอื่นไว้ และ แสดงโพสต์ที่เราได้โพสต์หาของที่ได้ทำหายไปอีกด้วย <br />
        </>
      ),
    },
    {
      title: "รายงาน - (วิธีการรายงาน)",
      content: (
        <>
          ทุกโพสต์หรือผู้ใช้ในแชทจะมีปุ่ม "รายงาน" กดเพื่อกรอกปัญหาที่พบ พร้อมปุ่มยืนยันข้อมูล <br />
          ข้อมูลจะถูกส่งไปยังแอดมินเพื่อตรวจสอบและพิจารณาบทลงโทษผู้กระทำผิด <br />
        </>
      ),
    },
    {
      title: "แนวทางชุมชน - (Terms of Service)",
      content: (
        <>
          1. ไม่เปิดเผยข้อมูลส่วนตัวในแชท <br />
          2. เคารพผู้อื่น พูดคุยอย่างสุภาพ <br />
          3. ไม่โพสต์สิ่งของผิดกฎหมายหรือไม่เหมาะสม <br />
          4. ไม่โพสต์สิ่งของที่ไม่ใช่ของตัวเอง <br />
          5. ไม่ใช้บอทหรือส่งข้อความสแปม <br />
          6. ไม่ใช้หลายบัญชีเพื่อหลอกลวง <br />
          7. หากพบการละเมิด กรุณารายงาน <br />
          8. การละเมิดกฎหมายหรือรบกวนผู้อื่น อาจถูกแบนบัญชี <br />
          9. เราขอสงวนสิทธิ์ในการปรับปรุงกฎตลอดเวลา <br />
        </>
      ),
    },
    {
      title: "PDPA - (นโยบายความเป็นส่วนตัว)",
      content: (
        <>
          เว็บไซต์นี้ใช้คุกกี้ที่จำเป็นเพื่อให้มั่นใจว่าการทำงานเป็นไปอย่างถูกต้อง <br />
          จึงจำเป็นต้องใช้คุกกี้ คุณสามารถอ่านเพิ่มเติมเกี่ยวกับเรื่องนี้ได้ใน พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล {" "}
          <Link
            to="/pdpa"
            className="text-blue-500 hover:underline font-semibold"
          >
            PDPA
          </Link>
          <br />
          เพื่อตรวจสอบและยืนยันการใช้ข้อมูลส่วนบุคคลของคุณอย่างถูกกฎหมาย <br />
        </>
      ),
    }
  ],
  en: [
    {
      title: "Website - (How to Use This Website)",
      content: (
        <>
          This website is designed for people who want to find items they’ve lost or who have found something that may be valuable to someone who accidentally dropped or forgot it. <br />
          It serves as a bridge between the problem and the solution, allowing users to search for lost items using images and text — without needing to log in. <br />
          However, some features may not be accessible without registration or login. Therefore, we recommend users to log in for the best and most efficient experience. <br />
          Once logged in, users will be able to do the following: <br />
          <ul className="ml-6 mt-0 list-disc">
            <li>Lost Item Report System: Report lost items by describing their appearance, color, and type.</li>
            <li>Item Search System: Search for desired items — the system will display up to 5 closest matches.</li>
            <li>Chat and Post Deletion System: Chat with the person who found your item, and delete posts if they were made by mistake.</li>
            <li>Report System: If you encounter violations such as harassment or misuse of images, you can report them to the admin.</li>
            <li>Profile System: Check which email address is linked to your account.</li>
          </ul>
        </>
      ),
    },
    {
      title: "Report Lost Items / Search Items / Chat - (Main Features)",
      content: (
        <>
          <b>Report Lost Items</b> <br />
          1. Upload an image — you can either choose one from your device or take a photo of the found item.  
          The photo feature automatically detects objects using <b>YOLOv8</b>.  
          Then, fill in the details and select the item category you want to report on the Home page. <br />
          2. After that, click <b>“Report lost item”</b> to display your submission on the <b>Lost</b> page. <br />
          <br />
          <b>Search Items</b> <br />
          There are two ways to search for lost items on this website: <br />
          1. Choose either to input text or upload an image, then click <b>“Found item.”</b>  
          The system will display up to 5 items most similar to your input, using similarity scores calculated by the <b>CLIP model</b>. <br />
          2. Go to the <b>Lost</b> page via the top menu tab — you can search directly using the search bar.  
          There is also an option to enlarge the main image before it was cropped by AI (if the image was taken from the camera). <br />
          <br />
          <b>Chat</b> <br />
          1. On the <b>Lost</b> page, you can chat with users who reported lost items by clicking the <b>chat</b> button.  
          Once clicked, you’ll be redirected to the chat page to talk and verify whether the found item matches the one reported lost. <br />
          2. On the <b>Chats</b> page in the top menu tab, you can view all your chat conversations  
          and see the posts you made about your lost items. <br />
        </>
      ),
    },
    {
      title: "Report - (How to Report)",
      content: (
        <>
          Every post or user in chat has a <b>“Report”</b> button — click it to fill out the issue you encountered and confirm your submission. <br />
          The information will be sent to the admin for review and to consider appropriate actions or penalties. <br />
        </>
      ),
    },
    {
      title: "Community Guidelines - (Terms of Service)",
      content: (
        <>
          1. Do not share personal information in chat. <br />
          2. Be respectful and communicate politely. <br />
          3. Do not post illegal or inappropriate items. <br />
          4. Do not post items that do not belong to you. <br />
          5. Do not use bots or send spam messages. <br />
          6. Do not use multiple accounts to deceive others. <br />
          7. If you notice a violation, please report it. <br />
          8. Violations of laws or harassment may result in account suspension. <br />
          9. We reserve the right to modify these rules at any time. <br />
        </>
      ),
    },
    {
      title: "PDPA - (Privacy Policy)",
      content: (
        <>
          This website uses essential cookies to ensure proper functionality. <br />
          Therefore, cookie usage is necessary.  
          You can read more about this in the <b>Personal Data Protection Act</b>{" "}
          <Link
            to="/pdpa"
            className="text-blue-500 hover:underline font-semibold"
          >
            PDPA
          </Link>
          <br />
          to review and confirm that your personal data is being used lawfully. <br />
        </>
      ),
    }
  ],
};

export default function GuideBook() {
  const [openIndex, setOpenIndex] = useState(null);
  const [lang, setLang] = useState("th"); // 'th' or 'en'

  const toggleLang = () => setLang(lang === "th" ? "en" : "th");

  const guides = guidesData[lang];

  return (
    <div className="min-h-screen py-16 mt-4 transition-all duration-700 bg-gray-900 text-gray-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto mb-4 flex justify-between items-center"
      >
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-white text-center">
          {lang === "th" ? "คู่มือการใช้งาน Lost & Found" : "Lost & Found Guide Book"}
        </h1>
        <button
            onClick={toggleLang}
            className="
              px-5 py-2
              bg-[#0f172a]          /* พื้นหลังเทาเข้มแบบในภาพ */
              text-white font-semibold
              rounded-full
              border border-blue-400 /* เส้นขอบสีน้ำเงิน */
              hover:bg-blue-500/10   /* เพิ่มแสงน้ำเงินจางๆ ตอน hover */
              transition-all duration-300
            "
          >
            {lang === "th" ? "English" : "ไทย"}
        </button>
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
            className="rounded-[2rem] overflow-hidden backdrop-blur-md transition-all duration-500 bg-gray-800/70 border border-gray-700/50 hover:bg-gray-800/90 shadow-2xl hover:shadow-blue-500/20"
          >
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full text-left px-8 py-6 flex justify-between items-center transition-all duration-300 hover:bg-gray-700/30"
            >
              <span className="font-semibold text-lg">{item.title}</span>
              <motion.span
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                className="text-xl text-white"
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
                  className="overflow-hidden"
                >
                  <div className="px-8 py-6 leading-relaxed bg-gray-900/80 text-gray-100 border-t border-gray-700/50">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

