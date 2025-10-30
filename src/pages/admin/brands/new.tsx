import { useState } from 'react';
import { firebaseDb, firebaseStorage } from '../../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import Image from 'next/image';

export default function NewBrandPage() {
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  async function handleUpload(file: File, path: string) {
    const storageRef = ref(firebaseStorage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setUploadProgress(0);
    
    try {
      let logo = '', image = '';
      
      if (logoFile) {
        setUploadProgress(25);
        logo = await handleUpload(logoFile, `brands/logos/${Date.now()}_${logoFile.name}`);
        setUploadProgress(50);
      }
      
      if (imageFile) {
        setUploadProgress(75);
        image = await handleUpload(imageFile, `brands/images/${Date.now()}_${imageFile.name}`);
        setUploadProgress(90);
      }
      
      const brandId = Date.now().toString();
      await setDoc(doc(firebaseDb, 'brands', brandId), {
        name: { en: nameEn, ar: nameAr },
        description: { en: descEn, ar: descAr },
        logo,
        image,
        createdAt: new Date().toISOString(),
      });
      
      setUploadProgress(100);
      setSuccess(true);
      
      // إعادة تعيين النموذج
      setTimeout(() => {
        setNameEn(''); 
        setNameAr(''); 
        setDescEn(''); 
        setDescAr(''); 
        setLogoFile(null); 
        setImageFile(null);
        setLogoPreview('');
        setImagePreview('');
        setSuccess(false);
        setUploadProgress(0);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error:', err);
      setError('حدث خطأ أثناء حفظ العلامة التجارية: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* زر العودة */}
        <Link href="/admin/brands">
          <button className="mb-6 px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-semibold">عودة | Back</span>
          </button>
        </Link>

        {/* عنوان الصفحة */}
        <div className="bg-gradient-to-r from-orange-600 to-yellow-600 rounded-2xl shadow-xl p-6 md:p-8 mb-6 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <span>🏷️</span>
            <span>إضافة علامة تجارية جديدة</span>
          </h1>
          <p className="text-lg opacity-90">Add New Brand</p>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6 border-2 border-orange-100">
          {/* معلومات الاسم */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-100">
            <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              معلومات الاسم | Name Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-bold text-gray-700 text-sm">
                  الاسم بالإنجليزية | Name (EN) <span className="text-red-500">*</span>
                </label>
                <input 
                  value={nameEn} 
                  onChange={e => setNameEn(e.target.value)} 
                  required 
                  placeholder="e.g. Nike, Adidas"
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
                />
              </div>
              <div>
                <label className="block mb-2 font-bold text-gray-700 text-sm">
                  الاسم بالعربية | Name (AR) <span className="text-red-500">*</span>
                </label>
                <input 
                  value={nameAr} 
                  onChange={e => setNameAr(e.target.value)} 
                  required 
                  placeholder="مثال: نايكي، أديداس"
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-right" 
                />
              </div>
            </div>
          </div>

          {/* معلومات الوصف */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100">
            <h2 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              الوصف | Description
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-bold text-gray-700 text-sm">
                  الوصف بالإنجليزية | Description (EN)
                </label>
                <textarea 
                  value={descEn} 
                  onChange={e => setDescEn(e.target.value)} 
                  rows={4}
                  placeholder="Brand description in English..."
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none" 
                />
              </div>
              <div>
                <label className="block mb-2 font-bold text-gray-700 text-sm">
                  الوصف بالعربية | Description (AR)
                </label>
                <textarea 
                  value={descAr} 
                  onChange={e => setDescAr(e.target.value)} 
                  rows={4}
                  placeholder="وصف العلامة التجارية بالعربية..."
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none text-right" 
                />
              </div>
            </div>
          </div>

          {/* الصور */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100">
            <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              الصور | Images
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo */}
              <div>
                <label className="block mb-2 font-bold text-gray-700 text-sm">
                  شعار العلامة التجارية | Logo
                </label>
                
                {logoPreview ? (
                  <div className="relative group">
                    <div className="border-2 border-green-300 rounded-lg p-4 bg-white">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="w-full h-48 object-contain rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all group">
                    <svg className="w-12 h-12 text-gray-400 group-hover:text-green-500 transition-colors mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-600 mb-1">انقر لتحميل الشعار</span>
                    <span className="text-xs text-gray-500">PNG, JPG (Max 5MB)</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Banner */}
              <div>
                <label className="block mb-2 font-bold text-gray-700 text-sm">
                  صورة البانر | Banner Image
                </label>
                
                {imagePreview ? (
                  <div className="relative group">
                    <div className="border-2 border-green-300 rounded-lg p-4 bg-white">
                      <img 
                        src={imagePreview} 
                        alt="Banner preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all group">
                    <svg className="w-12 h-12 text-gray-400 group-hover:text-green-500 transition-colors mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-600 mb-1">انقر لتحميل البانر</span>
                    <span className="text-xs text-gray-500">PNG, JPG (Max 5MB)</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* شريط التقدم */}
          {loading && uploadProgress > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-blue-700">جاري الرفع...</span>
                <span className="text-sm font-bold text-blue-700">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* رسائل النجاح والخطأ */}
          {success && (
            <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 flex items-center gap-3 animate-pulse">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-700 font-bold">✅ تم حفظ العلامة التجارية بنجاح!</span>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4 flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 font-bold">{error}</span>
            </div>
          )}

          {/* زر الحفظ */}
          <button 
            type="submit" 
            disabled={loading || !nameEn || !nameAr}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-lg disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري الحفظ...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                حفظ العلامة التجارية | Save Brand
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
