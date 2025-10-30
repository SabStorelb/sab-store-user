import Link from 'next/link';
import { useEffect, useState } from 'react';
import { firebaseDb, firebaseStorage } from '../../../lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

export default function BannersListPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    try {
      const snapshot = await getDocs(collection(firebaseDb, 'banners'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      // ترتيب حسب order أو تاريخ الإنشاء
      data.sort((a, b) => (a.order || 0) - (b.order || 0));
      setBanners(data);
    } catch (error) {
      console.error('Error fetching banners:', error);
      alert('حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(banner: any) {
    if (!confirm(`هل أنت متأكد من حذف البانر "${banner.title || 'بدون عنوان'}"؟`)) return;

    setDeleting(banner.id);
    try {
      // حذف الصورة من Storage إذا كانت موجودة
      if (banner.imageUrl) {
        try {
          const imageRef = ref(firebaseStorage, `banners/${banner.id}/image.jpg`);
          await deleteObject(imageRef);
        } catch (error) {
          console.log('Image already deleted or does not exist');
        }
      }

      // حذف المستند من Firestore
      await deleteDoc(doc(firebaseDb, 'banners', banner.id));
      
      setBanners(banners.filter(b => b.id !== banner.id));
      alert('تم حذف البانر بنجاح! ✅');
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('حدث خطأ أثناء الحذف ❌');
    } finally {
      setDeleting(null);
    }
  }

  const filteredBanners = banners.filter(banner => {
    const title = banner.title || banner.link?.titleAr || banner.link?.titleEn || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-black text-gray-800 mb-2">🎨 البانرات | Banners</h1>
            <p className="text-gray-600">إدارة البانرات والشرائح الترويجية</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/banners/new"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-2xl">➕</span>
              إضافة بانر جديد
            </Link>
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
            placeholder="🔍 ابحث عن بانر..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 pr-12 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-lg"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-purple-500">
          <div className="text-3xl font-black text-purple-600">{banners.length}</div>
          <div className="text-gray-600 font-bold">إجمالي البانرات</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500">
          <div className="text-3xl font-black text-green-600">
            {banners.filter(b => b.isActive).length}
          </div>
          <div className="text-gray-600 font-bold">البانرات النشطة</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-gray-500">
          <div className="text-3xl font-black text-gray-600">
            {banners.filter(b => !b.isActive).length}
          </div>
          <div className="text-gray-600 font-bold">البانرات الغير نشطة</div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-bold">جاري التحميل...</p>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">لا توجد بانرات</h3>
          <p className="text-gray-600 mb-6">ابدأ بإضافة أول بانر الآن!</p>
          <Link
            href="/admin/banners/new"
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
          >
            ➕ إضافة بانر جديد
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((banner) => (
            <div
              key={banner.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Banner Image */}
              <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
                {banner.imageUrl || banner.image ? (
                  <img
                    src={banner.imageUrl || banner.image}
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">🎨</span>
                  </div>
                )}
                
                {/* Active Badge */}
                {banner.isActive ? (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    ✅ نشط
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    ⏸️ غير نشط
                  </div>
                )}
                
                {/* Order Badge */}
                {banner.order !== undefined && (
                  <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    #{banner.order}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">
                  {banner.title || banner.link?.titleAr || banner.link?.titleEn || 'بدون عنوان'}
                </h3>
                
                {(banner.subtitle || banner.link?.subtitleAr || banner.link?.subtitleEn) && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {banner.subtitle || banner.link?.subtitleAr || banner.link?.subtitleEn}
                  </p>
                )}

                {/* Info */}
                <div className="space-y-2 mb-4 text-xs text-gray-500">
                  {banner.link?.type && (
                    <div className="flex items-center gap-2">
                      <span className="font-bold">🔗 النوع:</span>
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">{banner.link.type}</span>
                    </div>
                  )}
                  {banner.createdAt && (
                    <div className="flex items-center gap-2">
                      <span className="font-bold">📅 تاريخ الإنشاء:</span>
                      <span>{new Date(banner.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/admin/banners/${banner.id}/edit`}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-bold text-center transition-all"
                  >
                    ✏️ تعديل
                  </Link>
                  <button
                    onClick={() => handleDelete(banner)}
                    disabled={deleting === banner.id}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === banner.id ? '⏳' : '🗑️'} حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
