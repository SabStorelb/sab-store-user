# كيفية إضافة الإشعارات التلقائية
## Automatic Notifications Guide

## 🎯 الهدف
عندما يقوم العميل بإنشاء طلب جديد، سيصل إشعار تلقائياً للأدمن في صفحة الإشعارات.

---

## 📦 مثال: إضافة إشعار عند إنشاء طلب

### في صفحة Checkout (عند إتمام الطلب):

```typescript
import { notifyNewOrder } from '../lib/notifications';

async function createOrder() {
  try {
    // 1. حفظ الطلب في Firebase
    const orderData = {
      orderNumber: generateOrderNumber(),
      customerName: customerName,
      customerEmail: customerEmail,
      items: cartItems,
      totalAmount: totalAmount,
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: Timestamp.now(),
    };

    const orderRef = await addDoc(collection(firebaseDb, 'orders'), orderData);

    // 2. ✅ إرسال إشعار للأدمن
    await notifyNewOrder(
      orderRef.id,                    // معرف الطلب
      orderData.orderNumber,          // رقم الطلب
      orderData.customerName,         // اسم العميل
      orderData.totalAmount           // المبلغ الإجمالي
    );

    alert('تم إنشاء الطلب بنجاح! ✅');
    router.push('/orders/success');

  } catch (error) {
    console.error('Error creating order:', error);
  }
}
```

---

## 💬 مثال: إضافة إشعار عند رسالة دعم جديدة

### في صفحة Contact/Support:

```typescript
import { notifyNewSupportMessage } from '../lib/notifications';

async function submitSupportMessage() {
  try {
    const messageData = {
      customerName: name,
      customerEmail: email,
      subject: subject,
      message: message,
      read: false,
      createdAt: Timestamp.now(),
    };

    const messageRef = await addDoc(
      collection(firebaseDb, 'supportMessages'), 
      messageData
    );

    // ✅ إرسال إشعار للأدمن
    await notifyNewSupportMessage(
      messageRef.id,
      messageData.customerName,
      messageData.subject
    );

    alert('تم إرسال رسالتك بنجاح!');
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## 👤 مثال: إضافة إشعار عند تسجيل عميل جديد

### في صفحة التسجيل (Sign Up):

```typescript
import { notifyNewCustomer } from '../lib/notifications';

async function registerUser() {
  try {
    // إنشاء المستخدم في Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      email, 
      password
    );

    // حفظ بيانات المستخدم في Firestore
    await setDoc(doc(firebaseDb, 'users', userCredential.user.uid), {
      name: name,
      email: email,
      createdAt: Timestamp.now(),
    });

    // ✅ إرسال إشعار للأدمن
    await notifyNewCustomer(
      userCredential.user.uid,
      name,
      email
    );

    alert('تم التسجيل بنجاح!');
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## ⚠️ مثال: إشعار عند نفاد المخزون

### في صفحة إدارة المنتجات (عند تحديث المخزون):

```typescript
import { notifyLowStock } from '../lib/notifications';

async function updateProductStock(productId: string, newStock: number) {
  try {
    // تحديث المخزون
    await updateDoc(doc(firebaseDb, 'products', productId), {
      stock: newStock,
      updatedAt: Timestamp.now(),
    });

    // ✅ إرسال تنبيه إذا كان المخزون أقل من 5
    if (newStock < 5) {
      const productSnap = await getDoc(doc(firebaseDb, 'products', productId));
      const productData = productSnap.data();
      
      await notifyLowStock(
        productId,
        productData?.name?.ar || productData?.name?.en,
        newStock
      );
    }

    alert('تم تحديث المخزون');
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## 🔔 جميع الدوال المتاحة

### في `src/lib/notifications.ts`:

```typescript
// 1. طلب جديد
await notifyNewOrder(orderId, orderNumber, customerName, totalAmount);

// 2. رسالة دعم جديدة
await notifyNewSupportMessage(messageId, customerName, subject);

// 3. عميل جديد
await notifyNewCustomer(customerId, customerName, customerEmail);

// 4. مخزون منخفض
await notifyLowStock(productId, productName, currentStock);

// 5. إلغاء طلب
await notifyOrderCancelled(orderId, orderNumber, reason);

// 6. اكتمال طلب
await notifyOrderCompleted(orderId, orderNumber);

// 7. إشعار نظام عام
await notifySystem(title, message, targetUrl);

// 8. إشعار مخصص
await createNotification(type, title, message, targetUrl, targetId);
```

---

## 🎨 أنواع الإشعارات

| النوع | متى يُستخدم | اللون |
|-------|-------------|-------|
| `order` | طلبات جديدة، إلغاء، اكتمال | 🟢 أخضر |
| `support` | رسائل دعم فني | 🔵 أزرق |
| `product` | مخزون منخفض، منتج جديد | 🟣 بنفسجي |
| `customer` | عملاء جدد | 🌸 وردي |
| `system` | تحديثات نظام عامة | ⚪ رمادي |

---

## 🚀 التفعيل التلقائي

### في Dashboard (تم إضافته بالفعل):

- ✅ عداد للإشعارات غير المقروءة
- ✅ صوت تنبيه عند إشعار جديد
- ✅ تحديث فوري (realtime)
- ✅ أيقونة نابضة عند وجود إشعارات جديدة

---

## 📱 النتيجة النهائية

عندما يقوم العميل بـ:
1. **إنشاء طلب** → يظهر إشعار: "🔔 طلب جديد #12345"
2. **إرسال رسالة دعم** → يظهر إشعار: "💬 رسالة دعم جديدة"
3. **التسجيل في الموقع** → يظهر إشعار: "👤 عميل جديد"

وسيرى الأدمن:
- 🔔 رقم أحمر نابض على أيقونة الإشعارات في Dashboard
- 🔊 صوت تنبيه
- 📱 الإشعار مباشرة في صفحة الإشعارات

---

## 🎯 خطوات التطبيق

### 1. في صفحة Checkout (إنشاء الطلبات):
```typescript
// أضف هذا السطر بعد حفظ الطلب
import { notifyNewOrder } from '../lib/notifications';
await notifyNewOrder(orderId, orderNumber, customerName, totalAmount);
```

### 2. في صفحة Contact/Support:
```typescript
// أضف هذا السطر بعد حفظ الرسالة
import { notifyNewSupportMessage } from '../lib/notifications';
await notifyNewSupportMessage(messageId, customerName, subject);
```

### 3. في صفحة التسجيل:
```typescript
// أضف هذا السطر بعد إنشاء المستخدم
import { notifyNewCustomer } from '../lib/notifications';
await notifyNewCustomer(userId, name, email);
```

---

## ✅ تم بالفعل

- ✅ إنشاء ملف `src/lib/notifications.ts` مع جميع الدوال
- ✅ إضافة عداد الإشعارات في Dashboard
- ✅ إضافة صوت تنبيه
- ✅ التحديث الفوري (realtime)

## 🔜 ما تحتاج فعله

- استخدم الدوال في صفحات المتجر (Checkout, Contact, etc)
- اختبر النظام بإنشاء طلب جديد

---

**النظام جاهز للعمل! 🎉**
