import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminSession } from '../../../lib/auth';
import { admin } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    await verifyAdminSession(req);
  } catch (e: any) {
    return res.status(401).json({ error: e?.message || 'Unauthorized' });
  }

  const body = req.body || {};
  const now = admin.firestore.FieldValue.serverTimestamp();
  try {
    const docRef = await admin.firestore().collection('products').add({
      ...body,
      createdAt: now,
      updatedAt: now,
    });
    return res.status(200).json({ ok: true, id: docRef.id });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to create product' });
  }
}
