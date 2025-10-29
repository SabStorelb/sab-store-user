import React from 'react';

export default function SubcategoriesPage() {
  // لاحقاً: جلب بيانات الأقسام الفرعية من Firestore
  // الآن: عرض رسالة افتراضية
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">الأقسام الفرعية | Subcategories</h1>
      <div className="bg-gray-100 rounded-lg p-6 text-gray-600 text-lg shadow">
        لا يوجد معلومات لعرضها حالياً.
      </div>
    </div>
  );
}
