import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DEMO_ACCOUNTS = {
  admin: {
    email: 'demo-admin@paddlegrid.com',
    password: 'DemoAdmin2024!',
    label: 'Facility Owner',
    description: 'Admin dashboard, member analytics, court bookings, revenue reports, and the full back-of-house view.',
    cta: 'Tour as admin',
  },
  player: {
    email: 'demo-player@paddlegrid.com',
    password: 'DemoPlayer2024!',
    label: 'Player',
    description: 'Community feed, stories, court bookings, messaging, and what a member sees every day.',
    cta: 'Tour as player',
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
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 to-emerald-50/40 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-center mb-10"
        >
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold tracking-wide uppercase mb-4">
            Investor Preview
          </div>
          <h1
            className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Welcome to PaddleGrid
          </h1>
          <p className="text-slate-600 text-base max-w-xl mx-auto">
            Choose how you'd like to explore the product. You can switch perspectives anytime by signing out.
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
                transition={{ duration: 0.3, delay: 0.05 + i * 0.05 }}
                whileHover={!isDisabled ? { y: -2 } : {}}
                whileTap={!isDisabled ? { scale: 0.99 } : {}}
                onClick={() => signInAs(role)}
                disabled={isDisabled}
                className={`group relative flex flex-col items-start text-left p-6 sm:p-7 rounded-2xl border bg-white shadow-sm transition-all duration-200 ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg hover:border-emerald-300'} border-slate-200`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h2
                  className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  {account.label}
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">
                  {account.description}
                </p>
                <div
                  className={`mt-auto inline-flex items-center gap-2 text-sm font-semibold ${role === 'admin' ? 'text-emerald-700' : 'text-sky-700'}`}
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
          This is a preview environment with sample data. Nothing here affects production.
        </p>
      </div>
    </div>
  );
}
