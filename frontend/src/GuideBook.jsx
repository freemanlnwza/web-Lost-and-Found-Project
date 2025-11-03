import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const guides = [
    {
        title: "User",
        content: (
            <>
                1. อัปโหลดรูปของสิ่งของ - ถ่ายรูปหรือเลือกจากคลังภาพของคุณ <br />
                2. ระบุประเภทของสิ่งของ - เลือกเอง หรือใช้ AI ช่วยจำแนกให้โดยอัตโนมัติ <br />
                3. เพิ่มคำอธิบายสั้นๆ - บอกลักษณะสำคัญของสิ่งของที่หายหรือพบเจอ <br />
                4. เลือกประเภทโพสต์ <br />
                <ul className="ml-6 mt-0 list-disc">
                    <li>Report lost item : แจ้งของที่หาย</li>
                    <li>Found item : แจ้งสิ่งของที่พบ</li>
                </ul>
                5. ยืนยันข้อมูล - กด “คอนเฟิร์ม” ข้อมูลจะถูกส่งไปยังหน้าของ Lost หรือ Found <br />
            </>
        ),
    },
    {
        title: "Post / Found / chat",
        content: (
            <>
                1. รูปที่ถูกส่งมาจากหน้าหลักโดยผ่านปุ่ม Report lost item หริแ Found item ข้อมูลและรูปภาพก็จะมาอยู่ในหน้า Lost หรือหน้า Found พร้อมคำอธิบายที่ผู้ใช้ได้กรอกลงไป <br />
                2. ด้านใต้ของรูปภาพและคำอธิบายจะมีปุ่มไว้พูดคุยกับต้นทางคนโพส เพื่อติดต่อสอบถามเกี่ยวกับโพสของสิ่งของนั้นๆ <br />
            </>
        ),
    },
    {
        title: "Report",
        content: (
            <>
                แต่ละโพสหรือบุคคลที่สนทนา จะมีปุ่มให้กด Report พร้อมให้ใส่คำอธิบายปัญหาและสิ่งที่พบเจอพร้อมปุ่มยืนยันการร้องเรียน ข้อมูลจะถูกส่งไปที่ admin เพื่อพิจารณาในการลงโทษผู้ที่กระทำการผิด ผู้ที่ขัดต่อกฏและก่อกวนผู้อื่นจะได้รับการแจ้งการตักเตือนพร้อมข้อมูลที่ถูกแจ้งร้อง<br />
                <br />
                (โปรดให้เกียรติผู้อื่น และรักษามารยาท และกฎเกณฑ์เพื่อทำให้เว็บไซต์นี้น่าใช้งาน) <br />
            </>
        ),
    },
];

export default function GuideBook() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="min-h-screen py-16 mt-4 transition-all duration-700 bg-gray-900 text-gray-100">
      {/* Header */}
       <motion.div 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="max-w-3xl mx-auto mb-12 flex justify-center"
  >
    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-white text-center">
      Lost and Found Guide Book
    </h1>
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
