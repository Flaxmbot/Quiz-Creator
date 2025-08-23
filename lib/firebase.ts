// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "quizlink-m35wc",
  "appId": "1:723844920926:web:f9e6970dd56f7cf1a8a6cf",
  "storageBucket": "quizlink-m35wc.firebasestorage.app",
  "apiKey": "AIzaSyCdJvhEVY4gLrUdD149uvigYMG6p0jvJWs",
  "authDomain": "quizlink-m35wc.firebaseapp.com",
  "messagingSenderId": "723844920926"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
