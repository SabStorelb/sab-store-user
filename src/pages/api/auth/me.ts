import type { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    // Get session cookie
    const sessionCookie = req.cookies.sb_session;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'No session found' });
    }

    // Verify session cookie
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    
    // Get user data from Firestore
    const userDoc = await admin.firestore().collection('users').doc(decodedClaims.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
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
    console.error('Error getting user session:', e);
    return res.status(401).json({ error: 'Invalid session' });
  }
}
