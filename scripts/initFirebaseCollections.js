// Script to initialize Firebase collections
// Run: node scripts/initFirebaseCollections.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeCollections() {
  console.log('🚀 Starting Firebase collections initialization...\n');

  try {
    // 1. Create userNotifications collection
    console.log('📱 Creating userNotifications collection...');
    const userNotifRef = await addDoc(collection(db, 'userNotifications'), {
      userId: 'system',
      type: 'welcome',
      title: '🎉 مرحباً بك في نظام الإشعارات',
      message: 'تم إنشاء مجموعة إشعارات العملاء بنجاح',
      read: false,
      createdAt: Timestamp.now(),
      targetUrl: '/notifications',
      targetId: null,
      metadata: {
        source: 'initialization_script',
        version: '1.0'
      }
    });
    console.log('✅ userNotifications collection created!');
    console.log('   Document ID:', userNotifRef.id, '\n');

    // 2. Add sample notification to existing notifications collection
    console.log('🔔 Adding system notification to notifications collection...');
    const adminNotifRef = await addDoc(collection(db, 'notifications'), {
      type: 'system',
      title: '⚙️ تهيئة النظام',
      message: 'تم إنشاء نظام الإشعارات المزدوج بنجاح',
      read: false,
      createdAt: Timestamp.now(),
      targetUrl: '/admin/dashboard',
      targetId: null
    });
    console.log('✅ System notification added!');
    console.log('   Document ID:', adminNotifRef.id, '\n');

    // 3. Create activityLog collection (optional - may need admin permissions)
    console.log('📊 Creating activityLog collection...');
    try {
      const activityRef = await addDoc(collection(db, 'activityLog'), {
        action: 'system_initialization',
        adminId: 'system',
        adminName: 'النظام',
        targetType: 'collections',
        targetId: 'initialization',
        timestamp: Timestamp.now(),
        details: 'تم إنشاء جميع المجموعات المطلوبة للنظام',
        metadata: {
          collections: ['userNotifications', 'notifications', 'activityLog'],
          initializedAt: new Date().toISOString()
        }
      });
      console.log('✅ activityLog collection created!');
      console.log('   Document ID:', activityRef.id, '\n');
    } catch (error) {
      console.log('⚠️  Could not create activityLog (needs admin permissions)');
      console.log('   You can create it manually or from admin panel later.\n');
    }

    console.log('═══════════════════════════════════════════════');
    console.log('🎉 All collections initialized successfully!');
    console.log('═══════════════════════════════════════════════\n');
    
    console.log('📋 Summary:');
    console.log('  ✓ userNotifications - إشعارات العملاء');
    console.log('  ✓ notifications - إشعارات الأدمن');
    console.log('  ⚠ activityLog - (يحتاج صلاحيات أدمن - سيتم إنشاؤه تلقائياً عند أول استخدام)');
    console.log('\n🔗 Next Steps:');
    console.log('  1. ✅ Update Firestore Rules in Firebase Console');
    console.log('  2. ✅ Check Firebase Console - new collections created!');
    console.log('  3. 🧪 Test the dual notification system');
    console.log('  4. 📖 Check DUAL_NOTIFICATIONS_GUIDE.md for usage\n');
    console.log('✨ System is ready to use!\n');

  } catch (error) {
    console.error('❌ Error initializing collections:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    process.exit(1);
  }
}

// Run the initialization
initializeCollections()
  .then(() => {
    console.log('✅ Initialization script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
