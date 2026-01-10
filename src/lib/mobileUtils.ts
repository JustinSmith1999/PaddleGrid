import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Haptic feedback utilities
export const haptics = {
  light: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Haptics not available (web browser)
    }
  },

  medium: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      // Haptics not available
    }
  },

  heavy: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      // Haptics not available
    }
  },

  selection: async () => {
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch (e) {
      // Haptics not available
    }
  },

  success: async () => {
    try {
      await Haptics.notification({ type: 'SUCCESS' });
    } catch (e) {
      // Haptics not available
    }
  },

  warning: async () => {
    try {
      await Haptics.notification({ type: 'WARNING' });
    } catch (e) {
      // Haptics not available
    }
  },

  error: async () => {
    try {
      await Haptics.notification({ type: 'ERROR' });
    } catch (e) {
      // Haptics not available
    }
  }
};

// Swipe detection
interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useSwipeGesture(handlers: SwipeHandlers) {
  const threshold = handlers.threshold || 50;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Horizontal swipe
    if (absDeltaX > absDeltaY && absDeltaX > threshold) {
      if (deltaX > 0 && handlers.onSwipeRight) {
        handlers.onSwipeRight();
      } else if (deltaX < 0 && handlers.onSwipeLeft) {
        handlers.onSwipeLeft();
      }
    }

    // Vertical swipe
    if (absDeltaY > absDeltaX && absDeltaY > threshold) {
      if (deltaY > 0 && handlers.onSwipeDown) {
        handlers.onSwipeDown();
      } else if (deltaY < 0 && handlers.onSwipeUp) {
        handlers.onSwipeUp();
      }
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
}

// Pull to refresh
export interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export class PullToRefresh {
  private startY = 0;
  private currentY = 0;
  private pulling = false;
  private threshold: number;
  private resistance: number;
  private onRefresh: () => Promise<void>;
  private element: HTMLElement;
  private indicator: HTMLElement | null = null;

  constructor(element: HTMLElement, options: PullToRefreshOptions) {
    this.element = element;
    this.threshold = options.threshold || 80;
    this.resistance = options.resistance || 2.5;
    this.onRefresh = options.onRefresh;

    this.init();
  }

  private init() {
    this.element.addEventListener('touchstart', this.handleTouchStart);
    this.element.addEventListener('touchmove', this.handleTouchMove);
    this.element.addEventListener('touchend', this.handleTouchEnd);
  }

  private handleTouchStart = (e: TouchEvent) => {
    if (this.element.scrollTop === 0) {
      this.startY = e.touches[0].clientY;
      this.pulling = true;
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.pulling) return;

    this.currentY = e.touches[0].clientY;
    const diff = (this.currentY - this.startY) / this.resistance;

    if (diff > 0) {
      e.preventDefault();
      this.updateIndicator(diff);
    }
  };

  private handleTouchEnd = async () => {
    if (!this.pulling) return;

    const diff = (this.currentY - this.startY) / this.resistance;

    if (diff > this.threshold) {
      await this.triggerRefresh();
    }

    this.resetIndicator();
    this.pulling = false;
  };

  private updateIndicator(distance: number) {
    // Visual feedback can be implemented here
    if (this.indicator) {
      this.indicator.style.transform = `translateY(${distance}px)`;
      this.indicator.style.opacity = String(Math.min(distance / this.threshold, 1));
    }
  }

  private async triggerRefresh() {
    haptics.medium();
    await this.onRefresh();
    haptics.light();
  }

  private resetIndicator() {
    if (this.indicator) {
      this.indicator.style.transform = 'translateY(0)';
      this.indicator.style.opacity = '0';
    }
  }

  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
  }
}

// Smooth scroll utilities
export const smoothScroll = {
  toTop: (element?: HTMLElement) => {
    const target = element || window;
    if (target instanceof Window) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      target.scrollTo({ top: 0, behavior: 'smooth' });
    }
    haptics.light();
  },

  toElement: (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      haptics.light();
    }
  }
};

// Long press detection
export function useLongPress(callback: () => void, duration = 500) {
  let timeout: NodeJS.Timeout | null = null;

  const handleTouchStart = () => {
    timeout = setTimeout(() => {
      haptics.medium();
      callback();
    }, duration);
  };

  const handleTouchEnd = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd
  };
}

// Check if running on mobile device
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Check if running in Capacitor
export const isNativeApp = () => {
  return (window as any).Capacitor !== undefined;
};

// Prevent zoom on double tap
export const preventDoubleTapZoom = () => {
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
};
