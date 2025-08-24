// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

// Check environment variables in Node.js environment
if (typeof window === 'undefined') {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`Missing required environment variable: ${envVar}`);
    }
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  try {
    // Check if emulators are already connected to prevent re-initialization
    // This is a simplified check; more robust checks might be needed in complex scenarios
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(auth as any)._isEmulator) {
      console.log("Connecting to Firebase emulators...");
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      console.log("Successfully connected to Firebase emulators.");
    }
  } catch (error) {
    console.warn("Could not connect to Firebase emulators. Please ensure they are running.");
    console.error("Emulator connection error:", error);
  }
}

export { app, auth, db };
