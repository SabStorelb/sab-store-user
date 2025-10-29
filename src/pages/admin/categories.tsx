
import { useEffect, useState } from 'react';
import { firebaseDb, firebaseStorage } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
      <button
        onClick={() => window.history.back()}
        className="mb-4 px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300"
      >عودة | Back</button>
      <h1 className="text-3xl font-bold mb-6">Categories | الأقسام</h1>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : categories.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-6 text-gray-600 text-lg shadow">لا يوجد أقسام بعد.</div>
      ) : (
        <ul className="space-y-4">
          {categories.map(cat => (
            <li key={cat.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
              <div className="flex items-center gap-4 mb-2">
                {cat.image && (
                  <div className="flex flex-col items-center">
                    <img src={cat.image} alt="صورة القسم" className="w-14 h-14 object-cover rounded" />
                    <button
                      className="text-xs text-red-500 mt-1 hover:underline"
                      onClick={async () => {
                        if (window.confirm('هل أنت متأكد من حذف الصورة؟')) {
                          await updateDoc(doc(firebaseDb, 'categories', cat.id), { image: '' });
                          setCategories(categories => categories.map(c => c.id === cat.id ? { ...c, image: '' } : c));
                        }
                      }}
                    >إزالة الصورة</button>
                  </div>
                )}
                <label className="cursor-pointer text-xs text-blue-600 hover:underline">
                  تغيير الصورة
                  <input type="file" accept="image/*" hidden onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const storageRef = ref(firebaseStorage, `categories/${cat.id}_${Date.now()}`);
                      await uploadBytes(storageRef, file);
                      const url = await getDownloadURL(storageRef);
                      await updateDoc(doc(firebaseDb, 'categories', cat.id), { image: url });
                      setCategories(categories => categories.map(c => c.id === cat.id ? { ...c, image: url } : c));
                    }
                  }} />
                </label>
                <button
                  className="font-bold text-lg text-left hover:text-blue-600 transition"
                  onClick={() => handleExpand(cat.id)}
                >
                  {(cat.nameAr || 'بدون اسم') + ' | ' + (cat.name || 'No Name')}
                </button>
              </div>
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
                          <div className="flex items-center gap-3">
                            {sub.image && (
                                <div className="flex flex-col items-center">
                                  <img src={sub.image} alt="صورة الفئة الفرعية" className="w-10 h-10 object-cover rounded" />
                                  <button
                                    className="text-xs text-red-500 mt-1 hover:underline"
                                    onClick={async () => {
                                      if (window.confirm('هل أنت متأكد من حذف الصورة؟')) {
                                        await updateDoc(doc(firebaseDb, 'categories', cat.id, 'subcategory', sub.id), { image: '' });
                                        setSubcategories(subs => ({
                                          ...subs,
                                          [cat.id]: subs[cat.id].map(s => s.id === sub.id ? { ...s, image: '' } : s)
                                        }));
                                      }
                                    }}
                                  >إزالة الصورة</button>
                                </div>
                              )}
                            <label className="cursor-pointer text-xs text-blue-600 hover:underline">
                              تغيير الصورة
                              <input type="file" accept="image/*" hidden onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const storageRef = ref(firebaseStorage, `subcategories/${sub.id}_${Date.now()}`);
                                  await uploadBytes(storageRef, file);
                                  const url = await getDownloadURL(storageRef);
                                  await updateDoc(doc(firebaseDb, 'categories', cat.id, 'subcategory', sub.id), { image: url });
                                  setSubcategories(subs => ({
                                    ...subs,
                                    [cat.id]: subs[cat.id].map(s => s.id === sub.id ? { ...s, image: url } : s)
                                  }));
                                }
                              }} />
                            </label>
                            <div>
                              <span className="font-semibold">{(sub.nameAr || 'بدون اسم') + ' | ' + (sub.name || 'No Name')}</span>
                              <span className="block text-xs text-gray-400">ID: {sub.id}</span>
                            </div>
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
