# ✅ Firebase Console Setup Checklist

## خطوات إعداد Firebase للاختبار المحلي
## Firebase Console Setup for Local Testing

---

## 📋 الخطوات المطلوبة - Required Steps

### 1️⃣ إضافة Localhost إلى Authorized Domains

1. افتح [Firebase Console](https://console.firebase.google.com)
2. اختر مشروعك
3. من القائمة الجانبية، اختر **Authentication**
4. اذهب إلى تبويب **Settings**
5. اضغط على **Authorized domains**
6. اضغط **Add domain**
7. أضف النطاقات التالية (إذا لم تكن موجودة):
   - ✅ `localhost`
   - ✅ `127.0.0.1`
8. احفظ التغييرات

### 2️⃣ التحقق من قالب الإيميل (اختياري)

يمكنك تخصيص رسالة إعادة تعيين كلمة المرور:

1. في **Authentication** > **Templates**
2. اختر **Password reset**
3. خصص الرسالة (اختياري)
4. **مهم**: لا تغير متغيرات `%LINK%` أو `%APP_NAME%`

---

## 🔍 التحقق من الإعدادات - Verify Settings

### اختبار محلي - Local Testing

بعد إضافة localhost، جرب:

```bash
# شغل السيرفر المحلي
npm run dev

# في نافذة أخرى، اختبر إعادة التعيين
node scripts/testPasswordReset.js your-admin@email.com
```

### ما المتوقع - Expected Results

1. ستحصل على رابط مثل:
   ```
   http://localhost:3000/__/auth/action?mode=resetPassword&oobCode=...
   ```

2. عند فتح الرابط:
   - ✅ يجب أن يعمل بدون خطأ 404
   - ✅ يتم التوجيه إلى `/admin/reset-password`
   - ✅ تظهر نموذج إعادة تعيين كلمة المرور

---

## ❌ استكشاف الأخطاء - Troubleshooting

### خطأ: "unauthorized-continue-uri"

**السبب**: localhost غير موجود في Authorized Domains

**الحل**: أضف `localhost` كما في الخطوة 1 أعلاه

---

### خطأ 404 عند فتح الرابط

**الأسباب المحتملة**:
1. السيرفر المحلي لا يعمل
2. الرابط يشير إلى النطاق الخطأ

**الحل**:
```bash
# تأكد من أن السيرفر يعمل
npm run dev

# تحقق من أن الرابط يشير إلى localhost:3000
```

---

### رسالة "رابط منتهي الصلاحية"

**السبب**: روابط Firebase تنتهي بعد ساعة واحدة

**الحل**: اطلب رابط جديد من صفحة تسجيل الدخول

---

## 🎯 الخطوات التالية - Next Steps

بعد إتمام الإعداد:

1. ✅ اختبر إعادة تعيين كلمة المرور محلياً
2. ✅ اختبرها في الإنتاج أيضاً
3. ✅ تأكد من أن الإيميلات تصل
4. ✅ تحقق من أن الروابط تعمل في كلا البيئتين

---

## 📚 المراجع - References

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Password Reset Email](https://firebase.google.com/docs/auth/custom-email-handler)
- `PASSWORD_RESET_SETUP.md` - دليل شامل بالعربية

---

## ✅ Checklist Summary

- [ ] إضافة `localhost` إلى Authorized Domains
- [ ] إضافة `127.0.0.1` إلى Authorized Domains  
- [ ] تأكد من أن `.env.local` يحتوي على بيانات Firebase الصحيحة
- [ ] اختبر محلياً باستخدام `npm run dev`
- [ ] جرب إرسال إيميل إعادة تعيين
- [ ] تحقق من أن الرابط يعمل بدون 404
- [ ] اختبر إعادة تعيين كلمة المرور بالكامل
