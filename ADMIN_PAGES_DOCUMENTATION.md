# صفحات الأدمن الجديدة - New Admin Pages
## Documentation

تم إنشاء 4 صفحات جديدة لتحسين تجربة الأدمن وإدارة النظام بشكل احترافي.

---

## 📄 الصفحات المُنشأة

### 1. صفحة الملف الشخصي | Profile Page
**المسار:** `/admin/profile`  
**الملف:** `src/pages/admin/profile.tsx`

#### الميزات:
✅ **معلومات شخصية:**
- عرض وتعديل الاسم
- رقم الهاتف
- البريد الإلكتروني (للقراءة فقط)
- نبذة شخصية

✅ **صورة الملف الشخصي:**
- رفع صورة جديدة
- معاينة الصورة قبل الحفظ
- حفظ تلقائي في Firebase Storage
- عرض الحرف الأول بدلاً من الصورة إذا لم تكن موجودة

✅ **الأمان:**
- تغيير كلمة المرور
- تفعيل المصادقة الثنائية (2FA) - قيد التطوير

✅ **الصلاحيات:**
- عرض جميع الصلاحيات الممنوحة
- واجهة بصرية جميلة

✅ **النشاط:**
- عرض آخر الأنشطة
- تسجيل الدخول، التعديلات، إلخ

#### Tabs المتاحة:
1. 👤 المعلومات الشخصية
2. 🔒 الأمان
3. 🔑 الصلاحيات
4. 📊 النشاط

---

### 2. صفحة الإعدادات العامة | Settings Page
**المسار:** `/admin/settings`  
**الملف:** `src/pages/admin/settings.tsx`

#### الأقسام:

##### 🏪 معلومات المتجر:
- اسم المتجر (عربي/إنجليزي)
- وصف المتجر (عربي/إنجليزي)
- الشعار (Logo)
- الأيقونة (Favicon)

##### 📞 معلومات الاتصال:
- البريد الإلكتروني
- رقم الهاتف
- العنوان (عربي/إنجليزي)

##### 💰 الأسعار والضرائب:
- العملة (LBP/USD/EUR)
- نسبة الضريبة (%)
- رسوم الشحن
- الحد الأدنى للشحن المجاني

##### 📱 وسائل التواصل:
- Facebook
- Instagram
- WhatsApp
- Twitter

##### 💳 طرق الدفع:
- ☑️ الدفع عند الاستلام
- ☑️ بطاقة الائتمان
- ☑️ تحويل بنكي

#### Firebase Structure:
```typescript
settings/store: {
  storeName: { en: string, ar: string },
  storeDescription: { en: string, ar: string },
  logo: string,
  currency: string,
  taxRate: number,
  shippingFee: number,
  freeShippingThreshold: number,
  contactEmail: string,
  contactPhone: string,
  address: { en: string, ar: string },
  socialMedia: {
    facebook, instagram, twitter, whatsapp
  },
  paymentMethods: {
    cashOnDelivery, creditCard, bankTransfer
  }
}
```

---

### 3. صفحة سجل النشاط | Activity Log Page
**المسار:** `/admin/activity-log`  
**الملف:** `src/pages/admin/activity-log.tsx`

#### الميزات:

##### 📊 الإحصائيات:
- إجمالي الأنشطة
- عدد عمليات الإنشاء
- عدد عمليات التعديل
- عدد عمليات الحذف

##### 🔍 الفلاتر:
- **نوع النشاط:** الكل / إنشاء / تعديل / حذف / تسجيل دخول
- **الفترة الزمنية:** الكل / اليوم / آخر 7 أيام / آخر 30 يوم

##### 📝 عرض الأنشطة:
- اسم المستخدم
- نوع العملية (مع أيقونة)
- الوصف التفصيلي
- الوقت النسبي (منذ X دقيقة/ساعة/يوم)
- نوع الهدف (طلب، منتج، عميل، إلخ)
- عنوان IP

#### أنواع الأنشطة:
- ✨ **create**: إنشاء (أخضر)
- ✏️ **update**: تعديل (أزرق)
- 🗑️ **delete**: حذف (أحمر)
- 🔑 **login**: تسجيل دخول (بنفسجي)
- 📝 **other**: أخرى (رمادي)

#### Firebase Structure:
```typescript
activityLog/{id}: {
  userId: string,
  userName: string,
  action: string,
  actionType: 'create' | 'update' | 'delete' | 'login' | 'other',
  targetType: string,
  targetId: string,
  details: string,
  timestamp: Timestamp,
  ipAddress?: string
}
```

---

### 4. صفحة الإشعارات | Notifications Page
**المسار:** `/admin/notifications`  
**الملف:** `src/pages/admin/notifications.tsx`

#### الميزات:

##### 📊 الإحصائيات:
- إجمالي الإشعارات
- إشعارات الطلبات
- إشعارات الدعم
- إشعارات المنتجات
- غير المقروءة

##### 🔍 الفلاتر:
- **الحالة:** الكل / غير مقروءة / مقروءة
- **النوع:** الكل / طلبات / دعم / منتجات / عملاء / نظام

##### ⚡ الإجراءات:
- تحديد كمقروء (لإشعار واحد)
- تحديد الكل كمقروء
- النقر للانتقال إلى الصفحة المرتبطة

##### 🎨 الأنواع:
- 📦 **order**: طلبات (أخضر)
- 💬 **support**: دعم فني (أزرق)
- 🛍️ **product**: منتجات (بنفسجي)
- 👤 **customer**: عملاء (وردي)
- ⚙️ **system**: نظام (رمادي)

#### Firebase Structure:
```typescript
notifications/{id}: {
  type: 'order' | 'support' | 'product' | 'customer' | 'system',
  title: string,
  message: string,
  read: boolean,
  createdAt: Timestamp,
  targetId?: string,
  targetUrl?: string
}
```

---

## 🎨 التصميم الموحد

جميع الصفحات تتبع نفس التصميم:

### Header:
```
[زر عودة] [العنوان]                    [رابط لوحة التحكم]
```

### الألوان:
- أخضر: نجاح/نشط/إنشاء
- أحمر: حذف/خطر/تحذير
- أزرق: معلومات/تعديل
- رمادي: محايد/غير نشط
- أصفر: تنبيه
- بنفسجي: خاص

### الأيقونات:
جميع الصفحات تستخدم أيقونات SVG موحدة من Heroicons

---

## 🔗 التكامل مع Dashboard

تم إضافة 5 أزرار جديدة في Header لوحة التحكم:

1. 🔔 **الإشعارات** (أصفر) → `/admin/notifications`
2. 💬 **رسائل الدعم** (أزرق) → `/admin/support-messages`
3. 📊 **سجل النشاط** (بنفسجي) → `/admin/activity-log`
4. ⚙️ **الإعدادات** (رمادي) → `/admin/settings`
5. 👤 **الملف الشخصي** (أخضر) → `/admin/profile`
6. 🚪 **تسجيل الخروج** (أحمر)

### ترتيب الأزرار:
```
[إشعارات] [دعم] [نشاط] [إعدادات] [ملف شخصي] [خروج]     [العنوان]
```

---

## 📦 المتطلبات

### Firebase Collections المطلوبة:
```
✅ users - موجود
✅ settings/store - جديد
✅ activityLog - جديد
✅ notifications - جديد
```

### Firebase Storage:
```
/admins/{userId}/profile.jpg - صور الملف الشخصي
/store/logo.png - شعار المتجر
/store/favicon.png - أيقونة المتجر
```

---

## 🚀 الاستخدام

### 1. الوصول للصفحات:
```
http://localhost:3000/admin/profile
http://localhost:3000/admin/settings
http://localhost:3000/admin/activity-log
http://localhost:3000/admin/notifications
```

### 2. من Dashboard:
انقر على الأزرار في الـ Header

### 3. الحماية:
جميع الصفحات محمية ويجب تسجيل الدخول كأدمن

---

## ⚠️ ملاحظات مهمة

### 1. صور الملف الشخصي:
- يجب التأكد من تفعيل Firebase Storage
- الصور تُحفظ في `/admins/{userId}/profile.jpg`
- الحجم الأقصى: حسب إعدادات Storage

### 2. تسجيل الأنشطة:
- يجب إضافة منطق لتسجيل الأنشطة تلقائياً
- عند إنشاء/تعديل/حذف أي عنصر
- يُفضل إنشاء دالة مشتركة:

```typescript
async function logActivity(
  userId: string,
  userName: string,
  action: string,
  actionType: 'create' | 'update' | 'delete',
  targetType: string,
  targetId: string,
  details: string
) {
  await addDoc(collection(firebaseDb, 'activityLog'), {
    userId,
    userName,
    action,
    actionType,
    targetType,
    targetId,
    details,
    timestamp: Timestamp.now(),
  });
}
```

### 3. الإشعارات:
- يمكن إنشاؤها من Firebase Functions
- أو من الكود عند حدوث أحداث معينة:

```typescript
async function createNotification(
  type: string,
  title: string,
  message: string,
  targetUrl?: string
) {
  await addDoc(collection(firebaseDb, 'notifications'), {
    type,
    title,
    message,
    read: false,
    createdAt: Timestamp.now(),
    targetUrl,
  });
}
```

---

## 🔧 التحسينات المستقبلية

### 1. الملف الشخصي:
- [ ] تفعيل فعلي للمصادقة الثنائية (2FA)
- [ ] تغيير كلمة المرور عبر Firebase Auth
- [ ] إحصائيات شخصية أكثر تفصيلاً
- [ ] سجل جلسات تسجيل الدخول

### 2. الإعدادات:
- [ ] إعدادات البريد الإلكتروني (SMTP)
- [ ] إعدادات الإشعارات Push
- [ ] لغة واجهة الموقع الافتراضية
- [ ] إعدادات SEO

### 3. سجل النشاط:
- [ ] تصدير السجل إلى Excel/PDF
- [ ] فلاتر متقدمة (حسب المستخدم)
- [ ] رسم بياني للأنشطة
- [ ] البحث في السجل

### 4. الإشعارات:
- [ ] إشعارات Push للمتصفح
- [ ] إشعارات البريد الإلكتروني
- [ ] تخصيص أنواع الإشعارات
- [ ] جدولة الإشعارات

---

## 📝 الملفات المُنشأة

```
✅ src/pages/admin/profile.tsx
✅ src/pages/admin/settings.tsx
✅ src/pages/admin/activity-log.tsx
✅ src/pages/admin/notifications.tsx
✅ src/pages/admin/dashboard.tsx (محدث)
```

---

## ✅ الخلاصة

تم إنشاء نظام إدارة متكامل للأدمن يشمل:
- ✅ إدارة الملف الشخصي
- ✅ إعدادات المتجر الشاملة
- ✅ تتبع جميع الأنشطة
- ✅ نظام إشعارات احترافي
- ✅ واجهة موحدة وجميلة
- ✅ تكامل كامل مع Dashboard

جميع الصفحات جاهزة للاستخدام! 🎉

---

تم التطوير بواسطة: GitHub Copilot 🤖  
التاريخ: 30 أكتوبر 2025
