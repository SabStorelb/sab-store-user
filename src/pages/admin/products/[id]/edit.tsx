import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { firebaseDb, firebaseStorage } from '../../../../lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export default function EditProduct() {
  const router = useRouter();
  const { id } = router.query;

  // Product Data
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [featured, setFeatured] = useState(false);
  
  // Images
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  // Dropdowns
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  // Load product data
  useEffect(() => {
    if (!id) return;

    async function loadProduct() {
      try {
        const productDoc = await getDoc(doc(firebaseDb, 'products', id as string));
        if (productDoc.exists()) {
          const data = productDoc.data();
          
          // Handle multi-language name
          if (typeof data.name === 'object') {
            setNameAr(data.name.ar || '');
            setNameEn(data.name.en || '');
          } else {
            setNameAr(data.nameAr || '');
            setNameEn(data.nameEn || data.name || '');
          }
          
          // Handle multi-language description
          if (typeof data.description === 'object') {
            setDescAr(data.description.ar || '');
            setDescEn(data.description.en || '');
          } else {
            setDescAr(data.descAr || '');
            setDescEn(data.descEn || data.desc || '');
          }
          
          setPrice(data.price?.toString() || '');
          setCurrency(data.currency || 'USD');
          setStock(data.stock?.toString() || '');
          setCategory(data.categoryId || '');
          setSubcategory(data.subcategoryId || '');
          setBrand(data.brandId || '');
          setFeatured(data.featured || false);
          setExistingImages(data.images || []);
        }
      } catch (error) {
        console.error('Error loading product:', error);
        alert('حدث خطأ في تحميل بيانات المنتج');
      } finally {
        setLoadingData(false);
      }
    }

    loadProduct();
  }, [id]);

  // Auto-calculate final price when cost fields change
  useEffect(() => {
    // Removed cost calculation logic; employees only set/display final price
  }, []);

  // Load categories, subcategories, and brands
  useEffect(() => {
    async function loadDropdowns() {
      const [catsSnap, brandsSnap] = await Promise.all([
        getDocs(collection(firebaseDb, 'categories')),
        getDocs(collection(firebaseDb, 'brands')),
      ]);
      
      setCategories(catsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setBrands(brandsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    
    loadDropdowns();
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (!category) {
      setSubcategories([]);
      return;
    }

    async function loadSubcategories() {
      const subsSnap = await getDocs(collection(firebaseDb, 'categories', category, 'subcategory'));
      setSubcategories(subsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    
    loadSubcategories();
  }, [category]);

  function handleNewImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...files]);
      
      const previews = files.map(file => URL.createObjectURL(file));
      setNewImagePreviews(prev => [...prev, ...previews]);
    }
  }

  function removeExistingImage(imageUrl: string) {
    setExistingImages(prev => prev.filter(img => img !== imageUrl));
    setImagesToDelete(prev => [...prev, imageUrl]);
  }

  function removeNewImage(index: number) {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!nameAr || !nameEn || !price || !category) {
      alert('الرجاء ملء جميع الحقول المطلوبة!');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setUploadStatus('جاري التحديث...');

    try {
      // Upload new images
      const newImageUrls: string[] = [];
      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];
        setUploadStatus(`جاري رفع الصورة ${i + 1} من ${newImages.length}...`);
        
        const timestamp = Date.now();
        const storageRef = ref(firebaseStorage, `products/${timestamp}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        newImageUrls.push(url);
        
        setUploadProgress(Math.round(((i + 1) / newImages.length) * 50));
      }

      // Delete removed images from storage
      for (const imageUrl of imagesToDelete) {
        try {
          const imageRef = ref(firebaseStorage, imageUrl);
          await deleteObject(imageRef);
        } catch (err) {
          console.log('Could not delete image:', imageUrl);
        }
      }

      setUploadProgress(70);
      setUploadStatus('جاري حفظ البيانات...');

      // Get category and subcategory names
      const selectedCategory = categories.find(c => c.id === category);
      const selectedSubcategory = subcategories.find(s => s.id === subcategory);
      const selectedBrand = brands.find(b => b.id === brand);

      // Combine existing images (not deleted) with new images
      const finalImages = [...existingImages, ...newImageUrls];

      const productData = {
        // Multi-language fields
        name: {
          en: nameEn,
          ar: nameAr,
        },
        description: {
          en: descEn,
          ar: descAr,
        },
        
        // Flat fields for compatibility
        nameEn,
        nameAr,
        title: nameEn,
        titleAr: nameAr,
        desc: descEn,
        descAr,
        
        // Price & Stock
        price: parseFloat(price),
        currency,
        stock: parseInt(stock) || 0,
    // No cost accounting fields for employees
        
        // Category & Brand
        categoryId: category,
        categoryName: selectedCategory?.name || '',
        categoryNameAr: selectedCategory?.nameAr || '',
        subcategoryId: subcategory || '',
        subcategoryName: selectedSubcategory?.name || '',
        subcategoryNameAr: selectedSubcategory?.nameAr || '',
        brandId: brand || '',
        brandName: selectedBrand?.name || '',
        
        // Images
        images: finalImages,
        
        // Featured
        featured,
        
        // Timestamps
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(firebaseDb, 'products', id as string), productData);

      setUploadProgress(100);
      setUploadStatus('✅ تم التحديث بنجاح!');

      // Clean up previews
      newImagePreviews.forEach(preview => URL.revokeObjectURL(preview));

      setTimeout(() => {
        router.push('/admin/products');
      }, 1000);

    } catch (error: any) {
      console.error('Error updating product:', error);
      setUploadStatus(`خطأ: ${error.message}`);
      setTimeout(() => setLoading(false), 2000);
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">جاري تحميل بيانات المنتج...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-4 md:p-8">
      {/* Upload Progress Modal */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{uploadStatus}</h3>
            </div>
            
            <div className="mb-4">
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-pink-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">{uploadProgress}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            عودة | Back
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            ✏️ تعديل منتج | Edit Product
          </h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        {/* Arabic Name */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            الاسم بالعربي <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
            placeholder="مثال: قميص قطن أزرق"
            required
          />
        </div>

        {/* English Name */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            English Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
            placeholder="Example: Blue Cotton Shirt"
            required
          />
        </div>

        {/* Arabic Description */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            الوصف بالعربي
          </label>
          <textarea
            value={descAr}
            onChange={(e) => setDescAr(e.target.value)}
            rows={4}
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none resize-none"
            placeholder="أدخل وصف المنتج بالعربي..."
          />
        </div>

        {/* English Description */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            English Description
          </label>
          <textarea
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
            rows={4}
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none resize-none"
            placeholder="Enter product description in English..."
          />
        </div>

        {/* Price & Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              السعر | Price (USD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Stock */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            المخزون | Stock
          </label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
            placeholder="0"
          />
        </div>

        {/* Category & Subcategory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              القسم | Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubcategory('');
              }}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
              required
            >
              <option value="">اختر القسم</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameAr} - {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              القسم الفرعي | Subcategory
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
              disabled={!category}
            >
              <option value="">اختر القسم الفرعي (اختياري)</option>
              {subcategories.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.nameAr} - {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Brand */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            الماركة | Brand
          </label>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
          >
            <option value="">اختر الماركة (اختياري)</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Featured */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-bold text-gray-700">
              ⭐ منتج مميز | Featured Product
            </span>
          </label>
        </div>

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              الصور الحالية | Current Images
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {existingImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`صورة ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(imageUrl)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            إضافة صور جديدة | Add New Images
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleNewImageChange}
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
          />
          
          {newImagePreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {newImagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`معاينة ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border-2 border-green-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">جديد</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            حفظ التعديلات | Save Changes
          </button>
          <Link
            href="/admin/products"
            className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
