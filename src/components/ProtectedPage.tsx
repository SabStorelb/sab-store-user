import { useAdminPermissions } from '../lib/useAdminPermissions';
import { AdminPermissions } from '../lib/permissions';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

interface ProtectedPageProps {
  children: React.ReactNode;
  requiredPermission?: keyof AdminPermissions;
  requireSuperAdmin?: boolean;
}

/**
 * Component to protect admin pages based on permissions
 */
export default function ProtectedPage({
  children,
  requiredPermission,
  requireSuperAdmin = false,
}: ProtectedPageProps) {
  const { admin, loading, checkPermission, isSuperAdmin } = useAdminPermissions();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Not logged in
      if (!admin) {
        router.push('/admin/login');
        return;
      }

      // Require SuperAdmin
      if (requireSuperAdmin && !isSuperAdmin) {
        alert('⛔ غير مصرح - هذه الصفحة للمدراء الرئيسيين فقط | Unauthorized - SuperAdmin Only');
        router.push('/admin/dashboard');
        return;
      }

      // Check specific permission
      if (requiredPermission && !checkPermission(requiredPermission)) {
        alert(`⛔ غير مصرح - ليس لديك صلاحية الوصول لهذه الصفحة | Unauthorized - Missing Permission`);
        router.push('/admin/dashboard');
        return;
      }
    }
  }, [admin, loading, requiredPermission, requireSuperAdmin, checkPermission, isSuperAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-bold">جاري التحميل... | Loading...</p>
        </div>
      </div>
    );
  }

  // Only show content if authorized
  if (!admin) return null;
  if (requireSuperAdmin && !isSuperAdmin) return null;
  if (requiredPermission && !checkPermission(requiredPermission)) return null;

  return <>{children}</>;
}
