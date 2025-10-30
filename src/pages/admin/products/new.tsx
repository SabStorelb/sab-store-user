import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { firebaseDb, firebaseStorage } from '../../../lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function NewProduct() {
  const router = useRouter();
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState('LBP');
  const [stock, setStock] = useState(0);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<string[]>([]);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [rate, setRate] = useState(0);
  const [available, setAvailable] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const colorOptions = [
    { ar: 'أبيض', en: 'White', hex: '#FFFFFF' },
    { ar: 'أسود', en: 'Black', hex: '#000000' },
    { ar: 'أحمر', en: 'Red', hex: '#FF0000' },
    { ar: 'أزرق', en: 'Blue', hex: '#0074D9' },
    { ar: 'أخضر', en: 'Green', hex: '#2ECC40' },
    { ar: 'أصفر', en: 'Yellow', hex: '#FFDC00' },
    { ar: 'رمادي', en: 'Gray', hex: '#AAAAAA' },
    { ar: 'برتقالي', en: 'Orange', hex: '#FF851B' },
    { ar: 'بنفسجي', en: 'Purple', hex: '#B10DC9' },
    { ar: 'وردي', en: 'Pink', hex: '#F012BE' },
    { ar: 'بني', en: 'Brown', hex: '#8B4513' },
  ];
  const [colors, setColors] = useState<{ar: string, en: string, hex: string}[]>([]);
  const ageOptions = [
    { ar: '0-6 أشهر', en: '0-6 months' },
    { ar: '6-12 شهر', en: '6-12 months' },
    { ar: '1-2 سنة', en: '1-2 years' },
    { ar: '2-3 سنوات', en: '2-3 years' },
    { ar: '3-4 سنوات', en: '3-4 years' },
    { ar: '4-5 سنوات', en: '4-5 years' },
    { ar: '5-6 سنوات', en: '5-6 years' },
    { ar: '6-7 سنوات', en: '6-7 years' },
    { ar: '7-8 سنوات', en: '7-8 years' },
    { ar: '8-10 سنوات', en: '8-10 years' },
    { ar: '10-12 سنة', en: '10-12 years' },
    { ar: '12-14 سنة', en: '12-14 years' },
    { ar: '14+ سنة', en: '14+ years' },
  ];
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const catSnap = await getDocs(collection(firebaseDb, 'categories'));
      setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const brandSnap = await getDocs(collection(firebaseDb, 'brands'));
      setBrands(brandSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchSubcategories() {
      if (!category) { setSubcategories([]); return; }
      const subSnap = await getDocs(collection(firebaseDb, 'categories', category, 'subcategory'));
      setSubcategories(subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchSubcategories();
  }, [category]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSizeToggle = (size: string) => {
    setSizes(sizes.includes(size) ? sizes.filter(s => s !== size) : [...sizes, size]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let imageUrls: string[] = [];
    if (images.length > 0) {
      for (const img of images) {
        const storageRef = ref(firebaseStorage, `products/${Date.now()}_${img.name}`);
        await uploadBytes(storageRef, img);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }
    }
    await addDoc(collection(firebaseDb, 'products'), {
      name: nameEn,
      nameAr,
      desc: descEn,
      descAr,
      price,
      currency,
      stock,
      category,
      subcategory,
      brand,
      sizes,
      ageRange,
      colors,
      deliveryTime,
      rate,
      available,
      featured,
      images: imageUrls,
      createdAt: new Date().toISOString(),
    });
    setLoading(false);
    router.push('/admin/products');
  };

  return (
    <div className="min-h-screen p-6">
      <button
        onClick={() => window.history.back()}
        className="mb-4 px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300"
      >عودة | Back</button>
      <h1 className="text-2xl font-bold mb-6">إضافة منتج - Add Product</h1>
      <form className="bg-white p-4 rounded shadow max-w-2xl" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <div className="text-sm mb-1">الاسم بالإنجليزية - Name (EN) *</div>
            <input value={nameEn} onChange={e => setNameEn(e.target.value)} required className="w-full border rounded px-3 py-2" />
          </label>
          <label className="block">
            <div className="text-sm mb-1">الاسم بالعربية - Name (AR) *</div>
            <input value={nameAr} onChange={e => setNameAr(e.target.value)} required className="w-full border rounded px-3 py-2" />
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <label className="block">
            <div className="text-sm mb-1">الوصف بالإنجليزية - Description (EN)</div>
            <textarea value={descEn} onChange={e => setDescEn(e.target.value)} className="w-full border rounded px-3 py-2" />
          </label>
          <label className="block">
            <div className="text-sm mb-1">الوصف بالعربية - Description (AR)</div>
            <textarea value={descAr} onChange={e => setDescAr(e.target.value)} className="w-full border rounded px-3 py-2" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <label className="block">
            <div className="text-sm mb-1">السعر - Price *</div>
            <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required className="w-full border rounded px-3 py-2" />
          </label>
          <label className="block">
            <div className="text-sm mb-1">العملة - Currency *</div>
            <select value={currency} onChange={e => setCurrency(e.target.value)} required className="w-full border rounded px-3 py-2">
              <option value="LBP">ليرة لبنانية (LBP)</option>
              <option value="USD">دولار أمريكي (USD)</option>
              <option value="SAR">ريال سعودي (SAR)</option>
              <option value="EUR">يورو (EUR)</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <label className="block">
            <div className="text-sm mb-1">المخزون - Stock</div>
            <input type="number" value={stock} onChange={e => setStock(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
          </label>
          <label className="block">
            <div className="text-sm mb-1">اختر الفئة - Select Category *</div>
            <select value={category} onChange={e => setCategory(e.target.value)} required className="w-full border rounded px-3 py-2">
              <option value="">اختر الفئة - Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nameAr || cat.name} | {cat.name || cat.nameAr}</option>
              ))}
            </select>
          </label>
        </div>
        {category && (
          <div className="mt-4">
            <label className="block">
              <div className="text-sm mb-1">اختر الفئة الفرعية - Select Subcategory</div>
              <select value={subcategory} onChange={e => setSubcategory(e.target.value)} className="w-full border rounded px-3 py-2">
                <option value="">اختر الفئة الفرعية - Select Subcategory</option>
                {subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.nameAr || sub.name} | {sub.name || sub.nameAr}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        <div className="mt-4">
          <label className="block mb-2">
            <div className="text-sm mb-1">الألوان المتاحة - Available Colors</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {colorOptions.map((c, i) => (
                <button
                  type="button"
                  key={i}
                  className={`px-3 py-1 rounded border flex items-center gap-2 ${colors.some(sel => sel.ar === c.ar && sel.en === c.en) ? 'bg-purple-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => {
                    if (colors.some(sel => sel.ar === c.ar && sel.en === c.en)) {
                      setColors(colors.filter(sel => sel.ar !== c.ar || sel.en !== c.en));
                    } else {
                      setColors([...colors, c]);
                    }
                  }}
                >
                  <span style={{background: c.hex, borderRadius: '50%', width: 18, height: 18, display: 'inline-block', border: '1px solid #ccc'}}></span>
                  {c.ar} | {c.en}
                </button>
              ))}
            </div>
            {colors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {colors.map((c, i) => (
                  <span key={i} className="bg-gray-200 rounded px-2 py-1 text-sm flex items-center gap-2">
                    <span style={{background: c.hex, borderRadius: '50%', width: 18, height: 18, display: 'inline-block', border: '1px solid #ccc'}}></span>
                    {c.ar} | {c.en}
                  </span>
                ))}
              </div>
            )}
          </label>
          <label className="block">
            <div className="text-sm mb-1">اختر العلامة التجارية - Brand (اختياري)</div>
            <select value={brand} onChange={e => setBrand(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">اختر العلامة التجارية - Select Brand</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.nameAr || b.name} | {b.name || b.nameAr}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4">
          <div className="text-sm mb-1">المقاسات - Sizes (اختياري)</div>
          <div className="flex flex-wrap gap-2">
            {['S','M','L','XL','2XL','3XL','4XL','5XL','6XL'].map(size => (
              <button type="button" key={size} className={`px-3 py-1 rounded border ${sizes.includes(size) ? 'bg-purple-500 text-white' : 'bg-gray-100'}`} onClick={() => handleSizeToggle(size)}>{size}</button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm mb-1">الفئة العمرية - Age Range (اختياري - للأطفال)</div>
          <div className="flex flex-wrap gap-2">
            {ageOptions.map((age, i) => (
              <button 
                type="button" 
                key={i} 
                className={`px-3 py-1 rounded border text-sm ${ageRange.some(a => a === age.en) ? 'bg-purple-500 text-white' : 'bg-gray-100'}`} 
                onClick={() => {
                  if (ageRange.includes(age.en)) {
                    setAgeRange(ageRange.filter(a => a !== age.en));
                  } else {
                    setAgeRange([...ageRange, age.en]);
                  }
                }}
              >
                {age.ar} | {age.en}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <label className="block">
            <div className="text-sm mb-1">زمن التوصيل - Delivery Time</div>
            <input value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="مثال: 2-3 أيام | Example: 2-3 days" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <label className="block">
            <div className="text-sm mb-1">التقييم - Rate (0-5)</div>
            <input type="number" min={0} max={5} value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
          </label>
          <label className="block flex items-center gap-2">
            <span>متوفر - Available</span>
            <input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)} />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <label className="block flex items-center gap-2">
            <span>منتج مميز - Featured</span>
            <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
          </label>
        </div>
        <div className="mt-4">
          <label className="block">
            <div className="text-sm mb-1">الصور - Images (اختياري)</div>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full border rounded px-3 py-2" />
            <div className="text-xs text-gray-500 mt-1">يمكنك رفع عدة صور للمنتج | You can upload multiple product images</div>
          </label>
        </div>
        <div className="mt-6 flex gap-4">
          <button type="submit" disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded">{loading ? 'جاري الإضافة...' : 'إضافة | Add'}</button>
          <Link href="/admin/products" className="bg-gray-100 px-4 py-2 rounded">إلغاء | Cancel</Link>
        </div>
      </form>
    </div>
  );
}
