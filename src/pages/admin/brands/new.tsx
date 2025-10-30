import { useState } from 'react';
import { firebaseDb, firebaseStorage } from '../../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function NewBrandPage() {
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload(file: File, path: string) {
    const storageRef = ref(firebaseStorage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      let logo = '', image = '';
      if (logoFile) logo = await handleUpload(logoFile, `brands/logos/${Date.now()}_${logoFile.name}`);
      if (imageFile) image = await handleUpload(imageFile, `brands/images/${Date.now()}_${imageFile.name}`);
      const brandId = Date.now().toString();
      await setDoc(doc(firebaseDb, 'brands', brandId), {
        name: { en: nameEn, ar: nameAr },
        description: { en: descEn, ar: descAr },
        logo,
        image,
      });
      setSuccess(true);
      setNameEn(''); setNameAr(''); setDescEn(''); setDescAr(''); setLogoFile(null); setImageFile(null);
    } catch (err: any) {
      setError('حدث خطأ أثناء حفظ العلامة التجارية');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">إضافة علامة تجارية جديدة</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded shadow p-6">
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
            <label className="block mb-1 font-bold">شعار العلامة التجارية (Logo)</label>
            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
          </div>
          <div>
            <label className="block mb-1 font-bold">صورة البانر (Banner)</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">
          {loading ? 'جاري الحفظ...' : 'حفظ العلامة التجارية'}
        </button>
        {success && <div className="text-green-600 font-bold mt-2">تم حفظ العلامة التجارية بنجاح!</div>}
        {error && <div className="text-red-600 font-bold mt-2">{error}</div>}
      </form>
    </div>
  );
}
