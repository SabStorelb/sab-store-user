import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  notifyNewOrder,
  notifyNewSupportMessage,
  notifyNewCustomer,
  notifyLowStock,
  notifyOrderCancelled,
  notifyOrderCompleted,
  notifySystem,
  createNotification,
  NotificationType,
} from '../../lib/notifications';

export default function TestNotifications() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customType, setCustomType] = useState<NotificationType>('order');
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  async function handleTestNotification(type: string) {
    setLoading(true);
    try {
      switch (type) {
        case 'newOrder':
          await notifyNewOrder(
            'test123',
            '12345',
            'أحمد محمد',
            45000
          );
          break;

        case 'support':
          await notifyNewSupportMessage(
            'msg123',
            'فاطمة علي',
            'استفسار عن الشحن'
          );
          break;

        case 'newCustomer':
          await notifyNewCustomer(
            'cust123',
            'خالد أحمد',
            'khaled@example.com'
          );
          break;

        case 'lowStock':
          await notifyLowStock(
            'prod123',
            'قميص أزرق',
            3
          );
          break;

        case 'orderCancelled':
          await notifyOrderCancelled(
            'order123',
            '54321',
            'العميل غير موجود'
          );
          break;

        case 'orderCompleted':
          await notifyOrderCompleted(
            'order456',
            '98765'
          );
          break;

        case 'system':
          await notifySystem(
            '⚙️ تحديث النظام',
            'سيتم إجراء صيانة للموقع يوم الجمعة الساعة 2 صباحاً',
            '/admin/settings'
          );
          break;
      }
      alert('✅ تم إرسال الإشعار بنجاح!');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ حدث خطأ');
    } finally {
      setLoading(false);
    }
  }

  async function handleCustomNotification() {
    if (!customTitle || !customMessage) {
      alert('يرجى ملء جميع الحقول');
      return;
    }

    setLoading(true);
    try {
      await createNotification(
        customType,
        customTitle,
        customMessage
      );
      alert('✅ تم إرسال الإشعار المخصص بنجاح!');
      setCustomTitle('');
      setCustomMessage('');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ حدث خطأ');
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold">🧪 اختبار الإشعارات | Test Notifications</h1>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-yellow-800 mb-2">⚠️ صفحة تجريبية</h3>
        <p className="text-sm text-yellow-700">
          هذه الصفحة لاختبار نظام الإشعارات فقط. الإشعارات المُرسلة من هنا ستظهر في صفحة الإشعارات.
        </p>
      </div>

      {/* Pre-defined Notifications */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">إشعارات جاهزة للاختبار</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => handleTestNotification('newOrder')}
            disabled={loading}
            className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition text-left"
          >
            <div className="text-2xl mb-2">📦</div>
            <div className="font-bold">طلب جديد</div>
            <div className="text-sm opacity-90">اختبار إشعار طلب جديد من عميل</div>
          </button>

          <button
            onClick={() => handleTestNotification('support')}
            disabled={loading}
            className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition text-left"
          >
            <div className="text-2xl mb-2">💬</div>
            <div className="font-bold">رسالة دعم</div>
            <div className="text-sm opacity-90">اختبار إشعار رسالة دعم جديدة</div>
          </button>

          <button
            onClick={() => handleTestNotification('newCustomer')}
            disabled={loading}
            className="bg-pink-500 text-white p-4 rounded-lg hover:bg-pink-600 disabled:bg-gray-400 transition text-left"
          >
            <div className="text-2xl mb-2">👤</div>
            <div className="font-bold">عميل جديد</div>
            <div className="text-sm opacity-90">اختبار إشعار تسجيل عميل جديد</div>
          </button>

          <button
            onClick={() => handleTestNotification('lowStock')}
            disabled={loading}
            className="bg-orange-500 text-white p-4 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 transition text-left"
          >
            <div className="text-2xl mb-2">⚠️</div>
            <div className="font-bold">مخزون منخفض</div>
            <div className="text-sm opacity-90">اختبار تنبيه مخزون منخفض</div>
          </button>

          <button
            onClick={() => handleTestNotification('orderCancelled')}
            disabled={loading}
            className="bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition text-left"
          >
            <div className="text-2xl mb-2">🚫</div>
            <div className="font-bold">إلغاء طلب</div>
            <div className="text-sm opacity-90">اختبار إشعار إلغاء طلب</div>
          </button>

          <button
            onClick={() => handleTestNotification('orderCompleted')}
            disabled={loading}
            className="bg-teal-500 text-white p-4 rounded-lg hover:bg-teal-600 disabled:bg-gray-400 transition text-left"
          >
            <div className="text-2xl mb-2">✅</div>
            <div className="font-bold">اكتمال طلب</div>
            <div className="text-sm opacity-90">اختبار إشعار توصيل طلب</div>
          </button>

          <button
            onClick={() => handleTestNotification('system')}
            disabled={loading}
            className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 disabled:bg-gray-400 transition text-left"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <div className="font-bold">إشعار نظام</div>
            <div className="text-sm opacity-90">اختبار إشعار نظام عام</div>
          </button>
        </div>
      </div>

      {/* Custom Notification */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">إنشاء إشعار مخصص</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">نوع الإشعار</label>
            <select
              value={customType}
              onChange={(e) => setCustomType(e.target.value as NotificationType)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="order">📦 طلب</option>
              <option value="support">💬 دعم</option>
              <option value="product">🛍️ منتج</option>
              <option value="customer">👤 عميل</option>
              <option value="system">⚙️ نظام</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">العنوان</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="مثال: طلب جديد #123"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">الرسالة</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="مثال: طلب جديد من أحمد محمد بقيمة 500 ريال"
            />
          </div>

          <button
            onClick={handleCustomNotification}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition font-bold w-full"
          >
            {loading ? 'جاري الإرسال...' : '📤 إرسال الإشعار'}
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => router.push('/admin/notifications')}
          className="flex-1 bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 font-bold"
        >
          🔔 عرض الإشعارات
        </button>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold"
        >
          📊 لوحة التحكم
        </button>
      </div>
    </div>
  );
}
