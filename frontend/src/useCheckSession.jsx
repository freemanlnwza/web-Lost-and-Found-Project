import { API_URL } from "./configurl"; 



export const useCheckSession = () => {
  const checkSession = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/check-session`, {
        method: "GET",
        credentials: "include", // ส่ง cookie ไป backend
      });

      if (!res.ok) {
        // session หมดอายุ
        return null;
      }

      const data = await res.json();
      return data.user; // คืนข้อมูล user
    } catch (err) {
      // error เช่น network, backend down
      console.error("Error checking session:", err);
      return null;
    }
  };

  return { checkSession };
};