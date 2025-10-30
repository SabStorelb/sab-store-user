// Script to initialize Firebase collections
// Run this once to create the required collections in Firestore

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Firebase config
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
    await addDoc(collection(db, 'userNotifications'), {
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
    console.log('✅ userNotifications collection created successfully!\n');

    // 2. Verify notifications collection exists (should already exist)
    console.log('🔔 Verifying notifications collection...');
    await addDoc(collection(db, 'notifications'), {
      type: 'system',
      title: '⚙️ تهيئة النظام',
      message: 'تم التحقق من مجموعة إشعارات الأدمن',
      read: false,
      createdAt: Timestamp.now(),
      targetUrl: '/admin/dashboard',
      targetId: null
    });
    console.log('✅ notifications collection verified!\n');

    // 3. Create activityLog collection (if not exists)
    console.log('📊 Creating activityLog collection...');
    await addDoc(collection(db, 'activityLog'), {
      action: 'system_initialization',
      adminId: 'system',
      adminName: 'النظام',
      targetType: 'collections',
      targetId: 'initialization',
      timestamp: Timestamp.now(),
      details: 'تم إنشاء جميع المجموعات المطلوبة للنظام',
      metadata: {
        collections: ['userNotifications', 'notifications', 'activityLog']
      }
    });
    console.log('✅ activityLog collection created successfully!\n');

    console.log('🎉 All collections initialized successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✓ userNotifications - للعملاء');
    console.log('  ✓ notifications - للأدمن');
    console.log('  ✓ activityLog - سجل الأنشطة');
    console.log('\n✨ You can now use the dual notification system!');
    console.log('📖 Check DUAL_NOTIFICATIONS_GUIDE.md for usage examples.\n');

  } catch (error) {
    console.error('❌ Error initializing collections:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeCollections()
  .then(() => {
    console.log('✅ Initialization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  });
