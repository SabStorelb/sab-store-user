import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { addDoc, collection, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ProtectedPage from '../../components/ProtectedPage';
import { firebaseDb, firebaseStorage } from '../../lib/firebase';

type VendorRecord = {
  id: string;
  name: string;
  company?: string;
  nameAr?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  logo?: string;
  logoUrl?: string;
};

type VendorProduct = {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  stock: number;
  categoryName?: string;
  subcategoryName?: string;
  vendorId?: string;
  updatedAt?: string;
};

type CategoryOption = {
  id: string;
  name: string;
  nameAr: string;
};

type SubcategoryOption = {
  id: string;
  name: string;
  nameAr: string;
};

type Feedback = {
  type: 'success' | 'error';
  message: string;
};

export default function VendorSystemPage() {
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);

  // Vendor form states
  const [vendorNameAr, setVendorNameAr] = useState('');
  const [vendorNameEn, setVendorNameEn] = useState('');
  const [vendorCompany, setVendorCompany] = useState('');
  const [vendorContactName, setVendorContactName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorLogo, setVendorLogo] = useState<File | null>(null);
  const [vendorLogoPreview, setVendorLogoPreview] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingVendor, setSavingVendor] = useState(false);

  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<SubcategoryOption[]>([]);

  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formSubcategoryId, setFormSubcategoryId] = useState('');
  const [formDescAr, setFormDescAr] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
  const unsubscribe = onSnapshot(collection(firebaseDb, 'suppliers'), (snapshot) => {
      const loaded: VendorRecord[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        const resolvedNameAr = (data.nameAr as string) || (data.name as string) || (data.company as string) || 'بائع بدون اسم';
        const resolvedNameEn = (data.name as string) || resolvedNameAr;
        return {
          id: docSnap.id,
          name: resolvedNameEn,
          nameAr: resolvedNameAr,
          company: (data.company as string) || undefined,
          contactName: (data.contactName as string) || undefined,
          email: (data.email as string) || undefined,
          phone: (data.phone as string) || undefined,
          logo: (data.logo as string) || (data.logoUrl as string) || undefined,
          logoUrl: (data.logoUrl as string) || (data.logo as string) || undefined,
        } satisfies VendorRecord;
      });

  loaded.sort((a, b) => (a.nameAr || a.name).localeCompare(b.nameAr || b.name, 'ar'));
  setVendors(loaded);
      setLoadingVendors(false);
      if (!selectedVendorId && loaded.length > 0) {
        setSelectedVendorId(loaded[0].id);
      }
    });

    return () => unsubscribe();
  }, [selectedVendorId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firebaseDb, 'products'), (snapshot) => {
      const loaded = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        const vendorId =
          (data.vendorId as string) ||
          (data.productVendorId as string) ||
          (data.productVendor as string) ||
          undefined;
        return {
          id: docSnap.id,
          name: typeof data.name === 'string' ? (data.name as string) : (data.nameEn as string) || '',
          nameAr:
            typeof data.nameAr === 'string'
              ? (data.nameAr as string)
              : typeof data.name === 'object' && data.name !== null
                ? ((data.name as Record<string, unknown>).ar as string)
                : undefined,
          price: typeof data.price === 'number' ? data.price : Number(data.price ?? 0),
          stock: typeof data.stock === 'number' ? data.stock : Number(data.stock ?? 0),
          categoryName: (data.categoryName as string) || (data.category as string) || undefined,
          subcategoryName: (data.subcategoryName as string) || (data.subcategory as string) || undefined,
          vendorId,
          updatedAt: (data.updatedAt as string) || undefined,
        } satisfies VendorProduct;
      });

      setProducts(loaded);
      setLoadingProducts(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const snap = await getDocs(collection(firebaseDb, 'categories'));
        const loaded = snap.docs
          .map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: (data.name as string) || '',
              nameAr: (data.nameAr as string) || (data.name as string) || '',
            } satisfies CategoryOption;
          })
          .sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));
        setCategoryOptions(loaded);
      } catch (error) {
        console.error('Error fetching categories for vendor page:', error);
      }
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    async function loadSubcategories(categoryId: string) {
      if (!categoryId) {
        setSubcategoryOptions([]);
        return;
      }
      try {
        const snap = await getDocs(collection(firebaseDb, 'categories', categoryId, 'subcategory'));
        const loaded = snap.docs
          .map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: (data.name as string) || '',
              nameAr: (data.nameAr as string) || (data.name as string) || '',
            } satisfies SubcategoryOption;
          })
          .sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));
        setSubcategoryOptions(loaded);
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        setSubcategoryOptions([]);
      }
    }

    loadSubcategories(formCategoryId);
  }, [formCategoryId]);

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === selectedVendorId) ?? null,
    [vendors, selectedVendorId],
  );

  const vendorProducts = useMemo(
    () =>
      products.filter((product) => {
        if (!selectedVendorId) return false;
        return product.vendorId === selectedVendorId;
      }),
    [products, selectedVendorId],
  );

  const productCountsByVendor = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      if (!product.vendorId) continue;
      counts.set(product.vendorId, (counts.get(product.vendorId) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const resetForm = () => {
    setFormNameAr('');
    setFormNameEn('');
    setFormPrice('');
    setFormStock('');
    setFormCategoryId('');
    setFormSubcategoryId('');
    setFormDescAr('');
    setFormDescEn('');
  };

  const resetVendorForm = () => {
    setVendorNameAr('');
    setVendorNameEn('');
    setVendorCompany('');
    setVendorContactName('');
    setVendorEmail('');
    setVendorPhone('');
    setVendorLogo(null);
    setVendorLogoPreview('');
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setFeedback({ type: 'error', message: '❌ حجم الصورة كبير جداً. الحد الأقصى 2 ميجابايت.' });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setFeedback({ type: 'error', message: '❌ يرجى اختيار صورة فقط (PNG, JPG, JPEG).' });
        return;
      }

      setVendorLogo(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setVendorLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateVendor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!vendorNameAr.trim()) {
      setFeedback({ type: 'error', message: 'يرجى إدخال اسم البائع بالعربي على الأقل.' });
      return;
    }

    setSavingVendor(true);
    setFeedback(null); // Clear previous feedback

    try {
      let logoUrl = '';
      
      // Upload logo if provided
      if (vendorLogo) {
        setUploadingLogo(true);
        try {
          const timestamp = Date.now();
          const fileName = `vendors/${timestamp}_${vendorLogo.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const storageRef = ref(firebaseStorage, fileName);
          
          await uploadBytes(storageRef, vendorLogo);
          logoUrl = await getDownloadURL(storageRef);
          
          console.log('Logo uploaded successfully:', logoUrl);
        } catch (uploadError) {
          console.error('Error uploading logo:', uploadError);
          setFeedback({ type: 'error', message: '❌ فشل رفع الشعار. حاول مرة أخرى.' });
          setSavingVendor(false);
          setUploadingLogo(false);
          return;
        } finally {
          setUploadingLogo(false);
        }
      }

      const vendorData = {
        name: vendorNameEn.trim() || vendorNameAr.trim(),
        nameAr: vendorNameAr.trim(),
        company: vendorCompany.trim() || vendorNameAr.trim(),
        contactName: vendorContactName.trim() || '',
        email: vendorEmail.trim() || '',
        phone: vendorPhone.trim() || '',
        logo: logoUrl || '',
        logoUrl: logoUrl || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Adding vendor:', vendorData);
      
      const docRef = await addDoc(collection(firebaseDb, 'suppliers'), vendorData);
      
      console.log('Vendor added successfully with ID:', docRef.id);

      setFeedback({ type: 'success', message: '✅ تم إضافة البائع بنجاح!' });
      resetVendorForm();
      setShowAddVendorForm(false);
      
      // Auto-select the newly created vendor after a short delay
      setTimeout(() => {
        setSelectedVendorId(docRef.id);
      }, 500);
      
    } catch (error) {
      console.error('Error creating vendor:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setFeedback({ 
        type: 'error', 
        message: `❌ تعذر إضافة البائع: ${errorMessage}. تحقق من صلاحيات Firebase.` 
      });
    } finally {
      setSavingVendor(false);
    }
  };

  const handleCreateProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedVendor) {
      setFeedback({ type: 'error', message: 'يرجى اختيار بائع قبل إضافة منتج.' });
      return;
    }

    const price = Number(formPrice);
    const stock = Number(formStock);

    if (!formNameAr.trim() || Number.isNaN(price) || Number.isNaN(stock) || price <= 0) {
      setFeedback({ type: 'error', message: 'تأكد من إدخال اسم عربي، وسعر صحيح، وكمية مخزون.' });
      return;
    }

    setSavingProduct(true);

    try {
      const category = categoryOptions.find((item) => item.id === formCategoryId);
      const subcategory = subcategoryOptions.find((item) => item.id === formSubcategoryId);

      await addDoc(collection(firebaseDb, 'products'), {
        name: {
          ar: formNameAr.trim(),
          en: formNameEn.trim() || formNameAr.trim(),
        },
        nameAr: formNameAr.trim(),
        nameEn: formNameEn.trim() || formNameAr.trim(),
        title: formNameEn.trim() || formNameAr.trim(),
        titleAr: formNameAr.trim(),
        description: {
          ar: formDescAr.trim(),
          en: formDescEn.trim(),
        },
        desc: formDescEn.trim(),
        descAr: formDescAr.trim(),
        price,
        currency: 'USD',
        stock,
        inStock: stock > 0,
        available: stock > 0,
        categoryId: formCategoryId || null,
        categoryName: category?.nameAr || category?.name || null,
        subcategoryId: formSubcategoryId || null,
        subcategoryName: subcategory?.nameAr || subcategory?.name || null,
        brand: null,
        brandId: null,
        images: [],
        featured: false,
        rating: 0,
        reviews: 0,
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.nameAr || selectedVendor.name || selectedVendor.company || null,
        productVendorId: selectedVendor.id,
        productVendorLabel: selectedVendor.nameAr || selectedVendor.name || selectedVendor.company || null,
        productVendorCompany: selectedVendor.company || null,
        productVendorContact: selectedVendor.contactName || null,
        productVendorEmail: selectedVendor.email || null,
        productVendorPhone: selectedVendor.phone || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setFeedback({ type: 'success', message: 'تم إضافة المنتج للبائع بنجاح.' });
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating vendor product:', error);
      setFeedback({ type: 'error', message: 'تعذر حفظ المنتج. حاول مرة أخرى.' });
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <ProtectedPage requiredPermission="canManageProducts">
      <div className="relative min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-6 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-amber-200/60 via-transparent to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-48 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6">
          <header className="flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 text-right">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-amber-700">
                🤝 نظام البائعين
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">إدارة منتجات البائعين</h1>
              <p className="text-sm text-slate-500">
                راجع منتجات كل بائع وأضف عناصر جديدة مباشرة إلى Firebase مع ربطها بالفئات الرئيسية والفرعية.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-600 to-gray-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-slate-700 hover:to-gray-700 hover:shadow-xl"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                رجوع
              </Link>
              <Link
                href="/admin/products"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-purple-700 hover:to-pink-700 hover:shadow-xl"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                لوحة المنتجات
              </Link>
              <button
                onClick={() => setShowAddVendorForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إضافة بائع جديد
              </button>
              <button
                onClick={() => setShowAddForm((prev) => !prev)}
                disabled={!selectedVendor}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg transition ${
                  selectedVendor
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:-translate-y-0.5 hover:from-amber-600 hover:to-orange-600 hover:shadow-xl'
                    : 'cursor-not-allowed bg-slate-300 text-slate-500'
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إضافة منتج للبائع
              </button>
            </div>
          </header>

          {feedback && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-md ${
                feedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Add Vendor Form Modal */}
          {showAddVendorForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-green-200 bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">➕ إضافة بائع جديد</h2>
                  <button
                    onClick={() => {
                      setShowAddVendorForm(false);
                      resetVendorForm();
                    }}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleCreateVendor} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                      اسم البائع (عربي) *
                      <input
                        type="text"
                        value={vendorNameAr}
                        onChange={(e) => setVendorNameAr(e.target.value)}
                        required
                        placeholder="مثال: محمد أحمد"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-100"
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                      Vendor Name (English)
                      <input
                        type="text"
                        value={vendorNameEn}
                        onChange={(e) => setVendorNameEn(e.target.value)}
                        placeholder="Example: Mohammed Ahmed"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-100"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                    اسم الشركة / Company Name
                    <input
                      type="text"
                      value={vendorCompany}
                      onChange={(e) => setVendorCompany(e.target.value)}
                      placeholder="مثال: شركة التجارة الدولية"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-100"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                    اسم جهة الاتصال / Contact Name
                    <input
                      type="text"
                      value={vendorContactName}
                      onChange={(e) => setVendorContactName(e.target.value)}
                      placeholder="مثال: أحمد علي"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-100"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                      البريد الإلكتروني / Email
                      <input
                        type="email"
                        value={vendorEmail}
                        onChange={(e) => setVendorEmail(e.target.value)}
                        placeholder="example@domain.com"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-100"
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                      رقم الهاتف / Phone
                      <input
                        type="tel"
                        value={vendorPhone}
                        onChange={(e) => setVendorPhone(e.target.value)}
                        placeholder="+961 xx xxx xxx"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-100"
                      />
                    </label>
                  </div>

                  {/* Logo Upload Section */}
                  <div className="rounded-xl border-2 border-dashed border-green-200 bg-green-50/30 p-4">
                    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        شعار البائع / Vendor Logo
                      </div>
                      <span className="text-xs text-slate-500">
                        اختياري • يظهر في التطبيق كعلامة تجارية • أقصى حجم: 2MB • PNG, JPG, JPEG
                      </span>
                      
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm file:mr-4 file:rounded-lg file:border-0 file:bg-green-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-700 hover:file:bg-green-200 focus:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-100"
                      />
                      
                      {uploadingLogo && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          جاري رفع الشعار...
                        </div>
                      )}
                      
                      {vendorLogoPreview && !uploadingLogo && (
                        <div className="mt-2 flex items-center gap-4">
                          <div className="relative h-24 w-24 overflow-hidden rounded-xl border-2 border-green-200 bg-white shadow-sm">
                            <img
                              src={vendorLogoPreview}
                              alt="Logo Preview"
                              className="h-full w-full object-contain p-2"
                            />
                          </div>
                          <div className="flex-1 text-xs text-slate-600">
                            <p className="font-semibold text-green-600">✓ تم اختيار الشعار</p>
                            <p className="mt-1">سيتم رفعه عند حفظ البائع</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setVendorLogo(null);
                              setVendorLogoPreview('');
                            }}
                            className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-200"
                          >
                            إزالة
                          </button>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddVendorForm(false);
                        resetVendorForm();
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={savingVendor}
                      className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg transition ${
                        savingVendor
                          ? 'cursor-not-allowed bg-slate-400'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                      }`}
                    >
                      {savingVendor ? '⏳ جاري الحفظ...' : '✅ حفظ البائع'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">قائمة البائعين</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {vendors.length} بائع
                </span>
              </div>

              <div className="max-h-[520px] overflow-y-auto pr-2">
                {loadingVendors ? (
                  <div className="py-12 text-center text-sm text-slate-500">جاري تحميل البائعين...</div>
                ) : vendors.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-500">
                    لا يوجد بائعون مسجلون. استخدم لوحة الموردين لإضافة بيانات جديدة.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {vendors.map((vendor) => {
                      const isActive = vendor.id === selectedVendorId;
                      const productCount = productCountsByVendor.get(vendor.id) ?? 0;
                      return (
                        <li key={vendor.id}>
                          <button
                            onClick={() => {
                              setSelectedVendorId(vendor.id);
                              setShowAddForm(false);
                            }}
                            className={`w-full rounded-2xl border px-4 py-4 text-right transition ${
                              isActive
                                ? 'border-orange-300 bg-orange-50/80 text-amber-800 shadow-md'
                                : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Vendor Logo */}
                              {vendor.logoUrl || vendor.logo ? (
                                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 border-orange-200 bg-white shadow-sm">
                                  <img
                                    src={vendor.logoUrl || vendor.logo}
                                    alt={vendor.nameAr || vendor.name}
                                    className="h-full w-full object-contain p-1"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border-2 border-slate-200 bg-slate-100 text-xl font-bold text-slate-400">
                                  {(vendor.nameAr || vendor.name).charAt(0)}
                                </div>
                              )}
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-xs font-semibold text-slate-400">{vendor.company || '—'}</div>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                    {productCount} منتج
                                  </span>
                                </div>
                                <div className="mt-1 text-base font-bold text-slate-800">
                                  {vendor.nameAr || vendor.name}
                                </div>
                                {vendor.contactName && (
                                  <div className="mt-1 text-xs text-slate-500">مسؤول التواصل: {vendor.contactName}</div>
                                )}
                                {vendor.phone && (
                                  <div className="mt-1 text-xs text-slate-500">هاتف: {vendor.phone}</div>
                                )}
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </aside>

            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur-md">
              {selectedVendor ? (
                <>
                  <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 text-right">
                    <div className="flex items-center gap-4">
                      {/* Vendor Logo in Details */}
                      {selectedVendor.logoUrl || selectedVendor.logo ? (
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 border-orange-300 bg-white shadow-md">
                          <img
                            src={selectedVendor.logoUrl || selectedVendor.logo}
                            alt={selectedVendor.nameAr || selectedVendor.name}
                            className="h-full w-full object-contain p-2"
                          />
                        </div>
                      ) : (
                        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border-2 border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 text-3xl font-bold text-slate-400 shadow-md">
                          {(selectedVendor.nameAr || selectedVendor.name).charAt(0)}
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-900">{selectedVendor.nameAr || selectedVendor.name}</h2>
                        <div className="text-sm text-slate-500">
                          {selectedVendor.email && <span className="ml-2">البريد: {selectedVendor.email}</span>}
                          {selectedVendor.phone && <span className="ml-2">الهاتف: {selectedVendor.phone}</span>}
                        </div>
                        {selectedVendor.company && (
                          <div className="text-sm text-slate-500">الشركة: {selectedVendor.company}</div>
                        )}
                        <div className="text-xs font-semibold text-slate-400">
                          {vendorProducts.length} منتج مرتبط بهذا البائع
                        </div>
                      </div>
                    </div>
                  </div>

                  {showAddForm && (
                    <form
                      onSubmit={handleCreateProduct}
                      className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-inner"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                          اسم المنتج (عربي)
                          <input
                            type="text"
                            value={formNameAr}
                            onChange={(event) => setFormNameAr(event.target.value)}
                            required
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                          Product Name (English)
                          <input
                            type="text"
                            value={formNameEn}
                            onChange={(event) => setFormNameEn(event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                          السعر (USD)
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={formPrice}
                            onChange={(event) => setFormPrice(event.target.value)}
                            required
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                          المخزون
                          <input
                            type="number"
                            min={0}
                            step="1"
                            value={formStock}
                            onChange={(event) => setFormStock(event.target.value)}
                            required
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                          القسم الرئيسي
                          <select
                            value={formCategoryId}
                            onChange={(event) => setFormCategoryId(event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
                          >
                            <option value="">اختر قسماً</option>
                            {categoryOptions.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.nameAr || category.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                          القسم الفرعي
                          <select
                            value={formSubcategoryId}
                            onChange={(event) => setFormSubcategoryId(event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
                          >
                            <option value="">بدون قسم فرعي</option>
                            {subcategoryOptions.map((subcategory) => (
                              <option key={subcategory.id} value={subcategory.id}>
                                {subcategory.nameAr || subcategory.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                          وصف داخلي (عربي)
                          <textarea
                            value={formDescAr}
                            onChange={(event) => setFormDescAr(event.target.value)}
                            rows={3}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                          Internal Notes (English)
                          <textarea
                            value={formDescEn}
                            onChange={(event) => setFormDescEn(event.target.value)}
                            rows={3}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
                          />
                        </label>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            resetForm();
                            setShowAddForm(false);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:text-amber-600 hover:shadow-md"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          disabled={savingProduct}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition ${
                            savingProduct
                              ? 'cursor-wait bg-slate-300 text-slate-500'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg hover:-translate-y-0.5 hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl'
                          }`}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {savingProduct ? 'جاري الحفظ...' : 'حفظ المنتج'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="rounded-2xl border border-slate-100 bg-white/70 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-500">
                      <span>منتجات هذا البائع</span>
                      <span>{vendorProducts.length} عنصر</span>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto">
                      {loadingProducts ? (
                        <div className="py-10 text-center text-sm text-slate-500">جاري تحميل المنتجات...</div>
                      ) : vendorProducts.length === 0 ? (
                        <div className="py-10 text-center text-sm text-slate-500">
                          لا توجد منتجات مسجلة لهذا البائع بعد. استخدم زر إضافة منتج في الأعلى.
                        </div>
                      ) : (
                        <ul className="divide-y divide-slate-100 text-sm text-slate-600">
                          {vendorProducts.map((product) => (
                            <li key={product.id} className="flex flex-col gap-1 px-4 py-3 hover:bg-slate-50/70">
                              <div className="flex items-center justify-between">
                                <div className="text-base font-bold text-slate-800">{product.nameAr || product.name}</div>
                                <div className="text-xs font-semibold text-slate-400">ID: {product.id.slice(0, 8)}</div>
                              </div>
                              <div className="text-xs text-slate-500">
                                القسم: {product.categoryName || 'غير محدد'}
                                {product.subcategoryName ? ` • الفرعي: ${product.subcategoryName}` : ''}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span>السعر: ${product.price.toFixed(2)}</span>
                                <span>المخزون: {product.stock}</span>
                                {product.updatedAt && <span>آخر تحديث: {product.updatedAt}</span>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-sm text-slate-500">
                  اختر بائعاً من القائمة لعرض تفاصيله ومنتجاته.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
