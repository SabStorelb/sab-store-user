import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthAction() {
  const router = useRouter();

  useEffect(() => {
    // Get all query parameters
    const { mode, oobCode, apiKey, continueUrl, lang } = router.query;

    // Redirect to our custom reset password page with all parameters
    if (mode && oobCode) {
      const params = new URLSearchParams();
      if (mode) params.append('mode', mode as string);
      if (oobCode) params.append('oobCode', oobCode as string);
      if (apiKey) params.append('apiKey', apiKey as string);
      if (continueUrl) params.append('continueUrl', continueUrl as string);
      if (lang) params.append('lang', lang as string);

      router.replace(`/admin/reset-password?${params.toString()}`);
    } else {
      // If no valid parameters, redirect to login
      router.replace('/admin/login');
    }
  }, [router.query]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500">
      <div className="text-white text-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl">جاري التحويل...</p>
        <p className="text-sm opacity-80">Redirecting...</p>
      </div>
    </div>
  );
}
