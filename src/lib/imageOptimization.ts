import imageCompression from 'browser-image-compression';

export const IMAGE_SIZES = {
  profile: { width: 400, height: 400, maxSizeMB: 0.5 },
  courtMain: { width: 1920, height: 1080, maxSizeMB: 2 },
  courtThumb: { width: 400, height: 300, maxSizeMB: 0.2 },
  socialPost: { width: 2048, height: 2048, maxSizeMB: 3 },
  socialThumb: { width: 400, height: 400, maxSizeMB: 0.2 },
  eventBanner: { width: 1200, height: 630, maxSizeMB: 1 },
  eventThumb: { width: 300, height: 200, maxSizeMB: 0.1 },
};

export type ImageType = keyof typeof IMAGE_SIZES;

export async function compressImage(
  file: File,
  type: ImageType = 'socialPost'
): Promise<File> {
  const config = IMAGE_SIZES[type];

  const options = {
    maxSizeMB: config.maxSizeMB,
    maxWidthOrHeight: Math.max(config.width, config.height),
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.85,
  };

  try {
    const compressedFile = await imageCompression(file, options);

    const webpFile = new File([compressedFile], file.name.replace(/\.(jpg|jpeg|png)$/i, '.webp'), {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    return webpFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    return file;
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.',
    };
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 10MB.',
    };
  }

  return { valid: true };
}

export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas to Blob conversion failed'));
        }
      }, 'image/webp', 0.85);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function generateThumbnail(file: File, size: number = 400): Promise<Blob> {
  return resizeImage(file, size, size);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export async function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

export function isWebPSupported(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}
