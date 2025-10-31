import Link from 'next/link';

import { useEffect, useState } from 'react';
import { firebaseDb } from '../../../lib/firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const snap = await getDocs(collection(firebaseDb, 'products'));
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchProducts();
  }, []);

  async function handleDelete(id: string) {
    if (window.confirm('هل تريد حذف هذا المنتج؟')) {
      await deleteDoc(doc(firebaseDb, 'products', id));
      setProducts(products.filter(p => p.id !== id));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              عودة | Back
            </button>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:from-purple-700 hover:to-pink-600 shadow-sm transition-all duration-200 hover:shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              🛍️ المنتجات | Products
            </h1>
          </div>
          <Link 
            href="/admin/products/new" 
            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-600 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة منتج جديد | Add Product
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-12 w-12 text-purple-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-lg">جاري التحميل...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-dashed border-gray-200">
            {/* Empty State with Animation */}
            <div className="max-w-md mx-auto">
              <div className="mb-6 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full animate-pulse"></div>
                </div>
                <div className="relative text-8xl animate-bounce" style={{animationDuration: '2s'}}>
                  🛍️
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                لا توجد منتجات بعد
              </h2>
              <p className="text-gray-500 mb-8 text-lg">
                ابدأ بإضافة منتجك الأول لبناء متجرك الإلكتروني
              </p>

              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-pink-600 font-bold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                أضف منتجك الأول
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              {/* Features Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="text-3xl mb-2">📸</div>
                  <div className="font-semibold text-purple-900 mb-1">صور متعددة</div>
                  <div className="text-xs text-purple-700">رفع عدة صور للمنتج</div>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
                  <div className="text-3xl mb-2">🎨</div>
                  <div className="font-semibold text-pink-900 mb-1">ألوان ومقاسات</div>
                  <div className="text-xs text-pink-700">خيارات متنوعة للعملاء</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="text-3xl mb-2">💱</div>
                  <div className="font-semibold text-blue-900 mb-1">عملات متعددة</div>
                  <div className="text-xs text-blue-700">LBP, USD, SAR, EUR</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 transform hover:scale-[1.02]">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Product Info */}
                  <div className="flex items-center gap-4 flex-1">
                    {product.images && product.images[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt="صورة المنتج" 
                        className="w-20 h-20 object-cover rounded-lg shadow-md border-2 border-purple-100" 
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center text-3xl">
                        🛍️
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-800 mb-1">
                        {product.nameAr || 
                         (typeof product.name === 'object' ? product.name?.ar : product.name) || 
                         'بدون اسم'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {product.nameEn || 
                         (typeof product.name === 'object' ? product.name?.en : product.name) || 
                         'No name'}
                      </p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          ${product.price} USD
                        </span>
                        {product.stock > 0 ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                            📦 متوفر ({product.stock})
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                            ⚠️ نفذت الكمية
                          </span>
                        )}
                        {product.featured && (
                          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                            ⭐ مميز
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      تعديل
                    </Link>
                    <button 
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2" 
                      onClick={() => handleDelete(product.id)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}
