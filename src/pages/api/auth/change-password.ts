import { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../../lib/firebaseAdmin';

const adminAuth = admin.auth();

/**
 * API endpoint to change admin password
 * The user authenticates with old password on frontend,
 * then we update the password here using their UID
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, oldPassword, newPassword, uid } = req.body;

    // Validate inputs
    if (!email || !newPassword || !uid) {
      return res.status(400).json({ 
        error: 'الرجاء ملء جميع الحقول - Please fill all fields' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل - New password must be at least 6 characters' 
      });
    }

    // Get user from Firebase
    const userRecord = await adminAuth.getUser(uid);
    
    // Verify the email matches
    if (userRecord.email !== email) {
      return res.status(403).json({ 
        error: 'البريد الإلكتروني غير مطابق - Email mismatch' 
      });
    }

    // Update the password
    await adminAuth.updateUser(uid, {
      password: newPassword,
    });

    console.log(`✅ Password changed successfully for: ${email}`);

    return res.status(200).json({ 
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح - Password changed successfully' 
    });

  } catch (error: any) {
    console.error('❌ Change password error:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ 
        error: 'المستخدم غير موجود - User not found' 
      });
    }

    return res.status(500).json({ 
      error: 'فشل تغيير كلمة المرور - Failed to change password',
      details: error.message 
    });
  }
}
