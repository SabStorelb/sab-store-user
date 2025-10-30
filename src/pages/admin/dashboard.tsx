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
import { query, where, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { firebaseDb } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';


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
    key: 'orders', labelEn: 'Orders', labelAr: 'الطلبات', color: 'bg-green-400', percent: '8%+',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v2a2 2 0 01-2 2H5a2 2 0 01-2-2V3zm0 6h18v12a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm5 4h2v2H8v-2zm4 0h2v2h-2v-2z" /></svg>),
  },
  {
    key: 'products', labelEn: 'Products', labelAr: 'المنتجات', color: 'bg-purple-400', percent: '12%+',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V7m0 6v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" /></svg>),
  },
  {
    key: 'brands', labelEn: 'Brands', labelAr: 'العلامات', color: 'bg-orange-500', percent: '4%+',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v10H7V7z" /></svg>),
  },
  {
    key: 'banners', labelEn: 'Banners', labelAr: 'البنارات', color: 'bg-red-400', percent: '2%+',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="8" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2" /></svg>),
  },
  {
    key: 'customers', labelEn: 'Customers', labelAr: 'العملاء', color: 'bg-pink-400', percent: '15%+',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20h6M3 20h5v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>),
  },
  {
    key: 'categories', labelEn: 'Categories', labelAr: 'الأقسام', color: 'bg-blue-400', percent: '6%+',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" /></svg>),
  },
  {
    key: 'subcategories', labelEn: 'Subcategories', labelAr: 'الأقسام الفرعية', color: 'bg-cyan-400', percent: '5%+',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6v6H9z" /></svg>),
  },
  {
    key: 'addresses', labelEn: 'Addresses', labelAr: 'العناوين', color: 'bg-teal-400', percent: '1%+',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 12.414a2 2 0 00-2.828 0l-4.243 4.243a8 8 0 1111.314 0z" /></svg>),
  },
  {
    key: 'admins', labelEn: 'Admins', labelAr: 'المدراء', color: 'bg-gray-500', percent: '1%+',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" /></svg>),
  },
  {
    key: 'dailyStats', labelEn: 'Daily Stats', labelAr: 'إحصائيات يومية', color: 'bg-indigo-400', percent: '3%+',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>),
  },
];


export default function AdminDashboard() {
  // Unread support messages counter and notification sound
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const prevSupportCount = useRef(0);
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
  const [stats, setStats] = useState<{ [key: string]: number }>({});
  useEffect(() => {
    async function fetchStats() {
      const newStats: { [key: string]: number } = {};
      for (const item of statConfig) {
        if (item.key === 'subcategories') {
          // special: sum all subcategory collections inside each category
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
        } else {
          try {
            const snap = await getDocs(collection(firebaseDb, item.key));
            newStats[item.key] = snap.size;
          } catch {
            newStats[item.key] = 0;
          }
        }
      }
      setStats(newStats);
    }
    fetchStats();
  }, []);


  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {/* Support messages icon with unread counter */}
          <a href="/admin/support-messages" title="رسائل الدعم" className="relative w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg transition text-white text-xl font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a3 3 0 003.22 0L22 8m-19 8V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {unreadSupportCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5 font-bold shadow">{unreadSupportCount}</span>
            )}
          </a>
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
        {/* Render stat cards, insert Summary next to Daily Stats */}
        {(() => {
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

            const cardInner = (
              <div className={`${item.color} rounded-xl shadow p-6 flex flex-col justify-between min-h-[140px] cursor-pointer hover:scale-[1.03] transition-transform`}>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-white">{stats[item.key] ?? 0}</div>
                </div>
                <div className="mt-2">
                  <div className="text-lg font-bold text-white">{item.labelEn}</div>
                  <div className="text-sm text-white/80">{item.labelAr}</div>
                  <div className="text-xs text-white/60 mt-1">{item.percent}</div>
                </div>
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
            <Link href="/admin/summary" key="summary" className="bg-green-600 rounded-xl shadow p-6 flex flex-col justify-between min-h-[140px] cursor-pointer hover:scale-[1.03] transition-transform">
              <div className="flex items-center justify-between mb-2">
                <div className="text-4xl font-bold text-white">Summary</div>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold text-white">ملخص الإحصائيات</div>
              </div>
            </Link>
          );
          return cards;
        })()}
      </div>
    </div>
  );
}


