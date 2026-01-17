import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Firebase 설정
// 아래 값들을 Firebase Console에서 복사한 값으로 교체하세요
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase Storage 인스턴스
export const storage = getStorage(app);

export default app;
