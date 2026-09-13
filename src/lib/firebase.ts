import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCGPZIWhqObiWfu6fPUTs6LOMRyd63Xh8Q",
  authDomain: "flywings-ffe9a.firebaseapp.com",
  projectId: "flywings-ffe9a",
  storageBucket: "flywings-ffe9a.firebasestorage.app",
  messagingSenderId: "863095702196",
  appId: "1:863095702196:web:1af64e62cc04c57b2ecde1",
  measurementId: "G-M7D5EWXX7C"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Firebase Auth is only needed on the login page and the dashboard,
 * so it is loaded on demand instead of on every public page view.
 */
let authPromise: Promise<import("firebase/auth").Auth> | null = null;
export const getAuthLazy = () => {
  if (!authPromise) {
    authPromise = import("firebase/auth").then(({ getAuth }) => getAuth(app));
  }
  return authPromise;
};

// Initialize analytics only in browser environment
export const initAnalytics = async () => {
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
