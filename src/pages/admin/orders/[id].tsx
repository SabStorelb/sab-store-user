import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { firebaseDb } from '../../../lib/firebase';
import { doc, getDoc, collection, getDocs, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

export default function OrderDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');

  useEffect(() => {
    async function fetchOrderDetails() {
      if (!id) return;
      
      try {
        // جلب بيانات الطلب
        const orderDoc = await getDoc(doc(firebaseDb, 'orders', id as string));
        if (orderDoc.exists()) {
          const orderData = { id: orderDoc.id, ...orderDoc.data() };
          setOrder(orderData);
          
          console.log('Order data:', orderData); // للتأكد من البيانات
          
          // جلب بيانات العميل من userId
          if ((orderData as any).userId) {
            const userDoc = await getDoc(doc(firebaseDb, 'users', (orderData as any).userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log('User data:', userData); // للتأكد من البيانات
              setCustomer(userData);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrderDetails();
  }, [id]);

  // تهيئة الحالة الجديدة عند تحميل الطلب
  useEffect(() => {
    if (order) {
      setNewStatus(order.status || 'Under Review');
      setTrackingNumber(order.trackingNumber || '');
      setPaymentStatus(order.paymentStatus || (order.isPaid ? 'paid' : 'pending'));
    }
  }, [order]);

  // دالة تحديث حالة الطلب وإرسال إشعار للعميل
  const handleUpdateOrder = async () => {
    if (!id || !order) return;
    
    setUpdating(true);
    try {
      const orderRef = doc(firebaseDb, 'orders', id as string);
      
      // تحديث الطلب
      const updateData: any = {
        status: newStatus,
        paymentStatus: paymentStatus,
        isPaid: paymentStatus === 'paid',
        updatedAt: new Date().toISOString(),
      };
      
      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber;
      }
      
      await updateDoc(orderRef, updateData);
      
      // إرسال إشعار للعميل
      if (order.userId) {
        const statusDescriptions: any = {
          'Received': { ar: 'تم استلام طلبك وجاري المراجعة', en: 'Order received and is being processed' },
          'Under Review': { ar: 'طلبك قيد المراجعة', en: 'Order is under review' },
          'Preparing': { ar: 'جاري تحضير طلبك', en: 'Your order is being prepared' },
          'Shipped': { ar: 'تم شحن طلبك', en: 'Your order has been shipped' },
          'Arrived Hub': { ar: 'وصل طلبك إلى مركز التوزيع', en: 'Order arrived at distribution hub' },
          'Out for Delivery': { ar: 'طلبك في الطريق إليك', en: 'Order is out for delivery' },
          'Delivered': { ar: 'تم تسليم طلبك بنجاح', en: 'Order delivered successfully' },
          'Cancelled': { ar: 'تم إلغاء طلبك', en: 'Order has been cancelled' },
          'Delivery Failed': { ar: 'فشل تسليم الطلب', en: 'Delivery failed' },
          'Awaiting Payment': { ar: 'في انتظار الدفع', en: 'Awaiting payment' },
        };
        
        const description = statusDescriptions[newStatus] || { ar: 'تم تحديث حالة طلبك', en: 'Order status updated' };
        
        // إضافة معلومات الدفع في الإشعار
        let notificationMessage = description.ar;
        let notificationMessageEn = description.en;
        
        if (paymentStatus === 'paid' && order.paymentStatus !== 'paid') {
          notificationMessage += ' - تم تأكيد الدفع';
          notificationMessageEn += ' - Payment confirmed';
        }
        
        if (trackingNumber && order.trackingNumber !== trackingNumber) {
          notificationMessage += ` - رقم التتبع: ${trackingNumber}`;
          notificationMessageEn += ` - Tracking: ${trackingNumber}`;
        }
        
        // إرسال إشعار داخل التطبيق
        await addDoc(collection(firebaseDb, 'userNotifications'), {
          userId: order.userId,
          orderId: id,
          orderNumber: order.orderNumber || id,
          title: `تحديث الطلب #${order.orderNumber || id} | Order Update`,
          message: {
            ar: notificationMessage,
            en: notificationMessageEn,
          },
          status: newStatus,
          paymentStatus: paymentStatus,
          trackingNumber: trackingNumber || null,
          type: 'order_update',
          read: false,
          createdAt: serverTimestamp(),
        });
      }
      
      // تحديث البيانات المحلية
      setOrder({ 
        ...order, 
        status: newStatus, 
        paymentStatus: paymentStatus,
        isPaid: paymentStatus === 'paid',
        trackingNumber: trackingNumber, 
        updatedAt: new Date().toISOString() 
      });
      
      alert('✅ تم تحديث الطلب وإرسال إشعار للعميل بنجاح!');
    } catch (error) {
      console.error('Error updating order:', error);
      alert('❌ حدث خطأ أثناء تحديث الطلب');
    } finally {
      setUpdating(false);
    }
  };

  // دالة إرسال تحديث الطلب عبر WhatsApp
  const sendOrderUpdateWhatsApp = () => {
    const customerPhone = customer?.phoneNumber || order.customerInfo?.phone || order.shippingAddress?.phone;
    const customerName = customer?.displayName || order.customerInfo?.name || 'عزيزي العميل';
    
    const statusDescriptions: any = {
      'Received': 'تم استلام طلبك وجاري المراجعة',
      'Under Review': 'طلبك قيد المراجعة',
      'Preparing': 'جاري تحضير طلبك',
      'Shipped': 'تم شحن طلبك',
      'Arrived Hub': 'وصل طلبك إلى مركز التوزيع',
      'Out for Delivery': 'طلبك في الطريق إليك',
      'Delivered': 'تم تسليم طلبك بنجاح',
      'Cancelled': 'تم إلغاء طلبك',
      'Delivery Failed': 'فشل تسليم الطلب',
      'Awaiting Payment': 'في انتظار الدفع',
    };

    const whatsappMessage = `مرحباً *${customerName}*، 👋\n\n` +
      `📦 *تحديث حالة طلبك #${order.orderNumber || id}*\n\n` +
      `✨ *الحالة الجديدة:* ${statusDescriptions[newStatus] || newStatus}\n\n` +
      `💰 *المبلغ الإجمالي:* ${order.total?.toLocaleString('ar-SA')} ل.ل\n` +
      `💳 *حالة الدفع:* ${paymentStatus === 'paid' ? 'مدفوع ✅' : 'قيد الانتظار ⏳'}\n` +
      `${trackingNumber ? `📍 *رقم التتبع:* ${trackingNumber}\n` : ''}` +
      `\nشكراً لثقتك بنا! 💚\n` +
      `*فريق SAB Store*`;
    
    const cleanPhone = customerPhone?.replace(/\D/g, '') || '';
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  // دالة حذف الطلب
  const handleDeleteOrder = async () => {
    if (!id) return;
    
    const confirmDelete = confirm('⚠️ هل أنت متأكد من حذف هذا الطلب؟\n\nسيتم حذف الطلب نهائياً ولا يمكن التراجع عن هذا الإجراء!');
    if (!confirmDelete) return;
    
    try {
      // حذف الطلب من Firestore
      await deleteDoc(doc(firebaseDb, 'orders', id as string));
      
      alert('✅ تم حذف الطلب بنجاح!');
      
      // العودة لصفحة الطلبات
      router.push('/admin/orders');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('❌ حدث خطأ أثناء حذف الطلب');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-2xl font-bold text-purple-600">جاري التحميل...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
        <div className="text-center text-red-600 text-xl font-bold">الطلب غير موجود</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      'Cancelled': 'bg-red-500 text-white',
      'Delivered': 'bg-green-500 text-white',
      'Preparing': 'bg-purple-500 text-white',
      'Under Review': 'bg-yellow-500 text-white',
      'Delivery Failed': 'bg-pink-500 text-white',
      'Awaiting Payment': 'bg-amber-500 text-white',
      'Arrived Hub': 'bg-cyan-500 text-white',
      'Shipped': 'bg-blue-500 text-white',
      'Out for Delivery': 'bg-orange-500 text-white',
      'Received': 'bg-gray-400 text-white',
    };
    return colors[status] || 'bg-gray-200 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* أزرار الإجراءات */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          {/* زر العودة */}
          <Link href="/admin/orders">
            <button className="px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 group">
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-semibold">عودة للطلبات | Back to Orders</span>
            </button>
          </Link>

          {/* زر حذف الطلب */}
          <button
            onClick={handleDeleteOrder}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-bold group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            🗑️ حذف الطلب | Delete Order
          </button>
        </div>

        {/* عنوان الصفحة */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 md:p-8 mb-6 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">📦 تفاصيل الطلب | Order Details</h1>
          <p className="text-lg opacity-90">{order.orderNumber || order.id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* معلومات العميل */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-100">
            <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center gap-2">
              👤 معلومات العميل | Customer Info
            </h2>
            
            {customer ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="font-bold text-gray-700">الاسم:</span>
                  <span className="text-gray-900">{customer.fullName || customer.name || 'غير متوفر'}</span>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <span className="font-bold text-gray-700">البريد:</span>
                  <span className="text-gray-900 dir-ltr text-right">{customer.email || 'غير متوفر'}</span>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <span className="font-bold text-gray-700">الهاتف:</span>
                  <span className="text-gray-900 font-mono text-lg">{customer.phoneNumber || order.address?.phoneNumber || 'غير متوفر'}</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">لا توجد معلومات العميل</div>
            )}
          </div>

          {/* عنوان الشحن */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-green-100">
            <h2 className="text-2xl font-bold text-green-600 mb-4 flex items-center gap-2">
              📍 عنوان الشحن | Shipping Address
            </h2>
            
            {order.address ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <span className="font-bold text-gray-700">الاسم الكامل:</span>
                  <span className="text-gray-900">{order.address.fullName || 'غير متوفر'}</span>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="font-bold text-gray-700">العنوان:</span>
                  <span className="text-gray-900">{order.address.address || 'غير متوفر'}</span>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <span className="font-bold text-gray-700">المدينة:</span>
                  <span className="text-gray-900">{order.address.city || 'غير متوفر'}</span>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <span className="font-bold text-gray-700">الدولة:</span>
                  <span className="text-gray-900">{order.address.country || 'غير متوفر'}</span>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-lg">
                  <span className="font-bold text-gray-700">رقم الهاتف:</span>
                  <span className="text-gray-900 font-mono text-lg">{order.address.phoneNumber || 'غير متوفر'}</span>
                </div>
                
                {order.address.postalCode && (
                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <span className="font-bold text-gray-700">الرمز البريدي:</span>
                    <span className="text-gray-900">{order.address.postalCode}</span>
                  </div>
                )}
                
                {(order.address.latitude && order.address.longitude) && (
                  <div className="flex items-start gap-3 p-3 bg-cyan-50 rounded-lg">
                    <span className="font-bold text-gray-700">الموقع:</span>
                    <a 
                      href={`https://www.google.com/maps?q=${order.address.latitude},${order.address.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      عرض على الخريطة 🗺️
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">غير متوفر</div>
            )}
          </div>
        </div>

        {/* معلومات الطلب */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-purple-100 mt-6">
          <h2 className="text-2xl font-bold text-purple-600 mb-4 flex items-center gap-2">
            🛒 المنتجات | Products ({order.items?.length || 0})
          </h2>
          
          {order.items && order.items.length > 0 ? (
            <div className="space-y-4">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  {item.product?.image && (
                    <img 
                      src={item.product.image} 
                      alt={item.product.name?.ar || 'Product'} 
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{item.product?.name?.ar || 'اسم المنتج غير متوفر'}</h3>
                    <p className="text-sm text-gray-600">{item.product?.name?.en || ''}</p>
                    <p className="text-sm text-gray-500">الكمية: {item.quantity || 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">${item.price || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">لا توجد منتجات في هذا الطلب</div>
          )}
        </div>

        {/* حالة الطلب والدفع */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-yellow-100">
            <h2 className="text-xl font-bold text-yellow-600 mb-4">📊 حالة الطلب</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="font-bold">الحالة الحالية:</span>
                <span className={`px-4 py-2 rounded-lg font-bold ${getStatusColor(order.status)}`}>
                  {order.status || 'Under Review'}
                </span>
              </div>
              
              {order.trackingNumber && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-bold">رقم التتبع:</span>
                  <span className="font-mono text-lg">{order.trackingNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-green-100">
            <h2 className="text-xl font-bold text-green-600 mb-4">💰 معلومات الدفع</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-bold">طريقة الدفع:</span>
                <span className="font-bold text-gray-900">{order.paymentMethod || 'cash'}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-bold">حالة الدفع:</span>
                <span className={`px-4 py-2 rounded-lg font-bold ${
                  order.paymentStatus === 'paid' || order.isPaid ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                }`}>
                  {order.paymentStatus === 'paid' || order.isPaid ? 'مدفوع' : 'معلق'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="font-bold text-xl">الإجمالي:</span>
                <span className="font-bold text-3xl text-purple-600">${order.total || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* قسم تحديث حالة الطلب */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-xl p-6 border-2 border-orange-200 mt-6">
          <h2 className="text-2xl font-bold text-orange-600 mb-4 flex items-center gap-2">
            ✏️ تحديث حالة الطلب | Update Order Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                الحالة الجديدة | New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-base font-semibold"
              >
                <option value="Received">Received - مستلم</option>
                <option value="Under Review">Under Review - قيد المراجعة</option>
                <option value="Preparing">Preparing - قيد التحضير</option>
                <option value="Shipped">Shipped - تم الشحن</option>
                <option value="Arrived Hub">Arrived Hub - وصل للمركز</option>
                <option value="Out for Delivery">Out for Delivery - في الطريق</option>
                <option value="Delivered">Delivered - تم التوصيل</option>
                <option value="Cancelled">Cancelled - ملغي</option>
                <option value="Delivery Failed">Delivery Failed - فشل التوصيل</option>
                <option value="Awaiting Payment">Awaiting Payment - بانتظار الدفع</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                حالة الدفع | Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-base font-semibold"
              >
                <option value="pending">Pending - معلق</option>
                <option value="paid">Paid - مدفوع</option>
                <option value="failed">Failed - فشل</option>
                <option value="refunded">Refunded - مسترجع</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                رقم التتبع (اختياري) | Tracking Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="مثال: TRK123456789"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleUpdateOrder}
              disabled={updating || (newStatus === order.status && trackingNumber === (order.trackingNumber || '') && paymentStatus === (order.paymentStatus || 'pending'))}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-lg disabled:cursor-not-allowed"
            >
              {updating ? (
                <>
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري التحديث...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  تحديث وإرسال إشعار
                </>
              )}
            </button>

            {/* زر WhatsApp */}
            {(customer?.phoneNumber || order.customerInfo?.phone || order.shippingAddress?.phone) && (
              <button
                onClick={sendOrderUpdateWhatsApp}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                title="إرسال تحديث عبر WhatsApp"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                واتساب
              </button>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mt-3 text-center">
            💡 سيتم إرسال إشعار تلقائي للعميل عند تحديث حالة الطلب
          </p>
        </div>

        {/* تاريخ الطلب */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100 mt-6">
          <h2 className="text-xl font-bold text-gray-700 mb-4">📅 التواريخ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {order.createdAt && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="block text-sm text-gray-600 mb-1">تاريخ الإنشاء:</span>
                <span className="font-bold text-gray-900">
                  {new Date(order.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>
            )}
            
            {order.estimatedDelivery && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <span className="block text-sm text-gray-600 mb-1">التسليم المتوقع:</span>
                <span className="font-bold text-blue-900">
                  {new Date(order.estimatedDelivery).toLocaleDateString('en-GB')}
                </span>
              </div>
            )}
            
            {order.updatedAt && (
              <div className="p-3 bg-green-50 rounded-lg">
                <span className="block text-sm text-gray-600 mb-1">آخر تحديث:</span>
                <span className="font-bold text-green-900">
                  {new Date(order.updatedAt).toLocaleDateString('en-GB')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
