# إعداد إرسال البريد الإلكتروني 📧

## الخطوات المطلوبة:

### 1. تثبيت الحزم المطلوبة
```bash
npm install
```

### 2. إعداد ملف `.env.local`

أنشئ ملف `.env.local` في جذر المشروع وأضف المتغيرات التالية:

```env
# SMTP Email Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### 3. إعداد Gmail (خيار مُوصى به)

#### أ. تفعيل التحقق بخطوتين:
1. اذهب إلى [حسابك في Google](https://myaccount.google.com/)
2. اختر "الأمان" من القائمة اليمنى
3. فعّل "التحقق بخطوتين"

#### ب. إنشاء كلمة مرور التطبيق (App Password):
1. في صفحة الأمان، ابحث عن "كلمات مرور التطبيقات"
2. اختر "تطبيق آخر" وسمّه "SAB Store"
3. انسخ كلمة المرور المكونة من 16 حرف
4. استخدمها في `SMTP_PASS`

### 4. خيارات SMTP أخرى

#### SendGrid (مجاني حتى 100 بريد/يوم):
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun:
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

#### Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### 5. اختبار الإعداد

بعد الإعداد، جرب:
1. تحديث حالة طلب
2. الرد على رسالة دعم
3. تحقق من البريد الإلكتروني للعميل

### ملاحظات مهمة:
- ✅ لا تشارك ملف `.env.local` مع أحد
- ✅ أضف `.env.local` إلى `.gitignore`
- ✅ استخدم App Password لـ Gmail وليس كلمة المرور العادية
- ✅ تأكد من تفعيل "السماح للتطبيقات الأقل أماناً" إذا لزم الأمر

### استكشاف الأخطاء:

**خطأ: "Invalid login"**
- تأكد من استخدام App Password وليس كلمة المرور العادية
- تأكد من تفعيل التحقق بخطوتين

**خطأ: "Connection timeout"**
- تحقق من PORT و HOST
- قد يكون جدار الحماية يحجب SMTP

**خطأ: "535 Authentication failed"**
- كلمة المرور خاطئة
- جرب إنشاء App Password جديد
