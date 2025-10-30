# 📧 تفعيل إرسال البريد الإلكتروني - دليل سريع

## ✅ تم بالفعل:
1. ✅ إنشاء API endpoint: `/api/send-email`
2. ✅ تثبيت nodemailer
3. ✅ إضافة الكود لإرسال الإيميلات

## ⚠️ المطلوب منك الآن:

### الخطوة 1️⃣: أنشئ ملف `.env.local`

في جذر المشروع، أنشئ ملف باسم `.env.local` والصق هذا المحتوى:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
SMTP_FROM=your-email@gmail.com
```

### الخطوة 2️⃣: احصل على App Password من Gmail

1. اذهب إلى: https://myaccount.google.com/security
2. فعّل **"التحقق بخطوتين"** (Two-Factor Authentication)
3. بعد التفعيل، ارجع لنفس الصفحة
4. ابحث عن **"كلمات مرور التطبيقات"** (App passwords)
5. اختر "تطبيق آخر" واكتب "SAB Store"
6. انسخ كلمة المرور المكونة من 16 حرف (مثل: `abcd efgh ijkl mnop`)
7. الصقها في `SMTP_PASS` في ملف `.env.local`

### الخطوة 3️⃣: أكمل الإعدادات

استبدل في ملف `.env.local`:
- `your-email@gmail.com` → بريدك الإلكتروني الحقيقي
- `your-app-password-here` → كلمة المرور من الخطوة 2

**مثال:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=sabstore@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=sabstore@gmail.com
```

### الخطوة 4️⃣: أعد تشغيل السيرفر

```bash
# أوقف السيرفر (Ctrl+C)
# ثم شغله من جديد
npm run dev
```

## 🎉 الآن جاهز!

بعد هذه الخطوات:
- ✅ سيتم إرسال بريد عند تحديث حالة الطلب
- ✅ سيتم إرسال بريد عند الرد على رسائل الدعم
- ✅ سيصل للعميل إشعار في التطبيق + بريد إلكتروني

## ❓ إذا واجهت مشاكل:

### "Invalid login credentials"
- تأكد من استخدام **App Password** وليس كلمة المرور العادية
- تأكد من تفعيل التحقق بخطوتين أولاً

### "Connection timeout"
- تأكد من الإنترنت
- قد يكون جدار الحماية يحجب المنفذ 587

### بدائل لـ Gmail:

#### SendGrid (مجاني 100 بريد/يوم):
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```
