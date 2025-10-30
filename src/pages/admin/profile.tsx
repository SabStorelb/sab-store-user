import { useEffect, useState } from 'react';
import { firebaseDb, firebaseStorage } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role: string;
  permissions: string[];
  createdAt: any;
  lastLogin?: any;
  phone?: string;
  bio?: string;
}

export default function AdminProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'permissions' | 'activity'>('info');
  
  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      // الحصول على معلومات الأدمن من Session
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      
      if (!session.user) {
        router.push('/admin/login');
        return;
      }

      const docRef = doc(firebaseDb, 'users', session.user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as AdminProfile;
        setProfile(data);
        setName(data.name || '');
        setPhone(data.phone || '');
        setBio(data.bio || '');
        setPhotoPreview(data.photoURL || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleUpdateProfile() {
    if (!profile) return;
    
    setSaving(true);
    try {
      let photoURL = profile.photoURL;

      // رفع الصورة إذا تم اختيار صورة جديدة
      if (photoFile) {
        const storageRef = ref(firebaseStorage, `admins/${profile.id}/profile.jpg`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      // تحديث البيانات
      const docRef = doc(firebaseDb, 'users', profile.id);
      await updateDoc(docRef, {
        name,
        phone,
        bio,
        photoURL,
        updatedAt: new Date(),
      });

      alert('تم تحديث الملف الشخصي بنجاح! ✅');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('حدث خطأ أثناء التحديث ❌');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      alert('كلمة المرور الجديدة غير متطابقة!');
      return;
    }

    if (newPassword.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل!');
      return;
    }

    // هنا يمكن إضافة منطق تغيير كلمة المرور عبر Firebase Auth
    alert('ميزة تغيير كلمة المرور قيد التطوير 🔧');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">لم يتم العثور على الملف الشخصي</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300"
          >
            عودة | Back
          </button>
          <h1 className="text-3xl font-bold">الملف الشخصي | Profile</h1>
        </div>
        <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
          لوحة التحكم
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="flex items-center gap-6 mb-8">
          {/* صورة الملف الشخصي */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>

          {/* معلومات أساسية */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">{profile.name}</h2>
            <p className="text-gray-600">{profile.email}</p>
            <div className="flex gap-3 mt-3">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                {profile.role || 'Admin'}
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                ✅ نشط
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            {[
              { key: 'info', label: 'المعلومات الشخصية', icon: '👤' },
              { key: 'security', label: 'الأمان', icon: '🔒' },
              { key: 'permissions', label: 'الصلاحيات', icon: '🔑' },
              { key: 'activity', label: 'النشاط', icon: '📊' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-3 px-4 font-bold transition-all ${
                  activeTab === tab.key
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">تعديل المعلومات الشخصية</h3>
            
            <div>
              <label className="block text-sm font-bold mb-2">الاسم | Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل الاسم"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">رقم الهاتف | Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="+961 XX XXX XXX"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">البريد الإلكتروني | Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">لا يمكن تعديل البريد الإلكتروني</p>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">نبذة عني | Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="اكتب نبذة عنك..."
              />
            </div>

            <button
              onClick={handleUpdateProfile}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {saving ? 'جاري الحفظ...' : '💾 حفظ التغييرات'}
            </button>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">تغيير كلمة المرور</h3>

            <div>
              <label className="block text-sm font-bold mb-2">كلمة المرور الحالية</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">كلمة المرور الجديدة</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">تأكيد كلمة المرور</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              onClick={handleChangePassword}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition"
            >
              🔒 تغيير كلمة المرور
            </button>

            <hr className="my-6" />

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-bold text-yellow-800 mb-2">🔐 المصادقة الثنائية (2FA)</h4>
              <p className="text-sm text-yellow-700 mb-3">حماية إضافية لحسابك</p>
              <button className="bg-yellow-600 text-white px-4 py-2 rounded font-bold hover:bg-yellow-700">
                تفعيل المصادقة الثنائية
              </button>
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div>
            <h3 className="text-xl font-bold mb-4">الصلاحيات الممنوحة</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(profile.permissions || ['all']).map((permission, idx) => (
                <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <span className="font-bold text-green-800">{permission}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            <h3 className="text-xl font-bold mb-4">آخر الأنشطة</h3>
            <div className="space-y-3">
              {[
                { action: 'تسجيل الدخول', time: 'منذ ساعة', icon: '🔑' },
                { action: 'تعديل منتج #123', time: 'منذ ساعتين', icon: '✏️' },
                { action: 'إضافة عميل جديد', time: 'منذ 3 ساعات', icon: '👤' },
                { action: 'معالجة طلب #456', time: 'منذ 5 ساعات', icon: '📦' },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold">{activity.action}</div>
                    <div className="text-sm text-gray-500">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
