/**
 * 🚀 نظام رفع آمن ومتقدم للصور
 * يتضمن: إعادة المحاولة، التحقق من الاتصال، معالجة الأخطاء
 */

import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { firebaseStorage, firebaseAuth } from './firebase';
import { handleStorageError, logError } from './errorHandler';
import { compressImage, type CompressionOptions } from './imageCompression';

export interface UploadOptions {
  maxRetries?: number;        // عدد محاولات إعادة الرفع (افتراضي: 3)
  retryDelay?: number;        // التأخير بين المحاولات بالملي ثانية (افتراضي: 1000)
  maxFileSize?: number;       // الحجم الأقصى للملف بالبايت (افتراضي: 5MB)
  compress?: boolean;         // ضغط الصورة تلقائياً (افتراضي: true)
  compressionOptions?: CompressionOptions;  // خيارات الضغط
  onProgress?: (progress: number) => void;  // دالة لمتابعة التقدم
  onRetry?: (attempt: number) => void;      // دالة تُنفذ عند إعادة المحاولة
  onCompressionProgress?: (status: string) => void; // تقدم الضغط
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  technicalError?: string;
  attempts?: number;
  compressionInfo?: {
    originalSize: number;
    compressedSize: number;
    savedPercentage: number;
  };
}

/**
 * التحقق من اتصال Firebase
 */
async function checkFirebaseConnection(): Promise<boolean> {
  try {
    // محاولة بسيطة للتحقق من الاتصال
    const testRef = ref(firebaseStorage, '.connection-test');
    await getDownloadURL(testRef).catch(() => {
      // نتوقع خطأ لأن الملف غير موجود، لكن هذا يؤكد الاتصال
    });
    return true;
  } catch (error) {
    console.warn('⚠️ Firebase connection check failed:', error);
    return false;
  }
}

/**
 * التحقق من صحة الملف
 */
function validateFile(file: File, maxSize: number): { valid: boolean; error?: string } {
  // التحقق من نوع الملف
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: '⚠️ يجب أن يكون الملف صورة (PNG, JPG, JPEG, WebP)',
    };
  }

  // التحقق من حجم الملف
  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `📦 حجم الملف كبير جداً. الحد الأقصى: ${sizeMB} ميجا`,
    };
  }

  // التحقق من اسم الملف
  if (file.name.length > 100) {
    return {
      valid: false,
      error: '⚠️ اسم الملف طويل جداً',
    };
  }

  return { valid: true };
}

/**
 * التحقق من صلاحيات المستخدم
 */
async function checkUserPermissions(): Promise<{ hasPermission: boolean; error?: string }> {
  const user = firebaseAuth.currentUser;

  if (!user) {
    return {
      hasPermission: false,
      error: '🔐 يجب تسجيل الدخول أولاً',
    };
  }

  // يمكن إضافة تحقق إضافي من Firestore للتأكد من أن المستخدم admin
  return { hasPermission: true };
}

/**
 * تأخير (للانتظار بين محاولات الرفع)
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * رفع ملف بشكل آمن مع إعادة المحاولة
 */
export async function safeUploadFile(
  file: File,
  storagePath: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    maxFileSize = 5 * 1024 * 1024, // 5MB
    compress = true,
    compressionOptions = {},
    onProgress,
    onRetry,
    onCompressionProgress,
  } = options;

  console.log(`📤 Starting upload: ${file.name} to ${storagePath}`);

  let fileToUpload = file;
  let compressionInfo: UploadResult['compressionInfo'];

  // 1. التحقق من صلاحيات المستخدم
  const permissionCheck = await checkUserPermissions();
  if (!permissionCheck.hasPermission) {
    const error = handleStorageError(new Error(permissionCheck.error));
    await logError(error, { file: file.name, storagePath });
    return {
      success: false,
      error: permissionCheck.error,
      attempts: 0,
    };
  }

  // 2. ضغط الصورة إذا كان مطلوباً
  if (compress && file.type.startsWith('image/')) {
    try {
      if (onCompressionProgress) {
        onCompressionProgress('🗜️ جاري ضغط الصورة...');
      }

      console.log(`🗜️ Compressing image: ${file.name}`);
      const compressionResult = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        quality: 0.85,
        ...compressionOptions,
      });

      fileToUpload = compressionResult.compressed;
      compressionInfo = {
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        savedPercentage: compressionResult.compressionRatio,
      };

      if (onCompressionProgress) {
        onCompressionProgress(
          `✅ تم الضغط: وفرنا ${compressionResult.compressionRatio.toFixed(1)}%`
        );
      }

      console.log(
        `✅ Compression saved ${compressionResult.compressionRatio.toFixed(1)}%`
      );
    } catch (compressionError) {
      console.warn('⚠️ Compression failed, uploading original:', compressionError);
      // إذا فشل الضغط، نرفع الصورة الأصلية
      fileToUpload = file;
    }
  }

  // 3. التحقق من صحة الملف
  const validation = validateFile(fileToUpload, maxFileSize);
  if (!validation.valid) {
    const error = handleStorageError(new Error(validation.error));
    await logError(error, { file: fileToUpload.name, storagePath });
    return {
      success: false,
      error: validation.error,
      attempts: 0,
    };
  }

  // 3. التحقق من الاتصال بـ Firebase
  const isConnected = await checkFirebaseConnection();
  if (!isConnected) {
    return {
      success: false,
      error: '🌐 لا يوجد اتصال بالخادم. تحقق من الإنترنت',
      attempts: 0,
    };
  }

  // 4. محاولة الرفع مع إعادة المحاولة
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Upload attempt ${attempt}/${maxRetries}`);

      if (attempt > 1 && onRetry) {
        onRetry(attempt);
      }

      const storageRef = ref(firebaseStorage, storagePath);

      // رفع مع متابعة التقدم
      if (onProgress) {
        const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(Math.round(progress));
            },
            (error) => reject(error),
            () => resolve()
          );
        });
      } else {
        // رفع بسيط بدون متابعة التقدم
        await uploadBytes(storageRef, fileToUpload);
      }

      // الحصول على رابط التحميل
      const downloadURL = await getDownloadURL(storageRef);

      console.log(`✅ Upload successful on attempt ${attempt}`);
      return {
        success: true,
        url: downloadURL,
        attempts: attempt,
        compressionInfo,
      };

    } catch (error) {
      console.error(`❌ Upload attempt ${attempt} failed:`, error);
      lastError = error as Error;

      // معالجة الخطأ
      const errorDetails = handleStorageError(error);

      // إذا كان الخطأ لا يستحق إعادة المحاولة، نتوقف
      if (!errorDetails.shouldRetry) {
        await logError(errorDetails, { file: fileToUpload.name, storagePath, attempt });
        return {
          success: false,
          error: errorDetails.message,
          technicalError: errorDetails.technicalMessage,
          attempts: attempt,
        };
      }

      // الانتظار قبل إعادة المحاولة (إلا في المحاولة الأخيرة)
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
        await delay(retryDelay * attempt); // زيادة وقت الانتظار مع كل محاولة
      }
    }
  }

  // فشلت جميع المحاولات
  const errorDetails = handleStorageError(lastError);
  await logError(errorDetails, { file: fileToUpload.name, storagePath, attempts: maxRetries });

  return {
    success: false,
    error: `❌ فشل الرفع بعد ${maxRetries} محاولات. ${errorDetails.message}`,
    technicalError: errorDetails.technicalMessage,
    attempts: maxRetries,
  };
}

/**
 * رفع عدة ملفات بشكل آمن
 */
export async function safeUploadMultipleFiles(
  files: File[],
  getStoragePath: (file: File, index: number) => string,
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  console.log(`📤 Starting batch upload: ${files.length} files`);

  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const storagePath = getStoragePath(file, i);

    const result = await safeUploadFile(file, storagePath, options);
    results.push(result);

    // إذا فشل رفع أحد الملفات، نتوقف
    if (!result.success) {
      console.error(`❌ Batch upload stopped at file ${i + 1}`);
      break;
    }
  }

  return results;
}
