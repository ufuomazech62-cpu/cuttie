// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0JSNlXVAJS7EL8DHuFoanDLFSYOc21JM",
  authDomain: "fashiony-ff160.firebaseapp.com",
  projectId: "fashiony",
  storageBucket: "fashiony.firebasestorage.app",
  messagingSenderId: "530161880907",
  appId: "1:530161880907:web:2b3d1cabd6359d704da2ce",
  measurementId: "G-9C623N07S6"
};

// Initialize Firebase
// Use existing app if initialized, otherwise initialize
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

let analytics;

// Initialize Analytics only on client side
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics, auth, db, storage, googleProvider };
