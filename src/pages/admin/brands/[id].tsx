import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { firebaseDb, firebaseStorage } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const BrandDetailsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchBrand() {
      if (!id) return;
      const snap = await getDoc(doc(firebaseDb, 'brands', String(id)));
      if (snap.exists()) {
        const data = snap.data();
        setBrand(data);
        setNameEn(data.name?.en || '');
        setNameAr(data.name?.ar || '');
        setDescEn(data.description?.en || '');
        setDescAr(data.description?.ar || '');
        setLogoUrl(data.logo || '');
        setImageUrl(data.image || '');
      }
      setLoading(false);
    }
    async function fetchProducts() {
      if (!id) return;
      const q = query(collection(firebaseDb, 'products'), where('brandId', '==', String(id)));
      const snap = await getDocs(q);
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setProductsLoading(false);
    }
    fetchBrand();
    fetchProducts();
  }, [id]);

  async function handleUpload(file: File, path: string) {
    const storageRef = ref(firebaseStorage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let logo = logoUrl, image = imageUrl;
      if (logoFile) logo = await handleUpload(logoFile, `brands/logos/${Date.now()}_${logoFile.name}`);
      if (imageFile) image = await handleUpload(imageFile, `brands/images/${Date.now()}_${imageFile.name}`);
      await updateDoc(doc(firebaseDb, 'brands', String(id)), {
        name: { en: nameEn, ar: nameAr },
        description: { en: descEn, ar: descAr },
        logo,
        image,
      });
      setEditMode(false);
      setLogoUrl(logo); setImageUrl(image);
      setBrand({ ...brand, name: { en: nameEn, ar: nameAr }, description: { en: descEn, ar: descAr }, logo, image });
    } catch (err: any) {
      setError('حدث خطأ أثناء الحفظ');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('هل أنت متأكد من حذف العلامة التجارية؟')) return;
    setSaving(true);
    try {
      await deleteDoc(doc(firebaseDb, 'brands', String(id)));
      router.push('/admin/brands');
    } catch (err) {
      setError('حدث خطأ أثناء الحذف');
    }
    setSaving(false);
  }

  if (loading) return <div className="min-h-screen p-6">جاري التحميل...</div>;
  if (!brand) return <div className="min-h-screen p-6">لم يتم العثور على العلامة التجارية.</div>;

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">تفاصيل العلامة التجارية</h1>
      <div className="bg-white rounded shadow p-6 mb-4">
        <div className="flex gap-4 items-center mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
            {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No Logo</div>}
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg">{brand.name?.ar} | {brand.name?.en}</div>
            <div className="text-sm text-gray-600">{brand.description?.ar || brand.description?.en}</div>
          </div>
        </div>
        <div className="mb-4">
          <div className="h-32 w-full bg-gray-100 rounded-lg overflow-hidden">
            {imageUrl ? <img src={imageUrl} alt="Banner" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No Banner</div>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditMode(true)} className="bg-yellow-500 text-white px-4 py-2 rounded font-bold">تعديل</button>
          <button onClick={handleDelete} disabled={saving} className="bg-red-600 text-white px-4 py-2 rounded font-bold">حذف</button>
        </div>
        {error && <div className="text-red-600 font-bold mt-2">{error}</div>}
      </div>
      {editMode && (
        <form onSubmit={handleSave} className="space-y-4 bg-white rounded shadow p-6 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-bold">الاسم (EN)</label>
              <input value={nameEn} onChange={e => setNameEn(e.target.value)} required className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block mb-1 font-bold">الاسم (AR)</label>
              <input value={nameAr} onChange={e => setNameAr(e.target.value)} required className="w-full border rounded px-2 py-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-bold">الوصف (EN)</label>
              <textarea value={descEn} onChange={e => setDescEn(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block mb-1 font-bold">الوصف (AR)</label>
              <textarea value={descAr} onChange={e => setDescAr(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-bold">تغيير الشعار (Logo)</label>
              <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="block mb-1 font-bold">تغيير صورة البانر (Banner)</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </form>
      )}
      {/* المنتجات المرتبطة */}
      <div className="bg-white rounded shadow p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">منتجات هذه العلامة التجارية</h2>
        {productsLoading ? (
          <div className="text-gray-500">جاري التحميل...</div>
        ) : products.length === 0 ? (
          <div className="text-gray-400">لا يوجد منتجات مرتبطة بهذه العلامة التجارية.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map(prod => (
              <div key={prod.id} className="border rounded-lg p-4 flex flex-col gap-2 bg-gray-50">
                <div className="font-bold text-lg">{prod.name?.ar || prod.name?.en || prod.name}</div>
                {prod.image && <img src={prod.image} alt="Product" className="w-full h-32 object-cover rounded" />}
                <div className="text-sm text-gray-600">{prod.description?.ar || prod.description?.en || ''}</div>
                <div className="text-xs text-gray-500">ID: {prod.id}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandDetailsPage;
