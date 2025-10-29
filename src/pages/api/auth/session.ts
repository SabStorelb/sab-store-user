import type { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { idToken } = req.body || {};
  if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Check admin claim or existence in admins collection
    let isAdmin = !!decoded.admin;
    if (!isAdmin) {
      const adminDoc = await admin.firestore().collection('admins').doc(decoded.uid).get();
      isAdmin = adminDoc.exists;
    }

    if (!isAdmin) return res.status(403).json({ error: 'Not an admin' });

    // create session cookie (valid up to 14 days). we'll use 5 days here
    const expiresIn = 5 * 24 * 60 * 60 * 1000; // 5 days in ms
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    const secure = process.env.NODE_ENV === 'production';
    const maxAge = expiresIn / 1000;
    const cookieValue = encodeURIComponent(sessionCookie);

    const cookie = `sb_session=${cookieValue}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax;$${secure ? ' Secure;' : ''}`.replace('$', '');

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('session create error', e);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
