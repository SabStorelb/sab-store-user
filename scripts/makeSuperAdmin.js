// Script to make a user SuperAdmin
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function makeSuperAdmin(email) {
  try {
    console.log(`\n🔍 البحث عن المستخدم: ${email}`);
    
    // Get user by email from Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;
    
    console.log(`✅ تم العثور على المستخدم - UID: ${uid}`);
    
    // Update admin document in Firestore
    await db.collection('admins').doc(uid).set({
      name: userRecord.displayName || 'Super Admin',
      email: email,
      phone: '',
      role: 'superadmin',
      isAdmin: true,
      isActive: true,
      permissions: {
        canManageProducts: true,
        canManageOrders: true,
        canManageUsers: true,
        canManageCategories: true,
        canManageBrands: true,
        canManageBanners: true,
        canViewReports: true,
        canManageAdmins: true,
      },
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    console.log(`\n🎉 تم بنجاح! ${email} أصبح الآن SuperAdmin 👑`);
    console.log(`\n✅ الصلاحيات:`);
    console.log(`   - الدور: SuperAdmin`);
    console.log(`   - جميع الصلاحيات: نعم ✓`);
    console.log(`\nيمكنك الآن تسجيل الدخول والتحكم بكل شيء! 🚀\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ حدث خطأ:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('\n⚠️ المستخدم غير موجود في Firebase Authentication');
      console.log('الحل: قم بإنشاء حساب جديد أولاً من صفحة التسجيل');
    }
    
    process.exit(1);
  }
}

// Run the script
const email = process.argv[2] || 'ahmadkabot@gmail.com';
makeSuperAdmin(email);
