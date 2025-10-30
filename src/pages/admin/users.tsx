import { useEffect, useState } from 'react';
import { firebaseDb } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError('');
      try {
        const snap = await getDocs(collection(firebaseDb, 'users'));
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch {
        setError('تعذر جلب المستخدمين');
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المستخدمين | Users</h1>
          <p className="text-sm text-gray-500">جميع الحسابات المسجلة في النظام</p>
        </div>
        <button onClick={() => window.history.back()} className="text-purple-600 hover:underline">⬅ العودة</button>
      </header>
      <section className="bg-white rounded shadow p-4">
        {loading ? (
          <div className="text-gray-500">جاري التحميل...</div>
        ) : users.length === 0 ? (
          <p className="text-gray-600">لا يوجد مستخدمين حتى الآن.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">الاسم</th>
                <th className="p-2">البريد</th>
                <th className="p-2">هاتف</th>
                <th className="p-2">نوع الحساب</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b">
                  <td className="p-2 font-bold">{user.name || '-'}</td>
                  <td className="p-2">{user.email || '-'}</td>
                  <td className="p-2">{user.phone || '-'}</td>
                  <td className="p-2">{user.isAdmin ? 'مدير' : 'عميل'}</td>
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
