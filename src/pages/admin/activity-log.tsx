import { useEffect, useState } from 'react';
import { firebaseDb } from '../../lib/firebase';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'login' | 'other';
  targetType: string;
  targetId: string;
  details: string;
  timestamp: any;
  ipAddress?: string;
}

export default function ActivityLog() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'create' | 'update' | 'delete' | 'login'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    fetchActivities();
  }, [filter, dateFilter]);

  async function fetchActivities() {
    setLoading(true);
    try {
      let q = query(
        collection(firebaseDb, 'activityLog'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      // تطبيق فلتر النوع
      if (filter !== 'all') {
        q = query(
          collection(firebaseDb, 'activityLog'),
          where('actionType', '==', filter),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      }

      // تطبيق فلتر التاريخ
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        if (dateFilter === 'today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (dateFilter === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (dateFilter === 'month') {
          startDate.setDate(now.getDate() - 30);
        }

        q = query(
          collection(firebaseDb, 'activityLog'),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      }

      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }

  function getActionIcon(type: string) {
    switch (type) {
      case 'create': return '✨';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'login': return '🔑';
      default: return '📝';
    }
  }

  function getActionColor(type: string) {
    switch (type) {
      case 'create': return 'bg-green-100 text-green-800 border-green-200';
      case 'update': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delete': return 'bg-red-100 text-red-800 border-red-200';
      case 'login': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function formatTimestamp(timestamp: any) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    
    return date.toLocaleDateString('ar-LB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300"
          >
            عودة | Back
          </button>
          <h1 className="text-3xl font-bold">📊 سجل النشاط | Activity Log</h1>
        </div>
        <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
          لوحة التحكم
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">نوع النشاط</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">الكل</option>
              <option value="create">إنشاء</option>
              <option value="update">تعديل</option>
              <option value="delete">حذف</option>
              <option value="login">تسجيل دخول</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">الفترة الزمنية</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">الكل</option>
              <option value="today">اليوم</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">آخر 30 يوم</option>
            </select>
          </div>

          <div className="flex-1 flex items-end justify-end">
            <button
              onClick={fetchActivities}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🔄 تحديث
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'إجمالي الأنشطة', value: activities.length, icon: '📊', color: 'bg-blue-500' },
          { label: 'إنشاء', value: activities.filter(a => a.actionType === 'create').length, icon: '✨', color: 'bg-green-500' },
          { label: 'تعديل', value: activities.filter(a => a.actionType === 'update').length, icon: '✏️', color: 'bg-yellow-500' },
          { label: 'حذف', value: activities.filter(a => a.actionType === 'delete').length, icon: '🗑️', color: 'bg-red-500' },
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.color} text-white rounded-lg shadow p-4`}>
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm opacity-90">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">الأنشطة الأخيرة</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">لا توجد أنشطة</div>
        ) : (
          <div className="divide-y">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{getActionIcon(activity.actionType)}</div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-lg">{activity.userName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getActionColor(activity.actionType)}`}>
                        {activity.actionType}
                      </span>
                    </div>
                    
                    <div className="text-gray-700 mb-1">{activity.action}</div>
                    
                    {activity.details && (
                      <div className="text-sm text-gray-500 mb-2">{activity.details}</div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>🕐 {formatTimestamp(activity.timestamp)}</span>
                      {activity.targetType && (
                        <span>📁 {activity.targetType}</span>
                      )}
                      {activity.ipAddress && (
                        <span>🌐 {activity.ipAddress}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-800 mb-2">ℹ️ معلومات</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• يتم تسجيل جميع الأنشطة تلقائياً في النظام</li>
          <li>• يمكن الاحتفاظ بالسجلات لمدة تصل إلى 90 يوماً</li>
          <li>• استخدم الفلاتر لتسهيل البحث عن نشاط معين</li>
        </ul>
      </div>
    </div>
  );
}
