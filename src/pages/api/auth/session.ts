import type { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { idToken } = req.body || {};
  if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

  try {
    console.log('🔍 Attempting to verify ID token...');
    const decoded = await admin.auth().verifyIdToken(idToken);
    console.log('✅ Token verified for user:', decoded.uid);


    // Fast admin check: prefer custom claim, fallback to Firestore only if missing
    let isAdmin = false;
    if (typeof decoded.admin !== 'undefined') {
      isAdmin = !!decoded.admin;
      console.log('✅ Admin status from custom claim:', isAdmin);
    } else {
      // Only check Firestore if claim not present
      console.log('🔍 Checking Firestore for admin status...');
      const adminDoc = await admin.firestore().collection('admins').doc(decoded.uid).get();
      isAdmin = adminDoc.exists;
      console.log('✅ Admin status from Firestore:', isAdmin);
    }

    if (!isAdmin) {
      console.log('❌ User is not an admin:', decoded.uid);
      return res.status(403).json({ error: 'Not an admin' });
    }

    // create session cookie (valid up to 14 days). we'll use 5 days here
    const expiresIn = 5 * 24 * 60 * 60 * 1000; // 5 days in ms
    console.log('🔍 Creating session cookie...');
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    console.log('✅ Session cookie created');

    const secure = process.env.NODE_ENV === 'production';
    const maxAge = expiresIn / 1000;
    const cookieValue = encodeURIComponent(sessionCookie);

    const cookie = `sb_session=${cookieValue}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax;$${secure ? ' Secure;' : ''}`.replace('$', '');

    res.setHeader('Set-Cookie', cookie);
    console.log('✅ Session created successfully for user:', decoded.uid);
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('❌ Session create error:', e);
    console.error('Error details:', {
      message: e.message,
      code: e.code,
      stack: e.stack?.split('\n')[0],
    });
    return res.status(401).json({ error: 'Invalid token', details: e.message });
  }
}
