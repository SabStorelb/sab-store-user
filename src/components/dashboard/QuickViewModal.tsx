import { useEffect, useState } from 'react';
import { firebaseDb } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  title: string;
}

export default function QuickViewModal({ isOpen, onClose, type, title }: QuickViewModalProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    async function fetchData() {
      setLoading(true);
      try {
        let q;
        if (type === 'orders') {
          q = query(collection(firebaseDb, 'orders'), orderBy('createdAt', 'desc'), limit(5));
        } else if (type === 'products') {
          q = query(collection(firebaseDb, 'products'), orderBy('createdAt', 'desc'), limit(5));
        } else if (type === 'customers') {
          q = query(collection(firebaseDb, 'users'), limit(5));
        } else if (type === 'warehouseSystem') {
          q = query(collection(firebaseDb, 'products'), orderBy('stock', 'desc'), limit(5));
        } else if (type === 'vendorSystem') {
          q = query(collection(firebaseDb, 'suppliers'), limit(5));
        } else {
          q = query(collection(firebaseDb, type), limit(5));
        }
        
        const snap = await getDocs(q);
        setData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching quick view data:', error);
      }
      setLoading(false);
    }
    
    fetchData();
  }, [isOpen, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{title} - عرض سريع</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-88px)]">
          {loading ? (
            <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">لا توجد بيانات</div>
          ) : (
            <div className="space-y-3">
              {data.map((item, idx) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {type === 'orders' && (
                        <>
                          <div className="font-bold text-lg">طلب #{item.orderNumber || item.id.slice(0, 8)}</div>
                          <div className="text-sm text-gray-600">
                            المبلغ: {item.totalAmount || 0} ريال | الحالة: {item.status || 'قيد المراجعة'}
                          </div>
                        </>
                      )}
                      {type === 'products' && (
                        <>
                          <div className="font-bold text-lg">
                            {typeof item.name === 'object' 
                              ? (item.name?.ar || item.name?.en || item.nameAr || item.nameEn || 'منتج')
                              : (item.name || item.nameAr || item.nameEn || 'منتج')
                            }
                          </div>
                          <div className="text-sm text-gray-600">
                            السعر: ${item.price || 0} USD | المخزون: {item.stock || 0}
                          </div>
                        </>
                      )}
                      {type === 'warehouseSystem' && (
                        <>
                          <div className="font-bold text-lg">
                            {typeof item.name === 'object'
                              ? (item.name?.ar || item.name?.en || item.nameAr || item.nameEn || 'منتج')
                              : (item.name || item.nameAr || item.nameEn || 'منتج')}
                          </div>
                          <div className="text-sm text-gray-600">
                            المخزون الحالي: {item.stock ?? 0} | الفئة: {item.categoryName || item.category || 'غير محدد'}
                          </div>
                        </>
                      )}
                      {type === 'vendorSystem' && (
                        <>
                          <div className="font-bold text-lg">
                            {item.nameAr || item.name || item.company || 'بائع'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.email ? `البريد: ${item.email}` : 'لا يوجد بريد مسجل'}
                          </div>
                        </>
                      )}
                      {type === 'customers' && (
                        <>
                          <div className="font-bold text-lg">{item.name || item.email || 'عميل'}</div>
                          <div className="text-sm text-gray-600">
                            البريد: {item.email || 'غير متوفر'}
                          </div>
                        </>
                      )}
                      {!['orders', 'products', 'customers'].includes(type) && (
                        <div className="font-bold">
                          {typeof item.name === 'object'
                            ? (item.name?.ar || item.name?.en || item.nameAr || item.nameEn || item.id)
                            : (item.name || item.nameAr || item.nameEn || item.id)
                          }
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">#{idx + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
