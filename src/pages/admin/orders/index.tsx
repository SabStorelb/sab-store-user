import { useEffect, useState } from 'react';
import { firebaseDb } from '../../../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function OrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    async function fetchOrders() {
      const snap = await getDocs(collection(firebaseDb, 'orders'));
      const ordersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by newest first
      ordersData.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setOrders(ordersData);
      setLoading(false);
    }
    fetchOrders();
  }, []);

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

  const statusOptions = ['Received', 'Under Review', 'Preparing', 'Shipped', 'Arrived Hub', 'Out for Delivery', 'Delivered', 'Cancelled', 'Delivery Failed', 'Awaiting Payment'];

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  const statusCounts = orders.reduce((acc: any, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/admin/dashboard">
            <button className="px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 group">
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-semibold">عودة | Back</span>
            </button>
          </Link>
          <Link href="/admin/dashboard">
            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 group">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-semibold">Home</span>
            </button>
          </Link>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 border-2 border-purple-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                📦 الطلبات | Orders
              </h1>
              <p className="text-gray-600">إدارة جميع الطلبات والشحنات</p>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-3 rounded-xl">
              <div className="text-sm text-gray-600">إجمالي الطلبات</div>
              <div className="text-3xl font-bold text-purple-700">{orders.length}</div>
            </div>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-purple-100">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
            </svg>
            فلترة حسب الحالة
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                filterStatus === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              الكل ({orders.length})
            </button>
            {statusOptions.map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                  filterStatus === status
                    ? getStatusColor(status) + ' shadow-lg scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {status} {statusCounts[status] ? `(${statusCounts[status]})` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">جاري تحميل الطلبات...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد طلبات</h3>
              <p className="text-gray-500">
                {filterStatus === 'all' ? 'لم يتم إنشاء أي طلبات بعد' : `لا توجد طلبات بحالة "${filterStatus}"`}
              </p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-2 border-transparent hover:border-purple-300 group"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Order ID & Status */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md ${getStatusColor(order.status)}`}>
                        {order.status || 'Unknown'}
                      </span>
                      {order.createdAt && (
                        <span className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-GB')}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg inline-block">
                      🔖 {order.id}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">العميل | Customer</div>
                    <div className="font-semibold text-gray-800">
                      {order.customerName || order.shippingAddress?.fullName || '---'}
                    </div>
                    {order.customerPhone && (
                      <div className="text-sm text-gray-600 mt-1">📱 {order.customerPhone}</div>
                    )}
                  </div>

                  {/* Total Amount */}
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">المجموع | Total</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {order.total || 0} {order.currency || 'USD'}
                    </div>
                    {order.products && (
                      <div className="text-xs text-gray-500 mt-1">
                        {order.products.length} منتج
                      </div>
                    )}
                  </div>

                  {/* Arrow Icon */}
                  <div className="hidden md:block">
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Modal - Order Details */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white relative">
              <button 
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                onClick={() => setSelectedOrder(null)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>📦</span>
                <span>تفاصيل الطلب | Order Details</span>
              </h2>
              <p className="text-white/80 text-sm mt-2 font-mono">{selectedOrder.id}</p>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  معلومات العميل | Customer Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 min-w-[80px]">الاسم:</span>
                    <span className="font-semibold text-gray-800">{selectedOrder.customerName || selectedOrder.shippingAddress?.fullName || '---'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 min-w-[80px]">البريد:</span>
                    <span className="font-semibold text-gray-800">{selectedOrder.customerEmail || '---'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 min-w-[80px]">الهاتف:</span>
                    <span className="font-semibold text-gray-800">{selectedOrder.customerPhone || selectedOrder.shippingAddress?.phoneNumber || '---'}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  عنوان الشحن | Shipping Address
                </h3>
                <div className="bg-white rounded-xl p-4 text-sm space-y-1">
                  {selectedOrder.shippingAddress && typeof selectedOrder.shippingAddress === 'object' ? (
                    <>
                      {selectedOrder.shippingAddress.fullName && <div><strong>الاسم:</strong> {selectedOrder.shippingAddress.fullName}</div>}
                      {selectedOrder.shippingAddress.country && <div><strong>الدولة:</strong> {selectedOrder.shippingAddress.country}</div>}
                      {selectedOrder.shippingAddress.city && <div><strong>المدينة:</strong> {selectedOrder.shippingAddress.city}</div>}
                      {selectedOrder.shippingAddress.addressLine1 && <div><strong>العنوان:</strong> {selectedOrder.shippingAddress.addressLine1} {selectedOrder.shippingAddress.addressLine2}</div>}
                      {selectedOrder.shippingAddress.zipCode && <div><strong>الرمز البريدي:</strong> {selectedOrder.shippingAddress.zipCode}</div>}
                    </>
                  ) : (
                    <div className="text-gray-500">{selectedOrder.shippingAddress || 'غير متوفر'}</div>
                  )}
                </div>
              </div>

              {/* Products */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                  </svg>
                  المنتجات | Products ({selectedOrder.products?.length || 0})
                </h3>
                {selectedOrder.products && selectedOrder.products.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.products.map((prod: any, idx: number) => (
                      <div key={idx} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{prod.nameAr || prod.name || '---'}</div>
                          <div className="text-xs text-gray-500 mt-1">الكمية: {prod.qty || 1}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-purple-600">{prod.price} {prod.currency || 'USD'}</div>
                          {prod.qty > 1 && (
                            <div className="text-xs text-gray-500">({prod.price * prod.qty} {prod.currency})</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-6 text-center text-gray-500">
                    لا توجد منتجات في هذا الطلب
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  ملخص المبالغ | Price Summary
                </h3>
                <div className="bg-white rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">المجموع الفرعي:</span>
                    <span className="font-semibold">{selectedOrder.subtotal || 0} {selectedOrder.currency || 'USD'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">رسوم التوصيل:</span>
                    <span className="font-semibold">{selectedOrder.deliveryFee || 0} {selectedOrder.currency || 'USD'}</span>
                  </div>
                  <div className="border-t-2 border-dashed border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">الإجمالي:</span>
                      <span className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {selectedOrder.total || 0} {selectedOrder.currency || 'USD'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Change Status */}
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  تغيير الحالة | Change Status
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {statusOptions.map(status => (
                    <button
                      key={status}
                      className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 border-2 ${
                        selectedOrder.status === status
                          ? getStatusColor(status) + ' border-gray-800 scale-95'
                          : getStatusColor(status) + ' border-transparent hover:scale-105'
                      }`}
                      disabled={selectedOrder.status === status}
                      onClick={async () => {
                        if (selectedOrder.status === status) return;
                        try {
                          const orderRef = doc(firebaseDb, 'orders', selectedOrder.id);
                          await updateDoc(orderRef, { status });
                          setSelectedOrder({ ...selectedOrder, status });
                          setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status } : o));
                        } catch (err) {
                          alert('حدث خطأ أثناء تحديث الحالة');
                        }
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
