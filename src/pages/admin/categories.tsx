
import { useEffect, useState } from 'react';
import { firebaseDb } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const [subcategories, setSubcategories] = useState<{[catId: string]: any[]}>({});
  const [subLoading, setSubLoading] = useState<string|null>(null);

  useEffect(() => {
    async function fetchCategories() {
      const snap = await getDocs(collection(firebaseDb, 'categories'));
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchCategories();
  }, []);

  async function handleExpand(catId: string) {
    if (expandedId === catId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(catId);
    if (!subcategories[catId]) {
      setSubLoading(catId);
      const snap = await getDocs(collection(firebaseDb, 'categories', catId, 'subcategory'));
      setSubcategories(prev => ({ ...prev, [catId]: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
      setSubLoading(null);
    }
  }

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
              <button
                className="font-bold text-lg text-left hover:text-blue-600 transition"
                onClick={() => handleExpand(cat.id)}
              >
                {(cat.nameAr || 'بدون اسم') + ' | ' + (cat.name || 'No Name')}
              </button>
              <span className="text-sm text-gray-500">ID: {cat.id}</span>
              {expandedId === cat.id && (
                <div className="mt-4">
                  <button
                    className="mb-3 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
                    onClick={() => alert('إضافة فئة فرعية غير مفعلة بعد | Add subcategory not implemented yet')}
                  >
                    + إضافة فئة فرعية | Add Subcategory
                  </button>
                  {subLoading === cat.id ? (
                    <div className="text-gray-400">جاري التحميل...</div>
                  ) : subcategories[cat.id] && subcategories[cat.id].length > 0 ? (
                    <ul className="space-y-2">
                      {subcategories[cat.id].map(sub => (
                        <li key={sub.id} className="bg-gray-50 rounded p-2 flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <span className="font-semibold">{(sub.nameAr || 'بدون اسم') + ' | ' + (sub.name || 'No Name')}</span>
                            <span className="block text-xs text-gray-400">ID: {sub.id}</span>
                          </div>
                          <div className="flex gap-2 mt-2 md:mt-0">
                            <button className="px-2 py-1 bg-yellow-400 text-white rounded" onClick={() => alert('تعديل الفئة الفرعية غير مفعل بعد | Edit subcategory not implemented yet')}>تعديل | Edit</button>
                            <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => alert('حذف الفئة الفرعية غير مفعل بعد | Delete subcategory not implemented yet')}>حذف | Delete</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-400">لا يوجد فئات فرعية. | No subcategories.</div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
