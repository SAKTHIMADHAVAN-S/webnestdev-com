import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// Your web app's Firebase configuration (provided by developer console)
const firebaseConfig = {
  apiKey: "AIzaSyDkvVepXKImb3nA3CK5BL3lNsrbx8vBsnU",
  authDomain: "webnestdev-57d2d.firebaseapp.com",
  projectId: "webnestdev-57d2d",
  storageBucket: "webnestdev-57d2d.firebasestorage.app",
  messagingSenderId: "33987495483",
  appId: "1:33987495483:web:c22e9c3a451f9eec587e1e",
  measurementId: "G-1FSKYN25E0"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore targeting the specific provisioned Firestore database ID
export const db = getFirestore(app, "ai-studio-9b272f8c-b2c5-4e30-b036-d9018f9c7809");

// Validate connection to Firestore to prevent errors on deployment
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("[Firebase] Successfully verified Firestore database connection channel.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("[Firebase Error] Connection failed: client is offline. Please check your config.", error);
    } else {
      console.log("[Firebase] Test connection completed.", error);
    }
  }
}

testConnection();
