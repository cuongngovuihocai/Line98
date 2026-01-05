import { LeaderboardEntry } from '../types';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

// --- CẤU HÌNH FIREBASE ---
// 1. Vào https://console.firebase.google.com/
// 2. Tạo project mới -> Tạo Database Firestore -> Chọn "Start in Test Mode"
// 3. Vào Project Settings -> Tạo Web App -> Copy config dán vào dưới đây:
  const firebaseConfig = {
    apiKey: "AIzaSyAL9ssdLNFM84oF35TLxijXYM6cBb0Hy3Y",
    authDomain: "line98-game.firebaseapp.com",
    projectId: "line98-game",
    storageBucket: "line98-game.firebasestorage.app",
    messagingSenderId: "252310123568",
    appId: "1:252310123568:web:39329fb247834e72c669f5"
  };

// Kiểm tra xem người dùng đã điền config chưa
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";

// Khởi tạo biến global (để tránh init nhiều lần nếu dùng strict mode)
let db: any = null;

if (isConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase init error:", e);
  }
}

const COLLECTION_NAME = 'leaderboard';

export const getLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
  // Nếu chưa cấu hình Firebase, dùng LocalStorage
  if (!isConfigured || !db) {
    console.warn("Firebase chưa được cấu hình. Đang sử dụng LocalStorage.");
    return new Promise((resolve) => {
      setTimeout(() => {
        const savedLB = localStorage.getItem('line98-leaderboard');
        try {
            resolve(savedLB ? JSON.parse(savedLB) : []);
        } catch {
            resolve([]);
        }
      }, 500);
    });
  }

  // Lấy dữ liệu từ Firestore
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("score", "desc"),
      limit(5)
    );
    
    const querySnapshot = await getDocs(q);
    const data: LeaderboardEntry[] = [];
    
    querySnapshot.forEach((doc) => {
      // Ép kiểu dữ liệu về LeaderboardEntry
      const d = doc.data();
      data.push({
        name: d.name,
        score: d.score,
        timestamp: d.timestamp
      });
    });
    
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu từ Firebase:", error);
    return [];
  }
};

export const saveLeaderboardData = async (entry: LeaderboardEntry): Promise<LeaderboardEntry[]> => {
  // Nếu chưa cấu hình, lưu vào LocalStorage
  if (!isConfigured || !db) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const savedLB = localStorage.getItem('line98-leaderboard');
        let currentBoard: LeaderboardEntry[] = savedLB ? JSON.parse(savedLB) : [];
        const newBoard = [...currentBoard, entry].sort((a, b) => b.score - a.score).slice(0, 5);
        localStorage.setItem('line98-leaderboard', JSON.stringify(newBoard));
        resolve(newBoard);
      }, 500);
    });
  }

  // Lưu vào Firestore
  try {
    // 1. Thêm record mới
    await addDoc(collection(db, COLLECTION_NAME), {
      name: entry.name,
      score: entry.score,
      timestamp: entry.timestamp
    });

    // 2. Trả về danh sách mới nhất
    return await getLeaderboardData();
  } catch (error) {
    console.error("Lỗi khi lưu điểm vào Firebase:", error);
    throw error;
  }
};
