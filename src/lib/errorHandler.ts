/**
 * 🛡️ نظام معالجة الأخطاء الشامل
 * يوفر رسائل خطأ واضحة للمستخدم وتسجيل تفصيلي للأخطاء
 */

import { FirebaseError } from 'firebase/app';

export interface ErrorDetails {
  message: string;          // الرسالة للمستخدم
  technicalMessage: string; // الرسالة التقنية للمطورين
  code: string;             // كود الخطأ
  shouldRetry: boolean;     // هل يجب إعادة المحاولة؟
  userAction?: string;      // ماذا يفعل المستخدم؟
}

/**
 * معالج أخطاء Firebase Storage
 */
export function handleStorageError(error: unknown): ErrorDetails {
  console.error('❌ Storage Error:', error);

  // التحقق من نوع الخطأ
  const errorObj = error as { code?: string; message?: string };

  // أخطاء Firebase المعروفة
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'storage/unauthorized':
        return {
          message: '⚠️ ليس لديك صلاحية لرفع الملفات',
          technicalMessage: 'User does not have permission to access the object',
          code: error.code,
          shouldRetry: false,
          userAction: 'تأكد من تسجيل الدخول كمسؤول',
        };

      case 'storage/canceled':
        return {
          message: '🚫 تم إلغاء عملية الرفع',
          technicalMessage: 'User canceled the upload',
          code: error.code,
          shouldRetry: false,
          userAction: 'حاول مرة أخرى',
        };

      case 'storage/unknown':
        return {
          message: '❌ حدث خطأ غير معروف',
          technicalMessage: error.message || 'Unknown storage error',
          code: error.code,
          shouldRetry: true,
          userAction: 'جرب مرة أخرى أو تواصل مع الدعم الفني',
        };

      case 'storage/object-not-found':
        return {
          message: '📁 الملف المطلوب غير موجود',
          technicalMessage: 'Object does not exist',
          code: error.code,
          shouldRetry: false,
          userAction: 'تأكد من صحة اسم الملف',
        };

      case 'storage/bucket-not-found':
        return {
          message: '⚠️ مشكلة في إعدادات التخزين',
          technicalMessage: 'Storage bucket not configured correctly',
          code: error.code,
          shouldRetry: false,
          userAction: 'تواصل مع الدعم الفني - مشكلة في الإعدادات',
        };

      case 'storage/quota-exceeded':
        return {
          message: '💾 تم تجاوز مساحة التخزين المتاحة',
          technicalMessage: 'Storage quota exceeded',
          code: error.code,
          shouldRetry: false,
          userAction: 'تواصل مع الدعم الفني - المساحة ممتلئة',
        };

      case 'storage/unauthenticated':
        return {
          message: '🔐 يجب تسجيل الدخول أولاً',
          technicalMessage: 'User is not authenticated',
          code: error.code,
          shouldRetry: false,
          userAction: 'سجل دخول وحاول مرة أخرى',
        };

      case 'storage/retry-limit-exceeded':
        return {
          message: '⏱️ انتهت محاولات الرفع',
          technicalMessage: 'Max retry time exceeded',
          code: error.code,
          shouldRetry: false,
          userAction: 'تحقق من اتصال الإنترنت وحاول لاحقاً',
        };

      case 'storage/invalid-checksum':
        return {
          message: '⚠️ الملف تالف أو معطوب',
          technicalMessage: 'File checksum mismatch',
          code: error.code,
          shouldRetry: true,
          userAction: 'جرب رفع ملف آخر',
        };
    }
  }

  // أخطاء CORS
  if (errorObj.message?.includes('CORS') || errorObj.message?.includes('Access-Control')) {
    return {
      message: '🌐 مشكلة في الاتصال بالخادم',
      technicalMessage: 'CORS policy blocked the request',
      code: 'CORS_ERROR',
      shouldRetry: true,
      userAction: 'تحقق من اتصال الإنترنت وحاول مرة أخرى',
    };
  }

  // أخطاء الشبكة
  if (errorObj.message?.includes('network') || errorObj.message?.includes('fetch')) {
    return {
      message: '📡 مشكلة في الاتصال بالإنترنت',
      technicalMessage: 'Network error occurred',
      code: 'NETWORK_ERROR',
      shouldRetry: true,
      userAction: 'تحقق من اتصالك بالإنترنت',
    };
  }

  // أخطاء حجم الملف
  if (errorObj.message?.includes('size') || errorObj.message?.includes('large')) {
    return {
      message: '📦 حجم الملف كبير جداً',
      technicalMessage: 'File size exceeds limit',
      code: 'FILE_TOO_LARGE',
      shouldRetry: false,
      userAction: 'اختر صورة أصغر حجماً (أقل من 5 ميجا)',
    };
  }

  // خطأ افتراضي
  return {
    message: '❌ حدث خطأ أثناء رفع الملف',
    technicalMessage: errorObj.message || 'Unknown error',
    code: 'UNKNOWN_ERROR',
    shouldRetry: true,
    userAction: 'حاول مرة أخرى أو تواصل مع الدعم الفني',
  };
}

/**
 * معالج أخطاء Firestore
 */
export function handleFirestoreError(error: unknown): ErrorDetails {
  console.error('❌ Firestore Error:', error);

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return {
          message: '⚠️ ليس لديك صلاحية لهذه العملية',
          technicalMessage: 'Permission denied',
          code: error.code,
          shouldRetry: false,
          userAction: 'تأكد من صلاحياتك',
        };

      case 'not-found':
        return {
          message: '📄 البيانات المطلوبة غير موجودة',
          technicalMessage: 'Document not found',
          code: error.code,
          shouldRetry: false,
          userAction: 'تحقق من صحة البيانات',
        };

      case 'already-exists':
        return {
          message: '⚠️ البيانات موجودة مسبقاً',
          technicalMessage: 'Document already exists',
          code: error.code,
          shouldRetry: false,
          userAction: 'استخدم اسماً مختلفاً',
        };
    }
  }

  const errorObj = error as { message?: string };

  return {
    message: '❌ حدث خطأ في قاعدة البيانات',
    technicalMessage: errorObj.message || 'Unknown firestore error',
    code: 'FIRESTORE_ERROR',
    shouldRetry: true,
    userAction: 'حاول مرة أخرى',
  };
}

/**
 * تسجيل الأخطاء للمراقبة
 */
export async function logError(error: ErrorDetails, context?: Record<string, unknown>) {
  const errorLog = {
    ...error,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
  };

  console.error('📋 Error Log:', errorLog);

  // يمكن إرسال الأخطاء إلى Firebase Analytics أو خدمة مراقبة
  // await addDoc(collection(firebaseDb, 'errorLogs'), errorLog);
}
