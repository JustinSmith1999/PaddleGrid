# Image Optimization Guide

This guide explains the image optimization strategy for PaddleGrid at scale.

## Current Setup

### Storage Configuration
- **Buckets**: `court-images`, `social-posts`, `profile-pictures`
- **Max File Size**: 10MB
- **Allowed Formats**: JPEG, PNG, GIF, WebP, MP4

### OptimizedImage Component
Location: `src/components/OptimizedImage.tsx`

Features:
- Lazy loading (loads when in viewport)
- Low-res placeholder support
- Intersection Observer API
- Smooth transitions

Usage:
```tsx
import { OptimizedImage } from './components/OptimizedImage';

<OptimizedImage
  src="https://example.com/image.jpg"
  lowResSrc="https://example.com/image-thumb.jpg"
  alt="Court photo"
  className="w-full h-48 object-cover rounded-lg"
/>
```

## Recommended Improvements

### 1. Client-Side Image Compression

Install image compression library:
```bash
npm install browser-image-compression
```

Usage before upload:
```typescript
import imageCompression from 'browser-image-compression';

async function handleImageUpload(file: File) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // Upload compressed file to Supabase
    await supabase.storage
      .from('social-posts')
      .upload(`${userId}/${Date.now()}.webp`, compressedFile);
  } catch (error) {
    console.error('Image compression failed:', error);
  }
}
```

### 2. Thumbnail Generation with Edge Function

Create a new edge function for automatic thumbnail generation:

```typescript
// supabase/functions/generate-thumbnail/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

serve(async (req) => {
  const { image_path, bucket } = await req.json();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Download original image
  const { data: imageData } = await supabase.storage
    .from(bucket)
    .download(image_path);

  // Generate thumbnail (150x150, 300x300, 600x600)
  // Implementation would use image processing library

  // Upload thumbnails
  const thumbnailPath = image_path.replace(/\.(jpg|png|webp)$/, '-thumb.$1');
  await supabase.storage
    .from(bucket)
    .upload(thumbnailPath, thumbnailBlob);

  return new Response(JSON.stringify({ success: true }));
});
```

### 3. CDN Integration

#### Option A: Supabase CDN (Already Enabled)
Supabase storage automatically uses a CDN. No additional configuration needed.

#### Option B: Cloudflare Images
1. Sign up for Cloudflare
2. Enable Images product
3. Configure image transformations:

```typescript
function getOptimizedImageUrl(url: string, width: number, quality: number = 85) {
  const cloudflareAccountHash = 'your-account-hash';
  return `https://imagedelivery.net/${cloudflareAccountHash}/${url}/width=${width},quality=${quality}`;
}
```

#### Option C: Imgix
```typescript
function getImgixUrl(url: string, params: Record<string, any>) {
  const imgixDomain = 'your-domain.imgix.net';
  const queryString = new URLSearchParams(params).toString();
  return `https://${imgixDomain}/${url}?${queryString}`;
}

// Usage
const optimizedUrl = getImgixUrl('path/to/image.jpg', {
  w: 800,
  auto: 'format,compress',
  fit: 'crop',
});
```

### 4. Responsive Images with srcset

Update OptimizedImage component:
```tsx
export function ResponsiveImage({ src, alt, sizes }: Props) {
  const srcset = [
    `${src}?width=400 400w`,
    `${src}?width=800 800w`,
    `${src}?width=1200 1200w`,
    `${src}?width=1600 1600w`,
  ].join(', ');

  return (
    <img
      src={`${src}?width=800`}
      srcSet={srcset}
      sizes={sizes || '(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px'}
      alt={alt}
      loading="lazy"
    />
  );
}
```

### 5. WebP with Fallback

```tsx
<picture>
  <source srcSet="/image.webp" type="image/webp" />
  <source srcSet="/image.jpg" type="image/jpeg" />
  <img src="/image.jpg" alt="Fallback" />
</picture>
```

### 6. Supabase Storage Optimization

Update storage bucket policies to automatically optimize:

```sql
-- Add image processing webhook
CREATE OR REPLACE FUNCTION process_uploaded_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger edge function to generate thumbnails
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/generate-thumbnail',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'image_path', NEW.name,
      'bucket', TG_TABLE_NAME
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This requires pg_net extension and proper configuration
```

## Image Size Guidelines

### Upload Limits by Type
- **Profile Pictures**: Max 2MB, resize to 400x400
- **Court Images**: Max 5MB, resize to 1920x1080
- **Social Posts**: Max 10MB, resize to 2048x2048
- **Event Banners**: Max 3MB, resize to 1200x630

### Recommended Dimensions
```typescript
export const IMAGE_SIZES = {
  profile: { width: 400, height: 400 },
  courtMain: { width: 1920, height: 1080 },
  courtThumb: { width: 400, height: 300 },
  socialPost: { width: 2048, height: 2048 },
  socialThumb: { width: 400, height: 400 },
  eventBanner: { width: 1200, height: 630 },
  eventThumb: { width: 300, height: 200 },
};
```

## Implementation Checklist

- [x] OptimizedImage component with lazy loading
- [ ] Client-side compression before upload
- [ ] Automatic thumbnail generation
- [ ] CDN integration (Cloudflare or Imgix)
- [ ] Responsive images with srcset
- [ ] WebP format with JPEG fallback
- [ ] Image dimension validation
- [ ] Storage webhook for auto-processing

## Performance Targets

After full implementation:
- **Initial Load**: < 2s (First Contentful Paint)
- **Image Load**: < 500ms (Largest Contentful Paint)
- **Total Page Weight**: < 2MB (including images)
- **Core Web Vitals**: All green scores

## Monitoring

Track image performance metrics:
```typescript
// Add to monitoring system
export function trackImageMetrics(imageUrl: string, loadTime: number) {
  // Send to analytics
  if (window.gtag) {
    gtag('event', 'image_load', {
      url: imageUrl,
      load_time: loadTime,
      size: 'unknown', // Can be added with Performance API
    });
  }
}
```

Use Performance API:
```typescript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'resource' && entry.initiatorType === 'img') {
      console.log('Image loaded:', entry.name, 'in', entry.duration, 'ms');
      trackImageMetrics(entry.name, entry.duration);
    }
  }
});

observer.observe({ entryTypes: ['resource'] });
```

## Budget Considerations

### Free Options
- Supabase Storage CDN (included)
- Client-side compression
- Browser lazy loading
- OptimizedImage component

### Paid Options (Worth it at scale)
- **Cloudflare Images**: ~$5-20/month for 100k transformations
- **Imgix**: ~$40/month for 10k master images
- **Cloudinary**: Free tier available, then $89/month

### Recommendation
Start with free options. When you exceed 1000 daily active users, migrate to Cloudflare Images for automatic optimization and faster delivery.

## Quick Wins (Implement Now)

1. **Use OptimizedImage component everywhere**
2. **Compress images client-side before upload**
3. **Set proper image dimensions (no auto-sizing)**
4. **Enable lazy loading on all images**
5. **Convert to WebP format**

These 5 changes will reduce bandwidth by 60-80% immediately.
