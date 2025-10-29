// server-side Firebase Admin initialization
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    // do not throw in initialization; functions or server will log explicit errors when used
    console.warn('Firebase admin credentials are not fully set in environment variables');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      } as any),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (e) {
    console.warn('Firebase admin initializeApp failed:', e);
  }
}

export { admin };
