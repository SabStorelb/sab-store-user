import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import { firebaseAuth, firebaseDb } from '../../lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore';

type InputField = {
  key: 'purchasePrice' | 'profitMargin' | 'shippingCost' | 'deliveryCost';
  icon: string;
  label: string;
  labelEn: string;
  description: string;
  placeholder?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  type: 'currency' | 'percentage';
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type InputSection = {
  title: string;
  subtitle: string;
  fields: InputField[];
};

type CategoryRecord = {
  id: string;
  name?: string;
  nameAr?: string;
  slug?: string;
  emoji?: string;
  icon?: string;
};

type CategoryOption = {
  value: string;
  label: string;
  labelEn?: string;
  emoji?: string;
  source?: CategoryRecord;
};

type SubcategoryRecord = {
  id: string;
  name?: string;
  nameAr?: string;
  slug?: string;
  parentId?: string;
};

type SubcategoryOption = {
  value: string;
  label: string;
  labelEn?: string;
  source?: SubcategoryRecord;
};

type VendorRecord = {
  id: string;
  name?: string;
  nameAr?: string;
  company?: string;
  contactName?: string;
  email?: string;
  phone?: string;
};

type VendorOption = {
  value: string;
  label: string;
  labelEn?: string;
  contact?: string;
  source?: VendorRecord;
};

export default function CostCalculator() {
  const router = useRouter();
  const [accessStatus, setAccessStatus] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productSubcategory, setProductSubcategory] = useState('');
  const [productVendor, setProductVendor] = useState('');
  const [productNotes, setProductNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<SubcategoryRecord[]>([]);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
  const [subcategoryError, setSubcategoryError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [vendorError, setVendorError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      setIsLoadingCategories(true);
      setCategoryError(null);

      try {
        const snap = await getDocs(collection(firebaseDb, 'categories'));
        if (!isMounted) return;

        const loaded = snap.docs
          .map((document) => {
            const data = document.data() as CategoryRecord;
            return {
              id: document.id,
              name: data.name,
              nameAr: data.nameAr,
              slug: data.slug,
              emoji: data.emoji ?? data.icon ?? '📂',
            } satisfies CategoryRecord;
          })
          .sort((a, b) => {
            const labelA = (a.nameAr || a.name || '').toString();
            const labelB = (b.nameAr || b.name || '').toString();
            return labelA.localeCompare(labelB, 'ar');
          });

        setCategories(loaded);

        if (loaded.length > 0) {
          setProductCategory((prev) => (prev && loaded.some((cat) => cat.id === prev) ? prev : loaded[0].id));
        }
      } catch (error) {
        console.error('Error loading categories for calculator:', error);
        if (isMounted) {
          setCategoryError('تعذر تحميل الأقسام من قاعدة البيانات. تم تفعيل قائمة افتراضية كحل مؤقت.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    }

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const fallbackCategoryOptions = useMemo(
    () => [
      { value: 'general', label: 'منتجات عامة', labelEn: 'General', emoji: '🛍️' },
      { value: 'fashion', label: 'ملابس وإكسسوارات', labelEn: 'Fashion & Accessories', emoji: '👗' },
      { value: 'beauty', label: 'منتجات تجميل', labelEn: 'Beauty', emoji: '💄' },
      { value: 'electronics', label: 'إلكترونيات', labelEn: 'Electronics', emoji: '💡' },
      { value: 'home', label: 'أدوات منزلية', labelEn: 'Home Goods', emoji: '🏠' },
      { value: 'food', label: 'مواد غذائية', labelEn: 'Food', emoji: '🍱' },
      { value: 'health', label: 'صحة وعناية', labelEn: 'Health & Care', emoji: '🩺' },
      { value: 'other', label: 'أخرى', labelEn: 'Other', emoji: '🧩' },
    ],
    [],
  );

  const categoryOptions = useMemo<CategoryOption[]>(() => {
    if (categories.length > 0) {
      return categories.map((category) => ({
        value: category.id,
        label: category.nameAr || category.name || 'قسم غير مسمى',
        labelEn: category.name || undefined,
        emoji: category.emoji || '📂',
        source: category,
      }));
    }

    return fallbackCategoryOptions;
  }, [categories, fallbackCategoryOptions]);

  useEffect(() => {
    if (!productCategory && categoryOptions.length > 0) {
      setProductCategory(categoryOptions[0].value);
    }
  }, [categoryOptions, productCategory]);

  const selectedCategory = useMemo(
    () => categoryOptions.find((option) => option.value === productCategory) ?? null,
    [categoryOptions, productCategory],
  );

  useEffect(() => {
    if (!productCategory) {
      setSubcategories([]);
      setProductSubcategory('');
      return;
    }

    let isMounted = true;

    async function fetchSubcategories() {
      setIsLoadingSubcategories(true);
      setSubcategoryError(null);

      try {
        const snap = await getDocs(collection(firebaseDb, 'categories', productCategory, 'subcategory'));
        if (!isMounted) return;

        const loaded = snap.docs
          .map((document) => {
            const data = document.data() as SubcategoryRecord;
            return {
              id: document.id,
              name: data.name,
              nameAr: data.nameAr,
              slug: data.slug,
              parentId: productCategory,
            } satisfies SubcategoryRecord;
          })
          .sort((a, b) => {
            const labelA = (a.nameAr || a.name || '').toString();
            const labelB = (b.nameAr || b.name || '').toString();
            return labelA.localeCompare(labelB, 'ar');
          });

  setSubcategories(loaded);
  setProductSubcategory((prev) => (prev && loaded.some((item) => item.id === prev) ? prev : ''));
      } catch (error) {
        console.error('Error loading subcategories for calculator:', error);
        if (isMounted) {
          setSubcategories([]);
          setProductSubcategory('');
          setSubcategoryError('تعذر تحميل الأقسام الفرعية لهذا القسم.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSubcategories(false);
        }
      }
    }

    fetchSubcategories();

    return () => {
      isMounted = false;
    };
  }, [productCategory]);

  const subcategoryOptions = useMemo<SubcategoryOption[]>(() => {
    if (subcategories.length === 0) {
      return [];
    }

    return [
      { value: '', label: 'بدون قسم فرعي', labelEn: 'No Subcategory' },
      ...subcategories.map((subcategory) => ({
        value: subcategory.id,
        label: subcategory.nameAr || subcategory.name || 'قسم فرعي غير مسمى',
        labelEn: subcategory.name || undefined,
        source: subcategory,
      })),
    ];
  }, [subcategories]);

  const selectedSubcategory = useMemo(
    () => subcategoryOptions.find((option) => option.value === productSubcategory) ?? null,
    [productSubcategory, subcategoryOptions],
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchVendors() {
      setIsLoadingVendors(true);
      setVendorError(null);

      try {
        const snap = await getDocs(collection(firebaseDb, 'suppliers'));
        if (!isMounted) return;

        const loaded = snap.docs
          .map((document) => {
            const data = document.data() as VendorRecord;
            return {
              id: document.id,
              name: data.name,
              nameAr: data.nameAr,
              company: data.company,
              contactName: data.contactName,
              email: data.email,
              phone: data.phone,
            } satisfies VendorRecord;
          })
          .sort((a, b) => {
            const labelA = (a.nameAr || a.name || a.company || '').toString();
            const labelB = (b.nameAr || b.name || b.company || '').toString();
            return labelA.localeCompare(labelB, 'ar');
          });

        setVendors(loaded);
        setProductVendor((prev) => (prev && loaded.some((vendor) => vendor.id === prev) ? prev : loaded[0]?.id || ''));
      } catch (error) {
        console.error('Error loading vendors for calculator:', error);
        if (isMounted) {
          setVendors([]);
          setProductVendor('');
          setVendorError('تعذر تحميل قائمة الموردين. تم استخدام قائمة افتراضية مؤقتاً.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingVendors(false);
        }
      }
    }

    fetchVendors();

    return () => {
      isMounted = false;
    };
  }, []);

  const fallbackVendorOptions = useMemo<VendorOption[]>(
    () => [
      { value: 'internal-stock', label: 'المخزون الداخلي', labelEn: 'Internal Stock' },
      { value: 'local-supplier', label: 'مورد محلي', labelEn: 'Local Supplier' },
      { value: 'international-partner', label: 'شريك خارجي', labelEn: 'International Partner' },
    ],
    [],
  );

  const vendorOptions = useMemo<VendorOption[]>(() => {
    if (vendors.length > 0) {
      return vendors.map((vendor) => ({
        value: vendor.id,
        label: vendor.nameAr || vendor.name || vendor.company || 'مورد غير مسمى',
        labelEn: vendor.name || vendor.company || undefined,
        contact: vendor.contactName,
        source: vendor,
      }));
    }

    return fallbackVendorOptions;
  }, [vendors, fallbackVendorOptions]);

  useEffect(() => {
    if (!productVendor && vendorOptions.length > 0) {
      setProductVendor(vendorOptions[0].value);
    }
  }, [vendorOptions, productVendor]);

  const selectedVendor = useMemo(
    () => vendorOptions.find((option) => option.value === productVendor) ?? null,
    [productVendor, vendorOptions],
  );

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

        // إذا لم يكن SuperAdmin في التوكن، تحقق من قاعدة البيانات
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
      // (Removed misplaced Firestore admin check, already handled in useEffect above)

  // Auto-calculate final price
  useEffect(() => {
    const totalCost = purchasePrice + shippingCost + deliveryCost;
    const calculated = totalCost * (1 + profitMargin / 100);
    setFinalPrice(Number(calculated.toFixed(2)));
  }, [purchasePrice, profitMargin, shippingCost, deliveryCost]);

  const createNumericHandler = useCallback(
    (setter: (value: number) => void) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const parsed = Number(event.target.value);
        setter(Number.isNaN(parsed) ? 0 : parsed);
      },
    [],
  );

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    [],
  );

  const dateTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }),
    [],
  );

  const formatCurrency = useCallback(
    (value: number) => currencyFormatter.format(value || 0),
    [currencyFormatter],
  );

  const totalCost = useMemo(
    () => purchasePrice + shippingCost + deliveryCost,
    [purchasePrice, shippingCost, deliveryCost],
  );

  const profitAmount = useMemo(
    () => totalCost * (profitMargin / 100),
    [totalCost, profitMargin],
  );

  const netProfit = useMemo(() => finalPrice - totalCost, [finalPrice, totalCost]);

  const profitShare = useMemo(
    () => (finalPrice > 0 ? Math.min(100, Math.max(0, (profitAmount / finalPrice) * 100)) : 0),
    [profitAmount, finalPrice],
  );

  const hasInputs = purchasePrice > 0 || shippingCost > 0 || deliveryCost > 0 || profitMargin > 0;

  const canSaveRecord = useMemo(
    () => productName.trim().length > 0 && finalPrice > 0 && !isSaving,
    [productName, finalPrice, isSaving],
  );

  const lastSavedLabel = useMemo(
    () => (lastSavedAt ? dateTimeFormatter.format(lastSavedAt) : null),
    [dateTimeFormatter, lastSavedAt],
  );

  const inputSections: InputSection[] = useMemo(
    () => [
      {
        title: 'التكاليف الأساسية',
        subtitle: 'أدخل كل ما تدفعه فعلياً للحصول على المنتج وتسليمه.',
        fields: [
          {
            key: 'purchasePrice',
            icon: '💵',
            label: 'سعر الشراء',
            labelEn: 'Purchase Price',
            description: 'السعر الذي دفعتَه للمورد مقابل المنتج الواحد.',
            placeholder: '0.00',
            value: purchasePrice,
            min: 0,
            step: 0.01,
            required: true,
            type: 'currency',
            onChange: createNumericHandler(setPurchasePrice),
          },
          {
            key: 'shippingCost',
            icon: '📦',
            label: 'كلفة الشحن',
            labelEn: 'Shipping Cost',
            description: 'تكلفة شحن المنتج من المورد أو المخزن.',
            placeholder: '0.00',
            value: shippingCost,
            min: 0,
            step: 0.01,
            type: 'currency',
            onChange: createNumericHandler(setShippingCost),
          },
          {
            key: 'deliveryCost',
            icon: '🚚',
            label: 'كلفة التوصيل',
            labelEn: 'Delivery Cost',
            description: 'تكلفة إيصال المنتج إلى العميل النهائي.',
            placeholder: '0.00',
            value: deliveryCost,
            min: 0,
            step: 0.01,
            type: 'currency',
            onChange: createNumericHandler(setDeliveryCost),
          },
        ],
      },
      {
        title: 'إستراتيجية التسعير',
        subtitle: 'حدد نسبة الربح المناسبة قبل مشاركة السعر مع الفريق.',
        fields: [
          {
            key: 'profitMargin',
            icon: '📈',
            label: 'نسبة الربح %',
            labelEn: 'Profit Margin %',
            description: 'مثال: 40 يعني أنك تريد ربح 40٪ فوق التكلفة.',
            placeholder: '10',
            value: profitMargin,
            min: 0,
            max: 1000,
            step: 1,
            type: 'percentage',
            onChange: createNumericHandler(setProfitMargin),
          },
        ],
      },
    ],
    [
      purchasePrice,
      shippingCost,
      deliveryCost,
      profitMargin,
      createNumericHandler,
    ],
  );

  const summaryStats = useMemo(
    () => [
      {
        key: 'totalCost' as const,
        title: 'إجمالي التكلفة',
        hint: 'سعر الشراء + الشحن + التوصيل',
        value: formatCurrency(totalCost),
      },
      {
        key: 'profitMargin' as const,
        title: 'نسبة الربح',
        hint: 'النسبة التي سيتم إضافتها فوق التكلفة الكاملة',
        value: `${profitMargin.toFixed(0)}%`,
      },
      {
        key: 'profitAmount' as const,
        title: 'قيمة الربح',
        hint: 'المبلغ الذي ستحصل عليه قبل المصاريف الإضافية',
        value: formatCurrency(profitAmount),
      },
      {
        key: 'netProfit' as const,
        title: 'صافي الربح المتوقع',
        hint: 'الفرق بين السعر النهائي و إجمالي التكلفة',
        value: formatCurrency(netProfit),
      },
    ],
    [formatCurrency, netProfit, profitAmount, profitMargin, totalCost],
  );

  const handleSaveRecord = useCallback(async () => {
    if (!productName.trim()) {
      setSaveStatus('error');
      setSaveMessage('يرجى كتابة اسم المنتج قبل حفظ السجل.');
      return;
    }

    const user = firebaseAuth.currentUser;
    if (!user) {
      setSaveStatus('error');
      setSaveMessage('انتهت صلاحية الجلسة. قم بتسجيل الدخول مجدداً.');
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');
    setSaveMessage('');

    try {
      await addDoc(collection(firebaseDb, 'costCalculations'), {
        productName: productName.trim(),
        productCategoryId: productCategory || null,
        productCategoryLabel: selectedCategory?.label ?? null,
        productCategoryLabelEn: selectedCategory?.labelEn ?? null,
        productCategorySlug: selectedCategory?.source?.slug ?? null,
        productVendorId: productVendor || null,
        productVendorLabel: selectedVendor?.label ?? null,
        productVendorLabelEn: selectedVendor?.labelEn ?? null,
        productVendorCompany: selectedVendor?.source?.company ?? null,
        productVendorContact: selectedVendor?.source?.contactName ?? selectedVendor?.contact ?? null,
        productVendorEmail: selectedVendor?.source?.email ?? null,
        productVendorPhone: selectedVendor?.source?.phone ?? null,
        productNotes: productNotes.trim() || null,
        productSubcategoryId: productSubcategory || null,
        productSubcategoryLabel: selectedSubcategory?.label ?? null,
        productSubcategoryLabelEn: selectedSubcategory?.labelEn ?? null,
        productSubcategorySlug: selectedSubcategory?.source?.slug ?? null,
        purchasePrice,
        shippingCost,
        deliveryCost,
        profitMargin,
        totalCost,
        finalPrice,
        profitAmount,
        netProfit,
        adminId: user.uid,
        adminEmail: user.email ?? null,
        currency: 'USD',
        createdAt: serverTimestamp(),
      });

      setSaveStatus('success');
      setSaveMessage('تم حفظ سجل التسعير في قاعدة البيانات.');
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('Error saving calculation record:', error);
      setSaveStatus('error');
      setSaveMessage('تعذر حفظ السجل. تحقق من الاتصال أو حاول مرة أخرى لاحقاً.');
    } finally {
      setIsSaving(false);
    }
  }, [
    productName,
    productCategory,
    productVendor,
    selectedCategory,
    selectedVendor,
    productNotes,
    productSubcategory,
    selectedSubcategory,
    purchasePrice,
    shippingCost,
    deliveryCost,
    profitMargin,
    totalCost,
    finalPrice,
    profitAmount,
    netProfit,
  ]);

  const handleCopyPrice = () => {
    navigator.clipboard.writeText(finalPrice.toString());
    alert('✅ تم نسخ السعر النهائي! الآن يمكنك لصقه في صفحة إضافة المنتج');
  };

  const handleReset = () => {
    setPurchasePrice(0);
    setProfitMargin(0);
    setShippingCost(0);
    setDeliveryCost(0);
    setFinalPrice(0);
    setProductName('');
    setProductCategory('');
    setProductSubcategory('');
    setProductVendor('');
    setProductNotes('');
    setSaveStatus('idle');
    setSaveMessage('');
    setLastSavedAt(null);
  };

  if (accessStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-8">
        <div className="bg-white/80 backdrop-blur-sm px-8 py-10 rounded-2xl shadow-lg text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto animate-pulse">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">جاري التحقق من الصلاحيات...</h2>
          <p className="text-sm text-gray-500">يرجى الانتظار لحظات</p>
        </div>
      </div>
    );
  }

  if (accessStatus === 'unauthorized') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-red-50 to-rose-50 p-6">
        <div className="max-w-lg w-full bg-white border border-red-200 rounded-2xl shadow-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-9 h-9 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10 3h4l1 2h3a1 1 0 011 1v2a1 1 0 01-1 1h-1l-1 9a2 2 0 01-2 2H9a2 2 0 01-2-2l-1-9H5a1 1 0 01-1-1V6a1 1 0 011-1h3l1-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">غير مصرح بالوصول</h1>
            <p className="text-gray-600 mt-2">
              هذه الصفحة خاصة بالمدير العام فقط ولا يمكن عرض محتوياتها إلا من قبل SuperAdmin.
            </p>
            <p className="text-sm text-gray-500 mt-1">إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع المدير العام.</p>
          </div>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            العودة إلى لوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 px-4 py-6 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-purple-200/60 via-white to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-pink-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-48 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-xl backdrop-blur-lg md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.back()}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:text-purple-600 hover:shadow-md"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                عودة
              </button>
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                  <span className="text-sm">🛡️</span>
                  SuperAdmin Only
                </span>
                <h1 className="text-2xl font-extrabold leading-tight text-slate-900 md:text-3xl">
                  حاسبة التكلفة والربح<br className="hidden sm:block" /> لتسعير المنتجات بثقة
                </h1>
                <p className="text-xs text-slate-500 md:text-sm">
                  أدخل تكاليف المنتج واحصل على سعر نهائي مقترح يمكنك مشاركته مع فريق إدخال المنتجات.
                </p>
              </div>
              <ul className="grid gap-1.5 text-xs text-slate-500 sm:grid-cols-2">
                <li className="flex items-center gap-2 rounded-2xl bg-slate-100/70 px-2.5 py-2">
                  <span className="text-base">✅</span>
                  عرض فوري للسعر النهائي والأرباح
                </li>
                <li className="flex items-center gap-2 rounded-2xl bg-slate-100/70 px-2.5 py-2">
                  <span className="text-base">🔒</span>
                  كل القيم السرية محفوظة للمدير العام فقط
                </li>
              </ul>
            </div>

            <aside className="flex w-full max-w-xs items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-rose-700 shadow-sm lg:self-start">
              <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-lg">⚠️</span>
              <div className="space-y-1 text-right">
                <p className="text-sm font-semibold text-rose-700">تنبيه أمني</p>
                <p className="text-xs leading-5 text-rose-600">
                  لا تشارك أسعار الشراء أو نسب الربح خارج الإدارة العليا. شارك السعر النهائي فقط مع فريق إدخال المنتجات الموثوق.
                </p>
                <p className="text-[11px] leading-4 text-rose-500">
                  Keep this data confidential. Share the final price only with trusted staff members.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur-sm md:p-8">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 md:text-xl">معلومات المنتج</h2>
                <p className="text-sm text-slate-500 md:text-base">
                  حدد المنتج الذي تقوم بتسعيره لتسهيل تتبع الأرباح والخسائر في التقارير.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-2xl">🗂️</div>
                    <div>
                      <p className="text-base font-semibold text-slate-800">فئة المنتج</p>
                      <p className="text-xs text-slate-500">Category</p>
                    </div>
                  </div>
                  <select
                    value={productCategory}
                    onChange={(event) => setProductCategory(event.target.value)}
                    disabled={isLoadingCategories && categories.length === 0}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.emoji ? `${option.emoji} ${option.label}` : option.label}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-slate-400">
                    {isLoadingCategories && <span>جاري تحميل الأقسام الحقيقية...</span>}
                    {!isLoadingCategories && categoryError && (
                      <span className="text-rose-500">{categoryError}</span>
                    )}
                  </div>
                </label>

                <label className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-2xl">🧾</div>
                    <div>
                      <p className="text-base font-semibold text-slate-800">القسم الفرعي</p>
                      <p className="text-xs text-slate-500">Subcategory</p>
                    </div>
                  </div>
                  {subcategoryOptions.length > 0 ? (
                    <select
                      value={productSubcategory}
                      onChange={(event) => setProductSubcategory(event.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                    >
                      {subcategoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-500">
                      {isLoadingSubcategories
                        ? 'جاري تحميل الأقسام الفرعية...'
                        : 'لا توجد أقسام فرعية لهذا القسم. يمكن ترك هذه الخانة فارغة.'}
                    </div>
                  )}
                  {subcategoryError && (
                    <span className="text-xs text-rose-500">{subcategoryError}</span>
                  )}
                </label>

                <label className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-2xl">�</div>
                    <div>
                      <p className="text-base font-semibold text-slate-800">المورد / البائع</p>
                      <p className="text-xs text-slate-500">Supplier / Vendor</p>
                    </div>
                  </div>
                  {vendorOptions.length > 0 ? (
                    <select
                      value={productVendor}
                      onChange={(event) => setProductVendor(event.target.value)}
                      disabled={isLoadingVendors && vendors.length === 0}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                    >
                      {vendorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-500">
                      {isLoadingVendors
                        ? 'جاري تحميل الموردين...'
                        : 'لا توجد قائمة للموردين. استخدم الملاحظات لكتابة تفاصيل البائع.'}
                    </div>
                  )}
                  <div className="text-xs text-slate-400">
                    {isLoadingVendors && vendors.length > 0 && <span>تحديث قائمة الموردين...</span>}
                    {vendorError && <span className="text-rose-500">{vendorError}</span>}
                  </div>
                </label>

                <label className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-2xl">🏷️</div>
                    <div>
                      <p className="text-base font-semibold text-slate-800">اسم المنتج</p>
                      <p className="text-xs text-slate-500">Product Name</p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={productName}
                    onChange={(event) => setProductName(event.target.value)}
                    placeholder="مثال: قميص رجالي كلاسيكي"
                    className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                  />
                </label>

                <label className="group relative md:col-span-2 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-2xl">📝</div>
                    <div>
                      <p className="text-base font-semibold text-slate-800">ملاحظات داخلية</p>
                      <p className="text-xs text-slate-500">Internal Notes</p>
                    </div>
                  </div>
                  <textarea
                    value={productNotes}
                    onChange={(event) => setProductNotes(event.target.value)}
                    placeholder="ملاحظات حول المورد أو شروط البيع أو طلبات خاصة من العميل"
                    rows={3}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                  />
                  <span className="text-xs text-slate-400">
                    تظهر هذه الملاحظات فقط في تقاريرك الداخلية، ولن يتم مشاركتها مع الموظفين الآخرين.
                  </span>
                </label>
              </div>
            </div>

            {inputSections.map((section) => (
              <div key={section.title} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 md:text-xl">{section.title}</h2>
                  <p className="text-sm text-slate-500 md:text-base">{section.subtitle}</p>
                </div>
                <div
                  className={
                    section.fields.length >= 3
                      ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
                      : section.fields.length === 2
                        ? 'grid gap-4 md:grid-cols-2'
                        : 'grid gap-4'
                  }
                >
                  {section.fields.map((field) => (
                    <label
                      key={field.key}
                      className="group relative block rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                          {field.icon}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-slate-800">{field.label}</p>
                          <p className="text-xs text-slate-500">{field.labelEn}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-500">{field.description}</p>
                      <div className="relative mt-4">
                        <input
                          type="number"
                          value={field.value === 0 ? '' : field.value}
                          onChange={field.onChange}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          placeholder={field.placeholder}
                          inputMode="decimal"
                          className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-lg font-semibold text-slate-800 outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-slate-400">
                          {field.type === 'percentage' ? '%' : '$'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <aside className="flex flex-col gap-6 rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 shadow-xl md:p-8">
            <div className="flex flex-col gap-3">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                💡 حساب فوري
              </span>
              <h3 className="text-xl font-bold text-slate-900 md:text-2xl">السعر النهائي المقترح</h3>
              <p className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                {formatCurrency(finalPrice)}
              </p>
              <p className="text-sm text-slate-500">
                شارك هذا السعر فقط مع الموظفين المخوّلين بإضافة المنتجات داخل لوحة التحكم.
              </p>
              <div className="rounded-2xl border border-purple-100 bg-white/70 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">المنتج الجاري تسعيره</p>
                    <p className="mt-1 text-base font-bold text-slate-900 md:text-lg">
                      {productName.trim() || 'لم يتم تحديد المنتج بعد'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs font-semibold text-purple-700">
                    <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1">
                      {(selectedCategory?.emoji ?? '📂')}
                      {selectedCategory?.label ?? 'قسم غير محدد'}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-purple-500">
                      🧾
                      {selectedSubcategory?.label ?? 'بدون قسم فرعي'}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-purple-500">
                      🤝
                      {selectedVendor?.label ?? 'مورد غير محدد'}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {productNotes.trim()
                    ? productNotes
                    : 'أضف ملاحظات داخلية لتوثيق تفاصيل التفاوض أو شروط خاصة بالمورد.'}
                </p>
              </div>
              <button
                onClick={handleCopyPrice}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-purple-700 hover:to-pink-700 hover:shadow-xl"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                نسخ السعر للموظف
              </button>
              <button
                onClick={handleSaveRecord}
                disabled={!canSaveRecord}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl ${
                  canSaveRecord
                    ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:from-emerald-700 hover:to-green-600'
                    : 'cursor-not-allowed bg-slate-200 text-slate-500 shadow-none'
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isSaving ? 'جاري الحفظ...' : 'حفظ السجل في التقرير'}
              </button>
              {!productName.trim() && (
                <p className="text-xs font-medium text-rose-500">
                  أدخل اسم المنتج لتستطيع حفظ نتيجة التسعير.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>حصة الربح من السعر</span>
                <span>{profitShare.toFixed(1)}%</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-200/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-500 to-yellow-400"
                  style={{ width: `${Math.min(100, profitShare)}%` }}
                />
              </div>
            </div>

            {hasInputs ? (
              <div className="space-y-3">
                {summaryStats.map((stat) => (
                  <div key={stat.key} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{stat.title}</p>
                        <p className="text-xs text-slate-500">{stat.hint}</p>
                      </div>
                      <span className="text-base font-bold text-slate-900">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-100/80 p-4 text-sm text-slate-600">
                أدخل قيم التكاليف ونسبة الربح في الجهة اليسرى لتظهر لك هنا جميع التفاصيل المتعلقة بالسعر النهائي.
              </div>
            )}

            {saveStatus !== 'idle' && saveMessage && (
              <div
                className={`rounded-2xl border p-4 text-sm font-semibold ${
                  saveStatus === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">
                    {saveStatus === 'success' ? '✅' : '⚠️'}
                  </span>
                  <div>
                    <p>{saveMessage}</p>
                    {lastSavedLabel && saveStatus === 'success' && (
                      <p className="mt-1 text-xs font-normal opacity-75">
                        آخر حفظ: {lastSavedLabel}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800">
              <p className="font-semibold">تذكير سريع</p>
              <ul className="mt-2 space-y-1">
                <li>• السعر النهائي يشمل كل التكاليف المذكورة.</li>
                <li>• عدِّل نسبة الربح بسرعة لمقارنة السيناريوهات.</li>
                <li>• انسخ السعر بعد التأكد ثم انتقل لإضافة المنتج.</li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            onClick={handleReset}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:text-purple-600 hover:shadow-md"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            إعادة تعيين القيم
          </button>
          <button
            onClick={() => router.push('/admin/products/new')}
            className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-purple-700 hover:to-pink-700 hover:shadow-xl"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة منتج بهذا السعر
          </button>
        </div>

        <section className="rounded-3xl border border-blue-100 bg-blue-50/80 p-6 shadow-md md:p-8">
          <h3 className="flex items-center gap-2 text-lg font-bold text-blue-900 md:text-xl">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            نصائح للاستخدام المثالي
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ul className="space-y-2 text-sm text-blue-900">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>قم بتحديث الأرقام بعد كل تفاوض مع المورد لتبقى الأسعار دقيقة.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>الحسابات هنا سرية؛ شارك فقط السعر النهائي مع فريق المنتجات.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>استخدم زر إعادة التعيين لبدء تسعير منتج جديد بسرعة.</span>
              </li>
            </ul>
            <div className="rounded-2xl border border-blue-200 bg-white/70 p-4 text-sm text-blue-900">
              <p className="font-semibold">تلميح سريع</p>
              <p className="mt-2 text-blue-700">
                جرّب إدخال نسب ربح مختلفة (مثل 25٪، 40٪، 60٪) لمعرفة تأثيرها على السعر النهائي ثم اختر الأنسب لسوقك.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
