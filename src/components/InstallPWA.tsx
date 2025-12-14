import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

      if (daysSinceDismissed < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <Download className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">Install PaddleGrid</h3>
          <p className="text-sm text-gray-600 mb-3">
            Install our app for quick access, offline support, and a better experience!
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
