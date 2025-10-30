import { useEffect, useState } from 'react';
import { firebaseDb } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';

interface Brand {
  id: string;
  name: { en: string; ar: string };
  description?: { en: string; ar: string };
  logo: string;
  image: string;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBrands() {
      const snap = await getDocs(collection(firebaseDb, 'brands'));
      setBrands(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand)));
      setLoading(false);
    }
    fetchBrands();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">العلامات التجارية | Brands</h1>
        <Link href="/admin/brands/new" className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition">إضافة علامة تجارية</Link>
      </div>
      {loading ? (
        <div className="text-gray-500">جاري التحميل...</div>
      ) : brands.length === 0 ? (
        <div className="bg-white rounded shadow p-4">لا يوجد علامات تجارية بعد.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {brands.map(brand => (
            <div key={brand.id} className="relative bg-white rounded-xl shadow-lg overflow-hidden group">
              {/* Banner image */}
              <div className="h-32 w-full bg-gray-100">
                {brand.image ? (
                  <img src={brand.image} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Banner</div>
                )}
              </div>
              {/* Logo overlay */}
              <div className="absolute left-4 top-20 w-16 h-16 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-lg">
                {brand.logo ? (
                  <img src={brand.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Logo</div>
                )}
              </div>
              <div className="pt-10 pb-4 px-4">
                <div className="font-bold text-lg mb-1">{brand.name.ar} | {brand.name.en}</div>
                {brand.description && (
                  <div className="text-sm text-gray-600 mb-2">{brand.description.ar || brand.description.en}</div>
                )}
                <Link href={`/admin/brands/${brand.id}`} className="text-blue-600 underline text-xs">عرض التفاصيل</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
