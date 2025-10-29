
import { useEffect, useState } from 'react';
import { firebaseDb } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const snap = await getDocs(collection(firebaseDb, 'categories'));
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Categories | الأقسام</h1>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : categories.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-6 text-gray-600 text-lg shadow">لا يوجد أقسام بعد.</div>
      ) : (
        <ul className="space-y-4">
          {categories.map(cat => (
            <li key={cat.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
              <span className="font-bold text-lg">{cat.nameAr || cat.name || 'بدون اسم'}</span>
              <span className="text-sm text-gray-500">ID: {cat.id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
