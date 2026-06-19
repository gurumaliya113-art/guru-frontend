import { initializeApp, getApp, getApps } from "firebase/app";
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence } from "firebase/auth";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCqdMfh2xwcpDVtuX4Qc7dMp_d3g_eHVzI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gurtron-3ca48.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gurtron-3ca48",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gurtron-3ca48.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "476944509684",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:476944509684:web:1dd5f92b7d30e8eac38ca1",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-C3BPEGTZM3",
};

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });

setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {
  // Local persistence is best-effort; sign-in still works if the browser blocks it.
});