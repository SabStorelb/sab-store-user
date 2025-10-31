// Permission checking utilities

export interface AdminPermissions {
  canManageProducts?: boolean;
  canManageOrders?: boolean;
  canManageUsers?: boolean;
  canManageCategories?: boolean;
  canManageBrands?: boolean;
  canManageBanners?: boolean;
  canViewReports?: boolean;
  canManageAdmins?: boolean;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'superadmin';
  permissions: AdminPermissions;
  isAdmin: boolean;
  isActive: boolean;
}

/**
 * Check if admin has a specific permission
 */
export function hasPermission(
  admin: Admin | null | undefined,
  permission: keyof AdminPermissions
): boolean {
  if (!admin) return false;
  
  // SuperAdmin has all permissions
  if (admin.role === 'superadmin') return true;
  
  // Check specific permission
  return admin.permissions?.[permission] === true;
}

/**
 * Check if admin is SuperAdmin
 */
export function isSuperAdmin(admin: Admin | null | undefined): boolean {
  return admin?.role === 'superadmin';
}

/**
 * Get all permissions for display
 */
export function getPermissionsList(): Array<{
  key: keyof AdminPermissions;
  nameAr: string;
  nameEn: string;
  icon: string;
}> {
  return [
    { key: 'canManageProducts', nameAr: 'إدارة المنتجات', nameEn: 'Manage Products', icon: '📦' },
    { key: 'canManageOrders', nameAr: 'إدارة الطلبات', nameEn: 'Manage Orders', icon: '🛒' },
    { key: 'canManageUsers', nameAr: 'إدارة العملاء', nameEn: 'Manage Customers', icon: '👥' },
    { key: 'canManageCategories', nameAr: 'إدارة الفئات', nameEn: 'Manage Categories', icon: '📁' },
    { key: 'canManageBrands', nameAr: 'إدارة العلامات', nameEn: 'Manage Brands', icon: '🏷️' },
    { key: 'canManageBanners', nameAr: 'إدارة البانرات', nameEn: 'Manage Banners', icon: '🎨' },
    { key: 'canViewReports', nameAr: 'عرض التقارير', nameEn: 'View Reports', icon: '📊' },
    { key: 'canManageAdmins', nameAr: 'إدارة المدراء', nameEn: 'Manage Admins', icon: '🔐' },
  ];
}

/**
 * Get default permissions for new admin
 */
export function getDefaultPermissions(): AdminPermissions {
  return {
    canManageProducts: true,
    canManageOrders: true,
    canManageUsers: false,
    canManageCategories: true,
    canManageBrands: true,
    canManageBanners: true,
    canViewReports: true,
    canManageAdmins: false,
  };
}

/**
 * Get all permissions (SuperAdmin)
 */
export function getAllPermissions(): AdminPermissions {
  return {
    canManageProducts: true,
    canManageOrders: true,
    canManageUsers: true,
    canManageCategories: true,
    canManageBrands: true,
    canManageBanners: true,
    canViewReports: true,
    canManageAdmins: true,
  };
}
