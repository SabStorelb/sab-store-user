import { useState, useEffect } from 'react';
import { firebaseAuth } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseDb } from './firebase';
import { Admin, AdminPermissions, hasPermission, isSuperAdmin } from './permissions';

/**
 * Hook to get current admin data and check permissions
 */
export function useAdminPermissions() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const adminDoc = await getDoc(doc(firebaseDb, 'admins', user.uid));
          if (adminDoc.exists()) {
            setAdmin({ id: adminDoc.id, ...adminDoc.data() } as Admin);
          } else {
            setAdmin(null);
          }
        } catch (error) {
          console.error('Error fetching admin data:', error);
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkPermission = (permission: keyof AdminPermissions): boolean => {
    return hasPermission(admin, permission);
  };

  const isSuper = isSuperAdmin(admin);

  return {
    admin,
    loading,
    checkPermission,
    isSuperAdmin: isSuper,
  };
}
