# 🔄 تحديث صفحة تعديل المنتج | Edit Product Page Update

## ❌ المشكلة الحالية:

صفحة تعديل المنتج (`/admin/products/[id]/edit.tsx`) **لا تعرض جميع الحقول الجديدة** مثل:
- الألوان (Colors)
- المقاسات (Sizes & Shoe Sizes)
- الفئة العمرية (Age Range)
- الجنس (Gender)
- الموسم (Season)
- مدة التوصيل (Delivery Time)
- التقييم (Rating)
- حالة التوفر (Availability)

---

## ✅ الحل السريع:

تم إضافة تحميل البيانات في الكود، لكن يجب **إضافة الـ UI** من صفحة الإضافة.

---

## 📋 خطوات التنفيذ:

### 1️⃣ **نسخ Sections من صفحة الإضافة**

من ملف: `src/pages/admin/products/new.tsx`

انسخ الأقسام التالية وضعها في `edit.tsx`:

#### 🎨 **Section 4: Colors**
- ابحث عن: `{/* Section 4: Colors */}`
- انسخ من السطر ~778 إلى ~910

#### 📏 **Section 5: Sizes & Age & Gender & Season**
- ابحث عن: `{/* Section 5: Sizes & Age */}`
- انسخ من السطر ~912 إلى ~1195

#### ⚙️ **Section 6: Additional Info**
- ابحث عن: `{/* Section 6: Additional Info */}`
- انسخ من السطر ~1197 إلى ~1282

---

### 2️⃣ **تعديل وظيفة الحفظ (handleSubmit)**

أضف الحقول الجديدة في `updateDoc`:

```typescript
await updateDoc(doc(firebaseDb, 'products', id as string), {
  // ... الحقول الموجودة
  
  // Variants - جديد
  sizes,
  shoeSizes,
  ageRange,
  colors,
  gender,
  season,
  
  // Additional info - جديد
  deliveryTime,
  rating: rate,
  rate,
  available,
  inStock: available,
  
  // ... باقي الحقول
});
```

---

### 3️⃣ **إضافة Color Options**

أضف قبل الـ return:

```typescript
const colorOptions = [
  { ar: 'أبيض', en: 'White', hex: '#FFFFFF' },
  { ar: 'أسود', en: 'Black', hex: '#000000' },
  { ar: 'أحمر', en: 'Red', hex: '#FF0000' },
  { ar: 'أزرق', en: 'Blue', hex: '#0074D9' },
  { ar: 'أخضر', en: 'Green', hex: '#2ECC40' },
  { ar: 'أصفر', en: 'Yellow', hex: '#FFDC00' },
  { ar: 'رمادي', en: 'Gray', hex: '#AAAAAA' },
  { ar: 'برتقالي', en: 'Orange', hex: '#FF851B' },
  { ar: 'بنفسجي', en: 'Purple', hex: '#B10DC9' },
  { ar: 'وردي', en: 'Pink', hex: '#F012BE' },
  { ar: 'بني', en: 'Brown', hex: '#8B4513' },
  { ar: 'بيج', en: 'Beige', hex: '#F5F5DC' },
  { ar: 'فضي', en: 'Silver', hex: '#C0C0C0' },
  { ar: 'ذهبي', en: 'Gold', hex: '#FFD700' },
  { ar: 'كحلي', en: 'Navy', hex: '#000080' },
  { ar: 'سماوي', en: 'Sky Blue', hex: '#87CEEB' },
];

const ageOptions = [
  { ar: '0-6 أشهر', en: '0-6 months' },
  { ar: '6-12 شهر', en: '6-12 months' },
  { ar: '1-2 سنة', en: '1-2 years' },
  { ar: '2-3 سنوات', en: '2-3 years' },
  { ar: '3-4 سنوات', en: '3-4 years' },
  { ar: '4-5 سنوات', en: '4-5 years' },
  { ar: '5-6 سنوات', en: '5-6 years' },
  { ar: '6-7 سنوات', en: '6-7 years' },
  { ar: '7-8 سنوات', en: '7-8 years' },
  { ar: '8-10 سنوات', en: '8-10 years' },
  { ar: '10-12 سنة', en: '10-12 years' },
  { ar: '12-14 سنة', en: '12-14 years' },
  { ar: '14+ سنة', en: '14+ years' },
];
```

---

### 4️⃣ **إضافة دالة handleSizeToggle**

```typescript
function handleSizeToggle(size: string) {
  setSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
}
```

---

## 🎯 النتيجة المتوقعة:

عند فتح صفحة التعديل:
- ✅ جميع الحقول الأساسية محملة (الاسم، السعر، إلخ)
- ✅ الألوان المحددة مسبقاً تظهر محددة
- ✅ المقاسات المحددة تظهر محددة
- ✅ الجنس والموسم يظهران محددين
- ✅ التقييم ومدة التوصيل يظهران
- ✅ جميع الصور الموجودة تعرض

---

## 📸 مثال على الكود الكامل:

### في handleSubmit:

```typescript
const updateData = {
  // Multi-language fields
  name: {
    en: nameEn,
    ar: nameAr,
  },
  description: {
    en: descEn,
    ar: descAr,
  },
  
  // Flat fields for admin compatibility
  nameEn,
  nameAr,
  title: nameEn,
  titleAr: nameAr,
  desc: descEn,
  descAr,
  
  // Price & Stock
  price: parseFloat(price),
  currency,
  stock: parseInt(stock),
  
  // Category & Brand
  category: selectedCategory?.name || selectedCategory?.nameEn || 'Fashion',
  categoryName: selectedCategory?.name || selectedCategory?.nameEn || 'Fashion',
  categoryId: category,
  
  subcategory: selectedSubcategory?.name || selectedSubcategory?.nameEn || '',
  subcategoryName: selectedSubcategory?.name || selectedSubcategory?.nameEn || '',
  subcategoryId: subcategory,
  
  brand: selectedBrand?.name || selectedBrand?.nameEn || brand || 'SAB',
  brandName: selectedBrand?.name || selectedBrand?.nameEn || brand || 'SAB',
  brandId: brand,
  
  // Variants - NEW
  sizes,
  shoeSizes,
  ageRange,
  colors,
  gender,
  season,
  
  // Additional info - NEW
  deliveryTime,
  rating: rate,
  rate,
  reviews: 0,
  
  // Availability
  available,
  inStock: available,
  featured,
  
  // Images
  images: finalImages, // Array of all images (existing + new)
  image: finalImages[0] || '',
  
  // Timestamps
  updatedAt: new Date().toISOString(),
};

await updateDoc(doc(firebaseDb, 'products', id as string), updateData);
```

---

## ⚠️ ملاحظات مهمة:

1. **لا تنسَ** إضافة custom color feature إذا أردت
2. **تأكد** من تحميل الـ subcategories عند تحديد category
3. **احتفظ** بالصور القديمة إذا لم يتم رفع صور جديدة
4. **اختبر** التعديل على منتج موجود

---

## 🚀 للتنفيذ السريع:

انسخ الـ Sections 4, 5, 6 من `new.tsx` والصقها في `edit.tsx` بعد Section 3 (Categories).

---

✅ **بعد هذا التحديث، صفحة التعديل ستكون كاملة ومطابقة لصفحة الإضافة!**
