import { useEffect, useState } from 'react';
import { firebaseDb } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isAdmin?: boolean;
  banned?: boolean;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCustomers() {
      const snap = await getDocs(collection(firebaseDb, 'users'));
      setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
      setLoading(false);
    }
    fetchCustomers();
  }, []);

  async function checkCustomerOrders(customerId: string) {
    const q = query(collection(firebaseDb, 'orders'), where('customerId', '==', customerId));
    const snap = await getDocs(q);
    const unpaid = snap.docs.some(doc => {
      const data = doc.data();
      return data.status !== 'Delivered' && (data.total || 0) > 0;
    });
    return { hasOrders: snap.size > 0, hasUnpaid: unpaid };
  }

  async function handleAdmin(customer: Customer) {
    setActionLoading(customer.id);
    setError('');
    try {
      await updateDoc(doc(firebaseDb, 'users', customer.id), { isAdmin: !customer.isAdmin });
      setCustomers(customers.map(c => c.id === customer.id ? { ...c, isAdmin: !c.isAdmin } : c));
    } catch {
      setError('خطأ في تعيين كأدمن');
    }
    setActionLoading('');
  }

  async function handleBan(customer: Customer) {
    setActionLoading(customer.id);
    setError('');
    const check = await checkCustomerOrders(customer.id);
    if (check.hasUnpaid) {
      setError('لا يمكن حظر العميل لديه طلبات غير مدفوعة');
      setActionLoading('');
      return;
    }
    try {
      await updateDoc(doc(firebaseDb, 'users', customer.id), { banned: !customer.banned });
      setCustomers(customers.map(c => c.id === customer.id ? { ...c, banned: !c.banned } : c));
    } catch {
      setError('خطأ في الحظر');
    }
    setActionLoading('');
  }

  async function handleDelete(customer: Customer) {
    setActionLoading(customer.id);
    setError('');
    const check = await checkCustomerOrders(customer.id);
    if (check.hasOrders) {
      setError('لا يمكن حذف العميل لديه طلبات متعلقة');
      setActionLoading('');
      return;
    }
    try {
      await deleteDoc(doc(firebaseDb, 'users', customer.id));
      setCustomers(customers.filter(c => c.id !== customer.id));
    } catch {
      setError('خطأ في الحذف');
    }
    setActionLoading('');
  }

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">العملاء | Customers</h1>
        <p className="text-sm text-gray-500">قائمة العملاء وإدارة الحسابات</p>
      </header>

      <section className="bg-white rounded shadow p-4">
        {loading ? (
          <div className="text-gray-500">جاري التحميل...</div>
        ) : customers.length === 0 ? (
          <p className="text-gray-600">لا يوجد عملاء حتى الآن.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">الاسم</th>
                <th className="p-2">البريد</th>
                <th className="p-2">الهاتف</th>
                <th className="p-2">أدمن</th>
                <th className="p-2">محظور</th>
                <th className="p-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id} className="border-b">
                  <td className="p-2 font-bold">{customer.name}</td>
                  <td className="p-2">{customer.email}</td>
                  <td className="p-2">{customer.phone || '-'}</td>
                  <td className="p-2">{customer.isAdmin ? '✔️' : ''}</td>
                  <td className="p-2">{customer.banned ? '🚫' : ''}</td>
                  <td className="p-2 space-x-2">
                    <button
                      className={`px-2 py-1 rounded ${customer.isAdmin ? 'bg-yellow-400' : 'bg-gray-200'} font-bold`}
                      disabled={actionLoading === customer.id}
                      onClick={() => handleAdmin(customer)}
                    >{customer.isAdmin ? 'إزالة أدمن' : 'تعيين كأدمن'}</button>
                    <button
                      className={`px-2 py-1 rounded ${customer.banned ? 'bg-red-400 text-white' : 'bg-gray-200'} font-bold`}
                      disabled={actionLoading === customer.id}
                      onClick={() => handleBan(customer)}
                    >{customer.banned ? 'إلغاء الحظر' : 'حظر'}</button>
                    <button
                      className="px-2 py-1 rounded bg-red-600 text-white font-bold"
                      disabled={actionLoading === customer.id}
                      onClick={() => handleDelete(customer)}
                    >حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {error && <div className="text-red-600 font-bold mt-2">{error}</div>}
      </section>
    </div>
  );
}
