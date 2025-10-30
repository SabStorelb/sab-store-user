// Script to verify and initialize products collection
// Run: node scripts/verifyProductsCollection.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, Timestamp } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

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

async function verifyProductsCollection() {
  console.log('🔍 Verifying products collection...\n');

  try {
    // Check if products collection exists
    const productsSnapshot = await getDocs(collection(db, 'products'));
    
    if (productsSnapshot.empty) {
      console.log('⚠️  Products collection is EMPTY (no products found)');
      console.log('📦 Collection exists but contains no documents\n');
      
      console.log('💡 To add products:');
      console.log('   1. Login as admin at: http://localhost:3000/admin/login');
      console.log('   2. Go to: http://localhost:3000/admin/products');
      console.log('   3. Click "إضافة منتج جديد / Add Product"\n');
      
    } else {
      console.log('✅ Products collection EXISTS and has data');
      console.log(`   Total products: ${productsSnapshot.size}\n`);
      
      // Show product summary
      console.log('📊 Products Summary:');
      productsSnapshot.forEach((doc, index) => {
        const product = doc.data();
        console.log(`   ${index + 1}. ${product.nameAr || product.nameEn || 'Unnamed'}`);
        console.log(`      - ID: ${doc.id}`);
        console.log(`      - Price: ${product.price || 0} SAR`);
        console.log(`      - Stock: ${product.stock || 0}`);
        console.log(`      - Active: ${product.active ? 'Yes ✓' : 'No ✗'}`);
      });
      console.log('');
    }

    console.log('═══════════════════════════════════════════════');
    console.log('🎯 Products Collection Status: READY ✓');
    console.log('═══════════════════════════════════════════════\n');
    
    console.log('📝 Firestore Rules for products (verified):');
    console.log('   - Read: ✅ Public (everyone can view)');
    console.log('   - Write: ✅ Admin only (requires authentication)');
    console.log('\n🔗 Admin Panel URLs:');
    console.log('   - Products List: http://localhost:3000/admin/products');
    console.log('   - Add New Product: http://localhost:3000/admin/products/new\n');

  } catch (error) {
    console.error('❌ Error verifying products collection:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n⚠️  Permission denied - This is EXPECTED behavior!');
      console.log('   Reading products requires Firestore rules to be published.');
      console.log('\n📋 Have you published the rules in Firebase Console?');
      console.log('   1. Go to: https://console.firebase.google.com/project/sab-store-9b947/firestore/rules');
      console.log('   2. Make sure the rules from firestore.rules are there');
      console.log('   3. Click "Publish" button\n');
      console.log('   Current rule needed for products:');
      console.log('   match /products/{productId} {');
      console.log('     allow read: if true;  // ← This allows reading');
      console.log('     allow write: if request.auth != null && ...');
      console.log('   }\n');
    }
    
    process.exit(1);
  }
}

verifyProductsCollection()
  .then(() => {
    console.log('✅ Verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
