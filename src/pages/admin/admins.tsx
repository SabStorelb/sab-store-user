import { useEffect, useState } from 'react';
import { firebaseDb } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminAdmins() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAdmins() {
      setLoading(true);
      setError('');
      try {
        const snap = await getDocs(collection(firebaseDb, 'users'));
        setAdmins(snap.docs.filter(doc => doc.data().isAdmin).map(doc => ({ id: doc.id, ...doc.data() })));
      } catch {
        setError('تعذر جلب المدراء');
      }
      setLoading(false);
    }
    fetchAdmins();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المدراء | Admins</h1>
          <p className="text-sm text-gray-500">جميع المدراء في النظام</p>
        </div>
        <button onClick={() => window.history.back()} className="text-purple-600 hover:underline">⬅ العودة</button>
      </header>
      <section className="bg-white rounded shadow p-4">
        {loading ? (
          <div className="text-gray-500">جاري التحميل...</div>
        ) : admins.length === 0 ? (
          <p className="text-gray-600">لا يوجد مدراء حتى الآن.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">الاسم</th>
                <th className="p-2">البريد</th>
                <th className="p-2">هاتف</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id} className="border-b">
                  <td className="p-2 font-bold">{admin.fullName || admin.name || '-'}</td>
                  <td className="p-2">{admin.email || '-'}</td>
                  <td className="p-2">{admin.phone || '-'}</td>
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
