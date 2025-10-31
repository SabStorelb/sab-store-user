import { useEffect, useState } from 'react';
import { firebaseDb, firebaseStorage } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProtectedPage from '../../components/ProtectedPage';
import { useAdminPermissions } from '../../lib/useAdminPermissions';

interface StoreSettings {
  storeName: { en: string; ar: string };
  storeDescription: { en: string; ar: string };
  logo: string;
  favicon: string;
  currency: string;
  taxRate: number;
  shippingFee: number;
  freeShippingThreshold: number;
  contactEmail: string;
  contactPhone: string;
  address: { en: string; ar: string };
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
  };
  paymentMethods: {
    cashOnDelivery: boolean;
    creditCard: boolean;
    bankTransfer: boolean;
  };
}

export default function StoreSettings() {
  const router = useRouter();
  const { isSuperAdmin, loading: permissionsLoading } = useAdminPermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: { en: 'Sab Store', ar: 'متجر ساب' },
    storeDescription: { en: '', ar: '' },
    logo: '',
    favicon: '',
    currency: 'LBP',
    taxRate: 0,
    shippingFee: 0,
    freeShippingThreshold: 0,
    contactEmail: '',
    contactPhone: '',
    address: { en: '', ar: '' },
    socialMedia: {},
    paymentMethods: {
      cashOnDelivery: true,
      creditCard: false,
      bankTransfer: false,
    },
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  // حماية الصفحة - فقط Super Admin
  useEffect(() => {
    if (!permissionsLoading && !isSuperAdmin) {
      alert('⛔ هذه الصفحة مخصصة لـ Super Admin فقط!');
      router.push('/admin/dashboard');
    }
  }, [permissionsLoading, isSuperAdmin, router]);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const docRef = doc(firebaseDb, 'settings', 'store');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSettings({ ...settings, ...docSnap.data() });
        setLogoPreview(docSnap.data().logo || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSaveSettings() {
    // حماية: فقط Super Admin يمكنه الحفظ
    if (!isSuperAdmin) {
      alert('⛔ عذراً! فقط Super Admin يمكنه حفظ إعدادات المتجر.');
      return;
    }

    setSaving(true);
    try {
      let logoURL = settings.logo;

      // رفع الشعار إذا تم اختيار صورة جديدة
      if (logoFile) {
        const storageRef = ref(firebaseStorage, `store/logo.png`);
        await uploadBytes(storageRef, logoFile);
        logoURL = await getDownloadURL(storageRef);
      }

      // حفظ الإعدادات
      const docRef = doc(firebaseDb, 'settings', 'store');
      await setDoc(docRef, {
        ...settings,
        logo: logoURL,
        updatedAt: new Date(),
      });

      alert('تم حفظ الإعدادات بنجاح! ✅');
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ أثناء الحفظ ❌');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* تحذير لغير Super Admin */}
      {!isSuperAdmin && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ⛔ <strong>تنبيه:</strong> هذه الصفحة مخصصة لـ Super Admin فقط. لا يمكنك حفظ التغييرات.
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300"
          >
            عودة | Back
          </button>
          <h1 className="text-3xl font-bold">إعدادات المتجر | Store Settings</h1>
        </div>
        <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
          لوحة التحكم
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* معلومات أساسية */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🏪 معلومات المتجر
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">اسم المتجر (عربي)</label>
              <input
                type="text"
                value={settings.storeName.ar}
                onChange={(e) => setSettings({ ...settings, storeName: { ...settings.storeName, ar: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="متجر ساب"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Store Name (English)</label>
              <input
                type="text"
                value={settings.storeName.en}
                onChange={(e) => setSettings({ ...settings, storeName: { ...settings.storeName, en: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Sab Store"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">الوصف (عربي)</label>
              <textarea
                value={settings.storeDescription.ar}
                onChange={(e) => setSettings({ ...settings, storeDescription: { ...settings.storeDescription, ar: e.target.value } })}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="وصف المتجر بالعربي"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Description (English)</label>
              <textarea
                value={settings.storeDescription.en}
                onChange={(e) => setSettings({ ...settings, storeDescription: { ...settings.storeDescription, en: e.target.value } })}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Store description in English"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">الشعار | Logo</label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <img src={logoPreview} alt="Logo" className="w-20 h-20 object-contain border rounded" />
                )}
                <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  اختر صورة
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* معلومات الاتصال */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            📞 معلومات الاتصال
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="info@sabstore.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">رقم الهاتف</label>
              <input
                type="tel"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="+961 XX XXX XXX"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">العنوان (عربي)</label>
              <input
                type="text"
                value={settings.address.ar}
                onChange={(e) => setSettings({ ...settings, address: { ...settings.address, ar: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="بيروت، لبنان"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Address (English)</label>
              <input
                type="text"
                value={settings.address.en}
                onChange={(e) => setSettings({ ...settings, address: { ...settings.address, en: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Beirut, Lebanon"
              />
            </div>
          </div>
        </div>

        {/* الأسعار والضرائب */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            💰 الأسعار والضرائب
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">العملة | Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="LBP">ليرة لبنانية (LBP)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="EUR">يورو (EUR)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">نسبة الضريبة (%) | Tax Rate</label>
              <input
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="0"
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">رسوم الشحن | Shipping Fee</label>
              <input
                type="number"
                value={settings.shippingFee}
                onChange={(e) => setSettings({ ...settings, shippingFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">الحد الأدنى للشحن المجاني</label>
              <input
                type="number"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* وسائل التواصل */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            📱 وسائل التواصل الاجتماعي
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Facebook</label>
              <input
                type="url"
                value={settings.socialMedia.facebook || ''}
                onChange={(e) => setSettings({ ...settings, socialMedia: { ...settings.socialMedia, facebook: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="https://facebook.com/sabstore"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Instagram</label>
              <input
                type="url"
                value={settings.socialMedia.instagram || ''}
                onChange={(e) => setSettings({ ...settings, socialMedia: { ...settings.socialMedia, instagram: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="https://instagram.com/sabstore"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">WhatsApp</label>
              <input
                type="tel"
                value={settings.socialMedia.whatsapp || ''}
                onChange={(e) => setSettings({ ...settings, socialMedia: { ...settings.socialMedia, whatsapp: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="+961 XX XXX XXX"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Twitter</label>
              <input
                type="url"
                value={settings.socialMedia.twitter || ''}
                onChange={(e) => setSettings({ ...settings, socialMedia: { ...settings.socialMedia, twitter: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="https://twitter.com/sabstore"
              />
            </div>
          </div>
        </div>

        {/* طرق الدفع */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            💳 طرق الدفع المتاحة
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={settings.paymentMethods.cashOnDelivery}
                onChange={(e) => setSettings({
                  ...settings,
                  paymentMethods: { ...settings.paymentMethods, cashOnDelivery: e.target.checked }
                })}
                className="w-5 h-5"
              />
              <div>
                <div className="font-bold">الدفع عند الاستلام</div>
                <div className="text-sm text-gray-500">Cash on Delivery</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={settings.paymentMethods.creditCard}
                onChange={(e) => setSettings({
                  ...settings,
                  paymentMethods: { ...settings.paymentMethods, creditCard: e.target.checked }
                })}
                className="w-5 h-5"
              />
              <div>
                <div className="font-bold">بطاقة الائتمان</div>
                <div className="text-sm text-gray-500">Credit Card</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={settings.paymentMethods.bankTransfer}
                onChange={(e) => setSettings({
                  ...settings,
                  paymentMethods: { ...settings.paymentMethods, bankTransfer: e.target.checked }
                })}
                className="w-5 h-5"
              />
              <div>
                <div className="font-bold">تحويل بنكي</div>
                <div className="text-sm text-gray-500">Bank Transfer</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving || !isSuperAdmin}
          className={`px-8 py-3 rounded-lg font-bold transition text-lg ${
            isSuperAdmin 
              ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={!isSuperAdmin ? 'فقط Super Admin يمكنه حفظ الإعدادات' : ''}
        >
          {saving ? 'جاري الحفظ...' : '💾 حفظ جميع الإعدادات'}
        </button>
      </div>
    </div>
  );
}
