// Dual Notifications - إرسال إشعارات للأدمن والعميل معاً
// هذا الملف يجمع بين notifications.ts و userNotifications.ts

import {
  notifyNewOrder as adminNotifyNewOrder,
  notifyOrderCompleted as adminNotifyOrderCompleted,
  notifyOrderCancelled as adminNotifyOrderCancelled,
  notifyNewCustomer,
  notifyNewSupportMessage,
} from './notifications';

import {
  notifyUserOrderConfirmed,
  notifyUserOrderProcessing,
  notifyUserOrderShipped,
  notifyUserOrderDelivered,
  notifyUserOrderCancelled,
  notifyUserWelcome,
} from './userNotifications';

/**
 * إرسال إشعار عند إنشاء طلب جديد
 * يرسل إشعار للأدمن + إشعار تأكيد للعميل
 */
export async function notifyNewOrderDual(
  userId: string,
  orderId: string,
  orderNumber: string,
  customerName: string,
  totalAmount: number
): Promise<void> {
  try {
    // إشعار للأدمن
    await adminNotifyNewOrder(orderId, orderNumber, customerName, totalAmount);
    
    // إشعار للعميل
    await notifyUserOrderConfirmed(userId, orderId, orderNumber, totalAmount);
    
    console.log('✅ Dual notification sent for new order');
  } catch (error) {
    console.error('❌ Error sending dual order notification:', error);
  }
}

/**
 * إرسال إشعار عند تجهيز الطلب
 * فقط للعميل (الأدمن هو من يقوم بالتجهيز)
 */
export async function notifyOrderProcessingDual(
  userId: string,
  orderId: string,
  orderNumber: string
): Promise<void> {
  try {
    await notifyUserOrderProcessing(userId, orderId, orderNumber);
    console.log('✅ Processing notification sent to user');
  } catch (error) {
    console.error('❌ Error sending processing notification:', error);
  }
}

/**
 * إرسال إشعار عند شحن الطلب
 * فقط للعميل
 */
export async function notifyOrderShippedDual(
  userId: string,
  orderId: string,
  orderNumber: string,
  trackingNumber?: string
): Promise<void> {
  try {
    await notifyUserOrderShipped(userId, orderId, orderNumber, trackingNumber);
    console.log('✅ Shipped notification sent to user');
  } catch (error) {
    console.error('❌ Error sending shipped notification:', error);
  }
}

/**
 * إرسال إشعار عند توصيل الطلب
 * يرسل إشعار للعميل + إشعار للأدمن بالإكمال
 */
export async function notifyOrderDeliveredDual(
  userId: string,
  orderId: string,
  orderNumber: string
): Promise<void> {
  try {
    // إشعار للعميل
    await notifyUserOrderDelivered(userId, orderId, orderNumber);
    
    // إشعار للأدمن
    await adminNotifyOrderCompleted(orderId, orderNumber);
    
    console.log('✅ Dual notification sent for delivered order');
  } catch (error) {
    console.error('❌ Error sending dual delivered notification:', error);
  }
}

/**
 * إرسال إشعار عند إلغاء الطلب
 * يرسل إشعار للعميل + إشعار للأدمن
 */
export async function notifyOrderCancelledDual(
  userId: string,
  orderId: string,
  orderNumber: string,
  reason?: string
): Promise<void> {
  try {
    // إشعار للعميل
    await notifyUserOrderCancelled(userId, orderId, orderNumber, reason);
    
    // إشعار للأدمن
    await adminNotifyOrderCancelled(orderId, orderNumber, reason || 'غير محدد');
    
    console.log('✅ Dual notification sent for cancelled order');
  } catch (error) {
    console.error('❌ Error sending dual cancellation notification:', error);
  }
}

/**
 * إرسال إشعار عند تسجيل عميل جديد
 * يرسل ترحيب للعميل + إشعار للأدمن
 */
export async function notifyNewCustomerDual(
  userId: string,
  customerName: string,
  email: string
): Promise<void> {
  try {
    // ترحيب للعميل
    await notifyUserWelcome(userId, customerName);
    
    // إشعار للأدمن
    await notifyNewCustomer(userId, customerName, email);
    
    console.log('✅ Dual notification sent for new customer');
  } catch (error) {
    console.error('❌ Error sending dual customer notification:', error);
  }
}

/**
 * إرسال إشعار عند رسالة دعم جديدة
 * فقط للأدمن (العميل هو من أرسل الرسالة)
 */
export async function notifySupportMessageDual(
  messageId: string,
  customerName: string,
  subject: string
): Promise<void> {
  try {
    await notifyNewSupportMessage(messageId, customerName, subject);
    console.log('✅ Support notification sent to admin');
  } catch (error) {
    console.error('❌ Error sending support notification:', error);
  }
}

/**
 * مثال: دالة شاملة لتحديث حالة الطلب مع إرسال الإشعارات المناسبة
 */
export async function updateOrderStatus(
  userId: string,
  orderId: string,
  orderNumber: string,
  newStatus: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
  metadata?: {
    trackingNumber?: string;
    cancelReason?: string;
  }
): Promise<void> {
  try {
    switch (newStatus) {
      case 'confirmed':
        // يتم إرسال هذا عند إنشاء الطلب
        break;
      
      case 'processing':
        await notifyOrderProcessingDual(userId, orderId, orderNumber);
        break;
      
      case 'shipped':
        await notifyOrderShippedDual(
          userId,
          orderId,
          orderNumber,
          metadata?.trackingNumber
        );
        break;
      
      case 'delivered':
        await notifyOrderDeliveredDual(userId, orderId, orderNumber);
        break;
      
      case 'cancelled':
        await notifyOrderCancelledDual(
          userId,
          orderId,
          orderNumber,
          metadata?.cancelReason
        );
        break;
    }
    
    console.log(`✅ Order status updated to: ${newStatus}`);
  } catch (error) {
    console.error('❌ Error updating order status:', error);
  }
}
