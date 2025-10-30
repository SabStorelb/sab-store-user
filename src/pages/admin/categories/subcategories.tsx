import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { firebaseDb, firebaseStorage } from '../../../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface Subcategory {
  id: string;
  name: string;
  nameAr: string;
  image?: string;
  parentId: string;
  parentName?: string;
  parentNameAr?: string;
}

export default function SubcategoriesPage() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchAllSubcategories();
  }, []);

  async function fetchAllSubcategories() {
    try {
      const categoriesSnap = await getDocs(collection(firebaseDb, 'categories'));
      const allSubs: Subcategory[] = [];

      for (const catDoc of categoriesSnap.docs) {
        const categoryData = catDoc.data();
        const subsSnap = await getDocs(collection(firebaseDb, 'categories', catDoc.id, 'subcategory'));
        
        subsSnap.docs.forEach(subDoc => {
          allSubs.push({
            id: subDoc.id,
            parentId: catDoc.id,
            parentName: categoryData.name,
            parentNameAr: categoryData.nameAr,
            ...subDoc.data()
          } as Subcategory);
        });
      }

      setSubcategories(allSubs);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      alert('حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(sub: Subcategory, file: File) {
    setUploading(sub.id);
    try {
      const path = `subcategories/${sub.id}/image.jpg`;
      const storageRef = ref(firebaseStorage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(firebaseDb, 'categories', sub.parentId, 'subcategory', sub.id), { image: url });
      
      setSubcategories(subs => 
        subs.map(s => s.id === sub.id ? { ...s, image: url } : s)
      );
      
      alert('تم تحديث الصورة بنجاح! ✅');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('حدث خطأ في رفع الصورة ❌');
    } finally {
      setUploading(null);
    }
  }

  async function handleDeleteImage(sub: Subcategory) {
    if (!confirm('هل أنت متأكد من حذف الصورة؟')) return;
    
    try {
      const path = `subcategories/${sub.id}/image.jpg`;
      
      try {
        const storageRef = ref(firebaseStorage, path);
        await deleteObject(storageRef);
      } catch (error) {
        console.log('Image file not found or already deleted');
      }

      await updateDoc(doc(firebaseDb, 'categories', sub.parentId, 'subcategory', sub.id), { image: '' });
      
      setSubcategories(subs => 
        subs.map(s => s.id === sub.id ? { ...s, image: '' } : s)
      );
      
      alert('تم حذف الصورة بنجاح! ✅');
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('حدث خطأ في حذف الصورة ❌');
    }
  }

  const filteredSubcategories = subcategories.filter(sub => {
    const searchLower = searchTerm.toLowerCase();
    return sub.nameAr?.toLowerCase().includes(searchLower) ||
           sub.name?.toLowerCase().includes(searchLower) ||
           sub.parentNameAr?.toLowerCase().includes(searchLower) ||
           sub.parentName?.toLowerCase().includes(searchLower);
  });

  // Group by parent category
  const groupedByParent = filteredSubcategories.reduce((acc, sub) => {
    const key = sub.parentId;
    if (!acc[key]) {
      acc[key] = {
        parentId: sub.parentId,
        parentName: sub.parentName,
        parentNameAr: sub.parentNameAr,
        subs: []
      };
    }
    acc[key].subs.push(sub);
    return acc;
  }, {} as any);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-black text-gray-800 mb-2">📑 الفئات الفرعية | Subcategories</h1>
            <p className="text-gray-600">جميع الفئات الفرعية من كافة الأقسام</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/categories"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              📂 الأقسام الرئيسية
            </Link>
            <Link
              href="/admin/dashboard"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all duration-200"
            >
              ⬅ العودة
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 ابحث عن فئة فرعية أو قسم رئيسي..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 pr-12 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-lg"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-purple-500">
          <div className="text-3xl font-black text-purple-600">{subcategories.length}</div>
          <div className="text-gray-600 font-bold">إجمالي الفئات الفرعية</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-500">
          <div className="text-3xl font-black text-blue-600">{Object.keys(groupedByParent).length}</div>
          <div className="text-gray-600 font-bold">الأقسام الرئيسية</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-pink-500">
          <div className="text-3xl font-black text-pink-600">{filteredSubcategories.length}</div>
          <div className="text-gray-600 font-bold">نتائج البحث</div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-bold">جاري التحميل...</p>
        </div>
      ) : Object.keys(groupedByParent).length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">📑</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {searchTerm ? 'لا توجد نتائج' : 'لا توجد فئات فرعية'}
          </h3>
          <p className="text-gray-600">
            {searchTerm ? 'جرب البحث بكلمات مختلفة' : 'قم بإضافة فئات فرعية للأقسام'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedByParent).map((group: any) => (
            <div key={group.parentId} className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Parent Category Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
                <h2 className="text-2xl font-black text-white">
                  📂 {group.parentNameAr || 'بدون اسم'} | {group.parentName || 'No Name'}
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  {group.subs.length} {group.subs.length === 1 ? 'فئة فرعية' : 'فئات فرعية'}
                </p>
              </div>

              {/* Subcategories Grid */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.subs.map((sub: Subcategory) => (
                  <div
                    key={sub.id}
                    className="bg-gray-50 rounded-lg p-4 shadow hover:shadow-lg transition-all border-2 border-gray-100 hover:border-purple-300"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {/* Subcategory Image */}
                      <div className="relative group">
                        {sub.image ? (
                          <div className="relative">
                            <img
                              src={sub.image}
                              alt={sub.nameAr || sub.name}
                              className="w-16 h-16 object-cover rounded-lg border-2 border-purple-200"
                            />
                            <button
                              onClick={() => handleDeleteImage(sub)}
                              className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-all"
                              title="حذف الصورة"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg border-2 border-dashed border-purple-200 bg-purple-50 flex items-center justify-center">
                            <span className="text-2xl">📑</span>
                          </div>
                        )}
                        
                        <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 shadow cursor-pointer transition-all">
                          {uploading === sub.id ? (
                            <div className="w-3 h-3 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            </svg>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(sub, file);
                            }}
                            disabled={uploading === sub.id}
                          />
                        </label>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 mb-1 truncate">
                          {sub.nameAr || 'بدون اسم'}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">{sub.name || 'No Name'}</p>
                        <p className="text-xs text-gray-400 font-mono truncate">ID: {sub.id}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
