# 🔐 نظام الصلاحيات للمدراء | Admin Permissions System

## 📋 نظرة عامة | Overview

تم إنشاء نظام صلاحيات متدرج للمدراء يسمح بالتحكم الكامل في من يمكنه الوصول إلى أي صفحة أو ميزة.

---

## 👥 أنواع المدراء | Admin Types

### 👑 مدير رئيسي (SuperAdmin)
- **الصلاحيات**: جميع الصلاحيات بدون استثناء
- **الدور**: `role: 'superadmin'`
- **الاستخدام**: للمالك أو المدير العام
- **لا يمكن تقييد صلاحياته**

### 👤 مدير عادي (Admin)
- **الصلاحيات**: محددة حسب الاختيار
- **الدور**: `role: 'admin'`
- **الاستخدام**: للموظفين والمساعدين
- **يمكن تخصيص صلاحياته**

---

## ⚙️ الصلاحيات المتاحة | Available Permissions

| الصلاحية | المفتاح | الوصف |
|---------|---------|-------|
| 📦 إدارة المنتجات | `canManageProducts` | إضافة، تعديل، حذف المنتجات |
| 🛒 إدارة الطلبات | `canManageOrders` | عرض، تعديل حالة الطلبات |
| 👥 إدارة العملاء | `canManageUsers` | عرض، تعديل، حذف العملاء |
| 📁 إدارة الفئات | `canManageCategories` | إدارة الفئات والفئات الفرعية |
| 🏷️ إدارة العلامات | `canManageBrands` | إدارة العلامات التجارية |
| 🎨 إدارة البانرات | `canManageBanners` | إدارة البانرات الإعلانية |
| 📊 عرض التقارير | `canViewReports` | الوصول للتقارير والإحصائيات |
| 🔐 إدارة المدراء | `canManageAdmins` | إضافة، تعديل، حذف مدراء آخرين |

---

## 🛠️ الملفات الرئيسية | Main Files

### 1. **`src/lib/permissions.ts`**
ملف الدوال المساعدة للتحقق من الصلاحيات:

```typescript
// التحقق من صلاحية معينة
hasPermission(admin, 'canManageProducts') // true/false

// التحقق من SuperAdmin
isSuperAdmin(admin) // true/false

// الحصول على قائمة الصلاحيات
getPermissionsList()

// الصلاحيات الافتراضية
getDefaultPermissions()

// جميع الصلاحيات
getAllPermissions()
```

### 2. **`src/lib/useAdminPermissions.ts`**
Hook مخصص للاستخدام في المكونات:

```typescript
const { admin, loading, checkPermission, isSuperAdmin } = useAdminPermissions();

// مثال
if (checkPermission('canManageProducts')) {
  // عرض زر إضافة منتج
}
```

### 3. **`src/components/ProtectedPage.tsx`**
مكون لحماية الصفحات:

```typescript
// حماية صفحة للمدراء الرئيسيين فقط
<ProtectedPage requireSuperAdmin>
  <AdminsManagementPage />
</ProtectedPage>

// حماية صفحة بصلاحية معينة
<ProtectedPage requiredPermission="canManageProducts">
  <ProductsPage />
</ProtectedPage>
```

### 4. **`src/pages/api/admin/create-admin.ts`**
API لإنشاء مدراء جدد مع الصلاحيات:

```typescript
POST /api/admin/create-admin
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "password": "password123",
  "role": "admin",
  "permissions": {
    "canManageProducts": true,
    "canManageOrders": true,
    "canManageUsers": false,
    // ...
  }
}
```

---

## 📖 كيفية الاستخدام | How to Use

### 1️⃣ إضافة مدير جديد

1. اذهب إلى صفحة المدراء: `/admin/admins`
2. اضغط "➕ إضافة مدير جديد"
3. املأ البيانات (الاسم، البريد، كلمة المرور)
4. اختر الدور:
   - **👑 مدير رئيسي**: جميع الصلاحيات
   - **👤 مدير عادي**: اختر الصلاحيات المطلوبة
5. اضغط "✅ إضافة المدير"

### 2️⃣ تعديل صلاحيات مدير موجود

1. في صفحة المدراء، اضغط "✏️ تعديل" بجانب المدير
2. غير الدور إن أردت
3. في حالة "مدير عادي"، عدّل الصلاحيات كما تريد
4. اضغط "✅ حفظ التعديلات"

### 3️⃣ حماية صفحة جديدة

في ملف الصفحة:

```typescript
import ProtectedPage from '../components/ProtectedPage';

export default function ProductsPage() {
  return (
    <ProtectedPage requiredPermission="canManageProducts">
      <div>
        {/* محتوى الصفحة */}
      </div>
    </ProtectedPage>
  );
}
```

### 4️⃣ إخفاء أزرار حسب الصلاحية

```typescript
import { useAdminPermissions } from '../lib/useAdminPermissions';

function MyComponent() {
  const { checkPermission } = useAdminPermissions();

  return (
    <div>
      {checkPermission('canManageProducts') && (
        <button>➕ إضافة منتج</button>
      )}
    </div>
  );
}
```

---

## 🔒 الأمان | Security

### من يستطيع تعديل الصلاحيات؟
**فقط المدير الرئيسي (SuperAdmin)** يمكنه:
- ✅ إضافة مدراء جدد
- ✅ تعديل صلاحيات المدراء الموجودين
- ✅ تغيير دور المدير (admin ↔ superadmin)
- ✅ حذف المدراء

**المدير العادي (Admin):**
- ❌ لا يمكنه إضافة مدراء
- ❌ لا يمكنه تعديل صلاحيات أي مدير
- ❌ لا يمكنه حذف مدراء
- ✅ يمكنه فقط **عرض** قائمة المدراء

### في Frontend (صفحات الويب):
- استخدم `ProtectedPage` لحماية الصفحات
- استخدم `useAdminPermissions` لإخفاء/إظهار الأزرار
- التحقق من `isSuperAdmin` قبل السماح بالتعديل

### في Backend (API):
**⚠️ مهم جداً**: يجب التحقق من الصلاحيات في كل API endpoint:

```typescript
// مثال في API - التحقق من SuperAdmin
import { admin } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  // 1. الحصول على التوكن
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  // 2. التحقق من التوكن
  const decodedToken = await admin.auth().verifyIdToken(token);
  
  // 3. جلب بيانات المدير
  const adminDoc = await admin.firestore()
    .collection('admins')
    .doc(decodedToken.uid)
    .get();

  const adminData = adminDoc.data();
  
  // 4. فحص إذا كان SuperAdmin
  if (adminData.role !== 'superadmin') {
    return res.status(403).json({ 
      error: 'Forbidden - Only SuperAdmin' 
    });
  }

  // 5. تنفيذ العملية
  // ...
}
```

---

## 📊 هيكل البيانات في Firestore

```javascript
// Collection: admins/{uid}
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "phone": "1234567890",
  "role": "admin", // أو "superadmin"
  "isAdmin": true,
  "isActive": true,
  "permissions": {
    "canManageProducts": true,
    "canManageOrders": true,
    "canManageUsers": false,
    "canManageCategories": true,
    "canManageBrands": true,
    "canManageBanners": true,
    "canViewReports": true,
    "canManageAdmins": false
  },
  "createdAt": "2025-10-31T10:00:00.000Z",
  "updatedAt": "2025-10-31T10:00:00.000Z"
}
```

---

## ✅ أمثلة عملية | Practical Examples

### مثال 1: مدير متجر (محدود الصلاحيات)
```json
{
  "role": "admin",
  "permissions": {
    "canManageProducts": true,
    "canManageOrders": true,
    "canManageUsers": false,
    "canManageCategories": false,
    "canManageBrands": false,
    "canManageBanners": false,
    "canViewReports": true,
    "canManageAdmins": false
  }
}
```
**الاستخدام**: موظف يدير المنتجات والطلبات فقط

### مثال 2: مدير تسويق
```json
{
  "role": "admin",
  "permissions": {
    "canManageProducts": false,
    "canManageOrders": false,
    "canManageUsers": true,
    "canManageCategories": false,
    "canManageBrands": false,
    "canManageBanners": true,
    "canViewReports": true,
    "canManageAdmins": false
  }
}
```
**الاستخدام**: مسؤول عن البانرات والعملاء والتقارير

### مثال 3: مدير رئيسي (كل الصلاحيات)
```json
{
  "role": "superadmin",
  "permissions": {
    "canManageProducts": true,
    "canManageOrders": true,
    "canManageUsers": true,
    "canManageCategories": true,
    "canManageBrands": true,
    "canManageBanners": true,
    "canViewReports": true,
    "canManageAdmins": true
  }
}
```
**الاستخدام**: المالك أو المدير العام

---

## 🎯 الصفحات المحمية | Protected Pages

| الصفحة | الصلاحية المطلوبة |
|-------|-------------------|
| `/admin/products/*` | `canManageProducts` |
| `/admin/orders/*` | `canManageOrders` |
| `/admin/customers` | `canManageUsers` |
| `/admin/categories/*` | `canManageCategories` |
| `/admin/brands/*` | `canManageBrands` |
| `/admin/banners/*` | `canManageBanners` |
| `/admin/dashboard` | `canViewReports` |
| `/admin/admins` | `requireSuperAdmin` |

---

## 🚀 خطوات التطبيق المستقبلية

1. ✅ إضافة حماية لصفحات المنتجات
2. ✅ إضافة حماية لصفحات الطلبات
3. ✅ إضافة حماية لصفحات العملاء
4. ✅ إضافة التحقق من الصلاحيات في جميع API endpoints
5. ✅ إضافة سجل للعمليات (Audit Log) لتتبع من فعل ماذا

---

## 📝 ملاحظات مهمة

1. **المدير الرئيسي الأول**: يجب إنشاؤه يدوياً في Firebase Console أو عبر script
2. **لا يمكن حذف آخر SuperAdmin**: يجب الحفاظ على مدير رئيسي واحد على الأقل
3. **الصلاحيات في الوقت الفعلي**: تتحدث تلقائياً عند تعديل المدير
4. **الأمان مزدوج**: التحقق في Frontend (UX) و Backend (Security)

---

## 🆘 الدعم | Support

للأسئلة أو المساعدة، راجع:
- `src/lib/permissions.ts` - الدوال المساعدة
- `src/components/ProtectedPage.tsx` - مكون الحماية
- `src/pages/admin/admins.tsx` - صفحة إدارة المدراء

---

**آخر تحديث**: 31 أكتوبر 2025
**الإصدار**: 1.0.0
