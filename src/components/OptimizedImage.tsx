import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  lowResSrc?: string;
  className?: string;
  loadingClassName?: string;
}

export function OptimizedImage({
  src,
  alt,
  lowResSrc,
  className = '',
  loadingClassName = 'blur-sm',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const currentSrc = isInView ? src : lowResSrc || src;

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={`${className} ${!isLoaded && lowResSrc ? loadingClassName : ''} transition-all duration-300`}
      onLoad={() => setIsLoaded(true)}
      loading="lazy"
      {...props}
    />
  );
}
