# 🎯 حل مشكلة رابط إعادة تعيين كلمة المرور
# Password Reset Link Fix - Quick Summary

---

## ❌ المشكلة - The Problem

عند الاختبار محلياً، رابط إعادة تعيين كلمة المرور من Firebase يشير إلى:
- ❌ `https://admin.sab-store.com/__/auth/action` (النطاق المنشور)

بدلاً من:
- ✅ `http://localhost:3000/__/auth/action` (السيرفر المحلي)

هذا يسبب خطأ 404 لأن localhost:3000 ليس admin.sab-store.com

---

## ✅ الحل - The Solution

### 1️⃣ تحديث الكود

تم تحديث `src/pages/admin/login.tsx` لإضافة `actionCodeSettings`:

```typescript
// الكود القديم - Old Code
await sendPasswordResetEmail(firebaseAuth, resetEmail);

// الكود الجديد - New Code
const baseUrl = window.location.origin; // يكتشف البيئة تلقائياً
const actionCodeSettings = {
  url: `${baseUrl}/__/auth/action`,
  handleCodeInApp: true,
};
await sendPasswordResetEmail(firebaseAuth, resetEmail, actionCodeSettings);
```

**الفائدة**: الآن Firebase يستخدم نفس النطاق الذي يعمل عليه المستخدم:
- محلياً: `http://localhost:3000`
- إنتاج: `https://admin.sab-store.com`

### 2️⃣ إعداد Firebase Console

⚠️ **مهم جداً**: يجب إضافة `localhost` إلى Authorized Domains

**الخطوات**:
1. افتح: https://console.firebase.google.com/project/sab-store-9b947/authentication/settings
2. اذهب إلى **Authorized domains**
3. اضغط **Add domain**
4. أضف: `localhost`
5. أضف: `127.0.0.1` (اختياري)
6. احفظ

---

## 🧪 الاختبار - Testing

### الطريقة 1: من خلال الواجهة

1. شغل السيرفر:
   ```bash
   npm run dev
   ```

2. افتح: http://localhost:3000/admin/login

3. اضغط "نسيت كلمة المرور؟"

4. أدخل إيميل المسؤول

5. افتح إيميلك واضغط على الرابط

6. يجب أن يعمل! ✅

### الطريقة 2: باستخدام السكريبت

```bash
# احصل على رابط تجريبي
node scripts/testPasswordReset.js your-admin@email.com
```

سيعطيك رابط مثل:
```
http://localhost:3000/__/auth/action?mode=resetPassword&oobCode=ABC123...
```

---

## 📋 قائمة التحقق - Checklist

قبل الاختبار، تأكد من:

- [ ] السيرفر يعمل (`npm run dev`)
- [ ] تم إضافة `localhost` في Firebase Authorized Domains
- [ ] ملف `.env.local` يحتوي على بيانات Firebase الصحيحة
- [ ] الإيميل المستخدم موجود في Firebase Authentication

---

## 🔍 استكشاف الأخطاء - Troubleshooting

| الخطأ | السبب | الحل |
|-------|-------|------|
| 404 | السيرفر المحلي لا يعمل | شغل `npm run dev` |
| "unauthorized-continue-uri" | localhost غير مضاف في Firebase | أضف localhost في Authorized Domains |
| "رابط منتهي" | الرابط انتهت صلاحيته (ساعة واحدة) | اطلب رابط جديد |
| لا يصل الإيميل | مشكلة في إعدادات Firebase | تحقق من Firebase Console > Authentication |

---

## 📁 الملفات المعدلة - Modified Files

1. ✅ `src/pages/admin/login.tsx` - إضافة actionCodeSettings
2. ✅ `scripts/testPasswordReset.js` - سكريبت اختبار جديد
3. ✅ `PASSWORD_RESET_SETUP.md` - دليل شامل
4. ✅ `FIREBASE_SETUP_CHECKLIST.md` - قائمة التحقق
5. ✅ `scripts/README.md` - تحديث التوثيق

---

## 🎉 الخلاصة - Summary

**قبل**:
- ❌ الروابط دائماً تشير للنطاق المنشور
- ❌ لا يمكن الاختبار محلياً
- ❌ خطأ 404 عند فتح الرابط

**بعد**:
- ✅ الروابط تشير للنطاق الصحيح (محلي أو إنتاج)
- ✅ يمكن الاختبار محلياً بسهولة
- ✅ يعمل في كلا البيئتين بدون مشاكل

---

## 📚 المراجع الإضافية - Additional References

- `PASSWORD_RESET_SETUP.md` - دليل تفصيلي
- `FIREBASE_SETUP_CHECKLIST.md` - خطوات الإعداد
- `scripts/README.md` - توثيق السكريبتات
