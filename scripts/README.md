# 🔧 Firebase Collections Initialization Script

## 📝 الوصف

هذا السكريبت ينشئ تلقائياً جميع الـ Collections المطلوبة لنظام الإشعارات المزدوج في Firebase Firestore.

## 📦 Collections التي سيتم إنشاؤها:

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
