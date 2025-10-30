import * as XLSX from 'xlsx';
function exportStatsToExcel(stats: { [key: string]: number }) {
  const data = Object.entries(stats).map(([key, value]) => ({ القسم: key, العدد: value }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistics');
  XLSX.writeFile(workbook, 'statistics.xlsx');
}

import Link from 'next/link';
import { useRef } from 'react';
import { query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { firebaseDb } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import StatCardSkeleton from '../../components/dashboard/StatCardSkeleton';
import TrendBadge from '../../components/dashboard/TrendBadge';
import MiniChart from '../../components/dashboard/MiniChart';
import QuickViewModal from '../../components/dashboard/QuickViewModal';


const navItems = [
  { href: '/admin/products', label: 'المنتجات | Products', color: 'bg-blue-500' },
  { href: '/admin/brands', label: 'الماركات | Brands', color: 'bg-green-500' },
  { href: '/admin/categories', label: 'الأقسام | Categories', color: 'bg-orange-500' },
  { href: '/admin/orders', label: 'الطلبات | Orders', color: 'bg-purple-500' },
  { href: '/admin/customers', label: 'العملاء | Customers', color: 'bg-pink-500' },
  { href: '/admin/offers', label: 'العروض | Offers', color: 'bg-yellow-500' },
  { href: '/admin/banners', label: 'البنارات | Banners', color: 'bg-red-500' },
];



const statConfig = [
  {
    key: 'orders', labelEn: 'Orders', labelAr: 'الطلبات', color: 'bg-green-400',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v2a2 2 0 01-2 2H5a2 2 0 01-2-2V3zm0 6h18v12a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm5 4h2v2H8v-2zm4 0h2v2h-2v-2z" /></svg>),
    chartData: [12, 19, 15, 25, 22, 30, 28],
    badge: '🔔',
    hasQuickView: true,
  },
  {
    key: 'products', labelEn: 'Products', labelAr: 'المنتجات', color: 'bg-purple-400',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V7m0 6v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" /></svg>),
    chartData: [45, 52, 48, 58, 62, 70, 75],
    hasQuickView: true,
  },
  {
    key: 'brands', labelEn: 'Brands', labelAr: 'العلامات', color: 'bg-orange-500',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v10H7V7z" /></svg>),
    chartData: [8, 10, 9, 11, 12, 13, 14],
    hasQuickView: false,
  },
  {
    key: 'banners', labelEn: 'Banners', labelAr: 'البنارات', color: 'bg-red-400',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="8" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2" /></svg>),
    chartData: [3, 4, 4, 5, 5, 6, 6],
    hasQuickView: false,
  },
  {
    key: 'customers', labelEn: 'Customers', labelAr: 'العملاء', color: 'bg-indigo-500',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20h6M3 20h5v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>),
    chartData: [120, 135, 142, 158, 165, 178, 190],
    hasQuickView: true,
  },
  {
    key: 'categories', labelEn: 'Categories', labelAr: 'الأقسام', color: 'bg-blue-400',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" /></svg>),
    chartData: [15, 16, 17, 18, 19, 20, 21],
    hasQuickView: false,
  },
  {
    key: 'subcategories', labelEn: 'Subcategories', labelAr: 'الأقسام الفرعية', color: 'bg-cyan-400',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6v6H9z" /></svg>),
    chartData: [35, 38, 40, 42, 45, 48, 50],
    hasQuickView: false,
  },
  {
    key: 'addresses', labelEn: 'Addresses', labelAr: 'العناوين', color: 'bg-teal-400',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 12.414a2 2 0 00-2.828 0l-4.243 4.243a8 8 0 1111.314 0z" /></svg>),
    chartData: [45, 48, 47, 50, 52, 53, 55],
    hasQuickView: false,
  },
  {
    key: 'admins', labelEn: 'Admins', labelAr: 'المدراء', color: 'bg-gray-500',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" /></svg>),
    chartData: [3, 3, 3, 3, 3, 3, 3],
    hasQuickView: false,
  },
  {
    key: 'dailyStats', labelEn: 'Daily Stats', labelAr: 'إحصائيات يومية', color: 'bg-indigo-400',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>),
    chartData: [20, 22, 25, 28, 30, 32, 35],
    hasQuickView: false,
  },
];


export default function AdminDashboard() {
  // Unread support messages counter and notification sound
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const prevSupportCount = useRef(0);
  const [stats, setStats] = useState<{ [key: string]: number }>({});
  const [detailedStats, setDetailedStats] = useState<{ [key: string]: any }>({});
  const [trends, setTrends] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [selectedModal, setSelectedModal] = useState<{ type: string; title: string } | null>(null);
  const [showOrderNotification, setShowOrderNotification] = useState(true);
  const [lastSeenOrderCount, setLastSeenOrderCount] = useState(0);

  // تحميل آخر عدد طلبات تم رؤيته من localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lastSeenOrderCount');
    if (saved) {
      setLastSeenOrderCount(parseInt(saved));
    }
  }, []);

  // التحقق من وجود طلبات جديدة
  useEffect(() => {
    if (detailedStats.orders?.new > 0) {
      // إذا كان عدد الطلبات الجديدة أكبر من آخر عدد تم رؤيته، أظهر الإشعار
      if (detailedStats.orders.new > lastSeenOrderCount) {
        setShowOrderNotification(true);
      } else {
        setShowOrderNotification(false);
      }
    } else {
      setShowOrderNotification(false);
    }
  }, [detailedStats.orders?.new, lastSeenOrderCount]);

  useEffect(() => {
    const q = query(collection(firebaseDb, 'supportMessages'), where('read', '==', false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadSupportCount(snapshot.size);
      if (snapshot.size > prevSupportCount.current) {
        const audio = new Audio('/sounds/notify.mp3');
        audio.play();
      }
      prevSupportCount.current = snapshot.size;
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const newStats: { [key: string]: number } = {};
      const newDetailedStats: { [key: string]: any } = {};
      const newTrends: { [key: string]: number } = {};

      // حساب تاريخ قبل 7 أيام لمقارنة البيانات
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

      for (const item of statConfig) {
        if (item.key === 'subcategories') {
          // ✅ جمع الأقسام الفرعية داخل كل قسم
          try {
            const categoriesSnap = await getDocs(collection(firebaseDb, 'categories'));
            let subCount = 0;
            for (const catDoc of categoriesSnap.docs) {
              try {
                const subSnap = await getDocs(collection(firebaseDb, 'categories', catDoc.id, 'subcategory'));
                subCount += subSnap.size;
              } catch {}
            }
            newStats[item.key] = subCount;
          } catch {
            newStats[item.key] = 0;
          }
  
        } else if (item.key === 'customers') {
          // ✅ تعديل خاص للعملاء: استبعاد المدراء + حساب النشطين
          try {
            const snap = await getDocs(collection(firebaseDb, 'users'));
            const nonAdmins = snap.docs.filter(doc => !doc.data().isAdmin);
            newStats[item.key] = nonAdmins.length;
            
            // حساب العملاء النشطين خلال آخر 30 يوم
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const activeCustomers = nonAdmins.filter(doc => {
              const lastActive = doc.data().lastActive;
              if (lastActive && lastActive.toDate) {
                return lastActive.toDate() >= thirtyDaysAgo;
              }
              return false;
            });
            
            newDetailedStats[item.key] = {
              total: nonAdmins.length,
              active: activeCustomers.length,
              inactive: nonAdmins.length - activeCustomers.length,
            };
            
            // حساب النسبة المئوية - عملاء جدد خلال 7 أيام
            const oldCustomers = nonAdmins.filter(doc => {
              const createdAt = doc.data().createdAt;
              return createdAt && createdAt.toDate && createdAt.toDate() < sevenDaysAgoTimestamp.toDate();
            }).length;
            
            const newCustomers = nonAdmins.length - oldCustomers;
            if (oldCustomers > 0) {
              newTrends[item.key] = Math.round((newCustomers / oldCustomers) * 100);
            } else {
              newTrends[item.key] = newCustomers > 0 ? 100 : 0;
            }
          } catch {
            newStats[item.key] = 0;
            newTrends[item.key] = 0;
          }

        } else if (item.key === 'orders') {
          // ✅ إضافة تفاصيل الطلبات مع حالة الدفع والحالة الفعلية
          try {
            const snap = await getDocs(collection(firebaseDb, 'orders'));
            newStats[item.key] = snap.size;
            
            // حساب الطلبات حسب حالة الدفع
            const paidOrders = snap.docs.filter(doc => doc.data().paymentStatus === 'paid' || doc.data().isPaid === true);
            
            // حساب الطلبات حسب الحالة
            const openOrders = snap.docs.filter(doc => {
              const status = doc.data().status;
              return status === 'Received' || status === 'Under Review' || status === 'Preparing' || 
                     status === 'Shipped' || status === 'Arrived Hub' || status === 'Out for Delivery' ||
                     status === 'Awaiting Payment';
            });
            
            const closedOrders = snap.docs.filter(doc => {
              const status = doc.data().status;
              return status === 'Delivered' || status === 'Cancelled' || status === 'Delivery Failed';
            });
            
            const newOrders = snap.docs.filter(doc => {
              const status = doc.data().status;
              return status === 'Received' || status === 'Under Review' || !status;
            });
            
            newDetailedStats[item.key] = {
              total: snap.size,
              paid: paidOrders.length,
              open: openOrders.length,
              closed: closedOrders.length,
              new: newOrders.length,
            };
            
            // حساب النسبة المئوية - طلبات جديدة خلال 7 أيام
            const oldOrders = snap.docs.filter(doc => {
              const createdAt = doc.data().createdAt;
              return createdAt && createdAt.toDate && createdAt.toDate() < sevenDaysAgoTimestamp.toDate();
            }).length;
            
            const newOrdersCount = snap.size - oldOrders;
            if (oldOrders > 0) {
              newTrends[item.key] = Math.round((newOrdersCount / oldOrders) * 100);
            } else {
              newTrends[item.key] = newOrdersCount > 0 ? 100 : 0;
            }
          } catch {
            newStats[item.key] = 0;
            newTrends[item.key] = 0;
          }
  
        } else {
          // ✅ باقي الإحصائيات العادية
          try {
            const snap = await getDocs(collection(firebaseDb, item.key));
            newStats[item.key] = snap.size;
            
            // حساب النسبة المئوية للتغيير
            if (snap.docs.length > 0 && snap.docs[0].data().createdAt) {
              const oldCount = snap.docs.filter(doc => {
                const createdAt = doc.data().createdAt;
                return createdAt && createdAt.toDate && createdAt.toDate() < sevenDaysAgoTimestamp.toDate();
              }).length;
              
              const newCount = snap.size - oldCount;
              if (oldCount > 0) {
                newTrends[item.key] = Math.round((newCount / oldCount) * 100);
              } else {
                newTrends[item.key] = newCount > 0 ? 100 : 0;
              }
            } else {
              newTrends[item.key] = 0;
            }
          } catch {
            newStats[item.key] = 0;
            newTrends[item.key] = 0;
          }
        }
      }
      setStats(newStats);
      setDetailedStats(newDetailedStats);
      setTrends(newTrends);
      setLoading(false);
    }
    fetchStats();
  }, []);


  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {/* Support messages icon with unread counter */}
          <Link href="/admin/support-messages" title="رسائل الدعم" className="relative w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg transition text-white text-xl font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a3 3 0 003.22 0L22 8m-19 8V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {unreadSupportCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5 font-bold shadow">{unreadSupportCount}</span>
            )}
          </Link>

          {/* Activity Log Link */}
          <Link href="/admin/activity-log" title="سجل النشاط" className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-500 hover:bg-purple-600 shadow-lg transition text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </Link>

          {/* Settings Link */}
          <Link href="/admin/settings" title="الإعدادات" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-600 hover:bg-gray-700 shadow-lg transition text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>

          {/* Profile Link */}
          <Link href="/admin/profile" title="الملف الشخصي" className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 shadow-lg transition text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>

          {/* Logout button */}
          <button
            onClick={async () => {
              if (window.confirm('هل أنت متأكد أنك تريد تسجيل الخروج؟')) {
                await fetch('/api/logout', { method: 'POST' });
                window.location.href = '/admin/login';
              }
            }}
            title="تسجيل الخروج"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 shadow-lg transition text-white text-xl font-bold"
            style={{ fontFamily: 'inherit' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12" y2="16" />
            </svg>
          </button>
        </div>
        <h1 className="text-4xl font-bold">لوحة التحكم - Dashboard | Sab Store</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Render stat cards with loading skeleton */}
        {loading ? (
          // عرض Skeletons أثناء التحميل
          Array.from({ length: 10 }).map((_, idx) => <StatCardSkeleton key={idx} />)
        ) : (
          (() => {
            const cards = statConfig.map(item => {
              // determine target path for clickable cards
              let target: string | null = null;
              if (item.key === 'products') target = '/admin/products';
              else if (item.key === 'orders') target = '/admin/orders';
              else if (item.key === 'brands') target = '/admin/brands';
              else if (item.key === 'categories') target = '/admin/categories';
              else if (item.key === 'subcategories') target = '/admin/categories/subcategories';
              else if (item.key === 'customers') target = '/admin/customers';
              else if (item.key === 'banners') target = '/admin/banners';
              else if (item.key === 'addresses') target = '/admin/addresses';
              else if (item.key === 'admins') target = '/admin/admins';
              else if (item.key === 'users') target = '/admin/users';
              else if (item.key === 'dailyStats') target = '/admin/dailyStats';

              const currentStat = stats[item.key] ?? 0;
              const details = detailedStats[item.key];
              const trend = trends[item.key] ?? 0;

              const cardInner = (
                <div 
                  className={`${item.color} rounded-lg shadow-md p-4 flex flex-col justify-between min-h-[140px] cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-300 relative overflow-hidden`}
                  onClick={() => {
                    if (item.key === 'orders' && details?.new > 0) {
                      // حفظ عدد الطلبات الجديدة في localStorage
                      localStorage.setItem('lastSeenOrderCount', details.new.toString());
                      setLastSeenOrderCount(details.new);
                      setShowOrderNotification(false);
                    }
                  }}
                >
                  {/* إشعار الطلبات الجديدة - في وسط البطاقة */}
                  {item.badge && details?.new > 0 && showOrderNotification && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
                      <div className="relative">
                        {/* الدوائر المتموجة */}
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75 scale-[2.5]"></div>
                        <div className="absolute inset-0 bg-yellow-400 rounded-full animate-pulse opacity-50 scale-[2]"></div>
                        
                        {/* محتوى الإشعار */}
                        <div className="relative bg-red-600 text-white px-8 py-6 rounded-3xl font-black shadow-2xl flex flex-col items-center gap-3 border-4 border-white animate-bell-ring">
                          <span className="text-6xl drop-shadow-2xl animate-wiggle">{item.badge}</span>
                          <div className="bg-white text-red-600 px-6 py-3 rounded-2xl text-4xl font-black animate-bounce shadow-xl">
                            {details.new}
                          </div>
                          <div className="text-2xl font-extrabold animate-pulse">
                            طلب جديد!
                          </div>
                          <div className="text-sm opacity-80 mt-2">
                            👆 اضغط للمتابعة
                          </div>
                        </div>
                        
                        {/* Sparkles حول الإشعار */}
                        <div className="absolute -top-4 -right-4 text-yellow-300 text-3xl animate-ping">✨</div>
                        <div className="absolute -top-4 -left-4 text-yellow-300 text-3xl animate-pulse">⭐</div>
                        <div className="absolute -bottom-4 -right-4 text-yellow-300 text-3xl animate-bounce">💫</div>
                        <div className="absolute -bottom-4 -left-4 text-yellow-300 text-3xl animate-ping">🌟</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-4xl font-bold text-white mb-1">{currentStat}</div>
                      {/* عرض التفاصيل الإضافية */}
                      {details && item.key === 'customers' && (
                        <div className="text-xs text-white/80 space-y-0.5">
                          <div>✅ نشط: {details.active}</div>
                          <div>💤 غير نشط: {details.inactive}</div>
                        </div>
                      )}
                      {details && item.key === 'orders' && (
                        <div className="text-xs text-white/80 space-y-0.5">
                          <div>💰 مدفوع: {details.paid}</div>
                          <div>📂 مفتوح: {details.open}</div>
                          <div>✅ مغلق: {details.closed}</div>
                        </div>
                      )}
                    </div>
                    <div className="text-white/70 scale-75">{item.icon}</div>
                  </div>

                  <div className="mt-auto">
                    <div className="text-base font-bold text-white">{item.labelEn}</div>
                    <div className="text-sm text-white/80">{item.labelAr}</div>
                    
                    {/* Trend Badge */}
                    <div className="mt-1.5">
                      <TrendBadge value={trend} />
                    </div>
                  </div>

                  {/* زر عرض التفاصيل */}
                  {item.hasQuickView && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedModal({ type: item.key, title: item.labelAr });
                      }}
                      className="mt-2 w-full bg-white/20 hover:bg-white/30 text-white text-xs py-1.5 rounded-md transition font-bold backdrop-blur-sm"
                    >
                      🔍 عرض التفاصيل
                    </button>
                  )}
                </div>
              );

              if (target) {
                return (
                  <Link key={item.key} href={target} className="block">
                    {cardInner}
                  </Link>
                );
              }

              return (
                <div key={item.key}>
                  {cardInner}
                </div>
              );
            });

            // Find index of Daily Stats
            const dailyStatsIdx = statConfig.findIndex(item => item.key === 'dailyStats');
            // Insert Summary after Daily Stats
            cards.splice(dailyStatsIdx + 1, 0,
              <Link href="/admin/summary" key="summary" className="bg-green-600 rounded-lg shadow-md p-4 flex flex-col justify-between min-h-[140px] cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-4xl font-bold text-white">📊</div>
                </div>
                <div className="mt-auto">
                  <div className="text-base font-bold text-white">Summary</div>
                  <div className="text-sm text-white/80">ملخص الإحصائيات</div>
                </div>
              </Link>
            );
            return cards;
          })()
        )}
      </div>

      {/* Quick View Modal */}
      {selectedModal && (
        <QuickViewModal
          isOpen={true}
          onClose={() => setSelectedModal(null)}
          type={selectedModal.type}
          title={selectedModal.title}
        />
      )}
    </div>
  );
}


