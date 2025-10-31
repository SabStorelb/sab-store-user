import type { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  console.log('🔍 /api/auth/me called');
  console.log('📝 Cookies:', req.cookies);

  try {
    // Get session cookie
    const sessionCookie = req.cookies.sb_session;
    console.log('🍪 Session cookie:', sessionCookie ? 'exists' : 'missing');
    
    if (!sessionCookie) {
      console.log('❌ No session cookie found');
      return res.status(401).json({ error: 'No session found' });
    }

    // Verify session cookie
    console.log('🔐 Verifying session cookie...');
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    console.log('✅ Session verified for user:', decodedClaims.uid);
    
    // Get user data from Firestore
    console.log('📄 Fetching user document from Firestore...');
    const userDoc = await admin.firestore().collection('users').doc(decodedClaims.uid).get();
    console.log('📄 User document exists:', userDoc.exists);
    
    let userData: any;
    
    if (!userDoc.exists) {
      console.log('⚠️ User document not found, creating default user data...');
      // إنشاء بيانات افتراضية للمستخدم
      userData = {
        email: decodedClaims.email,
        name: decodedClaims.name || '',
        role: 'admin',
        permissions: ['all'],
        isAdmin: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
      // حفظ المستخدم في Firestore
      await admin.firestore().collection('users').doc(decodedClaims.uid).set(userData);
      console.log('✅ User document created successfully');
    } else {
      userData = userDoc.data();
    }
    
    // Return user info
    return res.status(200).json({
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        name: userData?.name || '',
        phone: userData?.phone || '',
        bio: userData?.bio || '',
        photoURL: userData?.photoURL || '',
        role: userData?.role || 'admin',
        permissions: userData?.permissions || ['all'],
        createdAt: userData?.createdAt || null,
        lastLogin: userData?.lastLogin || null,
      }
    });
  } catch (e: any) {
    console.error('❌ Error in /api/auth/me:', e);
    console.error('❌ Error details:', {
      name: e?.name,
      message: e?.message,
      code: e?.code
    });
    return res.status(401).json({ error: 'Invalid session' });
  }
}
