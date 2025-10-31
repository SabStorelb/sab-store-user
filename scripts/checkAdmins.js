const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function checkAdmins() {
  try {
    const adminsSnapshot = await admin.firestore().collection('admins').get();
    console.log('✅ Total admins found:', adminsSnapshot.size);
    
    adminsSnapshot.forEach(doc => {
      console.log('\n📋 Admin:');
      console.log('  ID:', doc.id);
      console.log('  Data:', doc.data());
    });

    // Check for the specific email
    const email = 'ahmadkabot@gmail.com';
    const userRecord = await admin.auth().getUserByEmail(email).catch(() => null);
    
    if (userRecord) {
      console.log('\n✅ User exists in Firebase Auth:');
      console.log('  UID:', userRecord.uid);
      console.log('  Email:', userRecord.email);
      
      const adminDoc = await admin.firestore().collection('admins').doc(userRecord.uid).get();
      if (adminDoc.exists) {
        console.log('  ✅ IS ADMIN in Firestore');
      } else {
        console.log('  ❌ NOT ADMIN in Firestore');
        console.log('  💡 Need to add UID to admins collection!');
      }
    } else {
      console.log('\n❌ User not found in Firebase Auth');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAdmins();
