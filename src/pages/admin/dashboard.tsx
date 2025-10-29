
import Link from 'next/link';
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
    key: 'banners', labelEn: 'Banners', labelAr: 'البنارات', color: 'bg-red-400', percent: '2%+',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="8" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2" /></svg>),
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
    key: 'users', labelEn: 'Users', labelAr: 'المستخدمين', color: 'bg-yellow-400', percent: '10%+',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" /></svg>),
  },
  {
    key: 'dailyStats', labelEn: 'Daily Stats', labelAr: 'إحصائيات يومية', color: 'bg-indigo-400', percent: '3%+',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>),
  },
];


export default function AdminDashboard() {
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
          } catch (e) {
            newStats[item.key] = 0;
          }
        }
      }
      setStats(newStats);
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen p-6 font-arabic">

      <h1 className="text-4xl font-bold mb-8">لوحة التحكم - Dashboard | Sab Store</h1>

  <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {statConfig.map((card, idx) => {
          // Define target page for each card
          let target = null;
          if (card.key === 'products') target = '/admin/products';
          else if (card.key === 'orders') target = '/admin/orders';
          else if (card.key === 'brands') target = '/admin/brands';
          else if (card.key === 'categories') target = '/admin/categories';
          else if (card.key === 'subcategories') target = '/admin/categories/subcategories';
          else if (card.key === 'customers') target = '/admin/customers';
          else if (card.key === 'banners') target = '/admin/banners';
          else if (card.key === 'addresses') target = '/admin/addresses';
          else if (card.key === 'admins') target = '/admin/admins';
          else if (card.key === 'users') target = '/admin/users';
          else if (card.key === 'dailyStats') target = '/admin/dailyStats';

          return target ? (
            <Link key={card.key} href={target} className={`rounded-2xl p-8 flex flex-col justify-between h-48 text-white shadow-lg cursor-pointer transition-transform hover:scale-105 ${card.color}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-4xl font-bold">{stats[card.key] ?? 0}</span>
                <div className="flex flex-col items-center">
                  <div className="bg-white bg-opacity-20 rounded-lg p-2 mb-1">{card.icon}</div>
                  <span className="font-semibold text-lg">{card.labelEn}</span>
                  <span className="text-sm">{card.labelAr}</span>
                </div>
              </div>
              <div className="flex items-end justify-end">
                <span className="text-xs font-bold">{card.percent} <span className="ml-1">↗</span></span>
              </div>
            </Link>
          ) : (
            <div key={card.key} className={`rounded-2xl p-8 flex flex-col justify-between h-48 text-white shadow-lg ${card.color}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-4xl font-bold">{stats[card.key] ?? 0}</span>
                <div className="flex flex-col items-center">
                  <div className="bg-white bg-opacity-20 rounded-lg p-2 mb-1">{card.icon}</div>
                  <span className="font-semibold text-lg">{card.labelEn}</span>
                  <span className="text-sm">{card.labelAr}</span>
                </div>
              </div>
              <div className="flex items-end justify-end">
                <span className="text-xs font-bold">{card.percent} <span className="ml-1">↗</span></span>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
