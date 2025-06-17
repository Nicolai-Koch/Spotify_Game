// firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAb3d2luYwkxT_6o1-l4JH2EfHyuwZI7uc",
  authDomain: "spotifygame-final.firebaseapp.com",
  projectId: "spotifygame-final",
  storageBucket: "spotifygame-final.firebasestorage.app",
  messagingSenderId: "469808083316",
  appId: "1:469808083316:web:cb3f2be01c1b841eebfc21",
  measurementId: "G-5783E2LFZ5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
//db.settings({ timestampsInSnapshots: true });
//export default app;
