// User Notification utility functions
// هذه الدوال لإرسال إشعارات للعملاء (في تطبيقهم/موقعهم)
import { addDoc, collection, Timestamp, getFirestore } from 'firebase/firestore';
import { getFirebaseClient } from './firebase';

// استخدام Firestore من العميل
const getDb = () => getFirestore(getFirebaseClient());

/**
 * أنواع إشعارات العملاء
 */
export type UserNotificationType = 
  | 'order_confirmed'    // تأكيد الطلب
  | 'order_processing'   // جاري تجهيز الطلب
  | 'order_shipped'      // تم الشحن
  | 'order_delivered'    // تم التوصيل
  | 'order_cancelled'    // تم الإلغاء
  | 'special_offer'      // عرض خاص
  | 'price_drop'         // انخفاض السعر
  | 'back_in_stock'      // عودة للمخزون
  | 'welcome'            // ترحيب
  | 'general';           // عام

/**
 * إنشاء إشعار للعميل
 */
export async function createUserNotification(
  userId: string,
  type: UserNotificationType,
  title: string,
  message: string,
  targetUrl?: string,
  targetId?: string,
  metadata?: any
): Promise<void> {
  try {
    await addDoc(collection(getDb(), 'userNotifications'), {
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: Timestamp.now(),
      targetUrl: targetUrl || null,
      targetId: targetId || null,
      metadata: metadata || null,
    });
    console.log('✅ User notification created:', { userId, type, title });
  } catch (error) {
    console.error('❌ Error creating user notification:', error);
    throw error;
  }
}

/**
 * إشعار العميل بتأكيد الطلب
 */
export async function notifyUserOrderConfirmed(
  userId: string,
  orderId: string,
  orderNumber: string,
  totalAmount: number
): Promise<void> {
  await createUserNotification(
    userId,
    'order_confirmed',
    '✅ تم تأكيد طلبك',
    `تم تأكيد طلبك رقم #${orderNumber} بقيمة ${totalAmount.toLocaleString()} ريال. سنبدأ في تجهيزه قريباً.`,
    `/orders/${orderId}`,
    orderId,
    { orderNumber, totalAmount }
  );
}

/**
 * إشعار العميل بأن الطلب قيد التجهيز
 */
export async function notifyUserOrderProcessing(
  userId: string,
  orderId: string,
  orderNumber: string
): Promise<void> {
  await createUserNotification(
    userId,
    'order_processing',
    '📦 جاري تجهيز طلبك',
    `طلبك رقم #${orderNumber} الآن قيد التجهيز. سيتم شحنه قريباً.`,
    `/orders/${orderId}`,
    orderId,
    { orderNumber }
  );
}

/**
 * إشعار العميل بشحن الطلب
 */
export async function notifyUserOrderShipped(
  userId: string,
  orderId: string,
  orderNumber: string,
  trackingNumber?: string
): Promise<void> {
  const message = trackingNumber
    ? `تم شحن طلبك رقم #${orderNumber}. رقم التتبع: ${trackingNumber}`
    : `تم شحن طلبك رقم #${orderNumber}. سيصلك قريباً.`;

  await createUserNotification(
    userId,
    'order_shipped',
    '🚚 تم شحن طلبك',
    message,
    `/orders/${orderId}`,
    orderId,
    { orderNumber, trackingNumber }
  );
}

/**
 * إشعار العميل بتوصيل الطلب
 */
export async function notifyUserOrderDelivered(
  userId: string,
  orderId: string,
  orderNumber: string
): Promise<void> {
  await createUserNotification(
    userId,
    'order_delivered',
    '🎉 تم توصيل طلبك',
    `تم توصيل طلبك رقم #${orderNumber} بنجاح. نتمنى أن تستمتع بمشترياتك!`,
    `/orders/${orderId}`,
    orderId,
    { orderNumber }
  );
}

/**
 * إشعار العميل بإلغاء الطلب
 */
export async function notifyUserOrderCancelled(
  userId: string,
  orderId: string,
  orderNumber: string,
  reason?: string
): Promise<void> {
  const message = reason
    ? `تم إلغاء طلبك رقم #${orderNumber}. السبب: ${reason}`
    : `تم إلغاء طلبك رقم #${orderNumber}.`;

  await createUserNotification(
    userId,
    'order_cancelled',
    '🚫 تم إلغاء طلبك',
    message,
    `/orders/${orderId}`,
    orderId,
    { orderNumber, reason }
  );
}

/**
 * إشعار العميل بعرض خاص
 */
export async function notifyUserSpecialOffer(
  userId: string,
  offerTitle: string,
  offerMessage: string,
  targetUrl?: string
): Promise<void> {
  await createUserNotification(
    userId,
    'special_offer',
    `🎁 ${offerTitle}`,
    offerMessage,
    targetUrl,
    undefined,
    { offerTitle }
  );
}

/**
 * إشعار العميل بانخفاض سعر منتج
 */
export async function notifyUserPriceDrop(
  userId: string,
  productId: string,
  productName: string,
  oldPrice: number,
  newPrice: number
): Promise<void> {
  const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  
  await createUserNotification(
    userId,
    'price_drop',
    `💰 انخفض سعر ${productName}`,
    `السعر انخفض من ${oldPrice} إلى ${newPrice} ريال (خصم ${discount}%)`,
    `/products/${productId}`,
    productId,
    { productName, oldPrice, newPrice, discount }
  );
}

/**
 * إشعار العميل بعودة منتج للمخزون
 */
export async function notifyUserBackInStock(
  userId: string,
  productId: string,
  productName: string
): Promise<void> {
  await createUserNotification(
    userId,
    'back_in_stock',
    `✨ ${productName} متوفر الآن`,
    `المنتج الذي طلبته عاد إلى المخزون. اطلبه الآن قبل نفاذه!`,
    `/products/${productId}`,
    productId,
    { productName }
  );
}

/**
 * إشعار ترحيب للعميل الجديد
 */
export async function notifyUserWelcome(
  userId: string,
  userName: string
): Promise<void> {
  await createUserNotification(
    userId,
    'welcome',
    `🎉 مرحباً ${userName}!`,
    'نحن سعداء بانضمامك إلينا. استمتع بتسوق منتجاتنا المميزة!',
    '/products',
    undefined,
    { userName }
  );
}

/**
 * إشعار عام للعميل
 */
export async function notifyUserGeneral(
  userId: string,
  title: string,
  message: string,
  targetUrl?: string
): Promise<void> {
  await createUserNotification(
    userId,
    'general',
    title,
    message,
    targetUrl
  );
}

/**
 * إرسال إشعار لعدة مستخدمين (Broadcast)
 */
export async function notifyMultipleUsers(
  userIds: string[],
  type: UserNotificationType,
  title: string,
  message: string,
  targetUrl?: string
): Promise<void> {
  try {
    const promises = userIds.map(userId =>
      createUserNotification(userId, type, title, message, targetUrl)
    );
    await Promise.all(promises);
    console.log(`✅ Sent notifications to ${userIds.length} users`);
  } catch (error) {
    console.error('❌ Error sending multiple notifications:', error);
    throw error;
  }
}
