// firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3l41ikLvJn-HbRtmQAzFk-IJ315BzSRI",
  authDomain: "spotify-7cc8a.firebaseapp.com",
  projectId: "spotify-7cc8a",
  storageBucket: "spotify-7cc8a.appspot.com",
  messagingSenderId: "156808795079",
  appId: "1:156808795079:web:fcd62a8063e2f33eaeffe2",
  measurementId: "G-RHMD47FBBD",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
//db.settings({ timestampsInSnapshots: true });
//export default app;
