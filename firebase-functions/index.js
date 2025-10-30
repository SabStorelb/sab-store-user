const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

admin.initializeApp();

// إعداد بيانات التواصل للمدير
const ADMIN_EMAIL = 'ahmadkabot@gmail.com';
const ADMIN_WHATSAPP = '+966557507005';

// إعداد nodemailer (استخدم بيانات SMTP الخاصة بك)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: ADMIN_EMAIL,
    pass: 'YOUR_GMAIL_APP_PASSWORD' // استخدم كلمة مرور تطبيق Gmail وليس كلمة المرور العادية
  }
});

// إعداد Twilio (استخدم بيانات حسابك)
const TWILIO_ACCOUNT_SID = 'YOUR_TWILIO_SID';
const TWILIO_AUTH_TOKEN = 'YOUR_TWILIO_TOKEN';
const TWILIO_WHATSAPP_FROM = 'whatsapp:+YOUR_TWILIO_WHATSAPP_NUMBER';
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// إشعار عند وصول رسالة دعم جديدة
exports.notifyAdminOnSupportMessage = functions.firestore
  .document('supportMessages/{messageId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const subject = 'رسالة دعم جديدة من Sab Store';
    const text = `رسالة جديدة من: ${data.name}\nالبريد: ${data.email}\nالرسالة: ${data.message}`;

    // إرسال بريد إلكتروني
    await transporter.sendMail({
      from: ADMIN_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      text
    });

    // إرسال رسالة واتساب
    await client.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: 'whatsapp:' + ADMIN_WHATSAPP,
      body: text
    });
  });

// يمكنك تكرار نفس الكود للطلبات الجديدة والعملاء الجدد ونقص المخزون
// فقط غير اسم المجموعة وبيانات الرسالة
