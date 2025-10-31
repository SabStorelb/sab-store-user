/**
 * Test Password Reset Email Functionality
 * 
 * This script tests sending a password reset email locally
 * 
 * Usage:
 *   node scripts/testPasswordReset.js <admin-email>
 * 
 * Example:
 *   node scripts/testPasswordReset.js admin@sabstore.com
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();

async function testPasswordReset() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Please provide an email address');
    console.log('Usage: node scripts/testPasswordReset.js <admin-email>');
    process.exit(1);
  }

  console.log('\n🔍 Testing Password Reset for:', email);
  console.log('━'.repeat(50));

  try {
    // Check if user exists
    console.log('\n1️⃣ Checking if user exists...');
    const user = await auth.getUserByEmail(email);
    console.log('✅ User found:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      disabled: user.disabled,
    });

    // Generate password reset link
    console.log('\n2️⃣ Generating password reset link...');
    
    // For local testing, use localhost
    const actionCodeSettings = {
      url: 'http://localhost:3000/__/auth/action',
      handleCodeInApp: true,
    };

    const resetLink = await auth.generatePasswordResetLink(email, actionCodeSettings);
    
    console.log('✅ Password reset link generated successfully!');
    console.log('\n📧 Reset Link:');
    console.log(resetLink);
    
    // Extract oobCode from link
    const url = new URL(resetLink);
    const oobCode = url.searchParams.get('oobCode');
    console.log('\n🔑 OOB Code:', oobCode);

    console.log('\n━'.repeat(50));
    console.log('✅ Test completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Copy the reset link above');
    console.log('2. Open it in your browser');
    console.log('3. You should be redirected to the reset password page');
    console.log('4. Enter your new password');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('\n💡 Suggestion: Create an admin user first');
      console.log('   You can do this through the Firebase Console or your app');
    } else if (error.code === 'auth/invalid-email') {
      console.log('\n💡 Suggestion: Check the email format');
    }
    
    process.exit(1);
  }

  process.exit(0);
}

testPasswordReset();
