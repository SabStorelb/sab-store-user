import Link from 'next/link';

import { useEffect, useState } from 'react';
import { firebaseDb } from '../../../lib/firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const snap = await getDocs(collection(firebaseDb, 'products'));
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchProducts();
  }, []);

  async function handleDelete(id: string) {
    if (window.confirm('هل تريد حذف هذا المنتج؟')) {
      await deleteDoc(doc(firebaseDb, 'products', id));
      setProducts(products.filter(p => p.id !== id));
    }
  }

  return (
    <div className="min-h-screen p-8">
      <button
        onClick={() => window.history.back()}
        className="mb-4 px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300"
      >عودة | Back</button>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">المنتجات | Products</h1>
        <Link href="/admin/products/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 font-semibold">إضافة منتج جديد | Add Product</Link>
      </div>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-6 text-gray-600 text-lg shadow">لا يوجد منتجات بعد.</div>
      ) : (
        <ul className="space-y-4">
          {products.map(product => (
            <li key={product.id} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {product.image && <img src={product.image} alt="صورة المنتج" className="w-16 h-16 object-cover rounded" />}
                <div>
                  <span className="font-bold text-lg">{product.nameAr || product.name || 'بدون اسم'}</span>
                  <span className="block text-sm text-gray-500">ID: {product.id}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <button className="px-3 py-1 bg-yellow-400 text-white rounded" onClick={() => alert('تعديل المنتج غير مفعل بعد')}>تعديل</button>
                <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={() => handleDelete(product.id)}>حذف</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
