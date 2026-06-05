import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  X,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Trophy,
  Users2,
  Megaphone,
  HandCoins,
} from 'lucide-react';

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
    body: 'Court 4 floodlights paid for themselves in 8 weeks. Most growth is coming from the new 4–6pm slot.',
    cta: 'Next: who is at risk',
  },
  {
    icon: AlertTriangle,
    badge: 'Churn alerts',
    title: '3 members haven’t booked in 21 days',
    body: 'Jen Hartwell, Marcus Chen, and Mike Russo all had weekly cadences last quarter and have gone quiet. One-click sends a re-engagement push.',
    cta: 'Next: scheduling',
  },
  {
    icon: Calendar,
    badge: 'Smart calendar',
    title: 'Tuesday morning ladies league is at capacity',
    body: 'You’ve had a waitlist three weeks running. Open Wednesday morning and the system can clone the league with one click.',
    cta: 'Next: community',
  },
  {
    icon: Users2,
    badge: 'Groups',
    title: 'My Groups runs your inside circles',
    body: 'Thursday Night Crew, Junior Pickleball, Ladies 3.0–3.5 — each can have its own feed, its own roster of regulars, and its own pinned drop-in invites. Blast a single post to a single group, no spamming the whole club.',
    cta: 'Next: partnerships',
  },
  {
    icon: HandCoins,
    badge: 'Partnerships',
    title: 'Pros, ambassadors, brand sponsors — in one model',
    body: 'Joola, Selkirk, and Waterloo are showing as partners on this club. Four of your pros wear brand stickers. Lesson and clinic requests land in one inbox for the pro to accept or decline.',
    cta: 'Next: monetization',
  },
  {
    icon: Megaphone,
    badge: 'Sponsorships',
    title: 'Any page can host a sponsor',
    body: 'The feed, match requests, bookings, the shop, even individual club pages — any surface can be sponsored. Today: Joola pays for the top of Match Requests. Tomorrow: a local bar sponsors the post-game club page.',
    cta: 'Next: community',
  },
  {
    icon: Trophy,
    badge: 'Community',
    title: 'Achievements drive 31% more posts',
    body: '124 members unlocked at least one achievement this month. Members who unlock 2+ post 4.2x more often than non-unlockers.',
    cta: 'Got it — let me explore',
  },
];

const STORAGE_KEY = 'paddlegrid-demo-tour-seen-v2';

/**
 * Auto-opening guided tour. Runs once per browser per version.
 * Renamed from InvestorTour; storage key bumped so existing seen-flags don't
 * suppress the refreshed v2 content.
 */
export default function DemoTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      const inAdmin = window.location.pathname.startsWith('/admin');
      if (!seen && inAdmin) setOpen(true);
    } catch {
      // private mode / blocked storage
    }
  }, []);

  const close = () => {
    setOpen(false);
    try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  };
  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : close());

  if (!open) return null;
  const S = STEPS[step];
  const Icon = S.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ background: 'rgba(22,41,30,0.55)' }}
      >
        <motion.div
          key={step}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
        >
          <div className="flex items-start justify-between px-5 pt-5 pb-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
              <Icon className="w-3 h-3" />
              {S.badge}
            </div>
            <button onClick={close} className="p-1.5 rounded-md text-slate-300 hover:text-slate-700 hover:bg-slate-50 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-5 pb-5">
            <h2 className="text-[20px] font-semibold text-emerald-900 leading-snug" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>
              {S.title}
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{S.body}</p>

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center gap-1">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`block h-1 rounded-full transition-all ${i === step ? 'w-6 bg-emerald-700' : 'w-1.5 bg-slate-200'}`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition"
              >
                {S.cta} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
