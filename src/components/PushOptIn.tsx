import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pushSupported, pushPermission, pushSubscribe } from '../lib/webPush';
import { useAuth } from '../contexts/AuthContext';

const KEY = 'paddlegrid-push-prompted-v1';

/**
 * Non-intrusive toast asking permission to send push notifications.
 * Appears after the user has been in-app for >25 sec, only on browsers that
 * support push, only if they've never been asked.
 */
export default function PushOptIn() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!pushSupported()) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const seen   = window.localStorage.getItem(KEY);
      const perm   = await pushPermission();
      if (seen || perm === 'granted' || perm === 'denied') return;
      if (!cancelled) setOpen(true);
    }, 25_000);
    return () => { cancelled = true; clearTimeout(t); };
  }, [user]);

  const dismiss = (granted: boolean) => {
    setOpen(false);
    window.localStorage.setItem(KEY, granted ? 'granted' : 'dismissed');
  };

  const enable = async () => {
    const ok = await pushSubscribe();
    dismiss(ok);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed z-[55] left-3 right-3 sm:left-auto sm:right-6 sm:w-[360px] bottom-[88px] sm:bottom-6 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden"
        >
          <div className="flex items-start gap-3 p-4">
            <span className="inline-flex w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">Get pinged when it matters</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">A match opens at your level. Someone you follow posts. Your booking confirms. We'll keep it light.</p>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={enable} className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition">
                  Enable
                </button>
                <button onClick={() => dismiss(false)} className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-50 text-xs font-semibold transition">
                  Not now
                </button>
              </div>
            </div>
            <button onClick={() => dismiss(false)} className="p-1 -mt-1 -mr-1 rounded-md text-slate-300 hover:text-slate-700 hover:bg-slate-50 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
