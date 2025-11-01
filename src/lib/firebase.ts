// client-side Firebase initialization
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Use NEXT_PUBLIC_* env vars for client-side Firebase config
const clientCredentials = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // Use the storage bucket from environment variables
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getFirebaseClient() {
  if (!getApps().length) {
    initializeApp(clientCredentials as FirebaseOptions);
  }
  return getApp();
}

export const firebaseClient = getFirebaseClient();
export const firebaseAuth = getAuth(firebaseClient);
export const firebaseDb = getFirestore(firebaseClient);
export const firebaseStorage = getStorage(firebaseClient);
