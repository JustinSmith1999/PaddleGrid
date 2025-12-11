import { useState, useEffect } from 'react';
import { X, Loader2, Building2, User, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'login' | 'signup' | 'facility';
}

type AccountType = 'user' | 'facility' | null;

export function AuthModal({ isOpen, onClose, mode = 'login' }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [accountType, setAccountType] = useState<AccountType>(mode === 'facility' ? 'facility' : null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [facilityAddress, setFacilityAddress] = useState('');
  const [facilityCity, setFacilityCity] = useState('');
  const [facilityState, setFacilityState] = useState('');
  const [estimatedPatronBase, setEstimatedPatronBase] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { signIn, signUp, signUpWithFacility, signInWithApple } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setIsLogin(mode === 'login');
      setAccountType(mode === 'facility' ? 'facility' : null);
      setError('');
      setRegistrationSuccess(false);
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
      } else if (accountType === 'facility') {
        if (!facilityName.trim()) {
          throw new Error('Facility name is required');
        }
        if (!facilityAddress.trim()) {
          throw new Error('Facility address is required');
        }
        if (!facilityCity.trim()) {
          throw new Error('City is required');
        }
        if (!facilityState.trim()) {
          throw new Error('State is required');
        }
        if (!ownerName.trim()) {
          throw new Error('Owner name is required');
        }
        if (!ownerPhone.trim()) {
          throw new Error('Owner phone is required');
        }
        if (!estimatedPatronBase.trim()) {
          throw new Error('Estimated patron base is required');
        }

        const { error } = await signUpWithFacility(
          email,
          password,
          firstName || ownerName.split(' ')[0] || '',
          lastName || ownerName.split(' ').slice(1).join(' ') || '',
          phone || ownerPhone,
          facilityName,
          facilityAddress,
          facilityCity,
          facilityState,
          parseInt(estimatedPatronBase),
          ownerName,
          ownerPhone
        );
        if (error) throw error;
        setRegistrationSuccess(true);
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

  const isFacilitySignup = accountType === 'facility';
  const showAccountTypeSelection = !isLogin && accountType === null;

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
            {registrationSuccess
              ? 'Registration Complete!'
              : isLogin ? 'Welcome Back' : showAccountTypeSelection ? 'Join PaddleGrid' : isFacilitySignup ? 'Facility Registration' : 'Create Your Account'}
          </h2>
          <p className="text-sm text-gray-600">
            {registrationSuccess
              ? 'Your facility has been successfully registered'
              : isLogin
              ? 'Sign in to manage your bookings'
              : showAccountTypeSelection
              ? 'Choose your account type to get started'
              : isFacilitySignup
              ? 'Complete your facility information'
              : 'Create a personal account to start booking'}
          </p>
        </div>

        {registrationSuccess ? (
          <div className="p-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to PaddleGrid!</h3>
                <p className="text-gray-600">Your facility "{facilityName}" has been created successfully.</p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
              <h4 className="font-semibold text-emerald-900 text-lg mb-3">Facility Subscription</h4>
              <div className="space-y-3 text-sm text-emerald-800">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p><span className="font-semibold">$449/month</span> - Full access to all features</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p>Manage unlimited courts, bookings, and members</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p>Advanced analytics and reporting</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p>Priority support and onboarding assistance</p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
            >
              Get Started
            </button>
          </div>
        ) : showAccountTypeSelection ? (
          <div className="p-6 space-y-4">
            <p className="text-center text-sm text-gray-600 mb-4">Select the type of account you want to create</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAccountType('user')}
                className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-500 transition-all duration-200 text-left"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-emerald-50 rounded-full group-hover:bg-emerald-100 transition-colors">
                    <User className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Player Account</h3>
                    <p className="text-sm text-gray-600 mt-1">Book courts, join matches, and track your progress</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('facility')}
                className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-500 transition-all duration-200 text-left"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-emerald-50 rounded-full group-hover:bg-emerald-100 transition-colors">
                    <Building2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Facility Account</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage courts, bookings, and members</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 pt-4 space-y-4">
              {!isFacilitySignup && !isLogin && (
                <>
                  <button
                    type="button"
                    onClick={handleAppleSignIn}
                    disabled={loading}
                    className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Sign up with Apple
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or continue with email</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-4">
              {!isLogin && (
                <>
                  {isFacilitySignup && (
                    <>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Facility Name *
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
                            Facility Address *
                          </label>
                          <input
                            type="text"
                            value={facilityAddress}
                            onChange={(e) => setFacilityAddress(e.target.value)}
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                            placeholder="123 Main Street"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            City *
                          </label>
                          <input
                            type="text"
                            value={facilityCity}
                            onChange={(e) => setFacilityCity(e.target.value)}
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                            placeholder="New York"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            State *
                          </label>
                          <input
                            type="text"
                            value={facilityState}
                            onChange={(e) => setFacilityState(e.target.value)}
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                            placeholder="NY"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Estimated Patron Base *
                          </label>
                          <input
                            type="number"
                            value={estimatedPatronBase}
                            onChange={(e) => setEstimatedPatronBase(e.target.value)}
                            required
                            min="1"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                            placeholder="500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                            placeholder="(555) 123-4567"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Owner Name *
                          </label>
                          <input
                            type="text"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                            placeholder="John Smith"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Owner Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={ownerPhone}
                            onChange={(e) => setOwnerPhone(e.target.value)}
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                            placeholder="(555) 987-6543"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {!isFacilitySignup && (
                    <div className={`grid grid-cols-2 gap-3`}>
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
                  )}

                  {!isFacilitySignup && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  )}
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
                  <>{isLogin ? 'Sign In' : isFacilitySignup ? 'Complete Registration' : 'Create Account'}</>
                )}
              </button>
            </form>

            <div className="px-6 pb-6 pt-4 text-center border-t border-gray-100">
              {accountType !== null && !isLogin && (
                <button
                  onClick={() => {
                    setAccountType(null);
                    setError('');
                  }}
                  className="text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm mb-3 block w-full"
                >
                  ← Back to account selection
                </button>
              )}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setAccountType(null);
                  setError('');
                }}
                className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
