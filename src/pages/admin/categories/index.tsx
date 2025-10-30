import { useEffect, useState } from 'react';
import Link from 'next/link';
import { firebaseDb, firebaseStorage } from '../../../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<{ [catId: string]: any[] }>({});
  const [subLoading, setSubLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  
  // Edit modals
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [showAddSubModal, setShowAddSubModal] = useState<string | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryImage, setNewCategoryImage] = useState<File | null>(null);
  const [newCategoryImagePreview, setNewCategoryImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const snap = await getDocs(collection(firebaseDb, 'categories'));
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }

  async function handleExpand(catId: string) {
    if (expandedId === catId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(catId);
    if (!subcategories[catId]) {
      setSubLoading(catId);
      try {
        const snap = await getDocs(collection(firebaseDb, 'categories', catId, 'subcategory'));
        setSubcategories(prev => ({ ...prev, [catId]: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      }
      setSubLoading(null);
    }
  }

  async function handleImageUpload(catId: string, file: File, isSubcategory: boolean = false, parentId?: string) {
    setUploading(catId);
    try {
      const path = isSubcategory 
        ? `subcategories/${catId}/image.jpg`
        : `categories/${catId}/image.jpg`;
      const storageRef = ref(firebaseStorage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      if (isSubcategory && parentId) {
        await updateDoc(doc(firebaseDb, 'categories', parentId, 'subcategory', catId), { image: url });
        setSubcategories(subs => ({
          ...subs,
          [parentId]: subs[parentId].map(s => s.id === catId ? { ...s, image: url } : s)
        }));
      } else {
        await updateDoc(doc(firebaseDb, 'categories', catId), { image: url });
        setCategories(cats => cats.map(c => c.id === catId ? { ...c, image: url } : c));
      }
      
      alert('تم تحديث الصورة بنجاح! ✅');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('حدث خطأ في رفع الصورة ❌');
    } finally {
      setUploading(null);
    }
  }

  async function handleDeleteImage(catId: string, isSubcategory: boolean = false, parentId?: string) {
    if (!confirm('هل أنت متأكد من حذف الصورة؟')) return;
    
    try {
      const path = isSubcategory 
        ? `subcategories/${catId}/image.jpg`
        : `categories/${catId}/image.jpg`;
      
      try {
        const storageRef = ref(firebaseStorage, path);
        await deleteObject(storageRef);
      } catch (error) {
        console.log('Image file not found or already deleted');
      }

      if (isSubcategory && parentId) {
        await updateDoc(doc(firebaseDb, 'categories', parentId, 'subcategory', catId), { image: '' });
        setSubcategories(subs => ({
          ...subs,
          [parentId]: subs[parentId].map(s => s.id === catId ? { ...s, image: '' } : s)
        }));
      } else {
        await updateDoc(doc(firebaseDb, 'categories', catId), { image: '' });
        setCategories(cats => cats.map(c => c.id === catId ? { ...c, image: '' } : c));
      }
      
      alert('تم حذف الصورة بنجاح! ✅');
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('حدث خطأ في حذف الصورة ❌');
    }
  }

  // Add New Category
  async function handleAddCategory(name: string, nameAr: string) {
    if (!name || !nameAr) {
      alert('الرجاء ملء جميع الحقول المطلوبة!');
      return;
    }

    try {
      // Create slug from English name
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Get current max order
      const maxOrder = categories.length > 0 
        ? Math.max(...categories.map(c => c.order || 0)) 
        : 0;

      // Create category document first
      const docRef = await addDoc(collection(firebaseDb, 'categories'), {
        name,
        nameAr,
        slug,
        order: maxOrder + 1,
        level: 0,
        isActive: true,
        parentId: null,
        path: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      let imageUrl = '';
      
      // Upload image if provided
      if (newCategoryImage) {
        const storageRef = ref(firebaseStorage, `categories/${docRef.id}/image.jpg`);
        await uploadBytes(storageRef, newCategoryImage);
        imageUrl = await getDownloadURL(storageRef);
        
        // Update document with image URL
        await updateDoc(doc(firebaseDb, 'categories', docRef.id), {
          image: imageUrl,
          updatedAt: new Date().toISOString(),
        });
      }

      setCategories(cats => [...cats, { 
        id: docRef.id, 
        name, 
        nameAr, 
        slug,
        order: maxOrder + 1,
        level: 0,
        isActive: true,
        image: imageUrl || undefined 
      }]);
      setShowAddCategoryModal(false);
      setNewCategoryImage(null);
      setNewCategoryImagePreview(null);
      alert('تم إضافة القسم بنجاح! ✅');
    } catch (error) {
      console.error('Error adding category:', error);
      alert('حدث خطأ في الإضافة ❌');
    }
  }

  // Edit Category
  async function handleEditCategory(cat: any) {
    if (!cat.name || !cat.nameAr) {
      alert('الرجاء ملء جميع الحقول المطلوبة!');
      return;
    }

    try {
      const slug = cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      await updateDoc(doc(firebaseDb, 'categories', cat.id), {
        name: cat.name,
        nameAr: cat.nameAr,
        slug,
        updatedAt: new Date().toISOString(),
      });
      
      setCategories(cats => cats.map(c => c.id === cat.id ? { ...cat, slug } : c));
      setEditingCategory(null);
      alert('تم تحديث القسم بنجاح! ✅');
    } catch (error) {
      console.error('Error updating category:', error);
      alert('حدث خطأ في التحديث ❌');
    }
  }

  // Delete Category
  async function handleDeleteCategory(catId: string) {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع الفئات الفرعية أيضاً!')) return;

    try {
      // Delete all subcategories first
      if (subcategories[catId]) {
        for (const sub of subcategories[catId]) {
          try {
            await deleteDoc(doc(firebaseDb, 'categories', catId, 'subcategory', sub.id));
            // Try to delete subcategory image
            try {
              const subImageRef = ref(firebaseStorage, `subcategories/${sub.id}/image.jpg`);
              await deleteObject(subImageRef);
            } catch (e) {}
          } catch (e) {
            console.error('Error deleting subcategory:', e);
          }
        }
      }

      // Delete category image
      try {
        const catImageRef = ref(firebaseStorage, `categories/${catId}/image.jpg`);
        await deleteObject(catImageRef);
      } catch (e) {}

      // Delete category
      await deleteDoc(doc(firebaseDb, 'categories', catId));
      
      setCategories(cats => cats.filter(c => c.id !== catId));
      delete subcategories[catId];
      alert('تم حذف القسم بنجاح! ✅');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('حدث خطأ في الحذف ❌');
    }
  }

  // Add Subcategory
  async function handleAddSubcategory(parentId: string, name: string, nameAr: string) {
    if (!name || !nameAr) {
      alert('الرجاء ملء جميع الحقول المطلوبة!');
      return;
    }

    try {
      // Get current max order for this parent
      const currentSubs = subcategories[parentId] || [];
      const maxOrder = currentSubs.length > 0 
        ? Math.max(...currentSubs.map((s: any) => s.order || 0)) 
        : 0;
      
      const newSubRef = await addDoc(collection(firebaseDb, 'categories', parentId, 'subcategory'), {
        name,
        nameAr,
        order: maxOrder + 1,
        isActive: true,
        image: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const newSub = { 
        id: newSubRef.id, 
        name, 
        nameAr, 
        order: maxOrder + 1,
        isActive: true,
        image: '' 
      };
      
      setSubcategories(prev => ({
        ...prev,
        [parentId]: [...(prev[parentId] || []), newSub]
      }));
      
      setShowAddSubModal(null);
      alert('تم إضافة الفئة الفرعية بنجاح! ✅');
    } catch (error) {
      console.error('Error adding subcategory:', error);
      alert('حدث خطأ في الإضافة ❌');
    }
  }

  // Edit Subcategory
  async function handleEditSubcategory(parentId: string, sub: any) {
    if (!sub.name || !sub.nameAr) {
      alert('الرجاء ملء جميع الحقول المطلوبة!');
      return;
    }

    try {
      await updateDoc(doc(firebaseDb, 'categories', parentId, 'subcategory', sub.id), {
        name: sub.name,
        nameAr: sub.nameAr,
        updatedAt: new Date().toISOString(),
      });
      
      setSubcategories(subs => ({
        ...subs,
        [parentId]: subs[parentId].map(s => s.id === sub.id ? sub : s)
      }));
      
      setEditingSubcategory(null);
      alert('تم تحديث الفئة الفرعية بنجاح! ✅');
    } catch (error) {
      console.error('Error updating subcategory:', error);
      alert('حدث خطأ في التحديث ❌');
    }
  }

  // Delete Subcategory
  async function handleDeleteSubcategory(parentId: string, subId: string) {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة الفرعية؟')) return;

    try {
      // Try to delete image
      try {
        const imageRef = ref(firebaseStorage, `subcategories/${subId}/image.jpg`);
        await deleteObject(imageRef);
      } catch (e) {}

      await deleteDoc(doc(firebaseDb, 'categories', parentId, 'subcategory', subId));
      
      setSubcategories(subs => ({
        ...subs,
        [parentId]: subs[parentId].filter(s => s.id !== subId)
      }));
      
      alert('تم حذف الفئة الفرعية بنجاح! ✅');
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      alert('حدث خطأ في الحذف ❌');
    }
  }

  const filteredCategories = categories.filter(cat => {
    const searchLower = searchTerm.toLowerCase();
    return cat.nameAr?.toLowerCase().includes(searchLower) ||
           cat.name?.toLowerCase().includes(searchLower);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-black text-gray-800 mb-2">📂 الأقسام | Categories</h1>
            <p className="text-gray-600">إدارة الأقسام والفئات الفرعية</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              ➕ إضافة قسم جديد
            </button>
            <Link
              href="/admin/categories/subcategories"
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              📑 الفئات الفرعية
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
            placeholder="🔍 ابحث عن قسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 pr-12 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all text-lg"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-orange-500">
          <div className="text-3xl font-black text-orange-600">{categories.length}</div>
          <div className="text-gray-600 font-bold">إجمالي الأقسام</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-500">
          <div className="text-3xl font-black text-blue-600">
            {Object.values(subcategories).reduce((sum, subs) => sum + subs.length, 0)}
          </div>
          <div className="text-gray-600 font-bold">إجمالي الفئات الفرعية</div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-bold">جاري التحميل...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {searchTerm ? 'لا توجد نتائج' : 'لا توجد أقسام'}
          </h3>
          <p className="text-gray-600">
            {searchTerm ? 'جرب البحث بكلمات مختلفة' : 'الأقسام موجودة في Firebase'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              {/* Category Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
                <div className="flex items-center gap-4">
                  {/* Category Image */}
                  <div className="relative group">
                    {cat.image ? (
                      <div className="relative">
                        <img
                          src={cat.image}
                          alt={cat.nameAr || cat.name}
                          className="w-20 h-20 object-cover rounded-lg border-4 border-white shadow-lg"
                        />
                        <button
                          onClick={() => handleDeleteImage(cat.id)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="حذف الصورة"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg border-4 border-white border-dashed bg-white/20 flex items-center justify-center">
                        <span className="text-4xl">📂</span>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg cursor-pointer transition-all">
                      {uploading === cat.id ? (
                        <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(cat.id, file);
                        }}
                        disabled={uploading === cat.id}
                      />
                    </label>
                  </div>

                  {/* Category Info */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white mb-1">
                      {cat.nameAr || 'بدون اسم'} | {cat.name || 'No Name'}
                    </h3>
                    <p className="text-white/80 text-sm font-mono">ID: {cat.id}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Edit Category */}
                    <button
                      onClick={() => setEditingCategory(cat)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
                      title="تعديل القسم"
                    >
                      ✏️ تعديل
                    </button>

                    {/* Delete Category */}
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
                      title="حذف القسم"
                    >
                      🗑️ حذف
                    </button>

                    {/* Expand Button */}
                    <button
                      onClick={() => handleExpand(cat.id)}
                      className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2"
                    >
                      {expandedId === cat.id ? '⬆️ إخفاء' : '⬇️ عرض'} الفئات الفرعية
                      {subcategories[cat.id] && (
                        <span className="bg-white text-orange-600 px-2 py-1 rounded-full text-sm font-black">
                          {subcategories[cat.id].length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Subcategories */}
              {expandedId === cat.id && (
                <div className="p-6 bg-gray-50">
                  {/* Add Subcategory Button */}
                  <div className="mb-4">
                    <button
                      onClick={() => setShowAddSubModal(cat.id)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      ➕ إضافة فئة فرعية جديدة
                    </button>
                  </div>

                  {subLoading === cat.id ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
                      <p className="mt-2 text-gray-600">جاري تحميل الفئات الفرعية...</p>
                    </div>
                  ) : subcategories[cat.id] && subcategories[cat.id].length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subcategories[cat.id].map((sub) => (
                        <div
                          key={sub.id}
                          className="bg-white rounded-lg p-4 shadow hover:shadow-lg transition-all border-2 border-gray-100 hover:border-orange-300"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            {/* Subcategory Image */}
                            <div className="relative group">
                              {sub.image ? (
                                <div className="relative">
                                  <img
                                    src={sub.image}
                                    alt={sub.nameAr || sub.name}
                                    className="w-16 h-16 object-cover rounded-lg border-2 border-orange-200"
                                  />
                                  <button
                                    onClick={() => handleDeleteImage(sub.id, true, cat.id)}
                                    className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-all"
                                    title="حذف الصورة"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-orange-200 bg-orange-50 flex items-center justify-center">
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
                                    if (file) handleImageUpload(sub.id, file, true, cat.id);
                                  }}
                                  disabled={uploading === sub.id}
                                />
                              </label>
                            </div>

                            <div className="flex-1">
                              <h4 className="font-bold text-gray-800 mb-1">
                                {sub.nameAr || 'بدون اسم'}
                              </h4>
                              <p className="text-sm text-gray-500">{sub.name || 'No Name'}</p>
                              <p className="text-xs text-gray-400 font-mono">ID: {sub.id}</p>
                            </div>
                          </div>

                          {/* Subcategory Action Buttons */}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => setEditingSubcategory({ ...sub, parentId: cat.id })}
                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-bold transition-all text-sm"
                            >
                              ✏️ تعديل
                            </button>
                            <button
                              onClick={() => handleDeleteSubcategory(cat.id, sub.id)}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-bold transition-all text-sm"
                            >
                              🗑️ حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="font-bold">لا توجد فئات فرعية لهذا القسم</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center gap-2">
              ✏️ تعديل القسم
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الاسم بالعربية
                </label>
                <input
                  type="text"
                  value={editingCategory.nameAr || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, nameAr: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="اسم القسم بالعربية"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الاسم بالإنجليزية
                </label>
                <input
                  type="text"
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="Category Name in English"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleEditCategory(editingCategory)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  ✅ حفظ التعديلات
                </button>
                <button
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all"
                >
                  ❌ إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subcategory Modal */}
      {editingSubcategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center gap-2">
              ✏️ تعديل الفئة الفرعية
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الاسم بالعربية
                </label>
                <input
                  type="text"
                  value={editingSubcategory.nameAr || ''}
                  onChange={(e) => setEditingSubcategory({ ...editingSubcategory, nameAr: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="اسم الفئة الفرعية بالعربية"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الاسم بالإنجليزية
                </label>
                <input
                  type="text"
                  value={editingSubcategory.name || ''}
                  onChange={(e) => setEditingSubcategory({ ...editingSubcategory, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="Subcategory Name in English"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleEditSubcategory(editingSubcategory.parentId, editingSubcategory)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  ✅ حفظ التعديلات
                </button>
                <button
                  onClick={() => setEditingSubcategory(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all"
                >
                  ❌ إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Subcategory Modal */}
      {showAddSubModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center gap-2">
              ➕ إضافة فئة فرعية جديدة
            </h2>
            
            <div className="mb-4 p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
              <p className="text-sm font-bold text-orange-800">
                القسم الرئيسي: {categories.find(c => c.id === showAddSubModal)?.nameAr}
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const nameAr = formData.get('nameAr') as string;
              const name = formData.get('name') as string;
              handleAddSubcategory(showAddSubModal, name, nameAr);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الاسم بالعربية *
                </label>
                <input
                  type="text"
                  name="nameAr"
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all"
                  placeholder="اسم الفئة الفرعية بالعربية"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الاسم بالإنجليزية *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all"
                  placeholder="Subcategory Name in English"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  ✅ إضافة الفئة الفرعية
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSubModal(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all"
                >
                  ❌ إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center gap-2">
              ➕ إضافة قسم رئيسي جديد
            </h2>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const nameAr = formData.get('nameAr') as string;
              const name = formData.get('name') as string;
              handleAddCategory(name, nameAr);
            }} className="space-y-4">
              {/* Image Preview & Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  📷 صورة القسم (اختياري)
                </label>
                <div className="flex items-center gap-4">
                  {/* Image Preview */}
                  {newCategoryImagePreview ? (
                    <div className="relative">
                      <img
                        src={newCategoryImagePreview}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-lg border-2 border-orange-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewCategoryImage(null);
                          setNewCategoryImagePreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 flex items-center justify-center">
                      <span className="text-4xl">📂</span>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <label className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-3 rounded-lg font-bold cursor-pointer text-center transition-all">
                    {newCategoryImage ? '✅ تم اختيار الصورة' : '📤 اختر صورة'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewCategoryImage(file);
                          setNewCategoryImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الاسم بالعربية *
                </label>
                <input
                  type="text"
                  name="nameAr"
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                  placeholder="اسم القسم بالعربية"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الاسم بالإنجليزية *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                  placeholder="Category Name in English"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  ✅ إضافة القسم الرئيسي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryImage(null);
                    setNewCategoryImagePreview(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all"
                >
                  ❌ إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
