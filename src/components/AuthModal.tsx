import { useState, useEffect } from 'react';
import { X, Loader2, Building2, User, Check, AlertCircle, HelpCircle, Mail, Apple } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'login' | 'signup' | 'facility';
}

type AccountType = 'user' | 'facility' | null;

export function AuthModal({ isOpen, onClose, mode = 'login' }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
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
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [formOpenTime, setFormOpenTime] = useState<number>(0);
  const { signIn, signUp, signUpWithFacility, signInWithApple, signInWithGoogle, profile, resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setIsLogin(mode === 'login');
      setAccountType(mode === 'facility' ? 'facility' : null);
      setError('');
      setRegistrationSuccess(false);
      setIsForgotPassword(false);
      setResetEmailSent(false);
      setHoneypot('');
      setFormOpenTime(Date.now());
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isLogin && password.length > 0) {
      if (password.length < 8) {
        setPasswordStrength('weak');
      } else if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        setPasswordStrength('medium');
      } else {
        setPasswordStrength('strong');
      }
    } else {
      setPasswordStrength(null);
    }
  }, [password, isLogin]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateBusinessEmail = (email: string): boolean => {
    const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    return !freeEmailDomains.includes(domain);
  };

  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  useEffect(() => {
    if (profile && !loading && isOpen && !registrationSuccess) {
      if (profile.role === 'owner' || profile.role === 'admin' || profile.role === 'desk' || profile.role === 'coach') {
        onClose();
        navigate('/admin');
      }
    }
  }, [profile, loading, isOpen, registrationSuccess, navigate, onClose]);

  if (!isOpen) return null;

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!resetPassword) {
        throw new Error('Password reset is not available');
      }

      const { error } = await resetPassword(email);
      if (error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('Too many attempts. Please wait a few minutes and try again.');
        }
        throw error;
      }

      setResetEmailSent(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (honeypot) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        throw new Error('Submission failed. Please try again.');
      }

      if (!isLogin && (Date.now() - formOpenTime) < 2000) {
        throw new Error('Please take a moment to review the form before submitting.');
      }

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please try again.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please confirm your email address before signing in.');
          }
          if (error.message.includes('network') || error.message.includes('fetch')) {
            throw new Error('Network error. Please check your internet connection and try again.');
          }
          if (error.message.includes('rate limit')) {
            throw new Error('Too many login attempts. Please wait a few minutes and try again.');
          }
          throw error;
        }
        onClose();
      } else if (accountType === 'facility') {
        if (!validateBusinessEmail(email)) {
          throw new Error('Please use a business email address (not Gmail, Yahoo, etc.)');
        }

        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }

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

        const patronCount = parseInt(estimatedPatronBase);
        if (isNaN(patronCount) || patronCount < 1) {
          throw new Error('Please enter a valid number for patron base');
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
          patronCount,
          ownerName,
          ownerPhone
        );
        if (error) {
          if (error.message.includes('already registered') || error.message.includes('already exists')) {
            throw new Error('This email is already registered. Please sign in or use a different email.');
          }
          if (error.message.includes('network') || error.message.includes('fetch')) {
            throw new Error('Network error. Please check your internet connection and try again.');
          }
          if (error.message.includes('rate limit')) {
            throw new Error('Too many registration attempts. Please wait a few minutes and try again.');
          }
          throw error;
        }
        setRegistrationSuccess(true);
      } else {
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }

        const { error } = await signUp(email, password, firstName, lastName, phone);
        if (error) {
          if (error.message.includes('already registered') || error.message.includes('already exists')) {
            throw new Error('This email is already registered. Please sign in or use a different email.');
          }
          if (error.message.includes('network') || error.message.includes('fetch')) {
            throw new Error('Network error. Please check your internet connection and try again.');
          }
          if (error.message.includes('rate limit')) {
            throw new Error('Too many registration attempts. Please wait a few minutes and try again.');
          }
          throw error;
        }
        onClose();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
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

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-2xl ${isFacilitySignup ? 'max-w-3xl' : 'max-w-md'} w-full my-2 sm:my-4 relative max-h-[95vh] overflow-y-auto`}>
        <div className="bg-white p-4 pb-3 border-b border-gray-100 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-xl font-bold text-gray-800 mb-0.5">
            {resetEmailSent
              ? 'Check Your Email'
              : registrationSuccess
              ? 'Registration Complete!'
              : isForgotPassword
              ? 'Reset Password'
              : isLogin ? 'Welcome Back' : showAccountTypeSelection ? 'Join PaddleGrid' : isFacilitySignup ? 'Facility Registration' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-gray-600">
            {resetEmailSent
              ? 'Password reset instructions have been sent to your email'
              : registrationSuccess
              ? 'Your facility has been successfully registered'
              : isForgotPassword
              ? 'Enter your email to receive password reset instructions'
              : isLogin
              ? 'Sign in to manage your bookings'
              : showAccountTypeSelection
              ? 'Choose your account type to get started'
              : isFacilitySignup
              ? 'Complete your facility information'
              : 'Create a personal account to start booking'}
          </p>
        </div>

        {resetEmailSent ? (
          <div className="p-4 space-y-4">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-emerald-600" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Email Sent</h3>
                <p className="text-sm text-gray-600">
                  Check <span className="font-medium">{email}</span> for reset instructions
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setResetEmailSent(false);
                setIsForgotPassword(false);
                setEmail('');
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
            >
              Back to Sign In
            </button>
          </div>
        ) : registrationSuccess ? (
          <div className="p-4 space-y-3">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Welcome to PaddleGrid!</h3>
                <p className="text-sm text-gray-600">Your facility "{facilityName}" has been created.</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3">
              <h4 className="font-bold text-emerald-900 text-sm mb-2 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Next Steps
              </h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-xs">Set Up Your Courts</p>
                    <p className="text-xs text-gray-600">Add courts and configure pricing</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-xs">Import Your Members</p>
                    <p className="text-xs text-gray-600">Upload or add members manually</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-xs">Configure Settings</p>
                    <p className="text-xs text-gray-600">Set operating hours and policies</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-blue-900 font-medium">14-Day Free Trial</p>
                  <p className="text-xs text-blue-800 mt-0.5">
                    No credit card required. Cancel anytime.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                navigate('/admin');
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
            >
              Go to Admin Dashboard
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
            <form onSubmit={isForgotPassword ? handlePasswordReset : handleSubmit} className="space-y-3 px-4 py-3">
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              {!isLogin && (
                <>
                  {isFacilitySignup && (
                    <>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Facility Name *
                          </label>
                          <input
                            type="text"
                            value={facilityName}
                            onChange={(e) => setFacilityName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 text-sm"
                            placeholder="Elite Pickleball Club"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Facility Address *
                          </label>
                          <input
                            type="text"
                            value={facilityAddress}
                            onChange={(e) => setFacilityAddress(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 text-sm"
                            placeholder="123 Main Street"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            value={facilityCity}
                            onChange={(e) => setFacilityCity(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 text-sm"
                            placeholder="New York"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            State *
                          </label>
                          <input
                            type="text"
                            value={facilityState}
                            onChange={(e) => setFacilityState(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 text-sm"
                            placeholder="NY"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                            Estimated Patron Base *
                            <div className="group relative">
                              <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                Approximate number of active members or regular players at your facility
                              </div>
                            </div>
                          </label>
                          <input
                            type="number"
                            value={estimatedPatronBase}
                            onChange={(e) => setEstimatedPatronBase(e.target.value)}
                            required
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 text-sm"
                            placeholder="500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 text-sm"
                            placeholder="(555) 123-4567"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Owner Name *
                          </label>
                          <input
                            type="text"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 text-sm"
                            placeholder="John Smith"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Owner Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={ownerPhone}
                            onChange={(e) => setOwnerPhone(formatPhoneNumber(e.target.value))}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 text-sm"
                            placeholder="(555) 987-6543"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {!isFacilitySignup && (
                    <div className={`grid grid-cols-2 gap-3`}>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 text-sm"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 text-sm"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                  )}

                  {!isFacilitySignup && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 text-sm"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  )}
                </>
              )}

          {!isForgotPassword && (
            <div className={`grid ${isFacilitySignup ? 'md:grid-cols-2' : 'grid-cols-1'} gap-3`}>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 text-sm"
                  placeholder={isFacilitySignup ? "yourname@yourbusiness.com" : "you@example.com"}
                />
                {isFacilitySignup && !isLogin && (
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Use your business email
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 text-sm"
                  placeholder="••••••••"
                />
                {!isLogin && passwordStrength && (
                  <div className="mt-1">
                    <div className="flex gap-1">
                      <div className={`h-1 flex-1 rounded-full ${passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                      <div className={`h-1 flex-1 rounded-full ${passwordStrength === 'medium' || passwordStrength === 'strong' ? passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500' : 'bg-gray-200'}`}></div>
                      <div className={`h-1 flex-1 rounded-full ${passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    </div>
                    <p className="text-xs mt-0.5 text-gray-600">
                      Strength: <span className={`font-medium ${passwordStrength === 'weak' ? 'text-red-600' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                        {passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Medium' : 'Strong'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isForgotPassword && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 text-sm"
                placeholder="you@example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                We'll send you reset instructions
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isForgotPassword ? 'Sending...' : isLogin ? 'Signing In...' : isFacilitySignup ? 'Creating Facility...' : 'Creating Account...'}
                  </>
                ) : (
                  <>{isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : isFacilitySignup ? 'Complete Registration' : 'Create Account'}</>
                )}
              </button>

              {isLogin && !isForgotPassword && (
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="w-full text-center text-xs text-gray-600 hover:text-emerald-600 font-medium transition-colors"
                >
                  Forgot your password?
                </button>
              )}

              {!isFacilitySignup && !isForgotPassword && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </button>

                    <button
                      type="button"
                      onClick={handleAppleSignIn}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700"
                    >
                      <Apple className="w-5 h-5" />
                      Apple
                    </button>
                  </div>
                </>
              )}
            </form>

            <div className="px-4 pb-3 pt-2 text-center border-t border-gray-100">
              {isForgotPassword ? (
                <button
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError('');
                  }}
                  className="text-gray-600 hover:text-gray-800 font-medium transition-colors text-xs"
                >
                  ← Back to sign in
                </button>
              ) : accountType !== null && !isLogin ? (
                <button
                  onClick={() => {
                    setAccountType(null);
                    setError('');
                  }}
                  className="text-gray-600 hover:text-gray-800 font-medium transition-colors text-xs mb-2 block w-full"
                >
                  ← Back to account selection
                </button>
              ) : null}
              {!isForgotPassword && (
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setAccountType(null);
                    setError('');
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors text-xs"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
