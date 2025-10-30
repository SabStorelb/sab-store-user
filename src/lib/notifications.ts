import { addDoc, collection, Timestamp, getFirestore } from 'firebase/firestore';
import { getFirebaseClient } from './firebase';

// استخدام Firestore من العميل
const getDb = () => getFirestore(getFirebaseClient());

/**
 * أنواع الإشعارات المتاحة
 */
export type NotificationType = 'order' | 'support' | 'product' | 'customer' | 'system';

/**
 * إنشاء إشعار جديد في النظام
 * @param type - نوع الإشعار (order, support, product, customer, system)
 * @param title - عنوان الإشعار
 * @param message - نص الإشعار
 * @param targetUrl - الرابط المرتبط بالإشعار (اختياري)
 * @param targetId - معرف العنصر المرتبط (اختياري)
 */
export async function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  targetUrl?: string,
  targetId?: string
): Promise<void> {
  try {
    await addDoc(collection(getDb(), 'notifications'), {
      type,
      title,
      message,
      read: false,
      createdAt: Timestamp.now(),
      targetUrl: targetUrl || null,
      targetId: targetId || null,
    });
    console.log('✅ تم إنشاء الإشعار بنجاح');
  } catch (error) {
    console.error('❌ خطأ في إنشاء الإشعار:', error);
  }
}

/**
 * إنشاء إشعار عند طلب جديد
 */
export async function notifyNewOrder(
  orderId: string,
  orderNumber: string,
  customerName: string,
  totalAmount: number
): Promise<void> {
  await createNotification(
    'order',
    `🔔 طلب جديد #${orderNumber}`,
    `طلب جديد من ${customerName} بقيمة ${totalAmount.toLocaleString()} ريال`,
    `/admin/orders/${orderId}`,
    orderId
  );
}

/**
 * إنشاء إشعار عند رسالة دعم جديدة
 */
export async function notifyNewSupportMessage(
  messageId: string,
  customerName: string,
  subject: string
): Promise<void> {
  await createNotification(
    'support',
    '💬 رسالة دعم جديدة',
    `رسالة جديدة من ${customerName}: ${subject}`,
    `/admin/support-messages`,
    messageId
  );
}

/**
 * إنشاء إشعار عند تسجيل عميل جديد
 */
export async function notifyNewCustomer(
  customerId: string,
  customerName: string,
  customerEmail: string
): Promise<void> {
  await createNotification(
    'customer',
    '👤 عميل جديد',
    `انضم ${customerName} (${customerEmail}) إلى المتجر`,
    `/admin/customers`,
    customerId
  );
}

/**
 * إنشاء إشعار عند نفاد المخزون
 */
export async function notifyLowStock(
  productId: string,
  productName: string,
  currentStock: number
): Promise<void> {
  await createNotification(
    'product',
    '⚠️ تحذير: مخزون منخفض',
    `المنتج "${productName}" متبقي منه ${currentStock} وحدات فقط`,
    `/admin/products`,
    productId
  );
}

/**
 * إنشاء إشعار عند إلغاء طلب
 */
export async function notifyOrderCancelled(
  orderId: string,
  orderNumber: string,
  reason?: string
): Promise<void> {
  await createNotification(
    'order',
    `🚫 تم إلغاء طلب #${orderNumber}`,
    reason ? `السبب: ${reason}` : 'تم إلغاء الطلب من قبل العميل',
    `/admin/orders/${orderId}`,
    orderId
  );
}

/**
 * إنشاء إشعار عند اكتمال طلب
 */
export async function notifyOrderCompleted(
  orderId: string,
  orderNumber: string
): Promise<void> {
  await createNotification(
    'order',
    `✅ اكتمل طلب #${orderNumber}`,
    'تم توصيل الطلب بنجاح للعميل',
    `/admin/orders/${orderId}`,
    orderId
  );
}

/**
 * إنشاع إشعار نظام عام
 */
export async function notifySystem(
  title: string,
  message: string,
  targetUrl?: string
): Promise<void> {
  await createNotification(
    'system',
    title,
    message,
    targetUrl
  );
}
