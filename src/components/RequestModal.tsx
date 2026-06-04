import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Check, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  proId?: string;
  proName?: string;
  facilityId?: string;
  facilityName?: string;
  kind: 'lesson' | 'clinic' | 'ambassador_invite';
}

const labels = {
  lesson: {
    title: 'Book a lesson',
    sub: (name?: string) => `Request a private session with ${name ?? 'this pro'}.`,
    placeholder: 'Tell them what you want to work on — backhand, third-shot drop, dinking strategy…',
    cta: 'Send request',
  },
  clinic: {
    title: 'Request a clinic',
    sub: (name?: string) => `Invite ${name ?? 'this pro'} to run a clinic. They'll coordinate with you on dates and group size.`,
    placeholder: 'How many players, target skill range, what you want covered…',
    cta: 'Send clinic request',
  },
  ambassador_invite: {
    title: 'Invite as ambassador',
    sub: (name?: string) => `Invite ${name ?? 'this pro'} to be a PaddleGrid Pro in residence at your facility.`,
    placeholder: 'Optional message — proposed title, terms, timeline.',
    cta: 'Send invitation',
  },
} as const;

export default function RequestModal({ open, onClose, proId, proName, facilityId, facilityName, kind }: Props) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!user) return;
    setSending(true);
    const { error } = await supabase.from('lesson_requests').insert({
      requester_id: user.id,
      pro_id: proId || null,
      facility_id: facilityId || null,
      kind,
      message: message.trim() || null,
      preferred_date: date || null,
    });
    setSending(false);
    if (!error) {
      setSent(true);
      setTimeout(() => { onClose(); setSent(false); setMessage(''); setDate(''); }, 1400);
    }
  };

  const L = labels[kind];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>{L.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-snug max-w-sm">{L.sub(proName || facilityName)}</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-3">
              {kind !== 'ambassador_invite' && (
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Preferred date</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().substring(0, 10)}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900"
                  />
                </label>
              )}

              <label className="block">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder={L.placeholder}
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed resize-none"
                />
              </label>

              <button
                onClick={send}
                disabled={sending || sent || !user}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold disabled:opacity-50 transition"
              >
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : sent ? <><Check className="w-4 h-4" /> Sent</>
                  : <><Send className="w-4 h-4" /> {L.cta}</>}
              </button>
              {!user && <p className="text-xs text-slate-400 text-center">Sign in to send a request.</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
