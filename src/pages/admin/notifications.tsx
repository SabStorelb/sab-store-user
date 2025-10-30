import { useEffect, useState } from 'react';
import { firebaseDb } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | 'all'>('');
  const [deleting, setDeleting] = useState(false);

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

  async function deleteNotification(id: string) {
    try {
      setDeleting(true);
      const docRef = doc(firebaseDb, 'notifications', id);
      await deleteDoc(docRef);
      setShowDeleteConfirm(false);
      setDeleteTarget('');
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('فشل الحذف - Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  async function deleteAllNotifications() {
    try {
      setDeleting(true);
      const batch = writeBatch(firebaseDb);
      
      // حذف جميع الإشعارات الحالية في القائمة
      notifications.forEach((notification) => {
        const docRef = doc(firebaseDb, 'notifications', notification.id);
        batch.delete(docRef);
      });
      
      await batch.commit();
      setShowDeleteConfirm(false);
      setDeleteTarget('');
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      alert('فشل حذف الإشعارات - Failed to delete notifications');
    } finally {
      setDeleting(false);
    }
  }

  async function deleteReadNotifications() {
    try {
      setDeleting(true);
      const batch = writeBatch(firebaseDb);
      
      // حذف الإشعارات المقروءة فقط
      const readNotifications = notifications.filter(n => n.read);
      readNotifications.forEach((notification) => {
        const docRef = doc(firebaseDb, 'notifications', notification.id);
        batch.delete(docRef);
      });
      
      await batch.commit();
      setShowDeleteConfirm(false);
      setDeleteTarget('');
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      alert('فشل حذف الإشعارات المقروءة - Failed to delete read notifications');
    } finally {
      setDeleting(false);
    }
  }

  function confirmDelete(target: string) {
    setDeleteTarget(target);
    setShowDeleteConfirm(true);
  }

  function handleConfirmDelete() {
    if (deleteTarget === 'all') {
      deleteAllNotifications();
    } else if (deleteTarget === 'read') {
      deleteReadNotifications();
    } else {
      deleteNotification(deleteTarget);
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
  const readCount = notifications.filter(n => n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">تأكيد الحذف</h3>
              <p className="text-gray-600">
                {deleteTarget === 'all' && 'هل أنت متأكد من حذف جميع الإشعارات؟'}
                {deleteTarget === 'read' && 'هل أنت متأكد من حذف جميع الإشعارات المقروءة؟'}
                {deleteTarget !== 'all' && deleteTarget !== 'read' && 'هل أنت متأكد من حذف هذا الإشعار؟'}
              </p>
              <p className="text-sm text-red-600 mt-2">⚠️ لا يمكن التراجع عن هذا الإجراء</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget('');
                }}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50"
              >
                ❌ إلغاء
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الحذف...
                  </>
                ) : (
                  '🗑️ حذف'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                تحديد الكل كمقروء
              </button>
            )}
            {readCount > 0 && (
              <button
                onClick={() => confirmDelete('read')}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                حذف المقروءة
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => confirmDelete('all')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                حذف الكل
              </button>
            )}
            <button
              onClick={fetchNotifications}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              تحديث
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

                  <div className="flex gap-2">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-bold px-3 py-1 rounded hover:bg-blue-50"
                        title="تحديد كمقروء"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(notification.id);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-bold px-3 py-1 rounded hover:bg-red-50"
                      title="حذف"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
