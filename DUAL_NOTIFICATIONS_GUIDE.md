# 📱 دليل نظام الإشعارات المزدوج
# Dual Notifications System Guide

## 🎯 نظرة عامة

تم إنشاء نظامين منفصلين للإشعارات:

### 1️⃣ إشعارات الأدمن (Admin Notifications)
- **الملف**: `src/lib/notifications.ts`
- **المجموعة في Firebase**: `notifications`
- **الهدف**: إخبار الأدمن بأحداث مهمة
- **الصفحة**: `/admin/notifications`

### 2️⃣ إشعارات العملاء (User Notifications)
- **الملف**: `src/lib/userNotifications.ts`
- **المجموعة في Firebase**: `userNotifications`
- **الهدف**: إخبار العملاء بتحديثات طلباتهم
- **الصفحة**: `/notifications`

### 3️⃣ النظام المزدوج (Dual System)
- **الملف**: `src/lib/dualNotifications.ts`
- **الهدف**: دوال تجمع بين النظامين

---

## 📦 هيكل البيانات

### إشعار الأدمن (notifications collection):
```typescript
{
  type: 'order' | 'support' | 'product' | 'customer' | 'system',
  title: string,
  message: string,
  read: boolean,
  createdAt: Timestamp,
  targetUrl?: string,
  targetId?: string
}
```

### إشعار العميل (userNotifications collection):
```typescript
{
  userId: string,  // معرف العميل
  type: 'order_confirmed' | 'order_processing' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'special_offer' | 'price_drop' | 'back_in_stock' | 'welcome' | 'general',
  title: string,
  message: string,
  read: boolean,
  createdAt: Timestamp,
  targetUrl?: string,
  targetId?: string,
  metadata?: any
}
```

---

## 🚀 كيفية الاستخدام

### مثال 1: عند إنشاء طلب جديد

```typescript
import { notifyNewOrderDual } from '@/lib/dualNotifications';

// في صفحة الـ Checkout عند نجاح الطلب
async function handleCheckout() {
  const order = await createOrder(orderData);
  
  // إرسال إشعار للأدمن + إشعار تأكيد للعميل
  await notifyNewOrderDual(
    userId,           // معرف العميل
    order.id,         // معرف الطلب
    order.number,     // رقم الطلب
    customerName,     // اسم العميل
    totalAmount       // المبلغ الإجمالي
  );
}
```

**النتيجة:**
- ✅ إشعار للأدمن: "طلب جديد #12345 من أحمد محمد بقيمة 450 ريال"
- ✅ إشعار للعميل: "تم تأكيد طلبك رقم #12345 بقيمة 450 ريال"

---

### مثال 2: عند تحديث حالة الطلب (من لوحة الأدمن)

```typescript
import { updateOrderStatus } from '@/lib/dualNotifications';

// في صفحة /admin/orders/[id]
async function updateStatus(newStatus) {
  await updateOrderInFirebase(orderId, newStatus);
  
  // إرسال الإشعارات المناسبة حسب الحالة
  await updateOrderStatus(
    userId,
    orderId,
    orderNumber,
    newStatus,  // 'processing' | 'shipped' | 'delivered' | 'cancelled'
    {
      trackingNumber: '123456',  // للشحن
      cancelReason: 'نفاذ المخزون'  // للإلغاء
    }
  );
}
```

**النتيجة حسب الحالة:**
- `processing` → إشعار للعميل فقط: "جاري تجهيز طلبك"
- `shipped` → إشعار للعميل فقط: "تم شحن طلبك. رقم التتبع: 123456"
- `delivered` → إشعار للعميل + إشعار للأدمن
- `cancelled` → إشعار للعميل + إشعار للأدمن

---

### مثال 3: عند تسجيل عميل جديد

```typescript
import { notifyNewCustomerDual } from '@/lib/dualNotifications';

// في صفحة التسجيل
async function handleSignup(userData) {
  const user = await createUserInFirebase(userData);
  
  // إرسال ترحيب للعميل + إشعار للأدمن
  await notifyNewCustomerDual(
    user.uid,
    userData.name,
    userData.email
  );
}
```

**النتيجة:**
- ✅ إشعار للعميل: "🎉 مرحباً أحمد! نحن سعداء بانضمامك إلينا"
- ✅ إشعار للأدمن: "عميل جديد: أحمد محمد"

---

### مثال 4: إشعار للعميل فقط (عرض خاص)

```typescript
import { notifyUserSpecialOffer } from '@/lib/userNotifications';

// إرسال عرض خاص لعميل معين
await notifyUserSpecialOffer(
  userId,
  'خصم 50% على جميع المنتجات',
  'احتفالاً بانضمامك، احصل على خصم 50% على أول طلب',
  '/products'
);
```

---

### مثال 5: إشعار للأدمن فقط (مخزون منخفض)

```typescript
import { notifyLowStock } from '@/lib/notifications';

// التحقق من المخزون وإرسال تنبيه
if (product.stock < 5) {
  await notifyLowStock(
    product.id,
    product.name,
    product.stock
  );
}
```

---

## 📊 جدول مقارنة

| الحدث | إشعار للأدمن | إشعار للعميل |
|------|------------|-------------|
| طلب جديد | ✅ | ✅ |
| تجهيز الطلب | ❌ | ✅ |
| شحن الطلب | ❌ | ✅ |
| توصيل الطلب | ✅ | ✅ |
| إلغاء الطلب | ✅ | ✅ |
| عميل جديد | ✅ | ✅ (ترحيب) |
| رسالة دعم | ✅ | ❌ |
| مخزون منخفض | ✅ | ❌ |
| عرض خاص | ❌ | ✅ |
| انخفاض سعر | ❌ | ✅ |

---

## 🔐 قواعد Firebase (Firestore Rules)

### قواعد إشعارات الأدمن:
```javascript
match /notifications/{notificationId} {
  // الأدمن فقط يمكنهم القراءة والكتابة
  allow read, write: if request.auth != null && 
    exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true;
  
  // السماح بالإنشاء للنظام
  allow create: if true;
}
```

### قواعد إشعارات العملاء:
```javascript
match /userNotifications/{notificationId} {
  // العملاء يقرأون إشعاراتهم فقط
  allow read: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  
  // العملاء يمكنهم تحديثها (لتحديد كمقروءة)
  allow update: if request.auth != null && 
    resource.data.userId == request.auth.uid &&
    request.resource.data.userId == resource.data.userId;
  
  // السماح بالإنشاء للنظام
  allow create: if true;
  
  // الأدمن يمكنه قراءة وكتابة جميع الإشعارات
  allow read, write: if request.auth != null && 
    exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true;
}
```

---

## 🛠️ الملفات المطلوبة

### ✅ تم إنشاؤها:

1. **src/lib/notifications.ts** - إشعارات الأدمن
2. **src/lib/userNotifications.ts** - إشعارات العملاء
3. **src/lib/dualNotifications.ts** - الدوال المزدوجة
4. **src/pages/admin/notifications.tsx** - صفحة إشعارات الأدمن
5. **src/pages/notifications.tsx** - صفحة إشعارات العميل
6. **firestore.rules** - القواعد المحدثة

### 📝 ما تحتاج إضافته:

1. **في صفحة Checkout/Order Creation:**
   ```typescript
   import { notifyNewOrderDual } from '@/lib/dualNotifications';
   
   await notifyNewOrderDual(userId, orderId, orderNumber, customerName, totalAmount);
   ```

2. **في صفحة Order Management (Admin):**
   ```typescript
   import { updateOrderStatus } from '@/lib/dualNotifications';
   
   await updateOrderStatus(userId, orderId, orderNumber, newStatus, metadata);
   ```

3. **في صفحة Sign Up:**
   ```typescript
   import { notifyNewCustomerDual } from '@/lib/dualNotifications';
   
   await notifyNewCustomerDual(userId, userName, userEmail);
   ```

---

## 🎨 واجهات المستخدم

### صفحة إشعارات الأدمن:
- **الرابط**: `/admin/notifications`
- **العداد**: في لوحة التحكم (زر أصفر 🔔)
- **الميزات**: 
  - فلتر (كل/غير مقروءة/نوع الإشعار)
  - إحصائيات
  - تحديد كمقروء
  - روابط سريعة للعناصر المرتبطة

### صفحة إشعارات العميل:
- **الرابط**: `/notifications`
- **الميزات**:
  - فلتر (كل/غير مقروءة)
  - عداد الإشعارات الجديدة
  - تحديد الكل كمقروء
  - ألوان مختلفة حسب نوع الإشعار
  - تحديث تلقائي (realtime)

---

## 📱 التحديثات التلقائية (Realtime)

كلا الصفحتين تستخدم `onSnapshot` لتحديث الإشعارات تلقائياً بدون إعادة تحميل الصفحة!

```typescript
// في لوحة التحكم
useEffect(() => {
  const q = query(
    collection(firebaseDb, 'notifications'),
    where('read', '==', false)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    setUnreadCount(snapshot.size);
    if (snapshot.size > prevCount.current) {
      playNotificationSound(); // صوت تنبيه
    }
  });
  
  return () => unsubscribe();
}, []);
```

---

## ✨ ميزات إضافية

### 1. Broadcast Notifications (للعملاء)
```typescript
import { notifyMultipleUsers } from '@/lib/userNotifications';

// إرسال إشعار لعدة عملاء
const userIds = ['user1', 'user2', 'user3'];
await notifyMultipleUsers(
  userIds,
  'special_offer',
  'تخفيضات الجمعة السوداء',
  'خصم 70% على جميع المنتجات',
  '/products'
);
```

### 2. إشعار عودة المخزون
```typescript
import { notifyUserBackInStock } from '@/lib/userNotifications';

await notifyUserBackInStock(
  userId,
  productId,
  'قميص أزرق - مقاس L'
);
```

### 3. إشعار انخفاض السعر
```typescript
import { notifyUserPriceDrop } from '@/lib/userNotifications';

await notifyUserPriceDrop(
  userId,
  productId,
  'ساعة ذكية',
  1200,  // السعر القديم
  899    // السعر الجديد
);
```

---

## 🔔 صوت التنبيه

يتم تشغيل صوت تنبيه تلقائياً في لوحة التحكم عند وصول إشعار جديد:

**الملف**: `public/sounds/notify.mp3`

```typescript
if (newNotificationsCount > prevCount) {
  const audio = new Audio('/sounds/notify.mp3');
  audio.play();
}
```

---

## 📋 الخطوات التالية

1. ✅ تحديث قواعد Firestore في Firebase Console
2. ✅ إنشاء collection جديد `userNotifications` في Firebase
3. ⏳ إضافة استدعاءات الدوال في صفحات الطلبات
4. ⏳ إضافة زر الإشعارات في navbar للعملاء
5. ⏳ اختبار النظام بالكامل

---

## 🎯 الخلاصة

الآن لديك نظام إشعارات مزدوج متكامل:

- **للأدمن**: متابعة جميع الأحداث المهمة في المتجر
- **للعملاء**: البقاء على اطلاع بتحديثات طلباتهم
- **مزدوج**: إرسال إشعارات للطرفين عند الحاجة

استخدم `dualNotifications.ts` للإرسال التلقائي للطرفين! ✨
