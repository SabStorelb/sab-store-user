import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { firebaseDb } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isAdmin?: boolean;
  banned?: boolean;
  createdAt?: any;
  lastActive?: any;
}

const AdminCustomers: React.FC = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned'>('all');

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const snap = await getDocs(collection(firebaseDb, 'users'));
        // استبعد المستخدمين الذين لديهم isAdmin=true
        const nonAdmins = snap.docs.filter(doc => !doc.data().isAdmin);
        setCustomers(nonAdmins.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
      } catch (error) {
        console.error('Error fetching customers:', error);
        setError('حدث خطأ في جلب البيانات');
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  async function checkCustomerOrders(customerId: string) {
    const q = query(collection(firebaseDb, 'orders'), where('customerId', '==', customerId));
    const snap = await getDocs(q);
    const unpaid = snap.docs.some(doc => {
      const data = doc.data();
      return data.status !== 'paid';
    });
    return { hasOrders: snap.size > 0, hasUnpaid: unpaid };
  }

  async function handleAdmin(customer: Customer) {
    if (!confirm(`هل أنت متأكد من ${customer.isAdmin ? 'إزالة' : 'تعيين'} "${customer.name}" كأدمن؟`)) return;
    
    setActionLoading(customer.id);
    setError('');
    try {
      await updateDoc(doc(firebaseDb, 'users', customer.id), { isAdmin: !customer.isAdmin });
      if (!customer.isAdmin) {
        alert('تم تعيين العميل كأدمن بنجاح! ✅');
        router.push('/admin/admins');
        return;
      }
      setCustomers(customers.map((c: Customer) => c.id === customer.id ? { ...c, isAdmin: !c.isAdmin } : c));
      alert('تم إزالة صلاحيات الأدمن بنجاح! ✅');
    } catch {
      setError('خطأ في تعيين كأدمن');
      alert('حدث خطأ! ❌');
    }
    setActionLoading('');
  }

  async function handleBan(customer: Customer) {
    const check = await checkCustomerOrders(customer.id);
    if (check.hasUnpaid) {
      alert('لا يمكن حظر العميل لديه طلبات غير مدفوعة! ⚠️');
      return;
    }
    
    if (!confirm(`هل أنت متأكد من ${customer.banned ? 'إلغاء حظر' : 'حظر'} "${customer.name}"؟`)) return;
    
    setActionLoading(customer.id);
    setError('');
    try {
      await updateDoc(doc(firebaseDb, 'users', customer.id), { banned: !customer.banned });
      setCustomers(customers.map((c: Customer) => c.id === customer.id ? { ...c, banned: !c.banned } : c));
      alert(customer.banned ? 'تم إلغاء الحظر بنجاح! ✅' : 'تم حظر العميل بنجاح! ✅');
    } catch {
      setError('خطأ في الحظر');
      alert('حدث خطأ! ❌');
    }
    setActionLoading('');
  }

  async function handleDelete(customer: Customer) {
    const check = await checkCustomerOrders(customer.id);
    if (check.hasOrders) {
      alert('لا يمكن حذف العميل لديه طلبات متعلقة! ⚠️');
      return;
    }
    
    if (!confirm(`هل أنت متأكد من حذف "${customer.name}" نهائياً؟ هذا الإجراء لا يمكن التراجع عنه!`)) return;
    
    setActionLoading(customer.id);
    setError('');
    try {
      await deleteDoc(doc(firebaseDb, 'users', customer.id));
      setCustomers(customers.filter((c: Customer) => c.id !== customer.id));
      alert('تم حذف العميل بنجاح! ✅');
    } catch {
      setError('خطأ في الحذف');
      alert('حدث خطأ! ❌');
    }
    setActionLoading('');
  }

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone?.includes(searchTerm);
    
    const matchesFilter = filterStatus === 'all' ? true :
                         filterStatus === 'banned' ? customer.banned :
                         !customer.banned;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: customers.length,
    active: customers.filter(c => !c.banned).length,
    banned: customers.filter(c => c.banned).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-black text-gray-800 mb-2">👥 العملاء | Customers</h1>
            <p className="text-gray-600">قائمة العملاء وإدارة الحسابات</p>
          </div>
          <Link
            href="/admin/dashboard"
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all duration-200"
          >
            ⬅ العودة
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 ابحث عن عميل (اسم، بريد، هاتف)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 pr-12 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-lg"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-6 py-4 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-lg font-bold"
          >
            <option value="all">📊 الكل ({stats.total})</option>
            <option value="active">✅ نشط ({stats.active})</option>
            <option value="banned">🚫 محظور ({stats.banned})</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-500">
          <div className="text-3xl font-black text-blue-600">{stats.total}</div>
          <div className="text-gray-600 font-bold">إجمالي العملاء</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500">
          <div className="text-3xl font-black text-green-600">{stats.active}</div>
          <div className="text-gray-600 font-bold">العملاء النشطين</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-red-500">
          <div className="text-3xl font-black text-red-600">{stats.banned}</div>
          <div className="text-gray-600 font-bold">العملاء المحظورين</div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-bold">جاري التحميل...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {searchTerm ? 'لا توجد نتائج' : 'لا يوجد عملاء'}
          </h3>
          <p className="text-gray-600">
            {searchTerm ? 'جرب البحث بكلمات مختلفة' : 'سيظهر العملاء هنا عند التسجيل'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <th className="p-4 text-right font-black text-lg">الاسم</th>
                  <th className="p-4 text-right font-black text-lg">البريد</th>
                  <th className="p-4 text-right font-black text-lg">الهاتف</th>
                  <th className="p-4 text-center font-black text-lg">أدمن</th>
                  <th className="p-4 text-center font-black text-lg">محظور</th>
                  <th className="p-4 text-center font-black text-lg">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer: Customer, index) => (
                  <tr 
                    key={customer.id} 
                    className={`border-b hover:bg-blue-50 transition-all ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                          {customer.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{customer.name || 'بدون اسم'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{customer.email}</td>
                    <td className="p-4 text-gray-600 font-mono">{customer.phone || '-'}</td>
                    <td className="p-4 text-center">
                      {customer.isAdmin ? (
                        <span className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
                          👑 أدمن
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {customer.banned ? (
                        <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                          🚫 محظور
                        </span>
                      ) : (
                        <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                          ✅ نشط
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center flex-wrap">
                        <button
                          className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                            customer.isAdmin 
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          disabled={actionLoading === customer.id}
                          onClick={() => handleAdmin(customer)}
                          title={customer.isAdmin ? 'إزالة صلاحيات الأدمن' : 'تعيين كأدمن'}
                        >
                          {customer.isAdmin ? '👑 إزالة أدمن' : '👑 تعيين كأدمن'}
                        </button>
                        <button
                          className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                            customer.banned 
                              ? 'bg-green-500 hover:bg-green-600 text-white' 
                              : 'bg-orange-500 hover:bg-orange-600 text-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          disabled={actionLoading === customer.id}
                          onClick={() => handleBan(customer)}
                          title={customer.banned ? 'إلغاء الحظر' : 'حظر العميل'}
                        >
                          {customer.banned ? '✅ إلغاء الحظر' : '🚫 حظر'}
                        </button>
                        <button
                          className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={actionLoading === customer.id}
                          onClick={() => handleDelete(customer)}
                          title="حذف العميل نهائياً"
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Info */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="text-center text-gray-600 font-bold">
              عرض {filteredCustomers.length} من {customers.length} عميل
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-100 border-2 border-red-500 text-red-700 px-6 py-4 rounded-xl font-bold">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;


