const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

// تعطيل SSL verification للتطوير (إذا كانت هناك مشكلة في الشهادات)
db.settings({
  ignoreUndefinedProperties: true,
});

// 🔔 إشعار عند طلب جديد - NEW!
exports.notifyAdminOnNewOrder = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const orderId = context.params.orderId;
    const orderData = snap.data();
    
    try {
      console.log('📦 New order detected:', orderId);
      console.log('📦 Order data:', JSON.stringify(orderData));
      
      const batch = db.batch();
      
      // إنشاء إشعار في collection الإشعارات للأدمن
      const adminNotifRef = db.collection('notifications').doc();
      batch.set(adminNotifRef, {
        title: 'طلب جديد | New Order',
        titleAr: 'طلب جديد',
        titleEn: 'New Order',
        message: `طلب جديد #${orderId.substring(0, 8)} من ${orderData.customerName || orderData.shippingAddress?.fullName || 'عميل'} بقيمة ${orderData.total || 0} ${orderData.currency || 'LBP'}`,
        messageAr: `طلب جديد من ${orderData.customerName || orderData.shippingAddress?.fullName || 'عميل'}`,
        messageEn: `New order from ${orderData.customerName || orderData.shippingAddress?.fullName || 'customer'}`,
        type: 'order',
        orderId: orderId,
        customerName: orderData.customerName || orderData.shippingAddress?.fullName || 'غير محدد',
        amount: orderData.total || 0,
        currency: orderData.currency || 'LBP',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        timestamp: new Date().toISOString(),
      });
      
      // إرسال إشعار للعميل أيضاً
      if (orderData.userId) {
        const userNotifRef = db.collection('userNotifications').doc();
        batch.set(userNotifRef, {
          userId: orderData.userId,
          title: 'تم تأكيد طلبك | Order Confirmed',
          titleAr: 'تم تأكيد طلبك',
          titleEn: 'Order Confirmed',
          message: `تم استلام طلبك #${orderId.substring(0, 8)} بنجاح! سنبدأ بتجهيزه قريباً.`,
          messageAr: `تم استلام طلبك بنجاح! المبلغ الإجمالي: ${orderData.total} ${orderData.currency || 'LBP'}`,
          messageEn: `Your order has been received! Total: ${orderData.total} ${orderData.currency || 'LBP'}`,
          type: 'order',
          orderId: orderId,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          timestamp: new Date().toISOString(),
        });
      }
      
      // تنفيذ batch
      await batch.commit();
      
      console.log('✅ Notifications created successfully for order:', orderId);
      return null;
      
    } catch (error) {
      console.error('❌ Error creating order notifications:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error code:', error.code);
      return null;
    }
  });

// إشعار عند وصول رسالة دعم جديدة
exports.notifyAdminOnSupportMessage = functions.firestore
  .document('supportMessages/{messageId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();

    try {
      console.log('📩 New support message detected');
      
      // إنشاء إشعار في Firestore
      await db.collection('notifications').doc().set({
        title: 'رسالة دعم جديدة | New Support Message',
        titleAr: 'رسالة دعم جديدة',
        titleEn: 'New Support Message',
        message: `رسالة جديدة من ${data.name}: ${data.message}`,
        messageAr: `رسالة من ${data.name}`,
        messageEn: `Message from ${data.name}`,
        type: 'support',
        customerName: data.name,
        email: data.email,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        timestamp: new Date().toISOString(),
      });

      console.log('✅ Support message notification created');
      return null;
    } catch (error) {
      console.error('❌ Error creating support notification:', error);
      console.error('❌ Error details:', error.message);
      return null;
    }
  });

// يمكنك تكرار نفس الكود للطلبات الجديدة والعملاء الجدد ونقص المخزون
// فقط غير اسم المجموعة وبيانات الرسالة
