import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Building2, User, Check, AlertCircle, Mail, Eye, EyeOff, ArrowRight, Shield, Sparkles, Apple } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'login' | 'signup' | 'facility';
}

type AccountType = 'user' | 'facility' | null;

const inputClasses =
  'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 24,
    transition: { duration: 0.2 },
  },
};

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
    if (passwordStrength === 'medium') return 'bg-amber-500';
    if (passwordStrength === 'strong') return 'bg-green-600';
    return 'bg-slate-200';
  };

  const getPasswordStrengthWidth = () => {
    if (passwordStrength === 'weak') return 'w-1/3';
    if (passwordStrength === 'medium') return 'w-2/3';
    if (passwordStrength === 'strong') return 'w-full';
    return 'w-0';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative bg-white rounded-2xl shadow-2xl border border-slate-200/60 ${
              isFacilitySignup ? 'max-w-4xl' : 'max-w-md'
            } w-full mx-4 overflow-hidden max-h-[90vh]`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors shadow-sm border border-slate-100"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>

            <div className="overflow-y-auto max-h-[90vh]">
              {/* ========== Success State ========== */}
              {registrationSuccess ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-green-700 flex items-center justify-center mx-auto mb-6 ring-2 ring-white shadow-sm">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                  <h3
                    className="text-3xl font-bold text-slate-800 mb-4"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    Welcome to PaddleGrid!
                  </h3>
                  <p className="text-base text-slate-500 mb-8 max-w-sm mx-auto">
                    Your facility account has been created successfully. Our team will review your application and contact you shortly.
                  </p>
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-8 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold shadow-sm transition-colors"
                  >
                    Get Started
                  </motion.button>
                </div>

              /* ========== Forgot Password ========== */
              ) : isForgotPassword ? (
                <div>
                  {/* Header */}
                  <div className="bg-green-700 px-8 py-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-7 h-7 text-white" />
                    </div>
                    <h2
                      className="text-2xl font-bold text-white mb-1"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      Reset Password
                    </h2>
                    <p className="text-green-100 text-sm">
                      {resetEmailSent
                        ? 'Check your email for reset instructions'
                        : 'Enter your email to receive reset instructions'}
                    </p>
                  </div>

                  <div className="p-8">
                    {!resetEmailSent ? (
                      <form onSubmit={handlePasswordReset} className="space-y-4">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Your email"
                          className={inputClasses}
                        />

                        <AnimatePresence>
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="flex items-start gap-2 p-3 bg-red-50 border border-red-200/60 rounded-xl"
                            >
                              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-red-700">{error}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <motion.button
                          type="submit"
                          disabled={loading}
                          whileHover={!loading ? { y: -1 } : {}}
                          whileTap={!loading ? { scale: 0.98 } : {}}
                          className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold shadow-sm transition-colors disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Send Reset Link'}
                        </motion.button>

                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(false)}
                          className="w-full text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
                        >
                          Back to Sign In
                        </button>
                      </form>
                    ) : (
                      <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setIsForgotPassword(false);
                          setResetEmailSent(false);
                        }}
                        className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold shadow-sm transition-colors"
                      >
                        Back to Sign In
                      </motion.button>
                    )}
                  </div>
                </div>

              /* ========== Account Type Selection ========== */
              ) : showAccountTypeSelection ? (
                <div>
                  {/* Header */}
                  <div className="bg-green-700 px-8 py-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold mb-4">
                      <Sparkles className="w-3.5 h-3.5" />
                      Join PaddleGrid
                    </div>
                    <h2
                      className="text-3xl font-bold text-white mb-2"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      Create Your Account
                    </h2>
                    <p className="text-green-100 text-sm">Choose the account type that fits you best</p>
                  </div>

                  <div className="p-8">
                    <div className="grid gap-3">
                      <motion.button
                        whileHover={{ y: -2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                        onClick={() => setAccountType('user')}
                        className="group relative p-5 rounded-xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-green-300 transition-colors text-left"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-green-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ring-2 ring-white shadow-sm">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>Player Account</h3>
                            <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
                              Book courts, find partners, and track your progress.
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-green-700 group-hover:translate-x-1 transition-all mt-1" />
                        </div>
                      </motion.button>

                      <motion.button
                        whileHover={{ y: -2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                        onClick={() => setAccountType('facility')}
                        className="group relative p-5 rounded-xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-green-300 transition-colors text-left"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-green-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ring-2 ring-white shadow-sm">
                            <Building2 className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>Facility Account</h3>
                            <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
                              Manage courts, memberships, and your club operations.
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-green-700 group-hover:translate-x-1 transition-all mt-1" />
                        </div>
                      </motion.button>
                    </div>

                    <div className="mt-6 text-center">
                      <button
                        onClick={() => setIsLogin(true)}
                        className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
                      >
                        Already have an account? <span className="text-green-700 font-semibold">Sign In</span>
                      </button>
                    </div>
                  </div>
                </div>

              /* ========== Login / Signup Form ========== */
              ) : (
                <div>
                  {/* Header */}
                  <div className="bg-green-700 px-8 py-8 text-center">
                    <h2
                      className="text-2xl font-bold text-white mb-1"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      {isLogin ? 'Welcome Back' : isFacilitySignup ? 'Register Your Facility' : 'Create Account'}
                    </h2>
                    <p className="text-green-100 text-sm">
                      {isLogin ? 'Sign in to continue to PaddleGrid' : 'Join the fastest-growing pickleball community'}
                    </p>
                  </div>

                  <div className="p-8">
                    {/* Tab Switcher - underline style */}
                    {!isFacilitySignup && (
                      <div className="relative flex mb-6 border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsLogin(true);
                            setAccountType(null);
                            setError('');
                          }}
                          className={`relative flex-1 py-2.5 text-sm font-semibold transition-colors ${
                            isLogin ? 'text-green-700' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Sign In
                          {isLogin && (
                            <motion.div
                              layoutId="auth-tab-indicator"
                              className="absolute bottom-0 left-4 right-4 h-0.5 bg-green-700 rounded-full"
                              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                            />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsLogin(false);
                            setAccountType(null);
                            setError('');
                          }}
                          className={`relative flex-1 py-2.5 text-sm font-semibold transition-colors ${
                            !isLogin ? 'text-green-700' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Sign Up
                          {!isLogin && (
                            <motion.div
                              layoutId="auth-tab-indicator"
                              className="absolute bottom-0 left-4 right-4 h-0.5 bg-green-700 rounded-full"
                              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                            />
                          )}
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Honeypot */}
                      <input
                        type="text"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        className="hidden"
                        tabIndex={-1}
                        autoComplete="off"
                      />

                      {/* Facility signup fields */}
                      {isFacilitySignup ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Facility Name</label>
                            <input
                              type="text"
                              value={facilityName}
                              onChange={(e) => setFacilityName(e.target.value)}
                              className={inputClasses}
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
                            <input
                              type="text"
                              value={facilityAddress}
                              onChange={(e) => setFacilityAddress(e.target.value)}
                              className={inputClasses}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">City</label>
                            <input
                              type="text"
                              value={facilityCity}
                              onChange={(e) => setFacilityCity(e.target.value)}
                              className={inputClasses}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">State</label>
                            <input
                              type="text"
                              value={facilityState}
                              onChange={(e) => setFacilityState(e.target.value)}
                              className={inputClasses}
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Estimated Member Count</label>
                            <input
                              type="number"
                              value={estimatedPatronBase}
                              onChange={(e) => setEstimatedPatronBase(e.target.value)}
                              className={inputClasses}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Owner Name</label>
                            <input
                              type="text"
                              value={ownerName}
                              onChange={(e) => setOwnerName(e.target.value)}
                              className={inputClasses}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Owner Phone</label>
                            <input
                              type="tel"
                              value={ownerPhone}
                              onChange={(e) => setOwnerPhone(formatPhoneNumber(e.target.value))}
                              className={inputClasses}
                              required
                            />
                          </div>
                        </div>

                      /* Player signup name fields */
                      ) : !isLogin ? (
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First Name"
                            className={inputClasses}
                            required
                          />
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last Name"
                            className={inputClasses}
                            required
                          />
                        </div>
                      ) : null}

                      {/* Email */}
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className={inputClasses}
                        required
                      />

                      {/* Password */}
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          className={`${inputClasses} pr-12`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password strength */}
                      {!isLogin && passwordStrength && (
                        <div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${getPasswordStrengthColor()} ${getPasswordStrengthWidth()}`}
                              initial={{ width: 0 }}
                              animate={{ width: 'auto' }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-1.5">
                            Password strength: <span className="font-semibold capitalize text-slate-600">{passwordStrength}</span>
                          </p>
                        </div>
                      )}

                      {/* Error */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200/60 rounded-xl"
                          >
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Submit */}
                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={!loading ? { y: -1 } : {}}
                        whileTap={!loading ? { scale: 0.98 } : {}}
                        className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold shadow-sm transition-colors disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            {isLogin ? 'Sign In' : 'Create Account'}
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        )}
                      </motion.button>

                      {/* Social auth */}
                      {!isFacilitySignup && (
                        <>
                          <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-slate-100" />
                            </div>
                            <div className="relative flex justify-center">
                              <span className="px-3 bg-white text-xs text-slate-400 font-medium">or</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <motion.button
                              type="button"
                              whileHover={{ y: -1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                              whileTap={{ scale: 0.98 }}
                              onClick={async () => {
                                setLoading(true);
                                setError('');
                                try {
                                  const { error } = await signInWithApple();
                                  if (error) throw error;
                                } catch (err: unknown) {
                                  setError(err instanceof Error ? err.message : 'Apple sign in failed');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              disabled={loading}
                              className="bg-white border border-slate-200 rounded-xl py-3 hover:bg-slate-50/50 font-medium text-slate-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                              <Apple className="w-5 h-5" />
                              <span className="text-sm">Apple</span>
                            </motion.button>

                            <motion.button
                              type="button"
                              whileHover={{ y: -1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                              whileTap={{ scale: 0.98 }}
                              onClick={async () => {
                                setLoading(true);
                                setError('');
                                try {
                                  const { error } = await signInWithGoogle();
                                  if (error) throw error;
                                } catch (err: unknown) {
                                  setError(err instanceof Error ? err.message : 'Google sign in failed');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              disabled={loading}
                              className="bg-white border border-slate-200 rounded-xl py-3 hover:bg-slate-50/50 font-medium text-slate-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                              <span className="text-sm">Google</span>
                            </motion.button>
                          </div>
                        </>
                      )}

                      {/* Forgot password */}
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="w-full text-sm text-slate-400 hover:text-slate-700 font-medium mt-2 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}

                      {/* Facility toggle */}
                      {isFacilitySignup && (
                        <div className="pt-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setIsLogin(!isLogin);
                              setAccountType(null);
                              setError('');
                            }}
                            className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
                          >
                            {isLogin ? (
                              <>
                                Don't have an account? <span className="text-green-700 font-semibold">Sign Up</span>
                              </>
                            ) : (
                              <>
                                Already have an account? <span className="text-green-700 font-semibold">Sign In</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </form>

                    {/* Security note */}
                    {!isLogin && !isFacilitySignup && (
                      <div className="mt-5 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200/60">
                        <div className="flex items-start gap-3">
                          <Shield className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-green-800 leading-relaxed">
                            Your data is secure with us. We use industry-standard encryption to protect your information.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
