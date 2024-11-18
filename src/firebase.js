// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDWgT1Lr5utw2knTu10_eSbP7iejH7p9Qo",
  authDomain: "artha-71c7e.firebaseapp.com",
  projectId: "artha-71c7e",
  storageBucket: "artha-71c7e.firebasestorage.app",
  messagingSenderId: "165595597250",
  appId: "1:165595597250:web:de76f62a373e4095acae5b",
  measurementId: "G-DMF7T2E3BF"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
