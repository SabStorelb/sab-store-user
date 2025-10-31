# 🔧 Firebase Scripts - سكريبتات Firebase

## 📝 الوصف العام

مجموعة من السكريبتات المساعدة لإدارة Firebase والنظام.

---

## 1️⃣ إنشاء Collections (initFirebaseCollections.js)

### 📝 الوصف

هذا السكريبت ينشئ تلقائياً جميع الـ Collections المطلوبة لنظام الإشعارات المزدوج في Firebase Firestore.

### 📦 Collections التي سيتم إنشاؤها:

1. **`userNotifications`** - إشعارات العملاء
2. **`notifications`** - إشعارات الأدمن (التحقق من وجودها)
3. **`activityLog`** - سجل الأنشطة

## 🚀 كيفية الاستخدام

### الطريقة 1: باستخدام npm (الأسهل)

```bash
npm run init:firebase
```

### الطريقة 2: تشغيل مباشر

```bash
node scripts/initFirebaseCollections.js
```

## ⚙️ المتطلبات

1. ✅ ملف `.env.local` يحتوي على بيانات Firebase
2. ✅ حزمة `dotenv` مثبتة (يتم تثبيتها تلقائياً)
3. ✅ حزمة `firebase` مثبتة (موجودة في المشروع)

## 📋 ما يفعله السكريبت

1. يقرأ بيانات Firebase من `.env.local`
2. يتصل بـ Firestore
3. ينشئ مستند تجريبي في كل collection:
   - `userNotifications`: إشعار ترحيبي تجريبي
   - `notifications`: إشعار نظام للأدمن
   - `activityLog`: سجل تهيئة النظام

## ✅ بعد التشغيل

1. افتح Firebase Console
2. تحقق من وجود الـ Collections الجديدة
3. احذف المستندات التجريبية إذا أردت
4. جاهز للاستخدام! ✨

## 🔐 ملاحظة أمنية

تأكد من تحديث قواعد Firestore في Firebase Console باستخدام الملف `firestore.rules`!

## 📖 للمزيد

راجع الدليل الشامل في `DUAL_NOTIFICATIONS_GUIDE.md`

---

## 2️⃣ اختبار إعادة تعيين كلمة المرور (testPasswordReset.js)

### 📝 الوصف

سكريبت لاختبار وظيفة إعادة تعيين كلمة المرور وتوليد روابط محلية.

### 🚀 كيفية الاستخدام

```bash
node scripts/testPasswordReset.js <admin-email>
```

### 📋 مثال

```bash
node scripts/testPasswordReset.js admin@sabstore.com
```

### ✅ ما يفعله السكريبت

1. يتحقق من وجود المستخدم في Firebase
2. يولد رابط إعادة تعيين كلمة المرور
3. يعرض الرابط المحلي للاختبار
4. يستخرج OOB Code للتحقق

### 💡 ملاحظات

- الرابط المولد يشير إلى `localhost:3000`
- مناسب للاختبار المحلي
- تأكد من إضافة `localhost` في Firebase Authorized Domains

### 📖 للمزيد

راجع `PASSWORD_RESET_SETUP.md` لمزيد من التفاصيل حول إعداد إعادة تعيين كلمة المرور.

---

## 🔐 ملاحظات أمنية

- جميع السكريبتات تستخدم `.env.local` لبيانات Firebase
- لا تشارك ملف `.env.local` أبداً
- تأكد من تحديث قواعد Firestore في Firebase Console