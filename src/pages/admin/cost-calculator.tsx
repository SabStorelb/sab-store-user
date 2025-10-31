import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { firebaseAuth } from '../../lib/firebase';

export default function CostCalculator() {
  const router = useRouter();
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);

  // Check authentication
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/admin/login');
        return;
      }

      try {
        const tokenResult = await user.getIdTokenResult();
        let isSuperAdmin = tokenResult.claims.role === 'SuperAdmin';

        // إذا لم يكن SuperAdmin في التوكن، تحقق من قاعدة البيانات
        if (!isSuperAdmin) {
          const { getDoc, doc } = await import('firebase/firestore');
          const { firebaseDb } = await import('../../lib/firebase');
          const adminDoc = await getDoc(doc(firebaseDb, 'admins', user.uid));
          isSuperAdmin = !!(adminDoc.exists && adminDoc.data() && adminDoc.data().role === 'SuperAdmin');
        }

        if (!isSuperAdmin) {
          alert('❌ هذه الصفحة متاحة فقط للمدير العام (SuperAdmin)');
          router.push('/admin/dashboard');
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        router.push('/admin/dashboard');
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2.5 bg-white rounded-xl text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200 transition-all duration-200 hover:shadow-lg flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              عودة
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                🧮 حاسبة التكلفة والربح
              </h1>
              <p className="text-gray-600 mt-1">Cost & Profit Calculator - للمدير العام فقط</p>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl shadow-xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold">⚠️ تنبيه أمني - Security Warning</h2>
          </div>
          <p className="text-white/90">
            هذه الصفحة تحتوي على معلومات سرية (أسعار الشراء ونسب الربح). <strong>لا تشارك هذه المعلومات مع أي موظف!</strong>
          </p>
          <p className="text-white/80 text-sm mt-2">
            This page contains confidential information (purchase prices & profit margins). Do NOT share with employees!
          </p>
        </div>

        {/* Calculator */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-purple-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-purple-100">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white text-2xl">
              🧮
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">احسب سعر المنتج</h2>
              <p className="text-sm text-gray-500">أدخل التكاليف وسيتم حساب السعر النهائي تلقائياً</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-6">
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
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-300 shadow-lg mb-6">
              <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                ملخص الحسابات
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-600">سعر الشراء:</span>
                  <span className="font-semibold text-gray-800 text-lg">${purchasePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-600">كلفة الشحن:</span>
                  <span className="font-semibold text-gray-800 text-lg">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-600">كلفة التوصيل:</span>
                  <span className="font-semibold text-gray-800 text-lg">${deliveryCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border-t-2 border-gray-200">
                  <span className="text-gray-700 font-medium">إجمالي التكلفة:</span>
                  <span className="font-bold text-gray-900 text-lg">${(purchasePrice + shippingCost + deliveryCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-green-600 font-medium">نسبة الربح ({profitMargin}%):</span>
                  <span className="font-bold text-green-600 text-lg">+${((purchasePrice + shippingCost + deliveryCost) * profitMargin / 100).toFixed(2)}</span>
                </div>
                
                {/* Final Price - Highlighted */}
                <div className="p-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-xl text-white">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="text-white/80 text-sm mb-1">💰 السعر النهائي المقترح</div>
                      <div className="text-white font-bold text-4xl">${finalPrice.toFixed(2)}</div>
                    </div>
                    <button
                      onClick={handleCopyPrice}
                      className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 border-2 border-white/30"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      نسخ السعر
                    </button>
                  </div>
                  <div className="text-white/70 text-sm">
                    Final Price - أعط هذا السعر للموظف لإضافته في المنتج
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-blue-800 font-medium">صافي الربح المتوقع:</span>
                  <span className="font-bold text-blue-600 text-xl">${(finalPrice - (purchasePrice + shippingCost + deliveryCost)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleReset}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 font-bold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              إعادة تعيين
            </button>
            
            <button
              onClick={() => router.push('/admin/products/new')}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إضافة منتج بهذا السعر
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            💡 نصائح مهمة
          </h3>
          <ul className="space-y-2 text-blue-900">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>احسب السعر هنا، ثم انسخه وأعطه للموظف ليضعه في صفحة إضافة المنتج</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>الموظف لن يرى سعر الشراء أو نسبة الربح - فقط السعر النهائي</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>هذه الصفحة محمية ومتاحة فقط للمدير العام (SuperAdmin)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
