import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import ProtectedPage from '../../components/ProtectedPage';
import { firebaseDb } from '../../lib/firebase';

type WarehouseProduct = {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  stock: number;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  vendorId?: string;
  vendorName?: string;
};

type CategoryOption = {
  id: string;
  name: string;
  nameAr: string;
};

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
};

function formatProductName(product: WarehouseProduct) {
  if (product.nameAr) return product.nameAr;
  if (product.name) return product.name;
  return 'منتج بدون اسم';
}

export default function WarehouseSystemPage() {
  const [products, setProducts] = useState<WarehouseProduct[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(firebaseDb, 'products'), orderBy('categoryName', 'asc')),
      (snapshot) => {
        const loaded: WarehouseProduct[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const rawName = data.name;
          const nameObject =
            typeof rawName === 'object' && rawName !== null ? (rawName as Record<string, unknown>) : null;
          const fallbackName =
            typeof rawName === 'string'
              ? rawName
              : typeof data.nameEn === 'string'
                ? (data.nameEn as string)
                : '';

          const resolvedName =
            typeof rawName === 'string'
              ? rawName
              : typeof nameObject?.en === 'string'
                ? (nameObject.en as string)
                : fallbackName;

          const resolvedNameAr =
            typeof data.nameAr === 'string'
              ? (data.nameAr as string)
              : typeof nameObject?.ar === 'string'
                ? (nameObject.ar as string)
                : fallbackName;

          return {
            id: docSnap.id,
            name: resolvedName,
            nameAr: resolvedNameAr,
            price: typeof data.price === 'number' ? data.price : Number(data.price ?? 0),
            stock: typeof data.stock === 'number' ? data.stock : Number(data.stock ?? 0),
            categoryId: (data.categoryId as string) || undefined,
            categoryName: (data.categoryName as string) || (data.category as string) || undefined,
            subcategoryId: (data.subcategoryId as string) || undefined,
            subcategoryName: (data.subcategoryName as string) || (data.subcategory as string) || undefined,
            vendorId:
              (data.vendorId as string) ||
              (data.productVendorId as string) ||
              (data.productVendor as string) ||
              undefined,
            vendorName:
              (data.vendorName as string) ||
              (data.productVendorLabel as string) ||
              (data.productVendorName as string) ||
              undefined,
          };
        });

        setProducts(loaded);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading warehouse products:', error);
        setLoading(false);
        setFeedback({ type: 'error', message: 'تعذر تحميل بيانات المستودع من قاعدة البيانات.' });
      },
    );

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
        setCategories(loaded);
      } catch (error) {
        console.error('Error fetching categories for warehouse page:', error);
      }
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') {
      return products;
    }

    return products.filter((product) => product.categoryId === selectedCategory);
  }, [products, selectedCategory]);

  const totals = useMemo(() => {
    const totalStock = filteredProducts.reduce((acc, product) => acc + (product.stock || 0), 0);
    const lowStockCount = filteredProducts.filter((product) => product.stock > 0 && product.stock < 5).length;
    const outOfStockCount = filteredProducts.filter((product) => !product.stock).length;

    const distinctVendors = new Set(filteredProducts.map((product) => product.vendorId).filter(Boolean));

    return {
      totalProducts: filteredProducts.length,
      totalStock,
      lowStockCount,
      outOfStockCount,
      vendorCount: distinctVendors.size,
    };
  }, [filteredProducts]);

  const handleDraftChange = (productId: string, value: string) => {
    setStockDrafts((prev) => ({ ...prev, [productId]: value }));
  };

  const handleStockUpdate = async (productId: string) => {
    const rawValue = stockDrafts[productId];
    const parsed = Number(rawValue ?? filteredProducts.find((item) => item.id === productId)?.stock ?? 0);

    if (!Number.isFinite(parsed) || parsed < 0) {
      setFeedback({ type: 'error', message: 'يرجى إدخال قيمة مخزون صحيحة (0 أو أكبر).' });
      return;
    }

    setUpdatingId(productId);

    try {
      await updateDoc(doc(firebaseDb, 'products', productId), {
        stock: parsed,
        updatedAt: new Date().toISOString(),
      });

      setStockDrafts((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });

      setFeedback({ type: 'success', message: 'تم تحديث المخزون بنجاح.' });
    } catch (error) {
      console.error('Error updating stock:', error);
      setFeedback({ type: 'error', message: 'تعذر تحديث المخزون. حاول مرة أخرى.' });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <ProtectedPage requiredPermission="canManageProducts">
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-6 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-blue-200/60 via-transparent to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-12 h-72 w-72 rounded-full bg-slate-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-48 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6">
          <header className="flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 text-right">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                🏬 نظام المستودعات
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">إدارة مخزون المنتجات</h1>
              <p className="text-sm text-slate-500">
                تابع مستويات المخزون لكل قسم وحدث الأرقام مباشرة. أي تعديل يتم حفظه في Firebase فوراً.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Link
                href="/admin/products"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إدارة المنتجات
              </Link>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md ${
                  selectedCategory === 'all'
                    ? 'border-blue-300 bg-blue-50 text-blue-600 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 shadow-sm'
                }`}
              >
                عرض كل الأقسام
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

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-md">
              <p className="text-sm text-slate-500">إجمالي المنتجات في هذا العرض</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{totals.totalProducts}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-md">
              <p className="text-sm text-slate-500">إجمالي المخزون</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{totals.totalStock}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-md">
              <p className="text-sm text-amber-600">منتجات تحتاج إعادة طلب</p>
              <p className="mt-2 text-3xl font-black text-amber-700">{totals.lowStockCount}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 shadow-md">
              <p className="text-sm text-rose-600">منتجات نفدت من المخزون</p>
              <p className="mt-2 text-3xl font-black text-rose-700">{totals.outOfStockCount}</p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur-md">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">قائمة المنتجــــات</h2>
                <p className="text-sm text-slate-500">اختر قسماً لعرض منتجاته وتحديث مخزونه المباشر.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  قسم المنتج:
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="all">جميع الأقسام</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nameAr || category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-xl bg-slate-100/70 px-3 py-2 text-xs font-semibold text-slate-600">
                  الموردون بالأقسام المحددة: {totals.vendorCount}
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100 shadow-inner">
              <div className="max-h-[540px] overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/80">
                    <tr className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">المنتج</th>
                      <th className="px-4 py-3">القسم / الفرعي</th>
                      <th className="px-4 py-3">المورد</th>
                      <th className="px-4 py-3">السعر</th>
                      <th className="px-4 py-3">المخزون</th>
                      <th className="px-4 py-3">تحديث المخزون</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                          جاري تحميل بيانات المستودع...
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                          لا توجد منتجات مطابقة لهذا القسم حتى الآن.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => {
                        const draftValue = stockDrafts[product.id];
                        const displayValue = draftValue ?? String(product.stock ?? 0);
                        const isLow = product.stock > 0 && product.stock < 5;
                        const isEmpty = !product.stock;

                        return (
                          <tr key={product.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-800">{formatProductName(product)}</div>
                              <div className="text-xs text-slate-400">معرف المنتج: {product.id.slice(0, 8)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div>{product.categoryName || 'غير محدد'}</div>
                              <div className="text-xs text-slate-400">{product.subcategoryName || 'بدون قسم فرعي'}</div>
                            </td>
                            <td className="px-4 py-3">
                              {product.vendorName || product.vendorId || '—'}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-700">
                              {product.price ? `$${product.price.toFixed(2)}` : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                                  isEmpty
                                    ? 'bg-rose-100 text-rose-700'
                                    : isLow
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {product.stock}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  min={0}
                                  value={displayValue}
                                  onChange={(event) => handleDraftChange(product.id, event.target.value)}
                                  className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                />
                                <button
                                  onClick={() => handleStockUpdate(product.id)}
                                  disabled={updatingId === product.id}
                                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                                    updatingId === product.id
                                      ? 'cursor-wait bg-slate-200 text-slate-500'
                                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm hover:-translate-y-0.5 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-md'
                                  }`}
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {updatingId === product.id ? 'جاري الحفظ...' : 'تحديث'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ProtectedPage>
  );
}
