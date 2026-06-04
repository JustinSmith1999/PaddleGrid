import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DEMO_ACCOUNTS = {
  admin: {
    email: 'demo-admin@paddlegrid.com',
    password: 'DemoAdmin2024!',
    label: 'Facility Owner',
    description:
      'The command center. Member retention, court utilization, revenue by hour, smart insights, and the back-of-house everything.',
    cta: 'Tour as owner',
  },
  player: {
    email: 'demo-player@paddlegrid.com',
    password: 'DemoPlayer2024!',
    label: 'Member',
    description:
      'The social side of the club. Live feed with stories, polls, achievements, court bookings, and the daily rhythm of a thriving facility.',
    cta: 'Tour as member',
  },
} as const;

type Role = keyof typeof DEMO_ACCOUNTS;

export default function DemoChooser() {
  const [loading, setLoading] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signInAs = async (role: Role) => {
    setLoading(role);
    setError(null);
    const account = DEMO_ACCOUNTS[role];
    const { error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });
    if (error) {
      setError(error.message);
      setLoading(null);
      return;
    }
    window.location.href = role === 'admin' ? '/admin' : '/';
  };

  return (
    <div
      className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #FBF8F2 0%, #FFFFFF 60%, #F2F6F3 100%)' }}
    >
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-10"
        >
          <div
            className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase mb-5"
            style={{ backgroundColor: '#F4ECD9', color: '#7D673F' }}
          >
            Investor Preview · Pickleball Heaven
          </div>
          <h1
            className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3"
            style={{ fontFamily: "'Cinzel', 'Manrope', serif", letterSpacing: '0.02em' }}
          >
            The Pickleball Palace, Online.
          </h1>
          <p className="text-slate-600 text-base max-w-2xl mx-auto leading-relaxed">
            PaddleGrid is the operating system for the new generation of premium paddle facilities — multi-court, F&B-included, social-first. Take it from either side.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {(['admin', 'player'] as Role[]).map((role, i) => {
            const account = DEMO_ACCOUNTS[role];
            const isLoading = loading === role;
            const isDisabled = loading !== null;
            const Icon = role === 'admin' ? ShieldCheck : User;
            return (
              <motion.button
                key={role}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.08 + i * 0.06 }}
                whileHover={!isDisabled ? { y: -3 } : {}}
                whileTap={!isDisabled ? { scale: 0.99 } : {}}
                onClick={() => signInAs(role)}
                disabled={isDisabled}
                className={`group relative flex flex-col items-start text-left p-7 sm:p-8 rounded-2xl bg-white shadow-sm transition-all duration-200 border
                  ${isDisabled ? 'opacity-60 cursor-not-allowed border-slate-200' : 'hover:shadow-xl cursor-pointer'}
                `}
                style={{
                  borderColor: isDisabled ? undefined : '#E6D5B0',
                  background: 'linear-gradient(140deg, #FFFFFF 0%, #FBF8F2 100%)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{
                    backgroundColor: role === 'admin' ? '#2D4A38' : '#B59866',
                    color: '#FFFFFF',
                  }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h2
                  className="text-xl sm:text-2xl font-bold text-slate-900 mb-2"
                  style={{ fontFamily: "'Cinzel', 'Manrope', serif", letterSpacing: '0.01em' }}
                >
                  {account.label}
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {account.description}
                </p>
                <div
                  className="mt-auto inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: role === 'admin' ? '#2D4A38' : '#7D673F' }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      {account.cta}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {error && (
          <p className="mt-6 text-center text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <p className="mt-10 text-center text-xs text-slate-400">
          Preview environment · Sample data only · Nothing here affects production.
        </p>
      </div>
    </div>
  );
}
