import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
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
}

export default function SupportMessagesPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'unread'>('all');

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

  async function updateStatus(messageId: string, newStatus: 'pending' | 'replied' | 'closed') {
    const messageRef = doc(firebaseDb, 'supportMessages', messageId);
    await updateDoc(messageRef, {
      status: newStatus,
      updatedAt: Timestamp.now()
    });
  }

  const unreadCount = messages.filter(msg => !msg.read).length;
  let filteredMessages = messages;
  if (filter === 'pending') filteredMessages = messages.filter(msg => msg.status === 'pending');
  if (filter === 'unread') filteredMessages = messages.filter(msg => !msg.read);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">رسائل الدعم | Support Messages</h1>
      <div className="mb-4 flex gap-2">
        <button className={`px-3 py-1 rounded ${filter==='all'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setFilter('all')}>الكل</button>
        <button className={`px-3 py-1 rounded ${filter==='pending'?'bg-yellow-500 text-white':'bg-gray-200'}`} onClick={()=>setFilter('pending')}>معلقة</button>
        <button className={`px-3 py-1 rounded ${filter==='unread'?'bg-red-500 text-white':'bg-gray-200'}`} onClick={()=>setFilter('unread')}>غير مقروءة</button>
        <span className="ml-auto text-sm">غير مقروءة: <b>{unreadCount}</b></span>
      </div>
      {loading ? (
        <div>جاري التحميل...</div>
      ) : (
        filteredMessages.length === 0 ? (
          <div>لا توجد رسائل.</div>
        ) : (
          filteredMessages.map(msg => (
            <div key={msg.id} className={`border rounded-lg p-4 mb-4 ${!msg.read ? 'bg-blue-50' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">{msg.name}</h3>
                {!msg.read && <span className="text-xs text-red-600">جديد</span>}
              </div>
              <p className="mb-1"><b>البريد الإلكتروني:</b> {msg.email}</p>
              <p className="mb-1"><b>الرسالة:</b> {msg.message}</p>
              <p className="mb-1"><b>الحالة:</b> {msg.status}</p>
              <p className="mb-1"><b>التاريخ:</b> {msg.createdAt?.toDate?.()?.toLocaleString('ar-SA') || 'غير متوفر'}</p>
              <div className="flex gap-2 mt-2">
                {!msg.read && <button className="px-2 py-1 bg-green-500 text-white rounded" onClick={()=>markAsRead(msg.id)}>تحديد كمقروء</button>}
                <select value={msg.status} onChange={e=>updateStatus(msg.id, e.target.value as any)} className="px-2 py-1 rounded border">
                  <option value="pending">معلقة</option>
                  <option value="replied">تم الرد</option>
                  <option value="closed">مغلقة</option>
                </select>
              </div>
            </div>
          ))
        )
      )}
    </div>
  );
}
