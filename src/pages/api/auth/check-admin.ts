import type { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required', isAdmin: false });
    }

    // Get user by email
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      // User not found in Firebase Auth
      return res.status(200).json({ isAdmin: false, message: 'User not found' });
    }

    // Check if user is admin in Firestore
    const adminDoc = await admin.firestore().collection('admins').doc(userRecord.uid).get();

    if (!adminDoc.exists) {
      return res.status(200).json({ isAdmin: false, message: 'Not an admin' });
    }

    const adminData = adminDoc.data();
    const isAdmin = adminData?.isAdmin === true;

    return res.status(200).json({ 
      isAdmin, 
      message: isAdmin ? 'Admin verified' : 'Not an admin' 
    });

  } catch (error: any) {
    console.error('Error checking admin status:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      isAdmin: false,
      details: error.message 
    });
  }
}
