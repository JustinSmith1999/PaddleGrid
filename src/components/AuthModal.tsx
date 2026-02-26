import { useState, useEffect } from 'react';
import { X, Loader2, Building2, User, Check, AlertCircle, Mail, Eye, EyeOff, ArrowRight, Shield, Sparkles } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
  const { signIn, signUp, signUpWithFacility, profile, resetPassword } = useAuth();
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
      if (!email || !validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const { error } = await resetPassword(email);
      if (error) throw error;

      setResetEmailSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        throw new Error('Invalid submission');
      }

      const submissionTime = Date.now() - formOpenTime;
      if (submissionTime < 2000) {
        throw new Error('Please take your time filling out the form');
      }

      if (!email || !validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (isLogin) {
        if (!password) {
          throw new Error('Please enter your password');
        }

        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid') || error.message.includes('credentials')) {
            throw new Error('Invalid email or password. Please try again.');
          }
          throw error;
        }
        onClose();
      } else if (accountType === 'facility') {
        if (!facilityName || !facilityAddress || !facilityCity || !facilityState || !estimatedPatronBase || !ownerName || !ownerPhone) {
          throw new Error('Please fill in all facility information');
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

  const isFacilitySignup = accountType === 'facility';
  const showAccountTypeSelection = !isLogin && accountType === null;

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 'weak') return 'bg-red-500';
    if (passwordStrength === 'medium') return 'bg-yellow-500';
    if (passwordStrength === 'strong') return 'bg-emerald-500';
    return 'bg-slate-200';
  };

  const getPasswordStrengthWidth = () => {
    if (passwordStrength === 'weak') return 'w-1/3';
    if (passwordStrength === 'medium') return 'w-2/3';
    if (passwordStrength === 'strong') return 'w-full';
    return 'w-0';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className={`relative bg-white rounded-3xl shadow-2xl ${
          isFacilitySignup ? 'max-w-4xl' : 'max-w-md'
        } w-full max-h-[90vh] overflow-hidden`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>

        <div className="overflow-y-auto max-h-[90vh]">
          {/* Success State */}
          {registrationSuccess ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Welcome to PaddleGrid!</h3>
              <p className="text-lg text-slate-600 mb-8">
                Your facility account has been created successfully. Our team will review your application and contact you shortly.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Get Started
              </button>
            </div>
          ) : isForgotPassword ? (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Reset Password</h2>
                <p className="text-slate-600">
                  {resetEmailSent
                    ? "Check your email for reset instructions"
                    : "Enter your email to receive reset instructions"}
                </p>
              </div>

              {!resetEmailSent ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />

                  {error && (
                    <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Send Reset Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="w-full text-slate-600 hover:text-slate-900 text-sm font-medium"
                  >
                    Back to Sign In
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetEmailSent(false);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          ) : showAccountTypeSelection ? (
            <div className="p-12">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-6">
                  <Sparkles className="w-4 h-4" />
                  Join PaddleGrid
                </div>
                <h2 className="text-4xl font-bold text-slate-900 mb-3">Create Your Account</h2>
                <p className="text-lg text-slate-600">Choose the account type that fits you best</p>
              </div>

              <div className="grid gap-6">
                <button
                  onClick={() => setAccountType('user')}
                  className="group relative p-8 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 text-left"
                >
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Player Account</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Perfect for individual players who want to book courts, find partners, and track their progress.
                      </p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>

                <button
                  onClick={() => setAccountType('facility')}
                  className="group relative p-8 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 text-left"
                >
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Facility Account</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Ideal for club owners and facility managers who want to manage courts and memberships.
                      </p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-slate-600 hover:text-slate-900 font-medium"
                >
                  Already have an account? <span className="text-emerald-600">Sign In</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-slate-900 mb-2">
                  {isLogin ? 'Welcome Back' : isFacilitySignup ? 'Register Your Facility' : 'Create Account'}
                </h2>
                <p className="text-slate-600">
                  {isLogin ? 'Sign in to continue to PaddleGrid' : 'Join the fastest-growing pickleball community'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <input
                  type="text"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                {isFacilitySignup ? (
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Facility Name</label>
                      <input
                        type="text"
                        value={facilityName}
                        onChange={(e) => setFacilityName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                      <input
                        type="text"
                        value={facilityAddress}
                        onChange={(e) => setFacilityAddress(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                      <input
                        type="text"
                        value={facilityCity}
                        onChange={(e) => setFacilityCity(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">State</label>
                      <input
                        type="text"
                        value={facilityState}
                        onChange={(e) => setFacilityState(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Estimated Member Count</label>
                      <input
                        type="number"
                        value={estimatedPatronBase}
                        onChange={(e) => setEstimatedPatronBase(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Owner Name</label>
                      <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Owner Phone</label>
                      <input
                        type="tel"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(formatPhoneNumber(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                ) : !isLogin ? (
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className="px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      required
                    />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className="px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      required
                    />
                  </div>
                ) : null}

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  required
                />

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {!isLogin && passwordStrength && (
                  <div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${getPasswordStrengthColor()} ${getPasswordStrengthWidth()} transition-all duration-300`} />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Password strength: <span className="font-semibold capitalize">{passwordStrength}</span>
                    </p>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </button>

                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="w-full text-sm text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Forgot password?
                  </button>
                )}

                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setAccountType(null);
                      setError('');
                    }}
                    className="text-slate-600 hover:text-slate-900 font-medium"
                  >
                    {isLogin ? (
                      <>
                        Don't have an account? <span className="text-emerald-600 font-semibold">Sign Up</span>
                      </>
                    ) : (
                      <>
                        Already have an account? <span className="text-emerald-600 font-semibold">Sign In</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {!isLogin && !isFacilitySignup && (
                <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-900">
                      Your data is secure with us. We use industry-standard encryption to protect your information.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
