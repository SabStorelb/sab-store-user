const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc } = require('firebase/firestore');
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

async function fixProduct() {
  try {
    const productId = '0c8tQtHYAXDLICklykUx';
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      console.log('❌ Product not found!');
      process.exit(1);
    }
    
    const data = productSnap.data();
    console.log('\n📦 Current product data:');
    console.log('Name:', data.name);
    console.log('Images:', data.images ? `${data.images.length} images` : 'NO IMAGES');
    
    // Create comprehensive update with React Native app format
    const updates = {
      // Multi-language fields (object format for React Native)
      name: {
        en: data.name || 'Two-Piece Sweatshirt Set with Mixed Design',
        ar: data.nameAr || 'طقم سويت شيرت من قطعتين بتصميم متنوع',
      },
      description: {
        en: data.desc || '',
        ar: data.descAr || '',
      },
      
      // Add main image
      image: data.images && data.images[0] ? data.images[0] : '',
      
      // Flat fields for admin compatibility
      nameEn: data.name || 'Two-Piece Sweatshirt Set with Mixed Design',
      title: data.name || 'Two-Piece Sweatshirt Set with Mixed Design',
      titleAr: data.nameAr || 'طقم سويت شيرت من قطعتين بتصميم متنوع',
      desc: data.desc || '',
      
      // Category & Brand
      category: 'Fashion',
      categoryName: 'Fashion',
      categoryId: data.category || 'fashion',
      
      subcategory: 'Kids',
      subcategoryName: 'Kids',
      subcategoryId: data.subcategory || 'kids',
      
      brand: 'SAB',
      brandName: 'SAB',
      brandId: data.brand || 'SAB',
      
      // Rating & Reviews
      rating: data.rate || 4.5,
      reviews: 0,
      
      // Stock status (React Native uses "inStock" not "available")
      inStock: data.available !== false,
      
      // Discount
      discount: 0,
      
      // Timestamp
      updatedAt: new Date().toISOString(),
    };
    
    console.log('\n✅ Updating product with:');
    console.log(JSON.stringify(updates, null, 2));
    
    await updateDoc(productRef, updates);
    console.log('\n✅ Product updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

fixProduct();
