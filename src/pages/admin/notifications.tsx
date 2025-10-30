import { useEffect, useState } from 'react';
import { firebaseDb } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'order' | 'support' | 'product' | 'customer' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  targetId?: string;
  targetUrl?: string;
}

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter, typeFilter]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      let q = query(
        collection(firebaseDb, 'notifications'),
        orderBy('createdAt', 'desc')
      );

      // فلتر المقروءة/غير المقروءة
      if (filter === 'unread') {
        q = query(
          collection(firebaseDb, 'notifications'),
          where('read', '==', false),
          orderBy('createdAt', 'desc')
        );
      } else if (filter === 'read') {
        q = query(
          collection(firebaseDb, 'notifications'),
          where('read', '==', true),
          orderBy('createdAt', 'desc')
        );
      }

      // فلتر النوع
      if (typeFilter !== 'all') {
        q = query(
          collection(firebaseDb, 'notifications'),
          where('type', '==', typeFilter),
          orderBy('createdAt', 'desc')
        );
      }

      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      const docRef = doc(firebaseDb, 'notifications', id);
      await updateDoc(docRef, { read: true });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      for (const notification of unreadNotifications) {
        const docRef = doc(firebaseDb, 'notifications', notification.id);
        await updateDoc(docRef, { read: true });
      }
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'order': return '📦';
      case 'support': return '💬';
      case 'product': return '🛍️';
      case 'customer': return '👤';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  }

  function getNotificationColor(type: string) {
    switch (type) {
      case 'order': return 'bg-green-100 border-green-200';
      case 'support': return 'bg-blue-100 border-blue-200';
      case 'product': return 'bg-purple-100 border-purple-200';
      case 'customer': return 'bg-pink-100 border-pink-200';
      case 'system': return 'bg-gray-100 border-gray-200';
      default: return 'bg-yellow-100 border-yellow-200';
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

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    
    return date.toLocaleDateString('ar-LB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  const unreadCount = notifications.filter(n => !n.read).length;

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
          <h1 className="text-3xl font-bold">🔔 الإشعارات | Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              {unreadCount} جديد
            </span>
          )}
        </div>
        <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
          لوحة التحكم
        </Link>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-bold mb-2">الحالة</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">الكل</option>
              <option value="unread">غير مقروءة</option>
              <option value="read">مقروءة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">النوع</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">الكل</option>
              <option value="order">طلبات</option>
              <option value="support">دعم فني</option>
              <option value="product">منتجات</option>
              <option value="customer">عملاء</option>
              <option value="system">نظام</option>
            </select>
          </div>

          <div className="flex-1 flex items-end justify-end gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                ✅ تحديد الكل كمقروء
              </button>
            )}
            <button
              onClick={fetchNotifications}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🔄 تحديث
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'الكل', value: notifications.length, icon: '🔔', color: 'bg-gray-500' },
          { label: 'طلبات', value: notifications.filter(n => n.type === 'order').length, icon: '📦', color: 'bg-green-500' },
          { label: 'دعم', value: notifications.filter(n => n.type === 'support').length, icon: '💬', color: 'bg-blue-500' },
          { label: 'منتجات', value: notifications.filter(n => n.type === 'product').length, icon: '🛍️', color: 'bg-purple-500' },
          { label: 'غير مقروء', value: unreadCount, icon: '🆕', color: 'bg-red-500' },
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.color} text-white rounded-lg shadow p-4`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm opacity-90">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🔕</div>
            <div className="text-xl text-gray-500">لا توجد إشعارات</div>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  if (!notification.read) markAsRead(notification.id);
                  if (notification.targetUrl) router.push(notification.targetUrl);
                }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full ${getNotificationColor(notification.type)} border flex items-center justify-center text-2xl`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-lg">{notification.title}</span>
                      {!notification.read && (
                        <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                          جديد
                        </span>
                      )}
                    </div>
                    
                    <div className="text-gray-700 mb-2">{notification.message}</div>
                    
                    <div className="text-xs text-gray-400">
                      🕐 {formatTimestamp(notification.createdAt)}
                    </div>
                  </div>

                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-bold"
                    >
                      تحديد كمقروء
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
