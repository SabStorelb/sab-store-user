// server-side Firebase Admin initialization
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Handle both escaped and non-escaped newlines
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    // Replace literal \n with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!projectId || !clientEmail || !privateKey) {
    // More detailed error logging
    console.error('❌ Firebase Admin credentials missing:', {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      privateKeyLength: privateKey?.length || 0,
    });
    throw new Error('Firebase admin credentials are not fully set in environment variables');
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
    console.log('✅ Firebase Admin initialized successfully');
  } catch (e) {
    console.error('❌ Firebase admin initializeApp failed:', e);
    throw e; // Re-throw to make the error visible
  }
}

export { admin };
