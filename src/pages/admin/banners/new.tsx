import { useState } from 'react';
import { useRouter } from 'next/router';
import { firebaseDb, firebaseStorage } from '../../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AddBanner() {
  const router = useRouter();
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(1);
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [subtitleAr, setSubtitleAr] = useState('');
  const [subtitleEn, setSubtitleEn] = useState('');
  const [linkType, setLinkType] = useState('category');
  const [linkId, setLinkId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    let imageUrl = image;
    if (imageFile) {
      setUploading(true);
      try {
        const storageRef = ref(firebaseStorage, `Banners/${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
        setImage(imageUrl);
      } catch {
        setError('تعذر رفع الصورة');
        setUploading(false);
        setLoading(false);
        return;
      }
      setUploading(false);
    }
    try {
      await addDoc(collection(firebaseDb, 'banners'), {
        image: imageUrl,
        isActive,
        order,
        link: {
          type: linkType,
          id: linkId,
          titleAr,
          titleEn,
          subtitleAr,
          subtitleEn,
        },
        createdAt: new Date().toISOString(),
      });
      router.push('/admin/banners');
    } catch {
      setError('تعذر إضافة البنر');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إضافة بنر جديد</h1>
          <p className="text-sm text-gray-500">أدخل بيانات البنر كما في Firebase</p>
        </div>
        <button onClick={() => router.back()} className="text-purple-600 hover:underline">⬅ العودة</button>
      </header>
      <form className="bg-white rounded shadow p-6 max-w-xl mx-auto flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="font-bold">رفع صورة البنر</label>
        <input type="file" accept="image/*" className="border rounded p-2" onChange={e => {
          if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setImage('');
          }
        }} />
        {imageFile && (
          <div className="my-2 flex flex-col items-start gap-2">
            <span className="text-xs">{imageFile.name}</span>
            <img src={URL.createObjectURL(imageFile)} alt="Banner preview" className="rounded border w-48 h-24 object-cover" />
          </div>
        )}
        {image && !imageFile && (
          <div className="my-2 flex flex-col items-start gap-2">
            <span className="text-xs">معاينة الصورة من الرابط</span>
            <img src={image} alt="Banner preview" className="rounded border w-48 h-24 object-cover" />
          </div>
        )}
        <label className="font-bold">أو رابط الصورة (اختياري)</label>
        <input type="text" className="border rounded p-2" value={image} onChange={e => { setImage(e.target.value); setImageFile(null); }} placeholder="https://..." />
        {uploading && <div className="text-purple-600">جاري رفع الصورة...</div>}

        <label className="font-bold">مفعل؟ (isActive)</label>
        <select className="border rounded p-2" value={isActive ? 'true' : 'false'} onChange={e => setIsActive(e.target.value === 'true')}>
          <option value="true">نعم</option>
          <option value="false">لا</option>
        </select>

        <label className="font-bold">ترتيب العرض (order)</label>
        <input type="number" className="border rounded p-2" value={order} onChange={e => setOrder(Number(e.target.value))} min={1} />

        <label className="font-bold">نوع الرابط (link.type)</label>
        <select className="border rounded p-2" value={linkType} onChange={e => setLinkType(e.target.value)}>
          <option value="category">Category</option>
          <option value="product">Product</option>
          <option value="brand">Brand</option>
        </select>

        <label className="font-bold">معرف الرابط (link.id)</label>
        <input type="text" className="border rounded p-2" value={linkId} onChange={e => setLinkId(e.target.value)} required />

        <label className="font-bold">العنوان بالعربي (link.titleAr)</label>
        <input type="text" className="border rounded p-2" value={titleAr} onChange={e => setTitleAr(e.target.value)} required />

        <label className="font-bold">العنوان بالإنجليزي (link.titleEn)</label>
        <input type="text" className="border rounded p-2" value={titleEn} onChange={e => setTitleEn(e.target.value)} required />

        <label className="font-bold">النص الفرعي بالعربي (link.subtitleAr)</label>
        <input type="text" className="border rounded p-2" value={subtitleAr} onChange={e => setSubtitleAr(e.target.value)} required />

        <label className="font-bold">النص الفرعي بالإنجليزي (link.subtitleEn)</label>
        <input type="text" className="border rounded p-2" value={subtitleEn} onChange={e => setSubtitleEn(e.target.value)} required />

        {error && <div className="text-red-600 font-bold">{error}</div>}
        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? 'جاري الإضافة...' : 'إضافة البنر'}
        </button>
      </form>
    </div>
  );
}
