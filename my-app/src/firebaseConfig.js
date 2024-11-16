// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration (replace with your config)
const firebaseConfig = {
    apiKey: "AIzaSyCeqkT00392PZtHAfz49iqEETV_-NW1fUU",
    authDomain: "smart-3f5b7.firebaseapp.com",
    projectId: "smart-3f5b7",
    storageBucket: "smart-3f5b7.appspot.com",
    messagingSenderId: "54434566073",
    appId: "1:54434566073:web:601618e0fb267eb14f3068",
    measurementId: "G-04FLQ5EJFN"
  };
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);