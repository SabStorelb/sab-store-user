# إعداد إعادة تعيين كلمة المرور - Password Reset Setup

## المشكلة - The Problem
عند الاختبار محلياً، روابط إعادة تعيين كلمة المرور من Firebase تشير إلى النطاق المنشور (admin.sab-store.com) بدلاً من localhost.

When testing locally, Firebase password reset links point to the production domain (admin.sab-store.com) instead of localhost.

## الحل - The Solution

### 1. إعدادات Firebase Console

يجب إضافة localhost إلى قائمة النطاقات المصرح بها في Firebase:

1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. اختر مشروعك
3. اذهب إلى **Authentication** > **Settings** > **Authorized domains**
4. أضف النطاقات التالية:
   - `localhost`
   - `127.0.0.1`
   - `admin.sab-store.com` (موجود بالفعل)

### 2. الكود المحدث

تم تحديث `src/pages/admin/login.tsx` لاستخدام `actionCodeSettings`:

```typescript
const baseUrl = window.location.origin; // http://localhost:3000 أو https://admin.sab-store.com

const actionCodeSettings = {
  url: `${baseUrl}/__/auth/action`,
  handleCodeInApp: true,
};

await sendPasswordResetEmail(firebaseAuth, resetEmail, actionCodeSettings);
```

### 3. مسار المعالجة

الرابط في الإيميل سيوجه إلى:
- محلياً: `http://localhost:3000/__/auth/action?mode=resetPassword&oobCode=...`
- إنتاج: `https://admin.sab-store.com/__/auth/action?mode=resetPassword&oobCode=...`

ثم `src/pages/__/auth/action.tsx` سيوجه إلى `src/pages/admin/reset-password.tsx`

## اختبار الميزة - Testing

### محلياً - Locally:
1. شغل السيرفر المحلي:
   ```bash
   npm run dev
   ```

2. اذهب إلى `http://localhost:3000/admin/login`

3. اضغط على "نسيت كلمة المرور؟"

4. أدخل إيميل المسؤول

5. ستستلم إيميل مع رابط يشير إلى `http://localhost:3000/__/auth/action`

6. اضغط على الرابط لإعادة تعيين كلمة المرور

### الإنتاج - Production:
نفس الخطوات، لكن الرابط سيشير تلقائياً إلى `https://admin.sab-store.com`

## ملاحظات مهمة - Important Notes

1. **الأمان**: روابط إعادة التعيين صالحة لمدة ساعة واحدة فقط
2. **التحقق**: يتم التحقق من صلاحية الرابط قبل عرض نموذج إعادة التعيين
3. **البيئة**: الكود يكتشف تلقائياً البيئة (محلي أو إنتاج) ويستخدم الرابط المناسب
4. **Firebase**: تأكد من إضافة localhost في Firebase Console Authorized Domains

## استكشاف الأخطاء - Troubleshooting

### خطأ 404 عند فتح الرابط
- تأكد من أن السيرفر المحلي يعمل (`npm run dev`)
- تأكد من أن localhost مضاف في Firebase Authorized Domains

### "رابط منتهي الصلاحية"
- الروابط صالحة لمدة ساعة فقط
- اطلب رابط جديد

### "خطأ في الإعدادات - Configuration error"
- تأكد من أن جميع متغيرات Firebase في `.env.local` صحيحة
- تأكد من أن localhost في Authorized Domains

## الملفات المتأثرة - Affected Files

1. `src/pages/admin/login.tsx` - صفحة تسجيل الدخول مع زر "نسيت كلمة المرور"
2. `src/pages/__/auth/action.tsx` - معالج روابط Firebase
3. `src/pages/admin/reset-password.tsx` - صفحة إعادة تعيين كلمة المرور
