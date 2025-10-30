import { useEffect, useState } from 'react';
import { firebaseDb, firebaseAuth } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';

interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  targetId?: string;
  targetUrl?: string;
  metadata?: any;
}

export default function UserNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [userId, setUserId] = useState<string | null>(null);

  // التحقق من تسجيل الدخول
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        router.push('/login'); // إعادة توجيه لصفحة تسجيل الدخول
      }
    });
    return () => unsubscribe();
  }, [router]);

  // جلب الإشعارات
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(firebaseDb, 'userNotifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserNotification[];
      
      setNotifications(notifs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  async function markAsRead(notificationId: string) {
    try {
      await updateDoc(doc(firebaseDb, 'userNotifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifs.map(n => 
          updateDoc(doc(firebaseDb, 'userNotifications', n.id), { read: true })
        )
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  function getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      order_confirmed: '✅',
      order_processing: '📦',
      order_shipped: '🚚',
      order_delivered: '🎉',
      order_cancelled: '🚫',
      special_offer: '🎁',
      price_drop: '💰',
      back_in_stock: '✨',
      welcome: '👋',
      general: '📢'
    };
    return icons[type] || '🔔';
  }

  function getNotificationColor(type: string): string {
    const colors: { [key: string]: string } = {
      order_confirmed: 'bg-green-50 border-green-200',
      order_processing: 'bg-blue-50 border-blue-200',
      order_shipped: 'bg-purple-50 border-purple-200',
      order_delivered: 'bg-teal-50 border-teal-200',
      order_cancelled: 'bg-red-50 border-red-200',
      special_offer: 'bg-yellow-50 border-yellow-200',
      price_drop: 'bg-orange-50 border-orange-200',
      back_in_stock: 'bg-pink-50 border-pink-200',
      welcome: 'bg-indigo-50 border-indigo-200',
      general: 'bg-gray-50 border-gray-200'
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  }

  function formatTime(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-SA');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-4 mb-3 shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🔔 الإشعارات
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              عودة
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              غير المقروءة ({unreadCount})
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 rounded-lg font-medium bg-green-100 text-green-700 hover:bg-green-200 transition mr-auto"
              >
                ✓ تحديد الكل كمقروء
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              {filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unread' 
                ? 'تم قراءة جميع الإشعارات' 
                : 'عندما تحصل على إشعارات جديدة، ستظهر هنا'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg border-2 shadow-sm overflow-hidden transition hover:shadow-md ${
                  getNotificationColor(notification.type)
                } ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-gray-700 text-sm mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatTime(notification.createdAt)}</span>
                        {!notification.read && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            جديد
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {notification.targetUrl && (
                        <Link
                          href={notification.targetUrl}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                          onClick={() => markAsRead(notification.id)}
                        >
                          عرض التفاصيل
                        </Link>
                      )}
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
                        >
                          ✓ تحديد كمقروء
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
