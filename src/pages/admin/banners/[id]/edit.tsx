import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { firebaseDb, firebaseStorage } from '../../../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function EditBanner() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [image, setImage] = useState('');

  useEffect(() => {
    async function fetchBanner() {
      if (!id) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(firebaseDb, 'banners', String(id)));
        if (snap.exists()) {
          setBanner(snap.data());
          setImage(snap.data().image || '');
        } else {
          setError('البانر غير موجود');
        }
      } catch {
        setError('تعذر جلب بيانات البانر');
      }
      setLoading(false);
    }
    fetchBanner();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setUploadProgress(0);
    let imageUrl = image;
    if (imageFile) {
      try {
        setUploadProgress(30);
        const storageRef = ref(firebaseStorage, `Banners/${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        setUploadProgress(60);
        imageUrl = await getDownloadURL(storageRef);
        setImage(imageUrl);
        setUploadProgress(80);
      } catch {
        setError('تعذر رفع الصورة');
        setSaving(false);
        setUploadProgress(0);
        return;
      }
    }
    try {
      await updateDoc(doc(firebaseDb, 'banners', String(id)), {
        image: imageUrl,
        isActive: banner.isActive,
        order: banner.order,
        link: banner.link,
        createdAt: banner.createdAt,
      });
      setUploadProgress(100);
      router.push('/admin/banners');
    } catch {
      setError('تعذر حفظ التعديلات');
    }
    setSaving(false);
    setUploadProgress(0);
  }

  if (loading) return <div className="p-8">جاري التحميل...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!banner) return null;

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">تعديل البانر</h1>
          <p className="text-sm text-gray-500">يمكنك تعديل بيانات البانر أو تبديل الصورة</p>
        </div>
        <button onClick={() => router.back()} className="text-purple-600 hover:underline">⬅ العودة</button>
      </header>
      <form className="bg-white rounded shadow p-6 max-w-xl mx-auto flex flex-col gap-4" onSubmit={handleSave}>
        <label className="font-bold">الصورة الحالية</label>
        {image && (
          <img src={image} alt="Banner preview" className="rounded border w-full max-w-md h-32 object-cover mb-2" />
        )}
        <label className="font-bold">تبديل الصورة</label>
        <input type="file" accept="image/*" className="border rounded p-2" onChange={e => {
          if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
          }
        }} />
        {imageFile && (
          <div className="my-2">
            <span className="text-xs">{imageFile.name}</span>
            <img src={URL.createObjectURL(imageFile)} alt="Banner preview" className="rounded border w-48 h-24 object-cover" />
          </div>
        )}
        <label className="font-bold">مفعل؟</label>
        <select className="border rounded p-2" value={banner.isActive ? 'true' : 'false'} onChange={e => setBanner({ ...banner, isActive: e.target.value === 'true' })}>
          <option value="true">نعم</option>
          <option value="false">لا</option>
        </select>
        <label className="font-bold">ترتيب العرض</label>
        <input type="number" className="border rounded p-2" value={banner.order || 1} onChange={e => setBanner({ ...banner, order: Number(e.target.value) })} min={1} />
        <label className="font-bold">نوع الرابط</label>
        <select className="border rounded p-2" value={banner.link?.type || ''} onChange={e => setBanner({ ...banner, link: { ...banner.link, type: e.target.value } })}>
          <option value="category">Category</option>
          <option value="product">Product</option>
          <option value="brand">Brand</option>
        </select>
        <label className="font-bold">معرف الرابط</label>
        <input type="text" className="border rounded p-2" value={banner.link?.id || ''} onChange={e => setBanner({ ...banner, link: { ...banner.link, id: e.target.value } })} />
        <label className="font-bold">العنوان بالعربي</label>
        <input type="text" className="border rounded p-2" value={banner.link?.titleAr || ''} onChange={e => setBanner({ ...banner, link: { ...banner.link, titleAr: e.target.value } })} />
        <label className="font-bold">العنوان بالإنجليزي</label>
        <input type="text" className="border rounded p-2" value={banner.link?.titleEn || ''} onChange={e => setBanner({ ...banner, link: { ...banner.link, titleEn: e.target.value } })} />
        <label className="font-bold">النص الفرعي بالعربي</label>
        <input type="text" className="border rounded p-2" value={banner.link?.subtitleAr || ''} onChange={e => setBanner({ ...banner, link: { ...banner.link, subtitleAr: e.target.value } })} />
        <label className="font-bold">النص الفرعي بالإنجليزي</label>
        <input type="text" className="border rounded p-2" value={banner.link?.subtitleEn || ''} onChange={e => setBanner({ ...banner, link: { ...banner.link, subtitleEn: e.target.value } })} />
        
        {/* Loading Spinner & Progress */}
        {saving && uploadProgress > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-lg font-bold text-gray-700">جاري الحفظ...</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="text-center mt-2 text-sm font-bold text-blue-600">
              {uploadProgress}%
            </div>
          </div>
        )}
        
        {error && <div className="text-red-600 font-bold">{error}</div>}
        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2" disabled={saving}>
          {saving ? (
            <>
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>جاري الحفظ...</span>
            </>
          ) : (
            '💾 حفظ التعديلات'
          )}
        </button>
      </form>
    </div>
  );
}
