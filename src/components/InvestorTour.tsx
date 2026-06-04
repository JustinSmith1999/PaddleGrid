import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, TrendingUp, AlertTriangle, Calendar, Trophy } from 'lucide-react';

interface TourStep {
  icon: any;
  badge: string;
  title: string;
  body: string;
  cta: string;
}

const STEPS: TourStep[] = [
  {
    icon: TrendingUp,
    badge: 'Insight',
    title: 'Revenue +14% MoM',
    body: 'Court 4 floodlights paid for themselves in 8 weeks. Most growth is coming from your new 4-6pm slot.',
    cta: 'Next: who is at risk',
  },
  {
    icon: AlertTriangle,
    badge: 'Churn alerts',
    title: '3 members haven’t booked in 21 days',
    body: 'Jen Hartwell, Marcus Chen, and Mike Russo all had weekly cadences last quarter and have gone quiet. One-click to send them a re-engagement push.',
    cta: 'Next: scheduling',
  },
  {
    icon: Calendar,
    badge: 'Smart calendar',
    title: 'Tuesday morning ladies league is at capacity',
    body: 'You’ve had a waitlist three weeks running. Consider opening Wednesday morning — system can clone the league with one click.',
    cta: 'Next: community',
  },
  {
    icon: Trophy,
    badge: 'Community',
    title: 'Achievements are driving 31% more posts',
    body: '124 members unlocked at least one achievement this month. Members who unlock 2+ post 4.2x more often than non-unlockers.',
    cta: 'Got it — let me explore',
  },
];

const STORAGE_KEY = 'paddlegrid-investor-tour-seen-v1';

export default function InvestorTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Show on first arrival; investor demo accounts always see it
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      const isDemoAdmin = window.location.pathname.startsWith('/admin');
      if (!seen && isDemoAdmin) setOpen(true);
    } catch {
      // ignore storage errors (private mode)
    }
  }, []);

  const close = () => {
    setOpen(false);
    try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else close();
  };

  if (!open) return null;
  const S = STEPS[step];
  const Icon = S.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={close}
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
          style={{ background: 'linear-gradient(135deg, #FBF8F2 0%, #FFFFFF 60%)' }}
        >
          <div className="relative px-6 pt-7 pb-5">
            <button
              onClick={close}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              aria-label="Close tour"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wider uppercase mb-4">
              <Icon className="w-3.5 h-3.5" />
              {S.badge}
            </div>

            <h2
              className="text-2xl sm:text-[26px] font-bold text-slate-900 mb-2 leading-tight"
              style={{ fontFamily: "'Cinzel', 'Manrope', serif" }}
            >
              {S.title}
            </h2>
            <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed">{S.body}</p>
          </div>

          <div className="flex items-center justify-between px-6 pb-5 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === step ? 'w-6 bg-emerald-700' : i < step ? 'w-1.5 bg-emerald-300' : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition"
            >
              {S.cta}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
