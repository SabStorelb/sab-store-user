import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { firebaseDb, firebaseStorage, firebaseAuth } from '../../../lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';

export default function NewProduct() {
  const router = useRouter();
  
  // Check authentication on mount
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      if (!user) {
        console.error('❌ No authenticated user found!');
        router.push('/admin/login');
      } else {
        console.log('✅ Authenticated user:', user.email);
      }
    });
    
    return () => unsubscribe();
  }, [router]);
  
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [stock, setStock] = useState(0);
  
  // Cost Accounting Fields
  const [purchasePrice, setPurchasePrice] = useState(0); // سعر الشراء
  const [profitMargin, setProfitMargin] = useState(0); // نسبة الربح %
  const [shippingCost, setShippingCost] = useState(0); // كلفة الشحن
  const [deliveryCost, setDeliveryCost] = useState(0); // كلفة التوصيل
  const [finalPrice, setFinalPrice] = useState(0); // السعر النهائي المحسوب
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
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
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

  // Auto-calculate final price when cost fields change
  useEffect(() => {
    const calculateFinalPrice = () => {
      // السعر النهائي = (سعر الشراء + كلفة الشحن + كلفة التوصيل) × (1 + نسبة الربح / 100)
      const totalCost = purchasePrice + shippingCost + deliveryCost;
      const calculated = totalCost * (1 + profitMargin / 100);
      setFinalPrice(Number(calculated.toFixed(2)));
      setPrice(Number(calculated.toFixed(2)));
    };
    
    calculateFinalPrice();
  }, [purchasePrice, profitMargin, shippingCost, deliveryCost]);

  useEffect(() => {
    async function loadData() {
      const catSnap = await getDocs(collection(firebaseDb, 'categories'));
      const loadedCategories = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(loadedCategories);
      console.log('📁 Loaded categories:', loadedCategories);
      
      const brandSnap = await getDocs(collection(firebaseDb, 'brands'));
      setBrands(brandSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadSubcategories() {
      if (!category) {
        setSubcategories([]);
        return;
      }
      
      try {
        // Load subcategories from subcollection
        const subSnap = await getDocs(collection(firebaseDb, 'categories', category, 'subcategory'));
        const subs = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('📂 Loaded subcategories for category', category, ':', subs);
        setSubcategories(subs);
      } catch (error) {
        console.error('❌ Error loading subcategories:', error);
        setSubcategories([]);
      }
    }
    
    loadSubcategories();
  }, [category]);

  function handleSizeToggle(size: string) {
    setSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  }

  // Compress image before upload
  async function compressImage(file: File, maxSizeMB = 1): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                console.log(`🗜️ Compressed ${file.name}: ${(file.size / 1024).toFixed(2)} KB → ${(compressedFile.size / 1024).toFixed(2)} KB`);
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.8 // Quality
          );
        };
      };
    });
  }

  // Upload with retry logic - SIMPLIFIED VERSION
  async function uploadImageWithRetry(file: File, retries = 2): Promise<string> {
    // Check authentication before upload
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      console.error('❌ No authenticated user - cannot upload!');
      throw new Error('يجب تسجيل الدخول أولاً');
    }
    
    console.log('🔐 Uploading as user:', currentUser.email);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`⬆️ Upload attempt ${attempt}/${retries} for ${file.name}`);
        console.log(`📦 File size: ${(file.size / 1024).toFixed(2)} KB`);
        
        const timestamp = Date.now();
        const storageRef = ref(firebaseStorage, `products/${timestamp}_${file.name}`);
        console.log('📍 Storage path:', storageRef.fullPath);
        
        // Direct upload without compression for testing
        console.log('⏳ Starting upload...');
        const uploadResult = await uploadBytes(storageRef, file);
        console.log('✅ Upload successful!');
        
        const url = await getDownloadURL(storageRef);
        console.log('🔗 Download URL obtained:', url.substring(0, 60) + '...');
        
        return url;
      } catch (error: any) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        console.error('Error code:', error.code);
        
        if (attempt === retries) {
          throw new Error(`فشل رفع الصورة ${file.name} بعد ${retries} محاولات: ${error.message}`);
        }
        
        // Wait before retry
        const waitTime = 2000; // 2 seconds
        console.log(`⏳ Waiting ${waitTime / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw new Error('Upload failed');
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(files);
      
      // Create image previews
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      setImages(files);
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Check authentication first
    const currentUser = firebaseAuth.currentUser;
    console.log('� Current user:', currentUser?.email || 'Not authenticated');
    
    if (!currentUser) {
      alert('يجب تسجيل الدخول أولاً!');
      router.push('/admin/login');
      return;
    }
    
    console.log('�🚀 Starting product upload...');
    console.log('📦 Images to upload:', images.length);
    console.log('👤 User email:', currentUser.email);
    console.log('🆔 User UID:', currentUser.uid);
    
    setLoading(true);
    setUploadProgress(0);
    setUploadStatus('جاري تحضير الصور...');
    
    try {
      const imageUrls: string[] = [];
      const totalImages = images.length;
      
      console.log('📸 Starting direct image uploads (no compression)...');
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`⬆️ Processing image ${i + 1}/${totalImages}: ${img.name}`);
        console.log(`📦 Size: ${(img.size / 1024).toFixed(2)} KB`);
        
        setUploadStatus(`جاري رفع الصورة ${i + 1} من ${totalImages}...`);
        
        try {
          // Upload with automatic retry (2 attempts)
          const url = await uploadImageWithRetry(img, 2);
          imageUrls.push(url);
          
          // Update progress
          const progress = Math.round(((i + 1) / totalImages) * 70); // 70% for images
          setUploadProgress(progress);
          console.log(`✅ Image ${i + 1}/${totalImages} completed - Progress: ${progress}%`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        } catch (imgError: any) {
          console.error(`❌ FINAL ERROR - Failed to upload image ${i + 1}:`, imgError);
          throw new Error(imgError.message || `فشل رفع الصورة ${i + 1}: ${img.name}`);
        }
      }

      console.log('💾 All images uploaded, saving to Firestore...');
      setUploadStatus('جاري حفظ بيانات المنتج...');
      setUploadProgress(80);

      // Get category and subcategory names
      const selectedCategory = categories.find(c => c.id === category);
      const selectedSubcategory = subcategories.find(s => s.id === subcategory);
      const selectedBrand = brands.find(b => b.id === brand);

      const productData = {
        // Multi-language fields (React Native app format)
        name: {
          en: nameEn,
          ar: nameAr,
        },
        description: {
          en: descEn,
          ar: descAr,
        },
        
        // Also keep flat fields for admin panel compatibility
        nameEn,
        nameAr,
        title: nameEn,
        titleAr: nameAr,
        desc: descEn,
        descAr,
        
        // Price & Stock
        price,
        currency,
        stock,
        
        // Cost Accounting
        purchasePrice,
        profitMargin,
        shippingCost,
        deliveryCost,
        finalPrice,
        totalCost: purchasePrice + shippingCost + deliveryCost,
        netProfit: finalPrice - (purchasePrice + shippingCost + deliveryCost),
        
        // Category & Brand (both ID and name)
        category: selectedCategory?.name || selectedCategory?.nameEn || 'Fashion',
        categoryName: selectedCategory?.name || selectedCategory?.nameEn || 'Fashion',
        categoryId: category,
        
        subcategory: selectedSubcategory?.name || selectedSubcategory?.nameEn || '',
        subcategoryName: selectedSubcategory?.name || selectedSubcategory?.nameEn || '',
        subcategoryId: subcategory,
        
        brand: selectedBrand?.name || selectedBrand?.nameEn || brand || 'SAB',
        brandName: selectedBrand?.name || selectedBrand?.nameEn || brand || 'SAB',
        brandId: brand,
        
        // Variants
        sizes,
        ageRange,
        colors,
        
        // Additional info
        deliveryTime,
        rating: rate,
        rate,
        reviews: 0, // Initial reviews count
        
        // Availability (React Native expects "inStock" not "available")
        available,
        inStock: available,
        
        featured,
        discount: 0, // Default no discount
        
        // Images
        images: imageUrls,
        image: imageUrls[0] || '', // Main image
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log('📄 Product data:', productData);
      
      const docRef = await addDoc(collection(firebaseDb, 'products'), productData);
      console.log('✅ Product saved with ID:', docRef.id);
      
      setUploadProgress(100);
      setUploadStatus('تم الحفظ بنجاح! جاري التحويل...');
      
      // Clean up previews
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
      
      setTimeout(() => {
        router.push('/admin/products');
      }, 500);
    } catch (error: any) {
      console.error('❌ ERROR in handleSubmit:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      setUploadStatus(`خطأ: ${error.message || 'حدث خطأ غير متوقع'}`);
      
      // Wait 3 seconds before allowing retry
      setTimeout(() => {
        setLoading(false);
        setUploadProgress(0);
      }, 3000);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-4 md:p-8">
      {/* Upload Progress Modal */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">جاري إضافة المنتج</h3>
              <p className="text-gray-600">{uploadStatus}</p>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">التقدم</span>
                <span className="text-sm font-bold text-purple-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg ${uploadProgress >= 10 ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${uploadProgress >= 70 ? 'bg-green-500' : uploadProgress >= 10 ? 'bg-purple-500' : 'bg-gray-300'}`}>
                  {uploadProgress >= 70 ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-white text-sm font-bold">1</span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">رفع الصور</span>
              </div>
              
              <div className={`flex items-center gap-3 p-3 rounded-lg ${uploadProgress >= 80 ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${uploadProgress >= 100 ? 'bg-green-500' : uploadProgress >= 80 ? 'bg-purple-500' : 'bg-gray-300'}`}>
                  {uploadProgress >= 100 ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-white text-sm font-bold">2</span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">حفظ البيانات</span>
              </div>
            </div>

            {uploadProgress === 100 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-700 font-semibold">تم الحفظ بنجاح! ✨</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2.5 bg-white rounded-xl text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200 transition-all duration-200 hover:shadow-lg flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              عودة
            </button>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent">
              ✨ إضافة منتج جديد
            </h1>
          </div>
          <Link
            href="/admin/products"
            className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            جميع المنتجات
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Info */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-purple-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-purple-100">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                1
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">📝 المعلومات الأساسية</h2>
                <p className="text-sm text-gray-500">أدخل اسم ووصف المنتج بالعربية والإنجليزية</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block">
                  <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <span className="text-2xl">🇸🇦</span>
                    <span>الاسم بالعربية *</span>
                  </div>
                  <input
                    value={nameAr}
                    onChange={e => setNameAr(e.target.value)}
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none text-lg"
                    placeholder="مثال: فستان أطفال صيفي"
                  />
                </label>
              </div>
              
              <div className="space-y-2">
                <label className="block">
                  <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <span className="text-2xl">🇬🇧</span>
                    <span>Name in English *</span>
                  </div>
                  <input
                    value={nameEn}
                    onChange={e => setNameEn(e.target.value)}
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none text-lg"
                    placeholder="Example: Kids Summer Dress"
                  />
                </label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-2">
                <label className="block">
                  <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <span className="text-xl">📄</span>
                    <span>الوصف بالعربية</span>
                  </div>
                  <textarea
                    value={descAr}
                    onChange={e => setDescAr(e.target.value)}
                    rows={4}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none resize-none"
                    placeholder="وصف تفصيلي للمنتج، المميزات، المواصفات..."
                  />
                </label>
              </div>
              
              <div className="space-y-2">
                <label className="block">
                  <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <span className="text-xl">📄</span>
                    <span>Description in English</span>
                  </div>
                  <textarea
                    value={descEn}
                    onChange={e => setDescEn(e.target.value)}
                    rows={4}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none resize-none"
                    placeholder="Detailed product description, features, specifications..."
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Price & Stock */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-green-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-green-100">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                2
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">💰 السعر والمخزون</h2>
                <p className="text-sm text-gray-500">حدد السعر، العملة وكمية المخزون</p>
              </div>
            </div>
            
            {/* Cost Accounting Section */}
            <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-bold text-green-800">🧮 حاسبة التكلفة والربح</h3>
              </div>
              <p className="text-sm text-green-700 mb-4">أدخل التكاليف وسيتم حساب السعر النهائي تلقائياً</p>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="block">
                    <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                      <span className="text-xl">💵</span>
                      <span>سعر الشراء *</span>
                    </div>
                    <input
                      type="number"
                      value={purchasePrice}
                      onChange={e => setPurchasePrice(Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-green-300 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none text-lg font-semibold bg-white"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">السعر الذي اشتريت به المنتج</p>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block">
                    <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                      <span className="text-xl">📈</span>
                      <span>نسبة الربح %</span>
                    </div>
                    <input
                      type="number"
                      value={profitMargin}
                      onChange={e => setProfitMargin(Number(e.target.value))}
                      min="0"
                      max="1000"
                      step="1"
                      className="w-full border-2 border-green-300 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none text-lg font-semibold bg-white"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">مثال: 50 تعني ربح 50%</p>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block">
                    <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                      <span className="text-xl">📦</span>
                      <span>كلفة الشحن</span>
                    </div>
                    <input
                      type="number"
                      value={shippingCost}
                      onChange={e => setShippingCost(Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-green-300 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none text-lg font-semibold bg-white"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">تكلفة شحن المنتج من المورد</p>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block">
                    <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                      <span className="text-xl">🚚</span>
                      <span>كلفة التوصيل</span>
                    </div>
                    <input
                      type="number"
                      value={deliveryCost}
                      onChange={e => setDeliveryCost(Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-green-300 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none text-lg font-semibold bg-white"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">تكلفة توصيل المنتج للعميل</p>
                  </label>
                </div>
              </div>

              {/* Calculation Summary */}
              {(purchasePrice > 0 || shippingCost > 0 || deliveryCost > 0 || profitMargin > 0) && (
                <div className="bg-white rounded-xl p-4 border-2 border-green-300 shadow-md">
                  <h4 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    ملخص الحسابات
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">سعر الشراء:</span>
                      <span className="font-semibold text-gray-800">${purchasePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">كلفة الشحن:</span>
                      <span className="font-semibold text-gray-800">${shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">كلفة التوصيل:</span>
                      <span className="font-semibold text-gray-800">${deliveryCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t-2 border-gray-200">
                      <span className="text-gray-700 font-medium">إجمالي التكلفة:</span>
                      <span className="font-bold text-gray-900">${(purchasePrice + shippingCost + deliveryCost).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-medium">نسبة الربح ({profitMargin}%):</span>
                      <span className="font-bold text-green-600">+${((purchasePrice + shippingCost + deliveryCost) * profitMargin / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-green-300 bg-green-50 -mx-4 px-4 py-2 rounded-lg">
                      <span className="text-green-800 font-bold text-base">💰 السعر النهائي المقترح:</span>
                      <span className="font-bold text-green-600 text-xl">${finalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-blue-50 -mx-4 px-4 py-2 rounded-lg">
                      <span className="text-blue-800 font-medium text-sm">صافي الربح المتوقع:</span>
                      <span className="font-bold text-blue-600">${(finalPrice - (purchasePrice + shippingCost + deliveryCost)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block">
                  <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <span className="text-xl">💵</span>
                    <span>السعر النهائي - Final Price *</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={price}
                      onChange={e => setPrice(Number(e.target.value))}
                      required
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none text-lg font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">السعر الذي سيظهر للعملاء (محسوب تلقائياً)</p>
                </label>
              </div>
              
              <div className="space-y-2">
                <label className="block">
                  <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <span className="text-xl">💱</span>
                    <span>العملة - Currency</span>
                  </div>
                  <div className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50 text-lg font-medium text-gray-700 ">دولار أمريكي (USD)
                  </div>
                </label>
              </div>

              <div className="space-y-2">
                <label className="block">
                  <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <span className="text-xl">📦</span>
                    <span>المخزون - Stock</span>
                  </div>
                  <input
                    type="number"
                    value={stock}
                    onChange={e => setStock(Number(e.target.value))}
                    min="0"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none text-lg font-semibold"
                    placeholder="0"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Categories */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-blue-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-blue-100">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                3
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">🏷️ التصنيف والعلامة التجارية</h2>
                <p className="text-sm text-gray-500">اختر الفئة والعلامة التجارية للمنتج</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block">
                  <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <span className="text-xl">📁</span>
                    <span>اختر الفئة - Select Category *</span>
                    <span className="text-xs text-gray-400">({categories.length} فئات متاحة)</span>
                  </div>
                  <select
                    value={category}
                    onChange={e => {
                      console.log('📌 Category changed to:', e.target.value);
                      setCategory(e.target.value);
                      setSubcategory(''); // Reset subcategory when category changes
                    }}
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none bg-white"
                  >
                    <option value="">اختر الفئة - Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.nameAr} | {c.nameEn}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="space-y-2">
                <label className="block">
                  <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <span className="text-xl">📂</span>
                    <span>الفئة الفرعية - Subcategory</span>
                    {subcategories.length > 0 && (
                      <span className="text-xs text-blue-600">({subcategories.length} متاحة)</span>
                    )}
                  </div>
                  <select
                    value={subcategory}
                    onChange={e => setSubcategory(e.target.value)}
                    disabled={!category || subcategories.length === 0}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                  >
                    <option value="">
                      {!category 
                        ? 'اختر الفئة الرئيسية أولاً'
                        : subcategories.length === 0
                        ? 'جاري التحميل... أو لا توجد فئات فرعية'
                        : 'اختر الفئة الفرعية'}
                    </option>
                    {subcategories.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.nameAr || sub.name || sub.id} | {sub.nameEn || sub.name || sub.id}
                      </option>
                    ))}
                  </select>
                </label>
                {subcategories.length > 0 && (
                  <div className="text-xs text-green-600 flex items-center gap-1 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">تم العثور على {subcategories.length} فئة فرعية</span>
                  </div>
                )}
                {category && subcategories.length === 0 && (
                  <div className="text-xs text-amber-600 flex items-center gap-1 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>لا توجد فئات فرعية لهذه الفئة</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block">
                  <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <span className="text-xl">🏢</span>
                    <span>اختر العلامة التجارية - Brand (اختياري)</span>
                  </div>
                  <select
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none bg-white"
                  >
                    <option value="">اختر العلامة التجارية - Select Brand</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.nameAr} | {b.nameEn}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Colors */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-pink-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-pink-100">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                4
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">🎨 الألوان المتاحة</h2>
                <p className="text-sm text-gray-500">اختر الألوان المتوفرة للمنتج</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {colorOptions.map((c, i) => (
                <button
                  type="button"
                  key={i}
                  className={`px-4 py-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all duration-200 transform hover:scale-105 ${
                    colors.some(sel => sel.ar === c.ar && sel.en === c.en)
                      ? 'bg-purple-500 text-white border-purple-600 shadow-lg'
                      : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
                  }`}
                  onClick={() => {
                    if (colors.some(sel => sel.ar === c.ar && sel.en === c.en)) {
                      setColors(colors.filter(sel => sel.ar !== c.ar || sel.en !== c.en));
                    } else {
                      setColors([...colors, c]);
                    }
                  }}
                >
                  <span 
                    style={{background: c.hex, borderRadius: '50%', width: 24, height: 24, display: 'inline-block', border: c.hex === '#FFFFFF' ? '2px solid #ddd' : '2px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}
                  ></span>
                  <span className="font-medium">{c.ar} | {c.en}</span>
                </button>
              ))}
            </div>

            {colors.length > 0 && (
              <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-sm font-semibold text-purple-800 mb-3">الألوان المختارة ({colors.length}):</div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c, i) => (
                    <span key={i} className="bg-white rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-2 shadow-sm border border-purple-100">
                      <span style={{background: c.hex, borderRadius: '50%', width: 20, height: 20, display: 'inline-block', border: c.hex === '#FFFFFF' ? '2px solid #ddd' : '2px solid rgba(0,0,0,0.1)'}}></span>
                      {c.ar} | {c.en}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Sizes & Age */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-orange-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-100">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                5
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">📏 المقاسات والفئة العمرية</h2>
                <p className="text-sm text-gray-500">اختر المقاسات والفئة العمرية المناسبة</p>
              </div>
            </div>
            
            {/* Sizes */}
            <div className="mb-6">
              <div className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
                <span className="text-xl">👕</span>
                <span>المقاسات - Sizes (اختياري)</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {['S','M','L','XL','2XL','3XL','4XL','5XL','6XL'].map(size => (
                  <button
                    type="button"
                    key={size}
                    className={`px-5 py-2.5 rounded-xl border-2 font-bold transition-all duration-200 transform hover:scale-105 ${
                      sizes.includes(size)
                        ? 'bg-orange-500 text-white border-orange-600 shadow-lg'
                        : 'bg-white border-gray-200 hover:border-orange-300 hover:shadow-md text-gray-700'
                    }`}
                    onClick={() => handleSizeToggle(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Range */}
            <div>
              <div className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
                <span className="text-xl">👶</span>
                <span>الفئة العمرية - Age Range (اختياري - للأطفال)</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {ageOptions.map((age, i) => (
                  <button 
                    type="button"
                    key={i} 
                    className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                      ageRange.some(a => a === age.en)
                        ? 'bg-orange-500 text-white border-orange-600 shadow-lg'
                        : 'bg-white border-gray-200 hover:border-orange-300 hover:shadow-md text-gray-700'
                    }`} 
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
          </div>

          {/* Section 6: Additional Info */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-indigo-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-indigo-100">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                6
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">⚙️ معلومات إضافية</h2>
                <p className="text-sm text-gray-500">زمن التوصيل، التقييم والحالة</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block">
                  <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <span className="text-xl">🚚</span>
                    <span>زمن التوصيل - Delivery Time</span>
                  </div>
                  <input
                    value={deliveryTime}
                    onChange={e => setDeliveryTime(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    placeholder="مثال: 2-3 أيام | Example: 2-3 days"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="block">
                  <div className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <span className="text-xl">⭐</span>
                    <span>التقييم - Rate (0-5)</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={rate}
                    onChange={e => setRate(Number(e.target.value))}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={e => setAvailable(e.target.checked)}
                    className="w-6 h-6 rounded-lg border-2 border-gray-300 text-indigo-600 focus:ring-4 focus:ring-indigo-100 cursor-pointer"
                  />
                  <span className="font-semibold text-gray-700">متوفر - Available</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={e => setFeatured(e.target.checked)}
                    className="w-6 h-6 rounded-lg border-2 border-gray-300 text-indigo-600 focus:ring-4 focus:ring-indigo-100 cursor-pointer"
                  />
                  <span className="font-semibold text-gray-700">منتج مميز - Featured</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 7: Images */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-teal-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-teal-100">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                7
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">📸 الصور - Images</h2>
                <p className="text-sm text-gray-500">ارفع صور المنتج (يمكنك رفع عدة صور - كلما كانت أكثر كان أفضل)</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="block">
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                    isDragging 
                      ? 'border-teal-500 bg-teal-100 scale-105 shadow-2xl' 
                      : 'border-gray-300 hover:border-teal-400 hover:bg-teal-50'
                  }`}
                >
                  <svg className={`w-16 h-16 mx-auto mb-4 transition-all duration-200 ${
                    isDragging ? 'text-teal-600 scale-125' : 'text-teal-500'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {isDragging ? (
                    <div className="text-xl font-bold text-teal-700 mb-2 animate-bounce">
                      🎯 أفلت الصور هنا!
                    </div>
                  ) : (
                    <>
                      <div className="text-lg font-semibold text-gray-700 mb-2">
                        🖱️ اضغط لاختيار الصور أو اسحبها هنا
                      </div>
                      <div className="text-sm text-gray-500 mb-3">
                        يمكنك رفع عدة صور للمنتج | Drag & drop or click to upload
                      </div>
                      <div className="text-xs text-teal-600 bg-teal-50 inline-block px-4 py-2 rounded-full">
                        💡 نصيحة: رفع 3-5 صور من زوايا مختلفة يزيد المبيعات
                      </div>
                    </>
                  )}
                </div>
              </label>
              
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-bold text-teal-800">
                      ✅ تم اختيار {images.length} صورة - جاهزة للرفع
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImages([]);
                        setImagePreviews([]);
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      حذف الكل
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {imagePreviews.map((preview, i) => (
                      <div key={i} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden shadow-lg border-2 border-white group-hover:border-teal-400 transition-all duration-200">
                          <img 
                            src={preview} 
                            alt={`Preview ${i + 1}`} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                          />
                        </div>
                        <div className="absolute top-2 right-2 bg-teal-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                          #{i + 1}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <p className="text-white text-xs truncate font-medium">{images[i].name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Array.from(images).map((img, i) => (
                      <div key={i} className="bg-white px-3 py-2 rounded-lg text-xs shadow-sm border border-teal-100 flex items-center gap-2">
                        <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 font-medium">{img.name}</span>
                        <span className="text-gray-400">({(img.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:via-pink-600 hover:to-rose-600 font-bold shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>جاري الإضافة...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>إضافة | Add</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="sm:flex-none bg-gray-200 text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-300 font-bold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>إلغاء | Cancel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

