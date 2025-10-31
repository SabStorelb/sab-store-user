import * as XLSX from 'xlsx';
function exportStatsToExcel(stats: { [key: string]: number }) {
  const data = Object.entries(stats).map(([key, value]) => ({ القسم: key, العدد: value }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistics');
  XLSX.writeFile(workbook, 'statistics.xlsx');
}

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { firebaseDb } from '../../lib/firebase';
import { useAdminPermissions } from '../../lib/useAdminPermissions';
import { AdminPermissions, hasPermission } from '../../lib/permissions';
import StatCardSkeleton from '../../components/dashboard/StatCardSkeleton';
import TrendBadge from '../../components/dashboard/TrendBadge';
import QuickViewModal from '../../components/dashboard/QuickViewModal';


type PermissionKey = keyof AdminPermissions;

type PermissionMeta = {
  requiredPermission?: PermissionKey;
  superAdminOnly?: boolean;
};

type DashboardNavItem = PermissionMeta & {
  key: string;
  href: string;
  labelEn: string;
  labelAr: string;
  color: string;
  icon: JSX.Element;
};

type StatConfigItem = PermissionMeta & {
  key: string;
  labelEn: string;
  labelAr: string;
  color: string;
  icon: JSX.Element;
  chartData: number[];
  badge?: string;
  hasQuickView: boolean;
};

type OrdersDetail = {
  total: number;
  paid: number;
  open: number;
  closed: number;
  new: number;
};

type CustomersDetail = {
  total: number;
  active: number;
  inactive: number;
};

type GenericDetail = {
  total?: number;
  [key: string]: number | undefined;
};

type StatDetail = OrdersDetail | CustomersDetail | GenericDetail;

type DetailedStatsMap = Partial<Record<string, StatDetail>>;

const isOrdersDetail = (detail: StatDetail | undefined): detail is OrdersDetail => {
  return Boolean(detail && 'paid' in detail && 'new' in detail);
};

const isCustomersDetail = (detail: StatDetail | undefined): detail is CustomersDetail => {
  return Boolean(detail && 'active' in detail && 'inactive' in detail);
};

const navItems: DashboardNavItem[] = [
  {
    key: 'products',
    href: '/admin/products',
    labelEn: 'Products',
    labelAr: 'المنتجات',
    color: 'from-blue-500 to-indigo-500',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V7m0 6v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" />
      </svg>
    ),
    requiredPermission: 'canManageProducts',
  },
  {
    key: 'warehouseSystem',
    href: '/admin/warehouse',
    labelEn: 'Warehouse',
    labelAr: 'نظام المستودعات',
    color: 'from-slate-600 to-slate-800',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9-4 9 4v10a2 2 0 01-2 2h-2a2 2 0 01-2-2v-3H7v3a2 2 0 01-2 2H3a2 2 0 01-2-2V7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V10h6v11" />
      </svg>
    ),
    requiredPermission: 'canManageProducts',
  },
  {
    key: 'vendorSystem',
    href: '/admin/vendors',
    labelEn: 'Vendors',
    labelAr: 'نظام البائعين',
    color: 'from-amber-500 to-orange-500',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11a4 4 0 10-8 0 4 4 0 008 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15c-4.418 0-8 2.015-8 4.5V21h16v-1.5c0-2.485-3.582-4.5-8-4.5z" />
      </svg>
    ),
    requiredPermission: 'canManageProducts',
  },
  {
    key: 'brands',
    href: '/admin/brands',
    labelEn: 'Brands',
    labelAr: 'الماركات',
    color: 'from-emerald-500 to-teal-500',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v10H7V7z" />
      </svg>
    ),
    requiredPermission: 'canManageBrands',
  },
  {
    key: 'categories',
    href: '/admin/categories',
    labelEn: 'Categories',
    labelAr: 'الأقسام',
    color: 'from-orange-500 to-amber-500',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" />
      </svg>
    ),
    requiredPermission: 'canManageCategories',
  },
  {
    key: 'orders',
    href: '/admin/orders',
    labelEn: 'Orders',
    labelAr: 'الطلبات',
    color: 'from-purple-500 to-violet-500',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v2a2 2 0 01-2 2H5a2 2 0 01-2-2V3zm0 6h18v12a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm5 4h2v2H8v-2zm4 0h2v2h-2v-2z" />
      </svg>
    ),
    requiredPermission: 'canManageOrders',
  },
  {
    key: 'customers',
    href: '/admin/customers',
    labelEn: 'Customers',
    labelAr: 'العملاء',
    color: 'from-pink-500 to-fuchsia-500',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20h6M3 20h5v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    requiredPermission: 'canManageUsers',
  },
  {
    key: 'offers',
    href: '/admin/offers',
    labelEn: 'Offers',
    labelAr: 'العروض',
    color: 'from-yellow-500 to-lime-500',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 18.364L4 22l3.636-1.121 12.243-12.243a2 2 0 000-2.828l-2.828-2.828a2 2 0 00-2.828 0L5.121 18.364z" />
      </svg>
    ),
    requiredPermission: 'canManageProducts',
  },
  {
    key: 'banners',
    href: '/admin/banners',
    labelEn: 'Banners',
    labelAr: 'البنارات',
    color: 'from-red-500 to-rose-500',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="4" y="8" width="16" height="8" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2" />
      </svg>
    ),
    requiredPermission: 'canManageBanners',
  },
  {
    key: 'admins',
    href: '/admin/admins',
    labelEn: 'Admins',
    labelAr: 'المدراء',
    color: 'from-slate-600 to-gray-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      </svg>
    ),
    requiredPermission: 'canManageAdmins',
    superAdminOnly: true,
  },
];



const statConfig: StatConfigItem[] = [
  {
    key: 'orders', labelEn: 'Orders', labelAr: 'الطلبات', color: 'bg-gradient-to-br from-green-400 via-green-500 to-emerald-600',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v2a2 2 0 01-2 2H5a2 2 0 01-2-2V3zm0 6h18v12a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm5 4h2v2H8v-2zm4 0h2v2h-2v-2z" /></svg>),
    chartData: [12, 19, 15, 25, 22, 30, 28],
    badge: '🔔',
    hasQuickView: true,
    requiredPermission: 'canManageOrders',
  },
  {
    key: 'products', labelEn: 'Products', labelAr: 'المنتجات', color: 'bg-gradient-to-br from-purple-400 via-purple-500 to-fuchsia-500',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V7m0 6v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" /></svg>),
    chartData: [45, 52, 48, 58, 62, 70, 75],
    hasQuickView: true,
    requiredPermission: 'canManageProducts',
  },
  {
    key: 'warehouseSystem', labelEn: 'Warehouse', labelAr: 'نظام المستودعات', color: 'bg-gradient-to-br from-slate-500 via-slate-600 to-gray-700',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9-4 9 4v10a2 2 0 01-2 2h-2a2 2 0 01-2-2v-3H7v3a2 2 0 01-2 2H3a2 2 0 01-2-2V7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 21V10h6v11" /></svg>),
    chartData: [120, 118, 122, 128, 135, 140, 144],
    hasQuickView: true,
    requiredPermission: 'canManageProducts',
  },
  {
    key: 'vendorSystem', labelEn: 'Vendors', labelAr: 'نظام البائعين', color: 'bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11a4 4 0 10-8 0 4 4 0 008 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15c-4.418 0-8 2.015-8 4.5V21h16v-1.5c0-2.485-3.582-4.5-8-4.5z" /></svg>),
    chartData: [4, 5, 6, 7, 8, 9, 10],
    hasQuickView: true,
    requiredPermission: 'canManageProducts',
  },
  {
    key: 'brands', labelEn: 'Brands', labelAr: 'العلامات', color: 'bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v10H7V7z" /></svg>),
    chartData: [8, 10, 9, 11, 12, 13, 14],
    hasQuickView: false,
    requiredPermission: 'canManageBrands',
  },
  {
    key: 'banners', labelEn: 'Banners', labelAr: 'البنارات', color: 'bg-gradient-to-br from-rose-400 via-red-500 to-rose-600',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="8" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2" /></svg>),
    chartData: [3, 4, 4, 5, 5, 6, 6],
    hasQuickView: false,
    requiredPermission: 'canManageBanners',
  },
  {
    key: 'customers', labelEn: 'Customers', labelAr: 'العملاء', color: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20h6M3 20h5v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>),
    chartData: [120, 135, 142, 158, 165, 178, 190],
    hasQuickView: true,
    requiredPermission: 'canManageUsers',
  },
  {
    key: 'categories', labelEn: 'Categories', labelAr: 'الأقسام', color: 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-500',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" /></svg>),
    chartData: [15, 16, 17, 18, 19, 20, 21],
    hasQuickView: false,
    requiredPermission: 'canManageCategories',
  },
  {
    key: 'subcategories', labelEn: 'Subcategories', labelAr: 'الأقسام الفرعية', color: 'bg-gradient-to-br from-cyan-400 via-cyan-500 to-sky-500',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6v6H9z" /></svg>),
    chartData: [35, 38, 40, 42, 45, 48, 50],
    hasQuickView: false,
    requiredPermission: 'canManageCategories',
  },
  // DISABLED: addresses - تم تعطيلها مؤقتاً
  // {
  //   key: 'addresses', labelEn: 'Addresses', labelAr: 'العناوين', color: 'bg-teal-400',
  //   icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 12.414a2 2 0 00-2.828 0l-4.243 4.243a8 8 0 1111.314 0z" /></svg>),
  //   chartData: [45, 48, 47, 50, 52, 53, 55],
  //   hasQuickView: false,
  // },
  {
    key: 'admins', labelEn: 'Admins', labelAr: 'المدراء', color: 'bg-gradient-to-br from-gray-500 via-gray-600 to-slate-600',
    icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" /></svg>),
    chartData: [3, 3, 3, 3, 3, 3, 3],
    hasQuickView: false,
    requiredPermission: 'canManageAdmins',
    superAdminOnly: true,
  },
  // DISABLED: dailyStats - تم تعطيلها لعدم وجود صفحة مخصصة لها
  // {
  //   key: 'dailyStats', labelEn: 'Daily Stats', labelAr: 'إحصائيات يومية', color: 'bg-indigo-400',
  //   icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>),
  //   chartData: [20, 22, 25, 28, 30, 32, 35],
  //   hasQuickView: false,
  // },
];


export default function AdminDashboard() {
  // Unread support messages counter and notification sound
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const prevSupportCount = useRef(0);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [detailedStats, setDetailedStats] = useState<DetailedStatsMap>({});
  const [trends, setTrends] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedModal, setSelectedModal] = useState<{ type: string; title: string } | null>(null);
  const [showOrderNotification, setShowOrderNotification] = useState(true);
  const [lastSeenOrderCount, setLastSeenOrderCount] = useState(0);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const { admin, loading: permissionsLoading, isSuperAdmin } = useAdminPermissions();

  const canAccess = useCallback((meta: PermissionMeta): boolean => {
    if (meta.superAdminOnly && !isSuperAdmin) {
      return false;
    }

    if (meta.requiredPermission) {
      return hasPermission(admin, meta.requiredPermission);
    }

    return true;
  }, [admin, isSuperAdmin]);

  const visibleNavItems = useMemo(
    () => navItems.filter(canAccess),
    [canAccess]
  );

  const visibleStatConfig = useMemo(
    () => statConfig.filter(canAccess),
    [canAccess]
  );

  // جلب معلومات الأدمن
  useEffect(() => {
    async function fetchAdminInfo() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setAdminName(data.user.name || '');
          setAdminEmail(data.user.email || '');
        }
      } catch (error) {
        console.error('Error fetching admin info:', error);
      }
    }
    fetchAdminInfo();
  }, []);

  // تحميل آخر عدد طلبات تم رؤيته من localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lastSeenOrderCount');
    if (saved) {
      setLastSeenOrderCount(parseInt(saved));
    }
  }, []);

  // التحقق من وجود طلبات جديدة
  useEffect(() => {
    const ordersDetail = detailedStats.orders;

    if (isOrdersDetail(ordersDetail) && ordersDetail.new > 0) {
      // إذا كان عدد الطلبات الجديدة أكبر من آخر عدد تم رؤيته، أظهر الإشعار
      if (ordersDetail.new > lastSeenOrderCount) {
        setShowOrderNotification(true);
      } else {
        setShowOrderNotification(false);
      }
    } else {
      setShowOrderNotification(false);
    }
  }, [detailedStats, lastSeenOrderCount]);

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
    if (permissionsLoading) {
      return;
    }

    let isMounted = true;

    async function fetchStats() {
      setLoading(true);
  const newStats: Record<string, number> = {};
  const newDetailedStats: DetailedStatsMap = {};
  const newTrends: Record<string, number> = {};

      if (visibleStatConfig.length === 0) {
        if (!isMounted) return;
        setStats(newStats);
        setDetailedStats(newDetailedStats);
        setTrends(newTrends);
        setLoading(false);
        return;
      }

      // حساب تاريخ قبل 7 أيام لمقارنة البيانات
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

      for (const item of visibleStatConfig) {
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

        } else if (item.key === 'warehouseSystem') {
          try {
            const snap = await getDocs(collection(firebaseDb, 'products'));
            let totalStock = 0;
            let lowStock = 0;
            let outOfStock = 0;

            for (const docSnap of snap.docs) {
              const data = docSnap.data();
              const stockValue = Number(data.stock ?? data.inventory ?? 0);
              if (!Number.isNaN(stockValue)) {
                totalStock += stockValue;
                if (stockValue <= 0) {
                  outOfStock += 1;
                } else if (stockValue < 5) {
                  lowStock += 1;
                }
              }
            }

            newStats[item.key] = totalStock;
            newDetailedStats[item.key] = {
              total: snap.size,
              totalStock,
              lowStock,
              outOfStock,
            };

            const oldProducts = snap.docs.filter(doc => {
              const createdAt = doc.data().createdAt;
              return createdAt && createdAt.toDate && createdAt.toDate() < sevenDaysAgoTimestamp.toDate();
            }).length;
            const newProducts = snap.size - oldProducts;
            if (oldProducts > 0) {
              newTrends[item.key] = Math.round((newProducts / oldProducts) * 100);
            } else {
              newTrends[item.key] = newProducts > 0 ? 100 : 0;
            }
          } catch {
            newStats[item.key] = 0;
            newDetailedStats[item.key] = {
              total: 0,
              totalStock: 0,
              lowStock: 0,
              outOfStock: 0,
            };
            newTrends[item.key] = 0;
          }

        } else if (item.key === 'vendorSystem') {
          try {
            const suppliersSnap = await getDocs(collection(firebaseDb, 'suppliers'));
            const productsSnap = await getDocs(collection(firebaseDb, 'products'));
            const vendorProducts = productsSnap.docs.filter(doc => {
              const data = doc.data();
              const vendorId = data.vendorId || data.productVendorId || data.productVendor;
              return typeof vendorId === 'string' && vendorId.trim().length > 0;
            });

            const activeVendors = new Set(
              vendorProducts
                .map(doc => {
                  const data = doc.data();
                  return (data.vendorId || data.productVendorId || data.productVendor) as string | undefined;
                })
                .filter(Boolean)
            ).size;

            newStats[item.key] = suppliersSnap.size;
            newDetailedStats[item.key] = {
              total: suppliersSnap.size,
              vendorProducts: vendorProducts.length,
              activeVendors,
            };

            const oldVendorProducts = vendorProducts.filter(doc => {
              const createdAt = doc.data().createdAt;
              return createdAt && createdAt.toDate && createdAt.toDate() < sevenDaysAgoTimestamp.toDate();
            }).length;
            const newVendorProducts = vendorProducts.length - oldVendorProducts;
            if (oldVendorProducts > 0) {
              newTrends[item.key] = Math.round((newVendorProducts / oldVendorProducts) * 100);
            } else {
              newTrends[item.key] = newVendorProducts > 0 ? 100 : 0;
            }
          } catch {
            newStats[item.key] = 0;
            newDetailedStats[item.key] = {
              total: 0,
              vendorProducts: 0,
              activeVendors: 0,
            };
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
      if (!isMounted) return;
      setStats(newStats);
      setDetailedStats(newDetailedStats);
      setTrends(newTrends);
      setLoading(false);
    }
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [permissionsLoading, visibleStatConfig]);


  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-100 p-6 md:p-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-200/60 via-transparent to-transparent blur-2xl" />
      <div className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-purple-300/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl backdrop-blur-xl lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
          {/* Support messages icon with unread counter */}
          {canAccess({ requiredPermission: 'canManageUsers' }) && (
            <Link href="/admin/support-messages" title="رسائل الدعم | Support Messages" className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a3 3 0 003.22 0L22 8m-19 8V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden md:inline">الرسائل</span>
              {unreadSupportCount > 0 && (
                <span className="bg-red-600 text-white text-xs rounded-full px-2 py-0.5 font-bold shadow">{unreadSupportCount}</span>
              )}
            </Link>
          )}

          {/* Activity Log Link */}
          {canAccess({ superAdminOnly: true }) && (
            <Link href="/admin/activity-log" title="سجل النشاط | Activity Log" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden md:inline">السجل</span>
            </Link>
          )}

          {/* Financial Reports Link */}
          {canAccess({ requiredPermission: 'canViewReports' }) && (
            <Link href="/admin/financial-reports" title="التقارير المالية | Financial Reports" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="hidden md:inline">التقارير</span>
            </Link>
          )}

          {canAccess({ requiredPermission: 'canViewReports' }) && visibleStatConfig.length > 0 && (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                if (loading) return;
                exportStatsToExcel(stats);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold shadow-lg transition-all duration-200 ${loading ? 'cursor-not-allowed bg-gradient-to-r from-slate-400 to-slate-500 text-white/80 opacity-70' : 'bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white hover:shadow-xl'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-6L12 15m0 0l4.5-4.5M12 15V3" />
              </svg>
              <span className="hidden md:inline">تصدير الإحصائيات</span>
            </button>
          )}

          {/* Cost Calculator Link - SuperAdmin Only */}
          {canAccess({ superAdminOnly: true }) && (
            <Link href="/admin/cost-calculator" title="حاسبة التكلفة | Cost Calculator" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="hidden md:inline">حاسبة التكلفة</span>
            </Link>
          )}

          {/* Settings Link */}
          {canAccess({ requiredPermission: 'canManageAdmins', superAdminOnly: true }) && (
            <Link href="/admin/settings" title="الإعدادات | Settings" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden md:inline">الإعدادات</span>
            </Link>
          )}

          {/* Profile Link */}
          <Link href="/admin/profile" title="الملف الشخصي | Profile" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="hidden md:inline">الملف الشخصي</span>
          </Link>

          {/* Logout button */}
          <button
            onClick={async () => {
              if (window.confirm('هل أنت متأكد أنك تريد تسجيل الخروج؟')) {
                await fetch('/api/logout', { method: 'POST' });
                window.location.href = '/admin/login';
              }
            }}
            title="تسجيل الخروج | Logout"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden md:inline">تسجيل الخروج</span>
          </button>
        </div>
        
            {/* Admin Info */}
            <div className="flex items-center gap-4 rounded-2xl bg-white/70 px-5 py-4 shadow-inner backdrop-blur-md">
              <div className="hidden text-5xl lg:block">🎯</div>
              <div className="text-right">
                <h1 className="text-3xl font-extrabold text-gray-800 md:text-4xl">لوحة التحكم - Dashboard</h1>
                {adminName && (
                  <p className="mt-2 text-base text-gray-600">
                    مرحباً، <span className="font-bold text-blue-600">{adminName}</span>
                  </p>
                )}
                {adminEmail && (
                  <p className="mt-1 flex items-center justify-end gap-2 text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-gray-400">
                      <path d="M1.5 8.67v8.58A2.25 2.25 0 003.75 19.5h16.5a2.25 2.25 0 002.25-2.25V8.67l-9 4.5-9-4.5z" />
                      <path d="M22.5 6.75v-.008l-.008-.004L12 1.5 1.508 6.738l-.008.004V6.75L12 12l10.5-5.25z" />
                    </svg>
                    <span>{adminEmail}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Render stat cards with loading skeleton */}
        {loading ? (
          // عرض Skeletons أثناء التحميل
          Array.from({ length: visibleStatConfig.length || 6 }).map((_, idx) => <StatCardSkeleton key={idx} />)
        ) : (
          (() => {
            const cards = visibleStatConfig.map(item => {
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
              else if (item.key === 'warehouseSystem') target = '/admin/warehouse';
              else if (item.key === 'vendorSystem') target = '/admin/vendors';

              const currentStat = stats[item.key] ?? 0;
              const detail = detailedStats[item.key];
              const ordersDetail = isOrdersDetail(detail) ? detail : undefined;
              const customersDetail = isCustomersDetail(detail) ? detail : undefined;
              const trend = trends[item.key] ?? 0;

              const cardInner = (
                <div 
                  className={`${item.color} group relative overflow-hidden rounded-2xl border border-white/20 shadow-xl p-5 flex flex-col justify-between h-[210px] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
                  onClick={() => {
                    if (item.key === 'orders' && ordersDetail && ordersDetail.new > 0) {
                      // حفظ عدد الطلبات الجديدة في localStorage
                      localStorage.setItem('lastSeenOrderCount', ordersDetail.new.toString());
                      setLastSeenOrderCount(ordersDetail.new);
                      setShowOrderNotification(false);
                    }
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-white/25 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-black/20 blur-3xl" />

                  {/* إشعار الطلبات الجديدة - في وسط البطاقة */}
                  {item.badge && ordersDetail && ordersDetail.new > 0 && showOrderNotification && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
                      <div className="relative">
                        {/* الدوائر المتموجة */}
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75 scale-[2.5]"></div>
                        <div className="absolute inset-0 bg-yellow-400 rounded-full animate-pulse opacity-50 scale-[2]"></div>
                        
                        {/* محتوى الإشعار */}
                        <div className="relative bg-red-600 text-white px-8 py-6 rounded-3xl font-black shadow-2xl flex flex-col items-center gap-3 border-4 border-white animate-bell-ring">
                          <span className="text-6xl drop-shadow-2xl animate-wiggle">{item.badge}</span>
                          <div className="bg-white text-red-600 px-6 py-3 rounded-2xl text-4xl font-black animate-bounce shadow-xl">
                            {ordersDetail.new}
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

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-4xl font-black text-white mb-1 drop-shadow-lg">{currentStat}</div>
                    </div>
                    <div className="text-white/80 scale-75">{item.icon}</div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-base font-black text-white mb-0.5">{item.labelEn}</div>
                        <div className="text-sm font-bold text-white/90 mb-1">{item.labelAr}</div>
                      </div>
                      
                      {/* عرض التفاصيل بجانب النص */}
                      {customersDetail && (
                        <div className="text-xs text-white/90 space-y-0.5 font-semibold text-right">
                          <div>✅ نشط: {customersDetail.active}</div>
                          <div>💤 غير نشط: {customersDetail.inactive}</div>
                        </div>
                      )}
                      {ordersDetail && (
                        <div className="text-xs text-white/90 space-y-0.5 font-semibold text-right">
                          <div>💰 مدفوع: {ordersDetail.paid}</div>
                          <div>📂 مفتوح: {ordersDetail.open}</div>
                          <div>✅ مغلق: {ordersDetail.closed}</div>
                        </div>
                      )}
                    </div>
                    
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
                      className="mt-2 w-full bg-white/20 hover:bg-white/40 text-white text-sm py-2 rounded-lg transition-all font-bold backdrop-blur-sm border-2 border-white/30 hover:border-white/60"
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

            // DISABLED: Summary - تم تعطيلها مؤقتاً
            // Find index of Daily Stats
            // const dailyStatsIdx = visibleStatConfig.findIndex(item => item.key === 'dailyStats');
            // Insert Summary after Daily Stats
            // cards.splice(dailyStatsIdx + 1, 0,
            //   <Link href="/admin/summary" key="summary" className="bg-green-600 rounded-lg shadow-md p-4 flex flex-col justify-between min-h-[140px] cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
            //     <div className="flex items-center justify-between mb-1">
            //       <div className="text-4xl font-bold text-white">📊</div>
            //     </div>
            //     <div className="mt-auto">
            //       <div className="text-base font-bold text-white">Summary</div>
            //       <div className="text-sm text-white/80">ملخص الإحصائيات</div>
            //     </div>
            //   </Link>
            // );
            return cards;
          })()
        )}
        </div>

        {visibleNavItems.length > 0 && (
          <div className="mt-4 md:mt-8 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-3xl">🚀</span>
              <span>روابط الوصول السريع</span>
            </h2>
            <p className="text-sm text-gray-500 sm:text-right">
              يعرض هذا القسم الصفحات والأدوات المسموح لك بالوصول إليها وفق صلاحياتك الحالية.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleNavItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="group relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className={`bg-gradient-to-r ${item.color} text-white p-5 flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/80">{item.labelEn}</div>
                      <div className="text-lg font-extrabold tracking-wide">{item.labelAr}</div>
                    </div>
                  </div>
                  <div className="text-white/80 transition-transform duration-300 group-hover:translate-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {selectedModal && (
        <div className="relative z-20">
          <QuickViewModal
            isOpen={true}
            onClose={() => setSelectedModal(null)}
            type={selectedModal.type}
            title={selectedModal.title}
          />
        </div>
      )}
    </div>
  );
}


