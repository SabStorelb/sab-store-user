import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import { firebaseAuth, firebaseDb } from '../../lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore';

interface Category {
  id: string;
  name?: string;
  nameAr?: string;
  emoji?: string;
}

interface Subcategory {
  id: string;
  name?: string;
  nameAr?: string;
  parentId?: string;
}

interface Vendor {
  id: string;
  name?: string;
  nameAr?: string;
  company?: string;
}

export default function CostCalculator() {
  const router = useRouter();
  const [accessStatus, setAccessStatus] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');
  
  // Cost inputs
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [deliveryCost, setDeliveryCost] = useState(0);
  
  // Product info
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productSubcategory, setProductSubcategory] = useState('');
  const [productVendor, setProductVendor] = useState('');
  const [productNotes, setProductNotes] = useState('');
  
  // Data loading
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // Check authentication
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      if (!user) {
        setAccessStatus('unauthorized');
        router.push('/admin/login');
        return;
      }

      try {
        const tokenResult = await user.getIdTokenResult();
        const claimRole = typeof tokenResult.claims.role === 'string'
          ? tokenResult.claims.role.toLowerCase()
          : undefined;
        const claimSuperFlag = tokenResult.claims.superadmin === true;

        let isSuperAdmin = claimRole === 'superadmin' || claimSuperFlag;

        if (!isSuperAdmin) {
          const adminDoc = await getDoc(doc(firebaseDb, 'admins', user.uid));
          const firestoreRole = adminDoc.exists()
            ? (adminDoc.data()?.role as string | undefined)
            : undefined;
          isSuperAdmin = firestoreRole?.toLowerCase() === 'superadmin';
        }

        if (!isSuperAdmin) {
          setAccessStatus('unauthorized');
          return;
        }

        setAccessStatus('authorized');
      } catch (error) {
        console.error('Error checking admin role:', error);
        setAccessStatus('unauthorized');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Load categories and vendors
  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesSnap, vendorsSnap] = await Promise.all([
          getDocs(collection(firebaseDb, 'categories')),
          getDocs(collection(firebaseDb, 'suppliers'))
        ]);

        const loadedCategories = categoriesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Category));
        
        const loadedVendors = vendorsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Vendor));

        setCategories(loadedCategories);
        setVendors(loadedVendors);

        if (loadedCategories.length > 0) setProductCategory(loadedCategories[0].id);
        if (loadedVendors.length > 0) setProductVendor(loadedVendors[0].id);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }

    if (accessStatus === 'authorized') {
      loadData();
    }
  }, [accessStatus]);

  // Load subcategories when category changes
  useEffect(() => {
    if (!productCategory) {
      setSubcategories([]);
      setProductSubcategory('');
      return;
    }

    async function loadSubcategories() {
      try {
        const subcatsSnap = await getDocs(
          collection(firebaseDb, 'categories', productCategory, 'subcategory')
        );

        const loadedSubcats = subcatsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          parentId: productCategory
        } as Subcategory));

        setSubcategories(loadedSubcats);
        setProductSubcategory(''); // Reset subcategory when category changes
      } catch (error) {
        console.error('Error loading subcategories:', error);
        setSubcategories([]);
      }
    }

    loadSubcategories();
  }, [productCategory]);

  // Calculate final price
  const totalCost = useMemo(
    () => purchasePrice + shippingCost + deliveryCost,
    [purchasePrice, shippingCost, deliveryCost]
  );

  const finalPrice = useMemo(
    () => totalCost * (1 + profitMargin / 100),
    [totalCost, profitMargin]
  );

  const profitAmount = useMemo(
    () => finalPrice - totalCost,
    [finalPrice, totalCost]
  );

  const profitShare = useMemo(
    () => (finalPrice > 0 ? (profitAmount / finalPrice) * 100 : 0),
    [profitAmount, finalPrice]
  );

  const canSave = productName.trim().length > 0 && finalPrice > 0 && !isSaving;

  const createNumericHandler = useCallback(
    (setter: (value: number) => void) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const parsed = Number(event.target.value);
        setter(Number.isNaN(parsed) ? 0 : parsed);
      },
    []
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(value || 0);
  };

  const handleSave = async () => {
    if (!productName.trim() || !canSave) return;

    const user = firebaseAuth.currentUser;
    if (!user) {
      setSaveStatus('error');
      setSaveMessage('انتهت صلاحية الجلسة');
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      await addDoc(collection(firebaseDb, 'costCalculations'), {
        productName: productName.trim(),
        productCategoryId: productCategory || null,
        productSubcategoryId: productSubcategory || null,
        productVendorId: productVendor || null,
        productNotes: productNotes.trim() || null,
        purchasePrice,
        shippingCost,
        deliveryCost,
        profitMargin,
        totalCost,
        finalPrice,
        profitAmount,
        adminId: user.uid,
        adminEmail: user.email ?? null,
        createdAt: serverTimestamp(),
      });

      setSaveStatus('success');
      setSaveMessage('تم حفظ السجل بنجاح ✓');
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');
      setSaveMessage('فشل الحفظ. حاول مرة أخرى');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPurchasePrice(0);
    setProfitMargin(0);
    setShippingCost(0);
    setDeliveryCost(0);
    setProductName('');
    setProductSubcategory('');
    setProductNotes('');
    setSaveStatus('idle');
    setSaveMessage('');
  };

  const handleCopyPrice = () => {
    navigator.clipboard.writeText(finalPrice.toFixed(2));
    setSaveStatus('success');
    setSaveMessage('تم نسخ السعر ✓');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  if (accessStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
        <div className="bg-white px-8 py-10 rounded-2xl shadow-xl text-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">جاري التحقق...</h2>
        </div>
      </div>
    );
  }

  if (accessStatus === 'unauthorized') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-red-50 to-rose-50 p-6">
        <div className="max-w-md w-full bg-white border-2 border-red-200 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">غير مصرح بالوصول</h1>
          <p className="text-gray-600 mb-6">
            هذه الصفحة خاصة بالمدير العام فقط
          </p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg transition-all"
          >
            العودة إلى لوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            عودة
          </button>
          
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                <span>🛡️</span>
                SuperAdmin Only
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                حاسبة التكلفة والربح
              </h1>
              <p className="text-gray-600">
                احسب السعر النهائي المناسب لمنتجاتك بناءً على التكاليف والأرباح
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-purple-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">📦</span>
                معلومات المنتج
              </h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    اسم المنتج
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="أدخل اسم المنتج"
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    القسم
                  </label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.nameAr || cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    القسم الفرعي
                  </label>
                  {subcategories.length > 0 ? (
                    <select
                      value={productSubcategory}
                      onChange={(e) => setProductSubcategory(e.target.value)}
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                    >
                      <option value="">بدون قسم فرعي</option>
                      {subcategories.map((subcat) => (
                        <option key={subcat.id} value={subcat.id}>
                          {subcat.nameAr || subcat.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 text-center">
                      لا توجد أقسام فرعية
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    المورد
                  </label>
                  <select
                    value={productVendor}
                    onChange={(e) => setProductVendor(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  >
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.nameAr || vendor.name || vendor.company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Cost Inputs */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-purple-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">💰</span>
                التكاليف والأرباح
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    💵 سعر الشراء
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={purchasePrice === 0 ? '' : purchasePrice}
                      onChange={createNumericHandler(setPurchasePrice)}
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-10 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    📦 كلفة الشحن
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={shippingCost === 0 ? '' : shippingCost}
                      onChange={createNumericHandler(setShippingCost)}
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-10 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    🚚 كلفة التوصيل
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={deliveryCost === 0 ? '' : deliveryCost}
                      onChange={createNumericHandler(setDeliveryCost)}
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-10 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    📈 نسبة الربح
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={profitMargin === 0 ? '' : profitMargin}
                      onChange={createNumericHandler(setProfitMargin)}
                      min={0}
                      step={1}
                      placeholder="10"
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-10 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">مثال: 40 يعني ربح 40٪ فوق التكلفة</p>
                </div>
              </div>
            </div>

            {/* Cost Summary */}
            {(purchasePrice > 0 || shippingCost > 0 || deliveryCost > 0) && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl p-6 border-2 border-blue-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📊 ملخص الحسابات</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">إجمالي التكلفة</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCost)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">قيمة الربح</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(profitAmount)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-purple-100">
              <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                <span className="text-xl">📝</span>
                ملاحظات داخلية
              </label>
              <textarea
                value={productNotes}
                onChange={(e) => setProductNotes(e.target.value)}
                placeholder="ملاحظات حول المورد أو المنتج..."
                rows={3}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none resize-none"
              />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 text-white sticky top-4">
              <div className="text-center mb-6">
                <p className="text-sm font-semibold text-purple-100 mb-2">السعر النهائي</p>
                <p className="text-5xl font-black mb-2">{formatCurrency(finalPrice)}</p>
                <p className="text-xs text-purple-100">
                  {productName.trim() || 'أدخل اسم المنتج'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs mb-1">
                  <span>هامش الربح</span>
                  <span>{profitShare.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, profitShare)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCopyPrice}
                  className="w-full bg-white text-purple-600 font-bold py-3 rounded-xl hover:bg-purple-50 transition-colors shadow-lg"
                >
                  📋 نسخ السعر
                </button>

                <button
                  onClick={handleSave}
                  disabled={!canSave}
                  className={`w-full font-bold py-3 rounded-xl transition-colors shadow-lg ${
                    canSave
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-white/20 text-white/50 cursor-not-allowed'
                  }`}
                >
                  {isSaving ? '⏳ جاري الحفظ...' : '💾 حفظ السجل'}
                </button>

                {saveStatus !== 'idle' && saveMessage && (
                  <div
                    className={`text-sm text-center p-3 rounded-xl ${
                      saveStatus === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {saveMessage}
                  </div>
                )}

                <button
                  onClick={handleReset}
                  className="w-full bg-white/10 text-white font-semibold py-2 rounded-xl hover:bg-white/20 transition-colors text-sm"
                >
                  🔄 إعادة تعيين
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
