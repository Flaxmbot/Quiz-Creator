// Run this with: node diagnose-firebase.js
// This will help us identify exactly what's wrong

const { initializeApp } = require('firebase/app');
const { getAuth, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, connectFirestoreEmulator, collection, addDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Diagnosing Firebase connection...\n');

// Check environment variables
console.log('📊 Environment Variables:');
console.log('- API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log('- Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('- Storage Bucket:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log('- Messaging Sender ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing');
console.log('- App ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing');
console.log();

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  console.log('✅ Firebase initialized successfully');
  console.log('🎯 Connected to project:', firebaseConfig.projectId);
  console.log('🔐 Auth domain:', firebaseConfig.authDomain);
  
  // Check if we're using emulators
  console.log('\n🧪 Emulator Status:');
  console.log('- Firestore emulator:', db._settings?.host?.includes('localhost') ? '⚠️ USING EMULATOR' : '✅ Production');
  console.log('- Auth emulator:', auth.config?.authDomain?.includes('localhost') ? '⚠️ USING EMULATOR' : '✅ Production');
  
  // Try a simple write to test permissions (this will fail if not authenticated)
  console.log('\n⚠️ To test write permissions, you need to be authenticated.');
  console.log('📋 Next steps:');
  console.log('1. Start your app: npm run dev');
  console.log('2. Sign in as a user');
  console.log('3. Try creating a quiz');
  console.log('4. Check browser console for detailed error messages');
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
}

console.log('\n🔧 Troubleshooting tips:');
console.log('- Make sure .env.local file exists and has correct values');
console.log('- Verify Firebase project is active: firebase projects:list');
console.log('- Check if emulators are running accidentally');
console.log('- Ensure Firestore database is created in Firebase Console');
console.log('- Wait 2-3 minutes after deploying rules for propagation');
