import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { firebaseDb, firebaseAuth } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  createdAt: string;
  items?: OrderItem[];
}

interface Product {
  id: string;
  purchasePrice?: number;
  shippingCost?: number;
  deliveryCost?: number;
  price?: number;
}

interface MonthlyReport {
  month: string;
  totalPurchaseCost: number;
  totalSalesRevenue: number;
  totalShippingCost: number;
  totalDeliveryCost: number;
  totalCost: number;
  totalProfit: number;
  totalOrders: number;
  totalProductsSold: number;
}

export default function FinancialReports() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);

  // Check authentication
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/admin/login');
      }
    });
    
    return () => unsubscribe();
  }, [router]);

  // Generate months array
  const months = [
    { value: '01', label: 'يناير - January' },
    { value: '02', label: 'فبراير - February' },
    { value: '03', label: 'مارس - March' },
    { value: '04', label: 'أبريل - April' },
    { value: '05', label: 'مايو - May' },
    { value: '06', label: 'يونيو - June' },
    { value: '07', label: 'يوليو - July' },
    { value: '08', label: 'أغسطس - August' },
    { value: '09', label: 'سبتمبر - September' },
    { value: '10', label: 'أكتوبر - October' },
    { value: '11', label: 'نوفمبر - November' },
    { value: '12', label: 'ديسمبر - December' },
  ];

  // Generate years array (last 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // Load financial report
  useEffect(() => {
    if (!selectedMonth || !selectedYear) {
      setLoading(false);
      return;
    }

    loadMonthlyReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  // Export to Excel function
  function exportToExcel() {
    if (!monthlyReport) return;

    // Prepare data for Excel
    const data = [
      ['التقرير المالي الشهري', ''],
      ['الشهر:', `${selectedMonth}/${selectedYear}`],
      ['', ''],
      ['البيان', 'القيمة'],
      ['إجمالي المبيعات', `$${monthlyReport.totalSalesRevenue.toFixed(2)}`],
      ['قيمة شراء المنتجات', `$${monthlyReport.totalPurchaseCost.toFixed(2)}`],
      ['تكاليف الشحن', `$${monthlyReport.totalShippingCost.toFixed(2)}`],
      ['تكاليف التوصيل', `$${monthlyReport.totalDeliveryCost.toFixed(2)}`],
      ['إجمالي التكاليف', `$${monthlyReport.totalCost.toFixed(2)}`],
      ['صافي الربح', `$${monthlyReport.totalProfit.toFixed(2)}`],
      ['', ''],
      ['إحصائيات إضافية', ''],
      ['عدد الطلبات', monthlyReport.totalOrders],
      ['عدد المنتجات المباعة', monthlyReport.totalProductsSold],
      ['متوسط قيمة الطلب', `$${(monthlyReport.totalSalesRevenue / (monthlyReport.totalOrders || 1)).toFixed(2)}`],
      ['هامش الربح', `${((monthlyReport.totalProfit / (monthlyReport.totalSalesRevenue || 1)) * 100).toFixed(1)}%`]
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 },
      { wch: 20 }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التقرير المالي');

    // Generate filename
    const filename = `تقرير_مالي_${selectedMonth}_${selectedYear}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  }

  async function loadMonthlyReport() {
    try {
      setLoading(true);

      // Get all products
      const productsSnap = await getDocs(collection(firebaseDb, 'products'));
      const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

      // Get orders for the selected month
      const ordersSnap = await getDocs(collection(firebaseDb, 'orders'));
      const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

      // Filter orders by month and year
      const filteredOrders = orders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        const orderMonth = (orderDate.getMonth() + 1).toString().padStart(2, '0');
        const orderYear = orderDate.getFullYear().toString();
        return orderMonth === selectedMonth && orderYear === selectedYear;
      });

      // Calculate totals from products
      let totalPurchaseCost = 0;
      let totalSalesRevenue = 0;
      let totalShippingCost = 0;
      let totalDeliveryCost = 0;

      // For orders in this month
      let totalProductsSold = 0;
      filteredOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: OrderItem) => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
              const quantity = item.quantity || 1;
              totalProductsSold += quantity;
              
              // Calculate costs
              const purchasePrice = product.purchasePrice || 0;
              const shippingCost = product.shippingCost || 0;
              const deliveryCost = product.deliveryCost || 0;
              const salePrice = item.price || product.price || 0;

              totalPurchaseCost += purchasePrice * quantity;
              totalShippingCost += shippingCost * quantity;
              totalDeliveryCost += deliveryCost * quantity;
              totalSalesRevenue += salePrice * quantity;
            }
          });
        }
      });

      const totalCost = totalPurchaseCost + totalShippingCost + totalDeliveryCost;
      const totalProfit = totalSalesRevenue - totalCost;

      const report: MonthlyReport = {
        month: `${selectedYear}-${selectedMonth}`,
        totalPurchaseCost,
        totalSalesRevenue,
        totalShippingCost,
        totalDeliveryCost,
        totalCost,
        totalProfit,
        totalOrders: filteredOrders.length,
        totalProductsSold,
      };

      setMonthlyReport(report);
    } catch (error) {
      console.error('Error loading financial report:', error);
      alert('حدث خطأ في تحميل التقرير المالي');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
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
                📊 التقارير المالية
              </h1>
              <p className="text-gray-600 mt-1">Financial Reports - تقارير شهرية وسنوية</p>
            </div>
          </div>
        </div>

        {/* Month/Year Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-purple-100 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            اختر الشهر والسنة
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                السنة - Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none bg-white"
              >
                <option value="">اختر السنة</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                الشهر - Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none bg-white"
              >
                <option value="">اختر الشهر</option>
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadMonthlyReport}
                disabled={!selectedMonth || !selectedYear || loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري التحميل...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    عرض التقرير
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Report Results */}
        {monthlyReport && !loading && (
          <div className="space-y-6">
            {/* Export Button */}
            <div className="flex justify-end">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                تصدير إلى Excel
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Revenue */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-white/80 text-sm font-medium mb-1">إجمالي المبيعات</div>
                    <div className="text-3xl font-bold">${monthlyReport.totalSalesRevenue.toFixed(2)}</div>
                  </div>
                </div>
                <div className="text-white/70 text-xs">Total Sales Revenue</div>
              </div>

              {/* Total Cost */}
              <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-white/80 text-sm font-medium mb-1">إجمالي التكاليف</div>
                    <div className="text-3xl font-bold">${monthlyReport.totalCost.toFixed(2)}</div>
                  </div>
                </div>
                <div className="text-white/70 text-xs">Total Costs</div>
              </div>

              {/* Net Profit */}
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-white/80 text-sm font-medium mb-1">صافي الربح</div>
                    <div className="text-3xl font-bold">${monthlyReport.totalProfit.toFixed(2)}</div>
                  </div>
                </div>
                <div className="text-white/70 text-xs">Net Profit</div>
              </div>

              {/* Total Orders */}
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-white/80 text-sm font-medium mb-1">إجمالي الطلبات</div>
                    <div className="text-3xl font-bold">{monthlyReport.totalOrders}</div>
                  </div>
                </div>
                <div className="text-white/70 text-xs">Total Orders</div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-purple-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                تفاصيل التكاليف والأرباح
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium">قيمة شراء المنتجات:</span>
                  <span className="text-gray-900 font-bold text-lg">${monthlyReport.totalPurchaseCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium">تكاليف الشحن:</span>
                  <span className="text-gray-900 font-bold text-lg">${monthlyReport.totalShippingCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium">تكاليف التوصيل:</span>
                  <span className="text-gray-900 font-bold text-lg">${monthlyReport.totalDeliveryCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border-2 border-red-200">
                  <span className="text-red-800 font-bold text-lg">إجمالي التكاليف:</span>
                  <span className="text-red-900 font-bold text-2xl">${monthlyReport.totalCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <span className="text-green-800 font-bold text-lg">إجمالي المبيعات:</span>
                  <span className="text-green-900 font-bold text-2xl">${monthlyReport.totalSalesRevenue.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg text-white">
                  <div>
                    <div className="text-white/80 text-sm mb-1">صافي الربح</div>
                    <div className="text-white font-bold text-3xl">${monthlyReport.totalProfit.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/80 text-sm mb-1">هامش الربح</div>
                    <div className="text-white font-bold text-2xl">
                      {monthlyReport.totalSalesRevenue > 0 
                        ? ((monthlyReport.totalProfit / monthlyReport.totalSalesRevenue) * 100).toFixed(1)
                        : '0'}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-center">
                    <div className="text-purple-600 text-sm font-medium mb-2">عدد المنتجات المباعة</div>
                    <div className="text-purple-900 text-3xl font-bold">{monthlyReport.totalProductsSold}</div>
                  </div>

                  <div className="p-4 bg-pink-50 rounded-xl border border-pink-200 text-center">
                    <div className="text-pink-600 text-sm font-medium mb-2">متوسط قيمة الطلب</div>
                    <div className="text-pink-900 text-3xl font-bold">
                      ${monthlyReport.totalOrders > 0 
                        ? (monthlyReport.totalSalesRevenue / monthlyReport.totalOrders).toFixed(2)
                        : '0.00'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!monthlyReport && !loading && selectedMonth && selectedYear && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-200">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">لا توجد بيانات</h3>
            <p className="text-gray-500">لا توجد طلبات أو مبيعات لهذا الشهر</p>
          </div>
        )}

        {/* Initial State */}
        {!monthlyReport && !loading && (!selectedMonth || !selectedYear) && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-purple-200">
            <svg className="w-24 h-24 text-purple-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">اختر الشهر والسنة</h3>
            <p className="text-gray-500">اختر الشهر والسنة من الأعلى لعرض التقرير المالي</p>
          </div>
        )}
      </div>
    </div>
  );
}
