import { useState } from 'react';
import { useRouter } from 'next/router';
import { firebaseAuth } from '../../lib/firebase';
import { signInWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export default function ResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
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

    if (oldPassword === newPassword) {
      setError('كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة - New password must be different from old password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Authenticating with old password...');
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, oldPassword);
      
      const credential = EmailAuthProvider.credential(email, oldPassword);
      await reauthenticateWithCredential(userCredential.user, credential);
      
      console.log('✅ Authentication successful');

      console.log('🔄 Calling change password API...');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          oldPassword, 
          newPassword,
          uid: userCredential.user.uid 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      console.log('✅ Password changed successfully');
      
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: 'تأكيد تغيير كلمة المرور - Password Change Confirmation',
            html: '<div>تم تغيير كلمة المرور بنجاح</div>',
          }),
        });
        console.log('📧 Confirmation email sent');
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }
      
      setSuccess(true);
      
      setTimeout(() => {
        router.push('/admin/login');
      }, 3000);
    } catch (err: any) {
      console.error('❌ Reset password error:', err);
      
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('كلمة المرور القديمة خاطئة - Old password is incorrect');
      } else if (err.code === 'auth/user-not-found') {
        setError('المستخدم غير موجود - User not found');
      } else {
        setError(err.message || 'فشلت إعادة تعيين كلمة المرور - Failed to reset password');
      }
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">تم بنجاح!</h2>
          <p className="text-gray-600 mb-2">تم تغيير كلمة المرور بنجاح</p>
          <p className="text-gray-500 text-sm mb-2">Password changed successfully</p>
          <p className="text-green-600 text-sm mb-4">📧 تم إرسال إيميل تأكيد</p>
          <p className="text-purple-600 text-sm">سيتم تحويلك لصفحة تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500">
      <form onSubmit={handleResetPassword} className="w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
            تغيير كلمة المرور
          </h1>
          <p className="text-gray-600 text-sm">Change Password</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-r-4 border-red-500 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-5">
          <div className="flex items-center justify-between mb-2">
            <div></div>
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition-colors"
            >
              {showPasswords ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                  <span>إخفاء كلمات المرور</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>إظهار كلمات المرور</span>
                </>
              )}
            </button>
          </div>

          <div>
            <label className="text-gray-700 mb-2 font-medium block">البريد الإلكتروني - Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 outline-none"
              placeholder="admin@sabstore.com"
              required
            />
          </div>

          <div>
            <label className="text-gray-700 mb-2 font-medium block">كلمة المرور الحالية - Current Password</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 outline-none"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
              >
                {showPasswords ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="text-gray-700 mb-2 font-medium block">كلمة المرور الجديدة - New Password</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-gray-700 mb-2 font-medium block">تأكيد كلمة المرور - Confirm Password</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور - Change Password'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/admin/login')}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
          >
            العودة لتسجيل الدخول - Back to Login
          </button>
        </div>
      </form>
    </div>
  );
}
