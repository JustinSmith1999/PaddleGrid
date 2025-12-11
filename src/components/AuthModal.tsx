import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'login' | 'signup' | 'facility';
}

export function AuthModal({ isOpen, onClose, mode = 'login' }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [isFacilitySignup, setIsFacilitySignup] = useState(mode === 'facility');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [facilityAddress, setFacilityAddress] = useState('');
  const [facilityCity, setFacilityCity] = useState('');
  const [facilityState, setFacilityState] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, signUpWithFacility, signInWithApple } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setIsLogin(mode === 'login');
      setIsFacilitySignup(mode === 'facility');
      setError('');
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        onClose();
      } else if (isFacilitySignup) {
        if (!facilityName.trim()) {
          throw new Error('Facility name is required');
        }
        const { error } = await signUpWithFacility(
          email,
          password,
          firstName,
          lastName,
          phone,
          facilityName,
          facilityAddress,
          facilityCity,
          facilityState
        );
        if (error) throw error;
        onClose();
      } else {
        const { error } = await signUp(email, password, firstName, lastName, phone);
        if (error) throw error;
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const { error } = await signInWithApple();
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl ${isFacilitySignup ? 'max-w-4xl' : 'max-w-md'} w-full max-h-[90vh] overflow-y-auto relative`}>
        <div className="sticky top-0 bg-white p-6 pb-4 border-b border-gray-100 rounded-t-2xl z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {isLogin ? 'Welcome Back' : isFacilitySignup ? 'Start Your Free Trial' : 'Join PaddleGrid'}
          </h2>
          <p className="text-sm text-gray-600">
            {isLogin
              ? 'Sign in to manage your bookings'
              : isFacilitySignup
              ? 'Create your facility account and start your 14-day free trial'
              : 'Create an account to start booking'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-4">
          {!isLogin && (
            <>
              {isFacilitySignup && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Facility Name
                    </label>
                    <input
                      type="text"
                      value={facilityName}
                      onChange={(e) => setFacilityName(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                      placeholder="Elite Pickleball Club"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Facility Address
                    </label>
                    <input
                      type="text"
                      value={facilityAddress}
                      onChange={(e) => setFacilityAddress(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={facilityCity}
                      onChange={(e) => setFacilityCity(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      value={facilityState}
                      onChange={(e) => setFacilityState(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                      placeholder="NY"
                    />
                  </div>
                </div>
              )}
              <div className={`grid ${isFacilitySignup ? 'md:grid-cols-2' : 'grid-cols-2'} gap-3`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className={isFacilitySignup ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required={isFacilitySignup}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                  placeholder="(555) 123-4567"
                />
              </div>
            </>
          )}

          <div className={`grid ${isFacilitySignup ? 'md:grid-cols-2' : 'grid-cols-1'} gap-3`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {isLogin ? 'Signing In...' : isFacilitySignup ? 'Creating Facility...' : 'Creating Account...'}
              </>
            ) : (
              <>{isLogin ? 'Sign In' : isFacilitySignup ? 'Start Free Trial' : 'Create Account'}</>
            )}
          </button>

          {!isFacilitySignup && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAppleSignIn}
                disabled={loading}
                className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Sign in with Apple
              </button>
            </>
          )}
        </form>

        <div className="px-6 pb-6 pt-4 text-center border-t border-gray-100">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setIsFacilitySignup(false);
              setError('');
            }}
            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
