const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: 'sab-store-9b947.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkProducts() {
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    
    console.log(`\n📦 Found ${productsSnap.size} products:\n`);
    
    productsSnap.forEach((doc) => {
      const data = doc.data();
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🆔 ID: ${doc.id}`);
      console.log(`� Name: ${data.name || data.nameEn || 'N/A'}`);
      console.log(`💰 Price: ${data.price} ${data.currency || 'USD'}`);
      console.log(`📸 Images: ${data.images ? data.images.length : 0}`);
      
      if (data.images && data.images.length > 0) {
        console.log(`   First image: ${data.images[0].substring(0, 60)}...`);
      } else {
        console.log(`   ⚠️ NO IMAGES!`);
      }
    });
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkProducts();
