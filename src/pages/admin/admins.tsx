import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    const snap = await getDocs(collection(firebaseDb, 'admins'));
    setAdmins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await updateDoc(doc(firebaseDb, 'admins', editingId), {
          name: form.name,
          email: form.email,
          phone: form.phone,
        });
        setSuccess('تم تعديل بيانات المدير');
      } else {
        const userCred = await createUserWithEmailAndPassword(firebaseAuth, form.email, form.password);
        const uid = userCred.user.uid;

        await setDoc(doc(firebaseDb, 'admins', uid), {
          name: form.name,
          email: form.email,
          phone: form.phone,
          isAdmin: true,
          createdAt: serverTimestamp(),
        });
        setSuccess('تم إضافة المدير بنجاح');
      }

      setForm({ name: '', email: '', phone: '', password: '' });
      setEditingId('');
      setShowForm(false);
      fetchAdmins();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الحفظ');
    }

    setLoading(false);
  }

  function handleEdit(admin: any) {
    setForm({ name: admin.name, email: admin.email, phone: admin.phone || '', password: '' });
    setEditingId(admin.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا المدير؟')) return;
    try {
      await deleteDoc(doc(firebaseDb, 'admins', id));
      setAdmins(admins.filter(admin => admin.id !== id));
      setSuccess('تم حذف المدير');
    } catch {
      setError('تعذر حذف المدير');
    }
  }

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المدراء | Admins</h1>
          <p className="text-sm text-gray-500">جميع المدراء في النظام</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setForm({ name: '', email: '', phone: '', password: '' });
            setEditingId('');
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded font-bold"
        >
          {showForm ? 'إغلاق النموذج' : '➕ إضافة مدير'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow mb-6 max-w-xl mx-auto">
          <h2 className="text-lg font-bold mb-2">{editingId ? 'تعديل مدير' : 'إضافة مدير جديد'}</h2>
          <input type="text" placeholder="الاسم" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full p-2 border rounded" />
          <input type="email" placeholder="البريد الإلكتروني" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="w-full p-2 border rounded" />
          <input type="text" placeholder="رقم الهاتف" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full p-2 border rounded" />
          {!editingId && (
            <input type="password" placeholder="كلمة المرور" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required className="w-full p-2 border rounded" />
          )}
          <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white p-2 rounded font-bold">
            {loading ? 'جارٍ الحفظ...' : editingId ? 'تعديل المدير' : 'إضافة مدير'}
          </button>
          {error && <div className="text-red-600 font-bold mt-2">{error}</div>}
          {success && <div className="text-green-600 font-bold mt-2">{success}</div>}
        </form>
      )}

      <section className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-bold mb-4">قائمة المدراء</h2>
        {admins.length === 0 ? (
          <p className="text-gray-600">لا يوجد مدراء حتى الآن.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">الاسم</th>
                <th className="p-2">البريد</th>
                <th className="p-2">الهاتف</th>
                <th className="p-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id} className="border-b">
                  <td className="p-2 font-bold">{admin.name}</td>
                  <td className="p-2">{admin.email}</td>
                  <td className="p-2">{admin.phone || '-'}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={() => handleEdit(admin)} className="px-2 py-1 bg-yellow-400 rounded font-bold">تعديل</button>
                    <button onClick={() => handleDelete(admin.id)} className="px-2 py-1 bg-red-600 text-white rounded font-bold">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}