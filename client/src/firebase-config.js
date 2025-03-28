// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAtonjC0nw_w5uUprvAnwAtl55-AKtRO4o",
  authDomain: "spotify-game-2b7a6.firebaseapp.com",
  projectId: "spotify-game-2b7a6",
  storageBucket: "spotify-game-2b7a6.firebasestorage.app",
  messagingSenderId: "904392710805",
  appId: "1:904392710805:web:1605eb26a559ec0231d99c",
  measurementId: "G-3QCWN8CTB9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;