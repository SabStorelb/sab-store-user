import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, orderBy, query, onSnapshot, doc, updateDoc, Timestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { firebaseDb } from '../../lib/firebase';

interface SupportMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  userId: string | null;
  status: 'pending' | 'replied' | 'closed';
  read: boolean;
  createdAt: any;
  updatedAt: any;
  reply?: string;
  repliedAt?: any;
}

export default function SupportMessagesPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'unread'>('all');
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const supportMessagesRef = collection(firebaseDb, 'supportMessages');
    const q = query(supportMessagesRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportMessage[];
      setMessages(messagesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function markAsRead(messageId: string) {
    const messageRef = doc(firebaseDb, 'supportMessages', messageId);
    await updateDoc(messageRef, {
      read: true,
      updatedAt: Timestamp.now()
    });
  }

  async function updateStatus(messageId: string, newStatus: 'pending' | 'replied' | 'closed', message?: SupportMessage) {
    const messageRef = doc(firebaseDb, 'supportMessages', messageId);
    await updateDoc(messageRef, {
      status: newStatus,
      updatedAt: Timestamp.now()
    });

    // إرسال إشعار للمستخدم عند تغيير الحالة
    if (message?.userId) {
      const statusMessages: any = {
        'pending': { ar: 'تم تحديث حالة رسالتك إلى: قيد المراجعة', en: 'Your message status: Under Review' },
        'replied': { ar: 'تم الرد على رسالتك', en: 'Your message has been replied' },
        'closed': { ar: 'تم إغلاق رسالتك', en: 'Your message has been closed' },
      };

      await addDoc(collection(firebaseDb, 'userNotifications'), {
        userId: message.userId,
        title: 'تحديث رسالة الدعم | Support Update',
        message: statusMessages[newStatus],
        type: 'support_status_update',
        read: false,
        createdAt: Timestamp.now(),
      });

      // إرسال بريد إلكتروني للعميل
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: message.email,
            subject: 'تحديث حالة رسالة الدعم | Support Status Update',
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0;">تحديث رسالة الدعم</h1>
                </div>
                <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 18px; color: #333;">مرحباً <strong>${message.name}</strong>،</p>
                  <p style="font-size: 16px; color: #555; line-height: 1.8;">
                    تم تحديث حالة رسالتك إلى: <strong style="color: #667eea;">${getStatusText(newStatus)}</strong>
                  </p>
                  <p style="font-size: 14px; color: #888; margin-top: 30px;">
                    شكراً لتواصلك معنا!<br>
                    فريق الدعم
                  </p>
                </div>
              </div>
            `,
          }),
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }
  }

  async function sendReply() {
    if (!selectedMessage || !replyText.trim()) {
      alert('الرجاء كتابة رد!');
      return;
    }

    setSending(true);
    try {
      // تحديث رسالة الدعم بالرد
      const messageRef = doc(firebaseDb, 'supportMessages', selectedMessage.id);
      await updateDoc(messageRef, {
        reply: replyText,
        repliedAt: Timestamp.now(),
        status: 'replied',
        read: true,
        updatedAt: Timestamp.now()
      });

      // إرسال إشعار للمستخدم (إذا كان لديه userId)
      if (selectedMessage.userId) {
        await addDoc(collection(firebaseDb, 'userNotifications'), {
          userId: selectedMessage.userId,
          title: 'رد على رسالة الدعم | Support Reply',
          message: {
            ar: `تم الرد على رسالتك`,
            en: `Your support message has been replied`
          },
          // إضافة الرد الكامل والرسالة الأصلية
          originalMessage: selectedMessage.message,
          replyText: replyText,
          supportMessageId: selectedMessage.id,
          type: 'support_reply',
          read: false,
          createdAt: Timestamp.now(),
        });
      }

      // إرسال البريد الإلكتروني للعميل مع الرد
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selectedMessage.email,
            subject: 'رد على رسالتك | Support Reply',
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0;">💬 رد على رسالتك</h1>
                </div>
                <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 18px; color: #333;">مرحباً <strong>${selectedMessage.name}</strong>،</p>
                  
                  <div style="background-color: #f0f4ff; padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #667eea;">
                    <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;"><strong>رسالتك:</strong></p>
                    <p style="font-size: 16px; color: #333; margin: 0;">${selectedMessage.message}</p>
                  </div>
                  
                  <div style="background-color: #e8f5e9; padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #4caf50;">
                    <p style="font-size: 14px; color: #2e7d32; margin: 0 0 10px 0;"><strong>✅ الرد:</strong></p>
                    <p style="font-size: 16px; color: #333; line-height: 1.8; margin: 0;">${replyText}</p>
                  </div>
                  
                  <p style="font-size: 14px; color: #888; margin-top: 30px;">
                    إذا كان لديك أي استفسار إضافي، لا تتردد في التواصل معنا مرة أخرى.<br><br>
                    مع أطيب التحيات،<br>
                    <strong>فريق الدعم</strong>
                  </p>
                </div>
              </div>
            `,
          }),
        });
        
        alert('✅ تم إرسال الرد بنجاح عبر البريد الإلكتروني والإشعارات!');
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        alert('✅ تم حفظ الرد بنجاح! لكن حدث خطأ في إرسال البريد الإلكتروني.');
      }

      setSelectedMessage(null);
      setReplyText('');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('❌ حدث خطأ في إرسال الرد');
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteMessage(messageId: string, messageName: string) {
    const confirmDelete = confirm(`⚠️ هل أنت متأكد من حذف رسالة "${messageName}"؟\n\nهذا الإجراء لا يمكن التراجع عنه!`);
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(firebaseDb, 'supportMessages', messageId));
      alert('✅ تم حذف الرسالة بنجاح!');
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('❌ حدث خطأ في حذف الرسالة');
    }
  }

  const unreadCount = messages.filter(msg => !msg.read).length;
  const pendingCount = messages.filter(msg => msg.status === 'pending').length;
  const repliedCount = messages.filter(msg => msg.status === 'replied').length;
  
  let filteredMessages = messages;
  if (filter === 'pending') filteredMessages = messages.filter(msg => msg.status === 'pending');
  if (filter === 'unread') filteredMessages = messages.filter(msg => !msg.read);

  // البحث
  if (searchTerm) {
    filteredMessages = filteredMessages.filter(msg =>
      msg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'replied': return 'bg-green-100 text-green-800 border-green-300';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'معلقة';
      case 'replied': return 'تم الرد';
      case 'closed': return 'مغلقة';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-black text-gray-800 mb-2">💬 رسائل الدعم | Support Messages</h1>
              <p className="text-gray-600">إدارة والرد على رسائل العملاء</p>
            </div>
            <Link
              href="/admin/dashboard"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all duration-200"
            >
              ⬅ العودة
            </Link>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="🔍 ابحث في الرسائل (الاسم، البريد، الرسالة)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 pr-12 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-lg"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              📋 الكل ({messages.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                filter === 'pending'
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              ⏳ معلقة ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                filter === 'unread'
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              🔴 غير مقروءة ({unreadCount})
            </button>
            <div className="ml-auto bg-green-100 text-green-800 px-6 py-3 rounded-xl font-bold border-2 border-green-300">
              ✅ تم الرد: {repliedCount}
            </div>
          </div>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-lg">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-bold">جاري التحميل...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-lg">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {searchTerm ? 'لا توجد نتائج' : 'لا توجد رسائل'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'جرب البحث بكلمات مختلفة' : 'لا توجد رسائل دعم حالياً'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 ${
                  !msg.read ? 'border-4 border-red-200' : 'border-2 border-gray-100'
                }`}
              >
                {/* Message Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black">
                        {msg.name?.charAt(0).toUpperCase() || '👤'}
                      </div>
                      <div>
                        <h3 className="text-xl font-black">{msg.name}</h3>
                        <p className="text-sm opacity-90">📧 {msg.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!msg.read && (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                          🔴 جديد
                        </span>
                      )}
                      <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(msg.status)}`}>
                        {getStatusText(msg.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-600 mb-2">📝 الرسالة:</label>
                    <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                      <p className="text-gray-800 leading-relaxed">{msg.message}</p>
                    </div>
                  </div>

                  {/* Reply Section */}
                  {msg.reply && (
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-green-600 mb-2">✅ الرد:</label>
                      <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                        <p className="text-gray-800 leading-relaxed">{msg.reply}</p>
                        {msg.repliedAt && (
                          <p className="text-xs text-green-600 mt-2">
                            تم الرد في: {msg.repliedAt?.toDate?.()?.toLocaleString('ar-SA')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Date and Actions */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="text-sm text-gray-500">
                      📅 {msg.createdAt?.toDate?.()?.toLocaleString('ar-SA') || 'غير متوفر'}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!msg.read && (
                        <button
                          onClick={() => markAsRead(msg.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm hover:shadow-md"
                        >
                          ✓ تحديد كمقروء
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedMessage(msg);
                          setReplyText(msg.reply || '');
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm hover:shadow-md"
                      >
                        💬 {msg.reply ? 'تعديل الرد' : 'إرسال رد'}
                      </button>

                      <select
                        value={msg.status}
                        onChange={(e) => updateStatus(msg.id, e.target.value as any, msg)}
                        className="px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 outline-none font-bold"
                      >
                        <option value="pending">⏳ معلقة</option>
                        <option value="replied">✅ تم الرد</option>
                        <option value="closed">🔒 مغلقة</option>
                      </select>

                      <button
                        onClick={() => handleDeleteMessage(msg.id, msg.name)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm hover:shadow-md"
                        title="حذف الرسالة"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center gap-2">
                💬 الرد على: {selectedMessage.name}
              </h2>

              {/* Original Message */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <label className="block text-sm font-bold text-gray-600 mb-2">الرسالة الأصلية:</label>
                <p className="text-gray-800">{selectedMessage.message}</p>
                <p className="text-xs text-gray-500 mt-2">من: {selectedMessage.email}</p>
              </div>

              {/* Reply Textarea */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ✍️ اكتب الرد: *
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
                  placeholder="اكتب ردك هنا..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {replyText.length} حرف
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? '⏳ جارٍ الإرسال...' : '✅ إرسال الرد'}
                </button>
                <button
                  onClick={() => {
                    setSelectedMessage(null);
                    setReplyText('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all"
                >
                  ❌ إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
