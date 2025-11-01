# 🛠️ دليل حل المشاكل الشائعة
## Troubleshooting Guide - Sab Store

هذا الدليل يساعدك في حل المشاكل الشائعة التي قد تواجهها في المتجر.

---

## 📋 جدول المحتويات

1. [مشاكل رفع الصور](#مشاكل-رفع-الصور)
2. [مشاكل Firebase](#مشاكل-firebase)
3. [مشاكل الصلاحيات](#مشاكل-الصلاحيات)
4. [مشاكل CORS](#مشاكل-cors)
5. [الصيانة الوقائية](#الصيانة-الوقائية)

---

## 🖼️ مشاكل رفع الصور

### المشكلة: "حدث خطأ في رفع الصورة"

#### الأسباب المحتملة:
1. ❌ **مشكلة في إعدادات Storage**
2. ❌ **انقطاع الإنترنت**
3. ❌ **مشكلة صلاحيات**
4. ❌ **حجم الملف كبير**

#### الحلول:

**✅ الحل 1: التحقق من Storage Bucket**
```bash
# تحقق من اسم Bucket في .env.local
Get-Content .env.local | Select-String "STORAGE"

# يجب أن يكون:
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sab-store-9b947.firebasestorage.app
```

**✅ الحل 2: إعادة نشر Storage Rules**
```bash
firebase deploy --only storage
```

**✅ الحل 3: تطبيق CORS**
```bash
gsutil cors set cors.json gs://sab-store-9b947.firebasestorage.app
```

**✅ الحل 4: التحقق من حجم الملف**
- الحد الأقصى: **5 ميجابايت**
- أنواع مدعومة: PNG, JPG, JPEG, WebP

---

## 🔥 مشاكل Firebase

### المشكلة: "storage/unauthorized"

#### السبب:
المستخدم ليس لديه صلاحية Admin في Firebase

#### الحل:
```bash
# التحقق من قائمة المسؤولين
node scripts/checkAdmins.js

# إضافة مسؤول جديد
node scripts/makeSuperAdmin.js
```

### المشكلة: "storage/bucket-not-found"

#### السبب:
اسم Storage Bucket غير صحيح

#### الحل:
```bash
# عرض جميع Buckets المتاحة
gsutil ls

# تحديث ملف .env.local بالاسم الصحيح
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sab-store-9b947.firebasestorage.app
```

---

## 🔐 مشاكل الصلاحيات

### المشكلة: لا يمكن رفع الصور رغم أني مسؤول

#### الحل:

**1. التحقق من Firestore Rules:**
```bash
firebase deploy --only firestore:rules
```

**2. التحقق من Storage Rules:**
```bash
firebase deploy --only storage
```

**3. التأكد من أن المستخدم admin:**
```javascript
// في Console المتصفح
console.log(await getDoc(doc(firebaseDb, 'users', firebaseAuth.currentUser.uid)))
// يجب أن يحتوي على: isAdmin: true
```

---

## 🌐 مشاكل CORS

### المشكلة: "blocked by CORS policy"

#### السبب:
Firebase Storage لا يسمح بالطلبات من localhost

#### الحل الدائم:

**1. إنشاء ملف cors.json (إذا لم يكن موجوداً):**
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["*"]
  }
]
```

**2. تطبيق CORS:**
```bash
gsutil cors set cors.json gs://sab-store-9b947.firebasestorage.app
```

**3. التحقق من CORS:**
```bash
gsutil cors get gs://sab-store-9b947.firebasestorage.app
```

---

## 🛡️ الصيانة الوقائية

### ✅ فحوصات أسبوعية

#### 1. التحقق من Storage Rules
```bash
firebase deploy --only storage --dry-run
```

#### 2. مراقبة حجم التخزين
- افتح [Firebase Console](https://console.firebase.google.com)
- اذهب إلى Storage
- راقب المساحة المستخدمة

#### 3. التحقق من Logs
```bash
# عرض آخر 50 سطر من logs
firebase functions:log
```

---

## 🔧 أوامر مفيدة

### Firebase

```bash
# تسجيل الدخول
firebase login

# عرض المشاريع
firebase projects:list

# اختيار مشروع
firebase use sab-store-9b947

# نشر كل شيء
firebase deploy

# نشر Storage فقط
firebase deploy --only storage

# نشر Firestore Rules فقط
firebase deploy --only firestore:rules
```

### Storage (gsutil)

```bash
# عرض جميع Buckets
gsutil ls

# عرض محتويات Bucket
gsutil ls gs://sab-store-9b947.firebasestorage.app

# تطبيق CORS
gsutil cors set cors.json gs://sab-store-9b947.firebasestorage.app

# عرض إعدادات CORS
gsutil cors get gs://sab-store-9b947.firebasestorage.app

# حذف ملف
gsutil rm gs://sab-store-9b947.firebasestorage.app/path/to/file
```

---

## 📊 مراقبة الأخطاء

### استخدام النظام الجديد

النظام الآن يتضمن:

1. **معالج أخطاء ذكي** (`src/lib/errorHandler.ts`)
   - يعطي رسائل واضحة للمستخدم
   - يسجل التفاصيل التقنية للمطورين

2. **نظام رفع آمن** (`src/lib/safeUpload.ts`)
   - إعادة محاولة تلقائية (3 مرات)
   - فحص الاتصال قبل الرفع
   - التحقق من الصلاحيات
   - فحص حجم ونوع الملف

3. **رسائل واضحة**
   - يعرف المستخدم بالضبط ما المشكلة
   - يوجه المستخدم للحل

---

## 🆘 الحصول على مساعدة

### عند حدوث مشكلة:

1. **افتح Console المتصفح** (F12)
   - ابحث عن أخطاء حمراء
   - انسخ رسالة الخطأ

2. **تحقق من الـ Network Tab**
   - هل هناك طلبات فاشلة؟
   - ما هو status code؟

3. **راجع Firebase Console**
   - [Storage](https://console.firebase.google.com/project/sab-store-9b947/storage)
   - [Firestore](https://console.firebase.google.com/project/sab-store-9b947/firestore)

4. **راجع هذا الدليل** للحلول

---

## 📝 ملاحظات مهمة

### ⚠️ تحذيرات

1. **لا تعدل Storage Rules** بدون اختبار
2. **احتفظ بنسخة احتياطية** من `.env.local`
3. **لا تشارك مفاتيح API** علناً
4. **راقب حجم Storage** لتجنب تجاوز الحصة

### ✅ أفضل الممارسات

1. ✅ استخدم `safeUploadFile` بدلاً من `uploadBytes`
2. ✅ دائماً افحص نتيجة الرفع
3. ✅ اعرض رسائل خطأ واضحة للمستخدم
4. ✅ سجل الأخطاء للمراجعة لاحقاً

---

## 🔄 التحديثات

### الإصدار 2.0 (1 نوفمبر 2025)
- ✅ إضافة نظام معالجة أخطاء شامل
- ✅ إضافة نظام رفع آمن مع إعادة محاولة
- ✅ إصلاح مشكلة CORS
- ✅ تحديث Storage Bucket URL
- ✅ تحسين Storage Rules

---

## 📞 الدعم الفني

للمساعدة الإضافية:
- 📧 البريد: support@sabstore.com
- 💬 Telegram: @sabstore_support
- 🌐 الموقع: https://admin.sab-store.com

---

**آخر تحديث:** 1 نوفمبر 2025  
**الإصدار:** 2.0.0
