import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  lowResSrc?: string;
  className?: string;
  loadingClassName?: string;
  fallback?: React.ReactNode;
  showPlaceholder?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  lowResSrc,
  className = '',
  loadingClassName = 'blur-sm',
  fallback,
  showPlaceholder = true,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Reset error state if src changes
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showPlaceholder) {
      return (
        <div className={`${className} flex items-center justify-center bg-slate-100 dark:bg-slate-800`}>
          <ImageOff className="w-8 h-8 text-slate-400" />
        </div>
      );
    }

    return null;
  }

  const currentSrc = isInView ? src : (lowResSrc || '');

  return (
    <div className="relative">
      {!isLoaded && showPlaceholder && (
        <div className={`absolute inset-0 bg-slate-200 dark:bg-slate-800 skeleton`} />
      )}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`${className} ${!isLoaded ? loadingClassName : ''} transition-all duration-300`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </div>
  );
}
