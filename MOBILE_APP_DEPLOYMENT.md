# دليل نشر تطبيق React Native / Expo

## خيارات النشر لتطبيقات الموبايل:

### 1. Expo Go (للتجربة السريعة) ✅ الأسهل
```bash
# في مجلد تطبيق الموبايل
npx expo publish
```
- **المميزات:** مجاني، سريع، للتجربة فقط
- **العيوب:** يحتاج Expo Go app على الموبايل
- **الاستخدام:** مثالي للتطوير والاختبار

### 2. Expo Application Services (EAS) 🚀 الموصى به
```bash
# تثبيت EAS CLI
npm install -g eas-cli

# تسجيل الدخول
eas login

# إعداد المشروع
eas build:configure

# بناء للأندرويد
eas build --platform android

# بناء للآيفون
eas build --platform ios

# نشر
eas submit
```
- **المميزات:** 
  - تطبيق standalone حقيقي
  - نشر على Google Play Store & App Store
  - تحديثات OTA
- **التكلفة:** لديه خطة مجانية محدودة

### 3. تحويل إلى Web App (لـ Vercel) 🌐

إذا كنت تريد نسخة ويب من التطبيق على Vercel:

```bash
# في مجلد تطبيق الموبايل
npx expo export:web

# سيُنشئ مجلد web-build
# يمكن نشره على Vercel
```

**ملف vercel.json:**
```json
{
  "buildCommand": "npx expo export:web",
  "outputDirectory": "web-build",
  "devCommand": "npx expo start --web",
  "framework": null
}
```

## 📱 التوصية المثلى:

### للتطوير والاختبار:
- استخدم `expo publish` أو `npx expo start`
- شارك الرابط مع المختبرين عبر Expo Go app

### للإطلاق الرسمي:
- استخدم **EAS Build** لبناء التطبيق
- انشر على **Google Play Store** (Android)
- انشر على **App Store** (iOS)

### للنسخة الويب (اختياري):
- استخدم `expo export:web`
- انشر على **Vercel** أو **Netlify**

## 🔗 روابط مفيدة:

- [Expo Publishing Docs](https://docs.expo.dev/workflow/publishing/)
- [EAS Build Guide](https://docs.expo.dev/build/introduction/)
- [Expo Web Support](https://docs.expo.dev/workflow/web/)

## ⚠️ ملاحظة مهمة:

تطبيق React Native Expo الحالي لديك على `localhost:8081` هو:
- تطبيق موبايل (يعمل على iOS/Android)
- لا يمكن نشره على Vercel كما هو
- تحتاج إما:
  1. بناؤه كـ APK/IPA للموبايل (EAS)
  2. أو تحويله لـ Web App (expo export:web)

## 🎯 الخطوات التالية:

1. حدد هدفك: موبايل app أم web app؟
2. إذا موبايل → استخدم EAS Build
3. إذا ويب → استخدم expo export:web ثم Vercel
