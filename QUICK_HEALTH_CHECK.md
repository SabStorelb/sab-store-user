# 🎯 دليل الفحص السريع (Quick Health Check)

استخدم هذا الدليل لفحص صحة التطبيق بسرعة.

---

## ✅ الفحص اليومي (5 دقائق)

### 1. التحقق من Firebase Connection
```bash
node scripts/checkAdmins.js
```
**✅ النتيجة المتوقعة:** عرض قائمة المسؤولين

---

### 2. التحقق من Storage
```bash
gsutil ls gs://sab-store-9b947.firebasestorage.app
```
**✅ النتيجة المتوقعة:** عرض المجلدات (banners/, products/, etc.)

---

### 3. اختبار رفع صورة
1. افتح: `http://localhost:3000/admin/banners/new`
2. حاول رفع صورة اختبار
3. **✅ النتيجة المتوقعة:** نجاح الرفع

---

### 4. التحقق من .env.local
```bash
Get-Content .env.local | Select-String "STORAGE"
```
**✅ يجب أن يكون:**
```
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sab-store-9b947.firebasestorage.app
FIREBASE_STORAGE_BUCKET=sab-store-9b947.firebasestorage.app
```

---

## 🚨 عند ظهور مشكلة

### خطوة 1: أعد نشر Rules
```bash
firebase deploy --only storage
```

### خطوة 2: أعد تطبيق CORS
```bash
gsutil cors set cors.json gs://sab-store-9b947.firebasestorage.app
```

### خطوة 3: أعد تشغيل السيرفر
```bash
npm run dev
```

---

## 📊 مؤشرات الصحة

| المؤشر | الحالة الجيدة | الحالة السيئة |
|--------|---------------|----------------|
| رفع الصور | ✅ يعمل في أقل من 5 ثواني | ❌ يفشل أو يأخذ أكثر من 10 ثواني |
| تسجيل الدخول | ✅ فوري | ❌ بطيء أو يفشل |
| Storage Quota | ✅ أقل من 80% | ⚠️ أكثر من 80% |
| عدد الأخطاء | ✅ صفر | ❌ أكثر من 5 في اليوم |

---

## 🔍 أسئلة التشخيص

عند حدوث مشكلة، اسأل نفسك:

1. ❓ **متى بدأت المشكلة؟**
   - بعد تحديث معين؟
   - فجأة؟
   - تدريجياً؟

2. ❓ **هل تحدث دائماً؟**
   - نعم → مشكلة في الإعدادات
   - أحياناً → مشكلة في الشبكة

3. ❓ **هل تحدث لجميع المستخدمين؟**
   - نعم → مشكلة في السيرفر
   - لا → مشكلة في الصلاحيات

4. ❓ **ما هي رسالة الخطأ؟**
   - راجع [دليل حل المشاكل](TROUBLESHOOTING_GUIDE.md)

---

## 📞 جهات الاتصال السريعة

- **Firebase Console:** https://console.firebase.google.com/project/sab-store-9b947
- **Storage Dashboard:** https://console.firebase.google.com/project/sab-store-9b947/storage
- **Admin Panel:** http://localhost:3000/admin

---

**آخر تحديث:** 1 نوفمبر 2025
