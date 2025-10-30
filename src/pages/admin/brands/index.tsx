import { useEffect, useState } from 'react';
import { firebaseDb, firebaseStorage } from '../../../lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import Link from 'next/link';
import Image from 'next/image';

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    try {
      const snap = await getDocs(collection(firebaseDb, 'brands'));
      const brandsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBrands(brandsData);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(brandId: string, logo?: string, image?: string) {
    if (!confirm('هل أنت متأكد من حذف هذه العلامة التجارية؟')) return;

    try {
      // حذف الصور من Storage
      if (logo) {
        try {
          const logoRef = ref(firebaseStorage, logo);
          await deleteObject(logoRef);
        } catch (err) {
          console.log('Logo already deleted or not found');
        }
      }
      if (image) {
        try {
          const imageRef = ref(firebaseStorage, image);
          await deleteObject(imageRef);
        } catch (err) {
          console.log('Image already deleted or not found');
        }
      }

      // حذف المستند من Firestore
      await deleteDoc(doc(firebaseDb, 'brands', brandId));
      
      // تحديث القائمة
      setBrands(brands.filter(b => b.id !== brandId));
      setDeleteConfirm(null);
      
      alert('✅ تم حذف العلامة التجارية بنجاح!');
    } catch (error) {
      console.error('Error deleting brand:', error);
      alert('❌ حدث خطأ أثناء حذف العلامة التجارية');
    }
  }

  const filteredBrands = brands.filter(brand => 
    brand.name?.ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.name?.en?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* زر العودة */}
        <Link href="/admin/dashboard">
          <button className="mb-6 px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-semibold">عودة | Back</span>
          </button>
        </Link>

        {/* عنوان الصفحة */}
        <div className="bg-gradient-to-r from-orange-600 to-yellow-600 rounded-2xl shadow-xl p-6 md:p-8 mb-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <span>🏷️</span>
                <span>العلامات التجارية | Brands</span>
              </h1>
              <p className="text-lg opacity-90">إدارة جميع العلامات التجارية</p>
            </div>
            <div className="bg-white/20 px-6 py-3 rounded-xl backdrop-blur-sm">
              <div className="text-sm opacity-80">إجمالي العلامات</div>
              <div className="text-3xl font-bold">{brands.length}</div>
            </div>
          </div>
        </div>

        {/* شريط البحث والإضافة */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-orange-100">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* بحث */}
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="🔍 ابحث عن علامة تجارية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* زر إضافة */}
            <Link href="/admin/brands/new">
              <button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إضافة علامة تجارية
              </button>
            </Link>
          </div>
        </div>

        {/* قائمة العلامات التجارية */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">جاري تحميل العلامات التجارية...</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">🏷️</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">لا يوجد علامات تجارية بعد</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? `لا توجد نتائج للبحث عن "${searchTerm}"` : 'ابدأ بإضافة أول علامة تجارية'}
            </p>
            {!searchTerm && (
              <Link href="/admin/brands/new">
                <button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all">
                  إضافة علامة تجارية جديدة
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrands.map(brand => (
              <div
                key={brand.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-orange-300 group"
              >
                {/* صورة البانر */}
                <div className="relative h-48 bg-gradient-to-br from-orange-100 to-yellow-100 overflow-hidden">
                  {brand.image ? (
                    <img
                      src={brand.image}
                      alt={brand.name?.ar || brand.name?.en}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl opacity-30">🏷️</span>
                    </div>
                  )}
                  
                  {/* Logo فوق البانر */}
                  {brand.logo && (
                    <div className="absolute bottom-4 left-4 bg-white rounded-xl p-3 shadow-lg border-2 border-orange-200">
                      <img
                        src={brand.logo}
                        alt="Logo"
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* المحتوى */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {brand.name?.ar || brand.name?.en || 'بدون اسم'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {brand.name?.en}
                  </p>
                  
                  {brand.description?.ar && (
                    <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                      {brand.description.ar}
                    </p>
                  )}

                  {/* الأزرار */}
                  <div className="flex gap-2 mt-4">
                    <Link href={`/admin/brands/${brand.id}`} className="flex-1">
                      <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        تعديل
                      </button>
                    </Link>
                    
                    <button
                      onClick={() => handleDelete(brand.id, brand.logo, brand.image)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
