import { useEffect, useState } from 'react';
import { firebaseDb } from '../../lib/firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

export default function AdminAddresses() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [users, setUsers] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const addressSnap = await getDocs(collection(firebaseDb, 'addresses'));
        const userSnap = await getDocs(collection(firebaseDb, 'users'));
        const userMap: any = {};
        userSnap.docs.forEach(doc => {
          userMap[doc.id] = doc.data();
        });
        setAddresses(addressSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setUsers(userMap);
      } catch {
        setError('تعذر جلب العناوين أو العملاء');
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا العنوان؟')) return;
    setActionId(id);
    try {
      await deleteDoc(doc(firebaseDb, 'addresses', id));
      setAddresses(addresses => addresses.filter(a => a.id !== id));
    } catch {
      setError('تعذر حذف العنوان');
    }
    setActionId(null);
  }

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">العناوين | Addresses</h1>
          <p className="text-sm text-gray-500">قائمة العناوين المرتبطة بالعملاء</p>
        </div>
        <button onClick={() => window.history.back()} className="text-purple-600 hover:underline">⬅ العودة</button>
      </header>
      <section className="bg-white rounded shadow p-4">
        {loading ? (
          <div className="text-gray-500">جاري التحميل...</div>
        ) : addresses.length === 0 ? (
          <p className="text-gray-600">لا يوجد عناوين حتى الآن.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">العنوان</th>
                <th className="p-2">العميل</th>
                <th className="p-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {addresses.map(address => (
                <tr key={address.id} className="border-b">
                  <td className="p-2 font-bold">{address.details || '-'}</td>
                  <td className="p-2">{users[address.customerId]?.name || users[address.customerId]?.email || '-'}</td>
                  <td className="p-2">
                    <button
                      className="px-2 py-1 rounded bg-red-600 text-white font-bold"
                      disabled={actionId === address.id}
                      onClick={() => handleDelete(address.id)}
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
