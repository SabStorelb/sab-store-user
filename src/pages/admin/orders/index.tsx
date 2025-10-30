import { useEffect, useState } from 'react';
import { firebaseDb } from '../../../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function OrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      const snap = await getDocs(collection(firebaseDb, 'orders'));
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen p-6">
      {/* زر العودة */}
      <button
        onClick={() => window.history.back()}
        className="mb-4 px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300"
      >عودة | Back</button>

      {/* رأس الصفحة */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الطلبات | Orders</h1>
          <p className="text-sm text-gray-500">قائمة الطلبات</p>
        </div>
      </header>

      {/* قائمة الطلبات */}
      <section>
        {loading ? (
          <div className="text-gray-500">جاري التحميل...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded shadow p-4">لا يوجد طلبات بعد. | No orders yet.</div>
        ) : (
          <ul className="space-y-4">
            {orders.map(order => (
              <li
                key={order.id}
                className="bg-white rounded-xl shadow p-3 cursor-pointer hover:shadow-lg transition flex flex-col gap-1 border border-gray-100 min-h-[90px] justify-center"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-base text-gray-800">رقم الطلب | Order ID:</span>
                  <span className="font-mono text-sm text-blue-700 break-all">{order.id}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-700">الحالة | Status:</span>
                  <span
                    className={
                      'px-2 py-1 rounded text-xs font-bold ' +
                      (order.status === 'Cancelled' ? 'bg-red-500 text-white' :
                        order.status === 'Delivered' ? 'bg-green-500 text-white' :
                        order.status === 'Preparing' ? 'bg-purple-400 text-white' :
                        order.status === 'Under Review' ? 'bg-yellow-400 text-black' :
                        order.status === 'Delivery Failed' ? 'bg-pink-500 text-white' :
                        order.status === 'Awaiting Payment' ? 'bg-yellow-300 text-black' :
                        order.status === 'Arrived Hub' ? 'bg-cyan-400 text-white' :
                        order.status === 'Shipped' ? 'bg-blue-400 text-white' :
                        order.status === 'Out for Delivery' ? 'bg-orange-400 text-white' :
                        order.status === 'Received' ? 'bg-gray-200 text-black' :
                        'bg-gray-100 text-gray-700')
                    }
                  >{order.status || '---'}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-700">العميل | Customer:</span>
                  <span className="text-gray-600">
                    {order.customerName || '---'}
                    {order.customerId && (
                      <>
                        {' '}
                        <a
                          href={`/admin/users/${order.customerId}`}
                          className="text-blue-500 underline text-xs ml-2"
                          title="عرض صفحة العميل"
                          onClick={e => e.stopPropagation()}
                        >ID: {order.customerId}</a>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-700">المجموع | Total:</span>
                  <span className="text-lg font-bold text-blue-700">
                    {order.total || '---'} {order.currency || 'USD'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* نافذة تفاصيل الطلب */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative overflow-y-auto max-h-[90vh]">
            <button className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-black" onClick={() => setSelectedOrder(null)}>×</button>
            <h2 className="text-2xl font-bold mb-4">تفاصيل الطلب | Order Details</h2>
            <div className="mb-4">
              <h3 className="font-bold mb-2">معلومات العميل | Customer Info</h3>
              <div className="text-sm text-gray-700">الاسم | Name: {selectedOrder.customerName || '---'}</div>
              <div className="text-sm text-gray-700">البريد | Email: {selectedOrder.customerEmail || '---'}</div>
              <div className="text-sm text-gray-700">الهاتف | Phone: {selectedOrder.customerPhone || '---'}</div>
            </div>
            <div className="mb-4">
              <h3 className="font-bold mb-2">عنوان الشحن | Shipping Address</h3>
              <div className="text-sm text-gray-700">
                {selectedOrder.shippingAddress && typeof selectedOrder.shippingAddress === 'object' ? (
                  <>
                    {selectedOrder.shippingAddress.fullName && <div>الاسم: {selectedOrder.shippingAddress.fullName}</div>}
                    {selectedOrder.shippingAddress.country && <div>الدولة: {selectedOrder.shippingAddress.country}</div>}
                    {selectedOrder.shippingAddress.city && <div>المدينة: {selectedOrder.shippingAddress.city}</div>}
                    {(selectedOrder.shippingAddress.addressLine1 || selectedOrder.shippingAddress.addressLine2) && <div>العنوان: {selectedOrder.shippingAddress.addressLine1} {selectedOrder.shippingAddress.addressLine2}</div>}
                    {selectedOrder.shippingAddress.zipCode && <div>الرمز البريدي: {selectedOrder.shippingAddress.zipCode}</div>}
                    {selectedOrder.shippingAddress.phoneNumber && <div>الهاتف: {selectedOrder.shippingAddress.phoneNumber}</div>}
                  </>
                ) : (
                  selectedOrder.shippingAddress || '---'
                )}
              </div>
            </div>
            <div className="mb-4">
              <h3 className="font-bold mb-2">المنتجات | Products</h3>
              {selectedOrder.products && selectedOrder.products.length > 0 ? (
                <ul className="space-y-2">
                  {selectedOrder.products.map((prod: any, idx: number) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span>{prod.nameAr || prod.name || '---'} <span className="text-xs text-gray-500">x{prod.qty || 1}</span></span>
                      <span className="font-bold text-green-600">{prod.price} {prod.currency || 'USD'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">لا يوجد منتجات.</div>
              )}
            </div>
            <div className="mb-4">
              <div className="flex justify-between"><span>المجموع الفرعي | Subtotal:</span><span>{selectedOrder.subtotal || 0} {selectedOrder.currency || 'USD'}</span></div>
              <div className="flex justify-between"><span>رسوم التوصيل | Delivery Fee:</span><span>{selectedOrder.deliveryFee || 0} {selectedOrder.currency || 'USD'}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>الإجمالي | Total:</span><span>{selectedOrder.total || 0} {selectedOrder.currency || 'USD'}</span></div>
            </div>
            <div className="mb-4">
              <h3 className="font-bold mb-2">تغيير الحالة | Change Status</h3>
              <div className="grid grid-cols-2 gap-2">
                {['Received','Under Review','Preparing','Shipped','Arrived Hub','Out for Delivery','Delivered','Cancelled','Delivery Failed','Awaiting Payment'].map(status => (
                  <button
                    key={status}
                    className={
                      'px-2 py-2 rounded font-bold border transition ' +
                      (selectedOrder.status === status ? 'border-black' : 'border-gray-200') + ' ' +
                      (status === 'Cancelled' ? 'bg-red-500 text-white' :
                        status === 'Delivered' ? 'bg-green-500 text-white' :
                        status === 'Preparing' ? 'bg-purple-400 text-white' :
                        status === 'Under Review' ? 'bg-yellow-400 text-white' :
                        status === 'Delivery Failed' ? 'bg-pink-500 text-white' :
                        status === 'Awaiting Payment' ? 'bg-yellow-300 text-black' :
                        status === 'Arrived Hub' ? 'bg-cyan-400 text-white' :
                        '')
                    }
                    disabled={selectedOrder.status === status}
                    style={{ cursor: selectedOrder.status === status ? 'not-allowed' : 'pointer', opacity: selectedOrder.status === status ? 0.7 : 1 }}
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
                  >{status}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
