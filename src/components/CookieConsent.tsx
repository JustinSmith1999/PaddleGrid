import { useState, useEffect } from 'react';
import { X, Cookie, Shield, Settings } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const STORAGE_KEY = 'paddlegrid_cookie_consent';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      setIsVisible(true);
    } else {
      try {
        const savedPreferences = JSON.parse(consent);
        setPreferences(savedPreferences);
        applyConsent(savedPreferences);
      } catch (error) {
        console.error('Error parsing cookie preferences:', error);
        setIsVisible(true);
      }
    }
  }, []);

  const applyConsent = (prefs: CookiePreferences) => {
    if (prefs.analytics && import.meta.env.VITE_SENTRY_DSN) {
      // Enable analytics tracking
      console.log('Analytics enabled');
    } else {
      console.log('Analytics disabled');
    }

    if (prefs.marketing) {
      // Enable marketing cookies
      console.log('Marketing cookies enabled');
    } else {
      console.log('Marketing cookies disabled');
    }
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    savePreferences(necessaryOnly);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    localStorage.setItem('paddlegrid_consent_date', new Date().toISOString());
    setPreferences(prefs);
    applyConsent(prefs);
    setIsVisible(false);
  };

  const handleToggle = (type: keyof CookiePreferences) => {
    if (type === 'necessary') return; // Necessary cookies cannot be disabled
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-emerald-50 rounded-full">
              <Cookie className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Cookie Settings</h2>
              <p className="text-sm text-gray-600">
                We use cookies to enhance your experience, analyze site traffic, and personalize content.
                You can choose which cookies to accept below.
              </p>
            </div>
          </div>

          {!showDetails ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 text-sm mb-1">Your Privacy Matters</h3>
                    <p className="text-xs text-blue-800">
                      We respect your privacy and comply with GDPR, CCPA, and other privacy regulations.
                      You can change your preferences at any time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Accept All
                </button>
                <button
                  onClick={handleAcceptNecessary}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Necessary Only
                </button>
                <button
                  onClick={() => setShowDetails(true)}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg border-2 border-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Customize
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                By clicking "Accept All", you agree to our use of cookies.
                Learn more in our{' '}
                <a href="/privacy-policy" className="text-emerald-600 hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm">Necessary Cookies</h3>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.necessary}
                      disabled
                      className="w-5 h-5 text-emerald-600 rounded cursor-not-allowed opacity-50"
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    Essential for the website to function. These cookies enable core functionality such as
                    security, authentication, and accessibility features.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">Analytics Cookies</h3>
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={() => handleToggle('analytics')}
                      className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    Help us understand how visitors interact with our website. We use this information to
                    improve user experience and optimize our services.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">Marketing Cookies</h3>
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={() => handleToggle('marketing')}
                      className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    Used to deliver personalized advertisements and track ad campaign performance. These
                    cookies may be set by third-party advertising partners.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Save Preferences
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (consent) {
      try {
        setPreferences(JSON.parse(consent));
      } catch (error) {
        console.error('Error parsing cookie preferences:', error);
      }
    }
  }, []);

  const hasConsent = (type: keyof CookiePreferences): boolean => {
    if (!preferences) return false;
    return preferences[type];
  };

  const resetConsent = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('paddlegrid_consent_date');
    setPreferences(null);
    window.location.reload();
  };

  return {
    preferences,
    hasConsent,
    resetConsent,
  };
}
