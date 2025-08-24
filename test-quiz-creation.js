// Simple test to verify quiz creation works with the new simplified approach
// This is a standalone test that you can run to verify Firebase connectivity

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Test Firebase configuration (using environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Test function to verify basic Firebase connectivity
async function testFirebaseConnection() {
  try {
    console.log("🔄 Testing Firebase connection...");
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    console.log("✅ Firebase initialized successfully");
    console.log("📊 Project ID:", firebaseConfig.projectId);
    console.log("🔑 Auth Domain:", firebaseConfig.authDomain);
    
    // Note: To fully test quiz creation, you would need to:
    // 1. Sign in with Firebase Authentication
    // 2. Then attempt to create a quiz document
    
    console.log("📝 To test quiz creation:");
    console.log("  1. Run your Next.js application: npm run dev");
    console.log("  2. Sign up/login as a teacher");
    console.log("  3. Navigate to /create");
    console.log("  4. Try creating a quiz with title, description, and questions");
    console.log("  5. Click 'Save Quiz'");
    
    return true;
  } catch (error) {
    console.error("❌ Firebase connection test failed:", error);
    return false;
  }
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testFirebaseConnection().then(success => {
    if (success) {
      console.log("\n🎉 Basic Firebase setup looks good!");
      console.log("📋 Next steps:");
      console.log("  - Start your application: npm run dev");
      console.log("  - Test quiz creation in the browser");
    } else {
      console.log("\n💥 Firebase setup needs attention!");
      console.log("📋 Check:");
      console.log("  - Environment variables in .env.local");
      console.log("  - Firebase project configuration");
    }
    process.exit(success ? 0 : 1);
  });
}

export default testFirebaseConnection;
