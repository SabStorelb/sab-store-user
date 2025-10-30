import { useState } from 'react';
import { useRouter } from 'next/router';
import { firebaseDb, firebaseStorage } from '../../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AddBanner() {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(1);
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [subtitleAr, setSubtitleAr] = useState('');
  const [subtitleEn, setSubtitleEn] = useState('');
  const [linkType, setLinkType] = useState('category');
  const [linkId, setLinkId] = useState('');

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!imageFile) {
      alert('الرجاء اختيار صورة للبانر');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Progress simulation
      setUploadProgress(25);
      
      // Upload image
      const tempId = Date.now().toString();
      const storageRef = ref(firebaseStorage, `banners/${tempId}/image.jpg`);
      await uploadBytes(storageRef, imageFile);
      
      setUploadProgress(50);
      
      const imageUrl = await getDownloadURL(storageRef);
      
      setUploadProgress(75);

      // Create banner document
      await addDoc(collection(firebaseDb, 'banners'), {
        imageUrl,
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

      setUploadProgress(100);
      
      alert('تم إضافة البانر بنجاح! ✅');
      
      // Reset form
      setImageFile(null);
      setImagePreview('');
      setTitleAr('');
      setTitleEn('');
      setSubtitleAr('');
      setSubtitleEn('');
      setLinkId('');
      setOrder(1);
      setIsActive(true);
      
      setTimeout(() => {
        router.push('/admin/banners');
      }, 500);
      
    } catch (error) {
      console.error('Error adding banner:', error);
      alert('حدث خطأ أثناء إضافة البانر ❌');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-800 mb-2">🎨 إضافة بانر جديد</h1>
            <p className="text-gray-600">أنشئ بانر ترويجي جديد للصفحة الرئيسية</p>
          </div>
          <button
            onClick={() => router.back()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all duration-200"
          >
            ⬅ العودة
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        {/* Banner Settings */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-blue-500">
          <h2 className="text-2xl font-black text-blue-600 mb-6 flex items-center gap-2">
            ⚙️ إعدادات البانر
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🔢 ترتيب العرض (Order)
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                min={1}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                required
              />
              <p className="text-xs text-gray-500 mt-1">الرقم الأصغر يظهر أولاً</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                ✅ الحالة (Active)
              </label>
              <select
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              >
                <option value="true">✅ نشط</option>
                <option value="false">⏸️ غير نشط</option>
              </select>
            </div>
          </div>
        </div>

        {/* Titles */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-purple-500">
          <h2 className="text-2xl font-black text-purple-600 mb-6 flex items-center gap-2">
            📝 العناوين
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🇸🇦 العنوان بالعربي (Title AR)
              </label>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="مثال: عروض الصيف الكبرى"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🇬🇧 العنوان بالإنجليزي (Title EN)
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Example: Big Summer Sale"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🇸🇦 النص الفرعي بالعربي (Subtitle AR)
              </label>
              <input
                type="text"
                value={subtitleAr}
                onChange={(e) => setSubtitleAr(e.target.value)}
                placeholder="مثال: خصم حتى 50%"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🇬🇧 النص الفرعي بالإنجليزي (Subtitle EN)
              </label>
              <input
                type="text"
                value={subtitleEn}
                onChange={(e) => setSubtitleEn(e.target.value)}
                placeholder="Example: Up to 50% Off"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Link Settings */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-orange-500">
          <h2 className="text-2xl font-black text-orange-600 mb-6 flex items-center gap-2">
            🔗 إعدادات الرابط
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                📂 نوع الرابط (Link Type)
              </label>
              <select
                value={linkType}
                onChange={(e) => setLinkType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
              >
                <option value="category">📂 قسم (Category)</option>
                <option value="product">📦 منتج (Product)</option>
                <option value="brand">🏷️ علامة تجارية (Brand)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🆔 معرف الرابط (Link ID)
              </label>
              <input
                type="text"
                value={linkId}
                onChange={(e) => setLinkId(e.target.value)}
                placeholder="أدخل ID من Firebase"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-green-500">
          <h2 className="text-2xl font-black text-green-600 mb-6 flex items-center gap-2">
            🖼️ صورة البانر
          </h2>
          
          {imagePreview ? (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border-4 border-green-200">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-all"
                >
                  🗑️
                </button>
              </div>
              <p className="text-sm text-gray-600 text-center">
                📁 {imageFile?.name}
              </p>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <div className="border-4 border-dashed border-green-300 rounded-xl p-12 text-center hover:border-green-500 hover:bg-green-50 transition-all">
                <div className="text-6xl mb-4">📸</div>
                <div className="text-xl font-bold text-gray-700 mb-2">
                  اضغط لاختيار صورة البانر
                </div>
                <div className="text-sm text-gray-500">
                  PNG, JPG, JPEG (الحجم المثالي: 1920x600)
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                required
              />
            </label>
          )}
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">جاري الرفع...</span>
              <span className="text-sm font-bold text-blue-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-xl font-black text-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed"
        >
          {uploading ? '⏳ جاري الرفع...' : '💾 حفظ البانر'}
        </button>
      </form>
    </div>
  );
}
