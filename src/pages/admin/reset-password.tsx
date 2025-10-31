import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { firebaseAuth } from '../../lib/firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

export default function ResetPassword() {
  const router = useRouter();
  const [oobCode, setOobCode] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const code = router.query.oobCode as string;
    const mode = router.query.mode as string;

    if (!code || mode !== 'resetPassword') {
      setError('رابط غير صالح - Invalid reset link');
      setVerifying(false);
      return;
    }

    setOobCode(code);

    // Verify the code
    verifyPasswordResetCode(firebaseAuth, code)
      .then((emailAddress) => {
        setEmail(emailAddress);
        setVerifying(false);
      })
      .catch((err) => {
        console.error('Verification error:', err);
        setError('رابط منتهي الصلاحية أو غير صالح - Expired or invalid link');
        setVerifying(false);
      });
  }, [router.query]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('الرجاء ملء جميع الحقول - Please fill all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمات المرور غير متطابقة - Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل - Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await confirmPasswordReset(firebaseAuth, oobCode, newPassword);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/admin/login');
      }, 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError('فشلت إعادة تعيين كلمة المرور - Failed to reset password');
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">جاري التحقق من الرابط...</p>
          <p className="text-gray-500 text-sm">Verifying link...</p>
        </div>
      </div>
    );
  }

  if (error && !oobCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">رابط غير صالح</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/admin/login')}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            العودة لتسجيل الدخول - Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">تم بنجاح!</h2>
          <p className="text-gray-600 mb-2">تم تغيير كلمة المرور بنجاح</p>
          <p className="text-gray-500 text-sm mb-6">Password changed successfully</p>
          <p className="text-purple-600 text-sm">سيتم تحويلك لصفحة تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <form onSubmit={handleResetPassword} className="w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl blur-lg opacity-50"></div>
            <img 
              src="/sab-logo.png" 
              alt="SAB Store Logo" 
              className="relative w-24 h-24 rounded-2xl shadow-lg" 
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
            إعادة تعيين كلمة المرور
          </h1>
          <p className="text-gray-600 text-sm">Reset Password</p>
        </div>

        {email && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <p className="text-sm text-gray-600 mb-1">إعادة تعيين كلمة المرور لـ:</p>
            <p className="text-purple-600 font-semibold break-all">{email}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-r-4 border-red-500 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-xl mt-0.5">⚠️</span>
              <p className="text-red-700 text-sm flex-1">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-gray-700 mb-2 font-medium">
              <span className="text-purple-600">🔐</span>
              <span>كلمة المرور الجديدة - New Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 outline-none"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-700 mb-2 font-medium">
              <span className="text-purple-600">🔐</span>
              <span>تأكيد كلمة المرور - Confirm Password</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <span>🔒</span>
                <span>حفظ كلمة المرور الجديدة - Save Password</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => router.push('/admin/login')}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
          >
            العودة لتسجيل الدخول - Back to Login
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
            <span>🔒</span>
            <span>صفحة آمنة - Secure Page</span>
          </p>
        </div>
      </form>
    </div>
  );
}
