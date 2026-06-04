import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Users, Trophy, DollarSign, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

/**
 * "Request to Play" composer.
 *
 * Backed by social_posts.post_type='match_invite' — uses the existing match_invite
 * schema (play_date, play_start_time, play_end_time, spots_needed, spots_filled,
 * skill_min, skill_max, requires_payment, price_per_person). Players join via
 * social_post_participants rows.
 *
 * Opinionated form: skill chips, time picker, drop-in cap, optional cost.
 */
interface Props {
  facilityId?: string;
  onClose: () => void;
  onCreated?: (postId: string) => void;
}

const SKILL_OPTIONS = [
  { min: 2.5, max: 3.0, label: '2.5–3.0', color: 'sky' },
  { min: 3.0, max: 3.5, label: '3.0–3.5', color: 'emerald' },
  { min: 3.5, max: 4.0, label: '3.5–4.0', color: 'amber' },
  { min: 4.0, max: 4.5, label: '4.0–4.5', color: 'rose' },
  { min: 4.5, max: 5.0, label: '4.5+',    color: 'violet' },
];

export default function MatchRequestComposer({ facilityId, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('18:00');
  const [duration, setDuration] = useState(90); // minutes
  const [skill, setSkill] = useState(SKILL_OPTIONS[1]);
  const [spotsTotal, setSpotsTotal] = useState(4);
  const [cost, setCost] = useState(0);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endTime = (() => {
    const [h, m] = startTime.split(':').map(Number);
    const totalMin = h * 60 + m + duration;
    const eh = Math.floor(totalMin / 60) % 24;
    const em = totalMin % 60;
    return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
  })();

  const create = async () => {
    if (!user) { setError('Please sign in to post a request.'); return; }
    setSubmitting(true);
    setError(null);
    const content = note.trim() || `Looking for ${spotsTotal - 1} ${spotsTotal - 1 === 1 ? 'player' : 'players'} — ${skill.label}, ${duration} min`;
    const { data, error } = await supabase
      .from('social_posts')
      .insert({
        author_id: user.id,
        facility_id: facilityId ?? null,
        post_type: 'match_invite',
        content,
        visibility: 'facility',
        is_archived: false,
        media_urls: [],
        play_date: date,
        play_start_time: `${startTime}:00`,
        play_end_time: `${endTime}:00`,
        spots_needed: spotsTotal,
        spots_filled: 1, // host counts as filled
        skill_min: skill.min,
        skill_max: skill.max,
        requires_payment: cost > 0,
        price_per_person: cost > 0 ? cost : null,
        sport: 'pickleball',
      })
      .select('id')
      .single();
    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }
    // Host auto-joins as the first participant
    if (data?.id) {
      void supabase.from('social_post_participants').insert({
        post_id: data.id,
        user_id: user.id,
        status: 'going',
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
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="inline-flex w-8 h-8 rounded-xl bg-emerald-700 items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Manrope',serif" }}>
                Request to play
              </h2>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 sm:px-6 py-5 space-y-5">
            {/* Skill chips */}
            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5 mb-2">
                <Trophy className="w-3.5 h-3.5" /> Skill level
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_OPTIONS.map((s) => {
                  const active = skill.label === s.label;
                  return (
                    <button
                      key={s.label}
                      onClick={() => setSkill(s)}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
                        active
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date + time row */}
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Date
                </span>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Start
                </span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                />
              </label>
            </div>

            {/* Duration */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Duration</span>
                <span className="text-sm font-semibold text-slate-700">{duration} min · ends {endTime}</span>
              </div>
              <div className="flex gap-1.5">
                {[60, 75, 90, 120].map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold border transition ${
                      duration === d ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            {/* Spots + cost row */}
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Total players
                </span>
                <div className="flex items-center gap-1.5">
                  {[2,3,4,5,6,7,8].map(n => (
                    <button
                      key={n}
                      onClick={() => setSpotsTotal(n)}
                      className={`w-9 h-9 rounded-lg text-sm font-bold border transition ${
                        spotsTotal === n ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                      }`}
                    >{n}</button>
                  ))}
                </div>
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> Cost per player
                </span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={cost}
                    onChange={(e) => setCost(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">0 = free / split however you want</p>
              </label>
            </div>

            {/* Note */}
            <label className="block space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Add a note (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Looking for a 4.0 partner for tonight, Court 8 if available, beers after"
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed resize-none"
              />
            </label>

            {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</p>}
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button onClick={onClose} className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 transition">Cancel</button>
            <button
              onClick={create}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-sm disabled:opacity-60 transition"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</> : 'Post request'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
