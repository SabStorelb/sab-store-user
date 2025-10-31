import { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and get user
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Check if the user is a SuperAdmin
    const currentAdminDoc = await admin.firestore().collection('admins').doc(uid).get();
    const currentAdminData = currentAdminDoc.data();

    if (!currentAdminData || currentAdminData.role !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Forbidden - Only SuperAdmin can create admins | محظور - فقط المدير الرئيسي يمكنه إضافة مدراء' 
      });
    }

    const { name, email, phone, password, role, permissions } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Create user in Firebase Authentication using Admin SDK
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    console.log('✅ User created in Firebase Auth:', userRecord.uid);

    // Determine role and permissions
    const adminRole = role || 'admin';
    const adminPermissions = adminRole === 'superadmin' ? {
      canManageProducts: true,
      canManageOrders: true,
      canManageUsers: true,
      canManageCategories: true,
      canManageBrands: true,
      canManageBanners: true,
      canViewReports: true,
      canManageAdmins: true,
    } : (permissions || {
      canManageProducts: true,
      canManageOrders: true,
      canManageUsers: false,
      canManageCategories: true,
      canManageBrands: true,
      canManageBanners: true,
      canViewReports: true,
      canManageAdmins: false,
    });

    // Create admin document in Firestore
    await admin.firestore().collection('admins').doc(userRecord.uid).set({
      name,
      email,
      phone: phone || '',
      role: adminRole,
      isAdmin: true,
      isActive: true,
      permissions: adminPermissions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ Admin document created in Firestore');

    return res.status(200).json({
      success: true,
      uid: userRecord.uid,
      message: 'Admin created successfully',
    });
  } catch (error: any) {
    console.error('❌ Error creating admin:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'البريد الإلكتروني مستخدم مسبقاً - Email already in use' });
    } else if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'البريد الإلكتروني غير صالح - Invalid email address' });
    } else if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'كلمة المرور ضعيفة - Weak password' });
    }

    return res.status(500).json({ error: error.message || 'Failed to create admin' });
  }
}
