import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Globe, Lock, Mail, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  facilityId?: string;
  onClose: () => void;
  onCreated?: (groupId: string) => void;
}

const VISIBILITY = [
  { value: 'public',      label: 'Public',      icon: Globe, hint: 'Anyone at the facility can find and join' },
  { value: 'invite_only', label: 'Invite-only', icon: Mail,  hint: 'Members can only join via your invite' },
  { value: 'private',     label: 'Private',     icon: Lock,  hint: 'Hidden from search; you control the roster' },
] as const;

export default function CreateGroupModal({ facilityId, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'invite_only' | 'private'>('public');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (!name.trim()) { setError('Give your group a name.'); return; }
    if (!user) { setError('Sign in first.'); return; }
    setSubmitting(true);
    setError(null);
    const { data, error } = await supabase
      .from('groups')
      .insert({
        facility_id: facilityId ?? null,
        name: name.trim(),
        description: description.trim() || null,
        visibility,
        owner_id: user.id,
        is_active: true,
      })
      .select('id')
      .single();
    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }
    if (data?.id) {
      await supabase.from('group_members').insert({
        group_id: data.id, user_id: user.id, role: 'owner',
      });
      onCreated?.(data.id);
    }
    setSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="inline-flex w-8 h-8 rounded-xl bg-emerald-700 items-center justify-center text-white"><Users className="w-4 h-4" /></span>
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Manrope',serif" }}>New group</h2>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 sm:px-6 py-5 space-y-5">
            <label className="block space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Thursday Night Crew"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What's this group about? Who's it for? When do you usually play?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed resize-none"
              />
            </label>

            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Visibility</span>
              <div className="space-y-1.5">
                {VISIBILITY.map((v) => {
                  const Icon = v.icon;
                  const active = visibility === v.value;
                  return (
                    <button
                      key={v.value}
                      onClick={() => setVisibility(v.value as any)}
                      className={`w-full text-left flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition ${
                        active ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold ${active ? 'text-emerald-900' : 'text-slate-900'}`}>{v.label}</div>
                        <div className="text-[11px] text-slate-500">{v.hint}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</p>}
          </div>

          <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button onClick={onClose} className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 transition">Cancel</button>
            <button
              onClick={create}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-sm disabled:opacity-60 transition"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create group'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
