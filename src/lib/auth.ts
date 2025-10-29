import type { NextApiRequest } from 'next';
import { admin } from './firebaseAdmin';

export async function verifyAdminSession(req: NextApiRequest) {
  const sessionCookie = req.cookies?.sb_session;
  if (!sessionCookie) throw new Error('No session cookie');

  try {
    // verify session cookie and check admin claim or admins collection
    const decoded = await admin.auth().verifySessionCookie(sessionCookie, true);
    if (decoded.admin) return decoded;

    const adminDoc = await admin.firestore().collection('admins').doc(decoded.uid).get();
    if (adminDoc.exists) return decoded;

    throw new Error('Not an admin');
  } catch (e) {
    throw e;
  }
}
