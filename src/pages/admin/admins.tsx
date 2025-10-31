import { useEffect, useState } from 'react';
import Link from 'next/link';
import { firebaseAuth, firebaseDb } from '../../lib/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { useAdminPermissions } from '../../lib/useAdminPermissions';

export default function AdminsPage() {
  const { admin: currentAdmin, isSuperAdmin } = useAdminPermissions();
  const [admins, setAdmins] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [permissions, setPermissions] = useState({
    canManageProducts: true,
    canManageOrders: true,
    canManageUsers: false,
    canManageCategories: true,
    canManageBrands: true,
    canManageBanners: true,
    canViewReports: true,
    canManageAdmins: false,
  });

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

    // Check if user is SuperAdmin
    if (!isSuperAdmin) {
      alert('⛔ غير مصرح - فقط المدير الرئيسي يمكنه إضافة أو تعديل المدراء!\nUnauthorized - Only SuperAdmin can add/edit admins!');
      return;
    }

    setSubmitting(true);

    try {
      if (editingId) {
        // Update basic info
        const updateData: any = {
          name: form.name,
          phone: form.phone,
          updatedAt: new Date().toISOString(),
        };

        // Update role and permissions if changed
        if (selectedRole !== 'superadmin') {
          updateData.role = selectedRole;
          updateData.permissions = permissions;
        } else {
          updateData.role = 'superadmin';
          updateData.permissions = {
            canManageProducts: true,
            canManageOrders: true,
            canManageUsers: true,
            canManageCategories: true,
            canManageBrands: true,
            canManageBanners: true,
            canViewReports: true,
            canManageAdmins: true,
          };
        }

        await updateDoc(doc(firebaseDb, 'admins', editingId), updateData);

        // Update password if provided
        if (newPassword) {
          if (newPassword !== confirmPassword) {
            alert('كلمات المرور غير متطابقة! ❌');
            setSubmitting(false);
            return;
          }

          if (newPassword.length < 6) {
            alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل! ❌');
            setSubmitting(false);
            return;
          }

          const currentAdmin = admins.find(a => a.id === editingId);
          const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: currentAdmin.email,
              newPassword,
              uid: editingId,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'فشل تغيير كلمة المرور');
          }
        }

        alert('تم تعديل بيانات المدير بنجاح! ✅');
      } else {
        // Get current user token
        const user = firebaseAuth.currentUser;
        if (!user) {
          throw new Error('يجب تسجيل الدخول أولاً');
        }
        const token = await user.getIdToken();

        // Create new admin using Admin API
        const response = await fetch('/api/admin/create-admin', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            role: selectedRole,
            permissions: selectedRole === 'superadmin' ? {
              canManageProducts: true,
              canManageOrders: true,
              canManageUsers: true,
              canManageCategories: true,
              canManageBrands: true,
              canManageBanners: true,
              canViewReports: true,
              canManageAdmins: true,
            } : permissions,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'فشل إضافة المدير');
        }

        alert('تم إضافة المدير بنجاح! ✅');
      }

      setForm({ name: '', email: '', phone: '', password: '' });
      setNewPassword('');
      setConfirmPassword('');
      setSelectedRole('admin');
      setPermissions({
        canManageProducts: true,
        canManageOrders: true,
        canManageUsers: false,
        canManageCategories: true,
        canManageBrands: true,
        canManageBanners: true,
        canViewReports: true,
        canManageAdmins: false,
      });
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
    // Check if user is SuperAdmin
    if (!isSuperAdmin) {
      alert('⛔ غير مصرح - فقط المدير الرئيسي يمكنه تعديل المدراء!\nUnauthorized - Only SuperAdmin can edit admins!');
      return;
    }

    setForm({ name: admin.name, email: admin.email, phone: admin.phone || '', password: '' });
    setNewPassword('');
    setConfirmPassword('');
    setSelectedRole(admin.role || 'admin');
    setPermissions(admin.permissions || {
      canManageProducts: true,
      canManageOrders: true,
      canManageUsers: false,
      canManageCategories: true,
      canManageBrands: true,
      canManageBanners: true,
      canViewReports: true,
      canManageAdmins: false,
    });
    setEditingId(admin.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    // Check if user is SuperAdmin
    if (!isSuperAdmin) {
      alert('⛔ غير مصرح - فقط المدير الرئيسي يمكنه حذف المدراء!\nUnauthorized - Only SuperAdmin can delete admins!');
      return;
    }

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
            {!isSuperAdmin && (
              <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>للعرض فقط</strong> - فقط المدير الرئيسي يمكنه إضافة أو تعديل المدراء
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            {isSuperAdmin && (
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setForm({ name: '', email: '', phone: '', password: '' });
                  setNewPassword('');
                  setConfirmPassword('');
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
            )}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center gap-2 sticky top-0 bg-white pb-4 border-b-2 border-gray-100">
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

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  🔑 الدور - Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                >
                  <option value="admin">👤 مدير عادي - Admin</option>
                  <option value="superadmin">👑 مدير رئيسي - SuperAdmin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  المدير الرئيسي لديه جميع الصلاحيات
                </p>
              </div>

              {/* Permissions - Only show for regular admins */}
              {selectedRole !== 'superadmin' && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-bold text-gray-700 mb-3">
                    ⚙️ الصلاحيات - Permissions
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canManageProducts}
                        onChange={(e) => setPermissions({ ...permissions, canManageProducts: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">📦 إدارة المنتجات - Manage Products</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canManageOrders}
                        onChange={(e) => setPermissions({ ...permissions, canManageOrders: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">🛒 إدارة الطلبات - Manage Orders</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canManageUsers}
                        onChange={(e) => setPermissions({ ...permissions, canManageUsers: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">👥 إدارة العملاء - Manage Customers</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canManageCategories}
                        onChange={(e) => setPermissions({ ...permissions, canManageCategories: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">📁 إدارة الفئات - Manage Categories</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canManageBrands}
                        onChange={(e) => setPermissions({ ...permissions, canManageBrands: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">🏷️ إدارة العلامات - Manage Brands</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canManageBanners}
                        onChange={(e) => setPermissions({ ...permissions, canManageBanners: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">🎨 إدارة البانرات - Manage Banners</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canViewReports}
                        onChange={(e) => setPermissions({ ...permissions, canViewReports: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">📊 عرض التقارير - View Reports</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canManageAdmins}
                        onChange={(e) => setPermissions({ ...permissions, canManageAdmins: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">🔐 إدارة المدراء - Manage Admins</span>
                    </label>
                  </div>
                </div>
              )}

              {!editingId && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    كلمة المرور *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                      placeholder="••••••••"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">6 أحرف على الأقل</p>
                </div>
              )}

              {editingId && (
                <>
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <p className="text-sm font-bold text-gray-700 mb-2">
                      🔐 تغيير كلمة المرور (اختياري)
                    </p>
                    <p className="text-xs text-gray-600 mb-3">
                      اترك الحقول فارغة إذا كنت لا تريد تغيير كلمة المرور
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      كلمة المرور الجديدة
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        placeholder="••••••••"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">6 أحرف على الأقل</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      تأكيد كلمة المرور الجديدة
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        placeholder="••••••••"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">يجب أن تتطابق مع كلمة المرور الجديدة</p>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2 border-t-2 border-gray-100 mt-6">
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
                    setNewPassword('');
                    setConfirmPassword('');
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
                  <th className="px-6 py-4 text-right text-sm font-black text-gray-700">الدور</th>
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
                    <td className="px-6 py-4">
                      {admin.role === 'superadmin' ? (
                        <span className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-lg font-bold text-xs">
                          👑 مدير رئيسي
                        </span>
                      ) : (
                        <div>
                          <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold text-xs mb-1">
                            👤 مدير عادي
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {admin.permissions?.canManageProducts && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">📦</span>
                            )}
                            {admin.permissions?.canManageOrders && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">🛒</span>
                            )}
                            {admin.permissions?.canManageUsers && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">👥</span>
                            )}
                            {admin.permissions?.canManageCategories && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">📁</span>
                            )}
                            {admin.permissions?.canManageBrands && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">🏷️</span>
                            )}
                            {admin.permissions?.canManageBanners && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">🎨</span>
                            )}
                            {admin.permissions?.canViewReports && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">📊</span>
                            )}
                            {admin.permissions?.canManageAdmins && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">🔐</span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
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
                        {isSuperAdmin ? (
                          <>
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
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm px-4 py-2">
                            🔒 للعرض فقط
                          </span>
                        )}
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