
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { firebaseDb } from '../../lib/firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';

export default function AdminBanners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBanners() {
      setLoading(true);
      setError(null);
      try {
  const snap = await getDocs(collection(firebaseDb, 'banners'));
  setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e: any) {
        setError('خطأ في جلب البنارات');
      }
      setLoading(false);
    }
    fetchBanners();
  }, []);

  async function handleToggleActive(id: string, current: boolean) {
    setActionId(id);
    try {
  await updateDoc(doc(firebaseDb, 'banners', id), { active: !current });
      setBanners(banners => banners.map(b => b.id === id ? { ...b, active: !current } : b));
    } catch {
      alert('تعذر تغيير حالة البنر');
    }
    setActionId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا البنر؟')) return;
    setActionId(id);
    try {
  await deleteDoc(doc(firebaseDb, 'banners', id));
      setBanners(banners => banners.filter(b => b.id !== id));
    } catch {
      alert('تعذر حذف البنر');
    }
    setActionId(null);
  }

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Banners</h1>
          <p className="text-sm text-gray-500">إدارة البنارات والشرائح الترويجية</p>
        </div>
        <Link href="/admin" className="text-purple-600 hover:underline">⬅ العودة</Link>
      </header>

      <nav className="mb-6 space-x-3">
        <Link href="/admin/products" className="px-3 py-1 bg-gray-100 rounded">Products</Link>
        <Link href="/admin/brands" className="px-3 py-1 bg-gray-100 rounded">Brands</Link>
        <Link href="/admin/categories" className="px-3 py-1 bg-gray-100 rounded">Categories</Link>
        <Link href="/admin/orders" className="px-3 py-1 bg-gray-100 rounded">Orders</Link>
      </nav>

      <div className="mb-4">
        <Link href="/admin/banners/new" className="bg-purple-600 text-white px-4 py-2 rounded">Add Banner</Link>
      </div>

      <section className="bg-white rounded shadow p-4">
        {loading ? (
          <div className="text-gray-500">جاري التحميل...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : banners.length === 0 ? (
          <p className="text-gray-600">لا توجد بنارات حتى الآن.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {banners.map(banner => (
              <div key={banner.id} className="border rounded-lg p-4 flex flex-col gap-2 relative">
                {banner.imageUrl && (
                  <img src={banner.imageUrl} alt={banner.title} className="w-full h-32 object-cover rounded" />
                )}
                <div className="font-bold text-lg">
                  {typeof banner.title === 'string' ? banner.title : JSON.stringify(banner.title)}
                </div>
                <div className="text-sm text-gray-500">
                  {typeof banner.subtitle === 'string' ? banner.subtitle : JSON.stringify(banner.subtitle)}
                </div>
                {banner.link && (
                  typeof banner.link === 'string' ? (
                    <a href={banner.link} target="_blank" rel="noopener" className="text-purple-600 underline text-xs">{banner.link}</a>
                  ) : (
                    <span className="text-purple-600 text-xs">{JSON.stringify(banner.link)}</span>
                  )
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    className={`px-3 py-1 rounded text-xs ${banner.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                    disabled={actionId === banner.id}
                    onClick={() => handleToggleActive(banner.id, banner.active)}
                  >
                    {banner.active ? 'مفعل' : 'غير مفعل'}
                  </button>
                  <Link href={`/admin/banners/${banner.id}`} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs">تعديل</Link>
                  <button
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs"
                    disabled={actionId === banner.id}
                    onClick={() => handleDelete(banner.id)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
