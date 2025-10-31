import { useState } from 'react';
import { firebaseAuth, firebaseDb } from '../../lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: code & new password
  const [resetSuccess, setResetSuccess] = useState(false);
  const router = useRouter();

  // Translate Firebase errors to Arabic
  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'البريد الإلكتروني غير صحيح - Invalid email address';
      case 'auth/user-disabled':
        return 'تم تعطيل هذا الحساب - Account disabled';
      case 'auth/user-not-found':
        return 'المستخدم غير موجود - User not found';
      case 'auth/wrong-password':
        return 'كلمة المرور خاطئة - Wrong password';
      case 'auth/invalid-credential':
        return 'بيانات الدخول غير صحيحة - Invalid credentials';
      case 'auth/too-many-requests':
        return 'محاولات كثيرة، حاول لاحقاً - Too many attempts, try later';
      case 'auth/network-request-failed':
        return 'خطأ في الاتصال - Network error';
      default:
        return 'خطأ في تسجيل الدخول - Login failed';
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userCred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      console.log('signed in firebase user:', userCred.user.uid);
      const idToken = await userCred.user.getIdToken();
      console.log('got idToken length=', idToken?.length);

      // send idToken to server to create httpOnly session cookie
      const resp = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!resp.ok) {
        // try to read json or text for more info
        let bodyText = '';
        try {
          const json = await resp.json();
          bodyText = JSON.stringify(json);
        } catch (e) {
          bodyText = await resp.text();
        }
        console.error('session creation failed', resp.status, bodyText);
        throw new Error(`فشل إنشاء الجلسة - Session creation failed`);
      }

      // success
      console.log('session cookie created, redirecting to dashboard');
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('login error', err);
      const errorCode = err?.code || '';
      setError(getErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowResetModal(true);
    setResetEmail(email);
    setResetStep(1);
    setError(null);
  };

  const handleSendResetEmail = async () => {
    if (!resetEmail) {
      setError('الرجاء إدخال البريد الإلكتروني - Please enter email');
      return;
    }

    try {
      setLoading(true);
      
      // First, check if this email belongs to an admin
      // We need to use the API to check server-side
      const checkResponse = await fetch('/api/auth/check-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const checkData = await checkResponse.json();

      if (!checkData.isAdmin) {
        setError('هذا البريد الإلكتروني غير مسجل كمدير - This email is not registered as admin');
        setLoading(false);
        return;
      }

      // If admin, send password reset email with action code settings
      const actionCodeSettings = {
        url: 'https://admin.sab-store.com/admin/login',
        handleCodeInApp: false,
      };
      
      await sendPasswordResetEmail(firebaseAuth, resetEmail, actionCodeSettings);
      setResetStep(2);
      setError(null);
      setLoading(false);
    } catch (err: any) {
      setError('فشل إرسال رابط إعادة التعيين - Failed to send reset link');
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
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

    setResetSuccess(true);
    setError(null);
    
    setTimeout(() => {
      setShowResetModal(false);
      setResetSuccess(false);
      setResetStep(1);
      setResetEmail('');
      setNewPassword('');
      setConfirmPassword('');
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <form onSubmit={submit} className="w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl relative z-10 animate-fade-in">
        {/* Logo and Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl blur-lg opacity-50"></div>
            <img 
              src="/sab-logo.png" 
              alt="SAB Store Logo" 
              className="relative w-24 h-24 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300" 
            />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
            Admin Login
          </h2>
          <p className="text-gray-500 text-sm">تسجيل دخول الإدارة</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Email Input */}
        <label className="block mb-5">
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            <span>البريد الإلكتروني - Email</span>
          </div>
          <div className="relative">
            <input 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 outline-none"
              placeholder="admin@sabstore.com"
              required
            />
          </div>
        </label>

        {/* Password Input */}
        <label className="block mb-6">
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>كلمة المرور - Password</span>
          </div>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 pl-12 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 outline-none"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors duration-200 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
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
        </label>

        {/* Forgot Password Link */}
        <div className="text-right mb-6">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-purple-600 hover:text-purple-800 underline transition-colors duration-200 font-medium"
          >
            نسيت كلمة المرور؟ - Forgot Password?
          </button>
        </div>

        {/* Submit Button */}
        <button 
          disabled={loading} 
          type="submit" 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>جاري تسجيل الدخول...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>تسجيل الدخول - Sign in</span>
            </>
          )}
        </button>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 صفحة آمنة - Secure Page</p>
        </div>
      </form>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowResetModal(false)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                إعادة تعيين كلمة المرور
              </h2>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {resetSuccess ? (
              /* Success Message */
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">تم إرسال رابط التعيين!</h3>
                <p className="text-gray-600 text-sm">
                  تحقق من بريدك الإلكتروني واتبع التعليمات لإعادة تعيين كلمة المرور
                </p>
              </div>
            ) : resetStep === 1 ? (
              /* Step 1: Email Input */
              <div>
                <p className="text-gray-600 mb-6 text-sm">
                  أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
                </p>
                
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    البريد الإلكتروني - Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                    placeholder="admin@sabstore.com"
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleSendResetEmail}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  إرسال رابط إعادة التعيين
                </button>
              </div>
            ) : (
              /* Step 2: Success - Email Sent */
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">تحقق من بريدك الإلكتروني</h3>
                <p className="text-gray-600 text-sm mb-4">
                  تم إرسال رابط إعادة التعيين إلى<br />
                  <span className="font-semibold text-purple-600">{resetEmail}</span>
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  الرابط صالح لمدة ساعة واحدة
                </p>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="text-purple-600 hover:text-purple-800 font-semibold"
                >
                  حسناً، فهمت
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
