/**
 * 🖼️ نظام ضغط الصور التلقائي
 * يقلل حجم الصور مع الحفاظ على جودة مقبولة
 */

export interface CompressionOptions {
  maxSizeMB?: number;           // الحجم الأقصى بالميجابايت (افتراضي: 1MB)
  maxWidthOrHeight?: number;    // أقصى عرض أو ارتفاع (افتراضي: 1920px)
  quality?: number;             // جودة الصورة 0-1 (افتراضي: 0.8)
  useWebWorker?: boolean;       // استخدام Web Worker (افتراضي: true)
}

export interface CompressionResult {
  compressed: File;
  originalSize: number;         // بالبايت
  compressedSize: number;       // بالبايت
  compressionRatio: number;     // نسبة الضغط (%)
  originalDimensions: { width: number; height: number };
  newDimensions: { width: number; height: number };
}

/**
 * الحصول على أبعاد الصورة
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('فشل قراءة أبعاد الصورة'));
    };

    img.src = url;
  });
}

/**
 * حساب أبعاد جديدة مع الحفاظ على النسبة
 */
function calculateNewDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number
): { width: number; height: number } {
  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (originalWidth > originalHeight) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    };
  } else {
    return {
      width: Math.round(maxDimension * aspectRatio),
      height: maxDimension,
    };
  }
}

/**
 * ضغط الصورة باستخدام Canvas
 */
async function compressWithCanvas(
  file: File,
  targetWidth: number,
  targetHeight: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        // إنشاء Canvas
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('فشل إنشاء Canvas context');
        }

        // رسم الصورة مع تقليل الأبعاد
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // تحويل إلى Blob مضغوط
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('فشل ضغط الصورة'));
            }
          },
          file.type || 'image/jpeg',
          quality
        );
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('فشل تحميل الصورة'));
    };

    img.src = url;
  });
}

/**
 * ضغط الصورة بشكل متكرر حتى الوصول للحجم المطلوب
 */
async function compressIteratively(
  file: File,
  originalDimensions: { width: number; height: number },
  options: Required<CompressionOptions>
): Promise<Blob> {
  const { maxSizeMB, maxWidthOrHeight, quality } = options;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // حساب الأبعاد الجديدة
  let { width, height } = calculateNewDimensions(
    originalDimensions.width,
    originalDimensions.height,
    maxWidthOrHeight
  );

  let currentQuality = quality;
  let compressed: Blob;

  // محاولات متعددة مع تقليل الجودة تدريجياً
  for (let attempt = 0; attempt < 5; attempt++) {
    compressed = await compressWithCanvas(file, width, height, currentQuality);

    console.log(
      `🔄 Compression attempt ${attempt + 1}: ${(compressed.size / 1024).toFixed(1)} KB (quality: ${(currentQuality * 100).toFixed(0)}%)`
    );

    // إذا وصلنا للحجم المطلوب
    if (compressed.size <= maxSizeBytes) {
      return compressed;
    }

    // تقليل الجودة للمحاولة التالية
    currentQuality *= 0.8;

    // إذا وصلنا لجودة منخفضة جداً، نقلل الأبعاد
    if (currentQuality < 0.5) {
      width = Math.round(width * 0.9);
      height = Math.round(height * 0.9);
      currentQuality = quality;
    }
  }

  // إذا فشلت كل المحاولات، نعيد آخر نتيجة
  return compressed!;
}

/**
 * ضغط صورة واحدة
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  console.log(`📦 Starting compression for: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    quality = 0.8,
    useWebWorker = false, // معطل حالياً للبساطة
  } = options;

  // التحقق من نوع الملف
  if (!file.type.startsWith('image/')) {
    throw new Error('الملف ليس صورة');
  }

  const originalSize = file.size;

  // إذا كانت الصورة صغيرة بالفعل، لا حاجة للضغط
  if (originalSize <= maxSizeMB * 1024 * 1024) {
    console.log('✅ Image already small enough, no compression needed');
    const dimensions = await getImageDimensions(file);
    return {
      compressed: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      originalDimensions: dimensions,
      newDimensions: dimensions,
    };
  }

  // الحصول على أبعاد الصورة الأصلية
  const originalDimensions = await getImageDimensions(file);
  console.log(`📐 Original dimensions: ${originalDimensions.width}x${originalDimensions.height}`);

  // ضغط الصورة
  const compressedBlob = await compressIteratively(file, originalDimensions, {
    maxSizeMB,
    maxWidthOrHeight,
    quality,
    useWebWorker,
  });

  // تحويل Blob إلى File
  const compressedFile = new File(
    [compressedBlob],
    file.name.replace(/\.[^.]+$/, '.jpg'), // تحويل لـ JPEG
    { type: 'image/jpeg' }
  );

  const compressedSize = compressedFile.size;
  const compressionRatio = ((1 - compressedSize / originalSize) * 100);

  // حساب الأبعاد الجديدة
  const newDimensions = await getImageDimensions(compressedFile);

  console.log(`✅ Compression complete:`);
  console.log(`   Original: ${(originalSize / 1024).toFixed(1)} KB (${originalDimensions.width}x${originalDimensions.height})`);
  console.log(`   Compressed: ${(compressedSize / 1024).toFixed(1)} KB (${newDimensions.width}x${newDimensions.height})`);
  console.log(`   Saved: ${compressionRatio.toFixed(1)}%`);

  return {
    compressed: compressedFile,
    originalSize,
    compressedSize,
    compressionRatio,
    originalDimensions,
    newDimensions,
  };
}

/**
 * ضغط عدة صور
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<CompressionResult[]> {
  console.log(`📦 Starting batch compression: ${files.length} files`);

  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (onProgress) {
      onProgress(i + 1, files.length);
    }

    const result = await compressImage(file, options);
    results.push(result);
  }

  // إحصائيات إجمالية
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalSaved = ((1 - totalCompressedSize / totalOriginalSize) * 100);

  console.log(`\n✅ Batch compression complete:`);
  console.log(`   Total original: ${(totalOriginalSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   Total compressed: ${(totalCompressedSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   Total saved: ${totalSaved.toFixed(1)}%`);

  return results;
}

/**
 * تحويل صورة إلى WebP (أفضل ضغط)
 */
export async function convertToWebP(
  file: File,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('فشل إنشاء Canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            const webpFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.webp'),
              { type: 'image/webp' }
            );
            resolve(webpFile);
          } else {
            reject(new Error('فشل التحويل لـ WebP'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('فشل تحميل الصورة'));
    };

    img.src = url;
  });
}
