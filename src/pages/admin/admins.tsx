import { useEffect, useState } from 'react';
import Link from 'next/link';
import { firebaseAuth, firebaseDb } from '../../lib/firebase';
import {
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    try {
      const snap = await getDocs(collection(firebaseDb, 'admins'));
      setAdmins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching admins:', error);
      alert('حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        await updateDoc(doc(firebaseDb, 'admins', editingId), {
          name: form.name,
          phone: form.phone,
          updatedAt: new Date().toISOString(),
        });
        alert('تم تعديل بيانات المدير بنجاح! ✅');
      } else {
        // Create authentication account
        const userCred = await createUserWithEmailAndPassword(firebaseAuth, form.email, form.password);
        const uid = userCred.user.uid;

        // Create admin document with proper structure
        await setDoc(doc(firebaseDb, 'admins', uid), {
          name: form.name,
          email: form.email,
          phone: form.phone || '',
          role: 'admin',
          isAdmin: true,
          isActive: true,
          permissions: {
            canManageProducts: true,
            canManageOrders: true,
            canManageUsers: true,
            canManageCategories: true,
            canManageBrands: true,
            canManageBanners: true,
            canViewReports: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        alert('تم إضافة المدير بنجاح! ✅');
      }

      setForm({ name: '', email: '', phone: '', password: '' });
      setEditingId('');
      setShowForm(false);
      fetchAdmins();
    } catch (err: any) {
      console.error('Error:', err);
      alert(err.message || 'حدث خطأ أثناء الحفظ ❌');
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(admin: any) {
    setForm({ name: admin.name, email: admin.email, phone: admin.phone || '', password: '' });
    setEditingId(admin.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا المدير؟ ⚠️')) return;
    try {
      await deleteDoc(doc(firebaseDb, 'admins', id));
      setAdmins(admins.filter(admin => admin.id !== id));
      alert('تم حذف المدير بنجاح! ✅');
    } catch {
      alert('تعذر حذف المدير ❌');
    }
  }

  const filteredAdmins = admins.filter(admin => {
    const search = searchTerm.toLowerCase();
    return admin.name?.toLowerCase().includes(search) ||
           admin.email?.toLowerCase().includes(search) ||
           admin.phone?.toLowerCase().includes(search);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-black text-gray-800 mb-2">👥 المدراء | Admins</h1>
            <p className="text-gray-600">إدارة حسابات المدراء في النظام</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowForm(!showForm);
                setForm({ name: '', email: '', phone: '', password: '' });
                setEditingId('');
              }}
              className={`${
                showForm 
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                  : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white'
              } px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2`}
            >
              {showForm ? '❌ إغلاق النموذج' : '➕ إضافة مدير جديد'}
            </button>
            <Link
              href="/admin/dashboard"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all duration-200"
            >
              ⬅ العودة
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 ابحث عن مدير (الاسم، البريد، الهاتف)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 pr-12 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-lg"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-purple-500">
          <div className="text-3xl font-black text-purple-600">{admins.length}</div>
          <div className="text-gray-600 font-bold">إجمالي المدراء</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-indigo-500">
          <div className="text-3xl font-black text-indigo-600">{filteredAdmins.length}</div>
          <div className="text-gray-600 font-bold">نتائج البحث</div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center gap-2">
              {editingId ? '✏️ تعديل مدير' : '➕ إضافة مدير جديد'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الاسم *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                  placeholder="اسم المدير"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  disabled={!!editingId}
                  className={`w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all ${editingId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="admin@example.com"
                />
                {editingId && (
                  <p className="text-xs text-gray-500 mt-1">لا يمكن تعديل البريد الإلكتروني</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                  placeholder="00000000"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    كلمة المرور *
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">6 أحرف على الأقل</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '⏳ جارٍ الحفظ...' : editingId ? '✅ حفظ التعديلات' : '✅ إضافة المدير'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setForm({ name: '', email: '', phone: '', password: '' });
                    setEditingId('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all"
                >
                  ❌ إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admins List */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-bold">جاري التحميل...</p>
        </div>
      ) : filteredAdmins.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {searchTerm ? 'لا توجد نتائج' : 'لا يوجد مدراء'}
          </h3>
          <p className="text-gray-600">
            {searchTerm ? 'جرب البحث بكلمات مختلفة' : 'ابدأ بإضافة مدير جديد'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
            <h2 className="text-xl font-black text-white">📋 قائمة المدراء</h2>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-black text-gray-700">الاسم</th>
                  <th className="px-6 py-4 text-right text-sm font-black text-gray-700">البريد الإلكتروني</th>
                  <th className="px-6 py-4 text-right text-sm font-black text-gray-700">رقم الهاتف</th>
                  <th className="px-6 py-4 text-center text-sm font-black text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-purple-50 transition-all duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-black">
                          {admin.name?.charAt(0).toUpperCase() || '👤'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{admin.name}</div>
                          {admin.isAdmin && (
                            <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-bold">
                              🔐 مدير
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{admin.email}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {admin.phone ? (
                        <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-mono">
                          📞 {admin.phone}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(admin)}
                          className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 px-4 py-2 rounded-lg font-bold transition-all shadow-sm hover:shadow-md"
                        >
                          ✏️ تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm hover:shadow-md"
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
        </div>
      )}
    </div>
  );
}