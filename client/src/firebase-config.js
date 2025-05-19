// firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBzkDJ9NgMqNuVpv0Omj7kHUP4RhDl6J1k",
  authDomain: "spotify1-73e07.firebaseapp.com",
  projectId: "spotify1-73e07",
  storageBucket: "spotify1-73e07.appspot.com",
  messagingSenderId: "819343136632",
  appId: "1:819343136632:web:01e70cc5bb3c7c194d1a8d",
  measurementId: "G-E69VZJZSDQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
//db.settings({ timestampsInSnapshots: true });
//export default app;
