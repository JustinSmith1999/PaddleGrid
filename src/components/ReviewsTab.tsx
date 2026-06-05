import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Loader2, Plus, X, Check, Smile, ImagePlus, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  profiles?: { id: string; full_name: string; profile_picture_url?: string | null };
}

interface Props { facilityId: string; facilityName: string }

const PROMPTS = ['Coaching quality', 'Court conditions', 'Vibe', 'Booking experience', 'Value', 'Pro shop'];

export default function ReviewsTab({ facilityId, facilityName }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(5);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('facility_reviews')
      .select('id, rating, title, content, created_at, profiles!facility_reviews_user_id_fkey(id, full_name, profile_picture_url)')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false })
      .limit(50);
    setReviews((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, [facilityId]);

  const stats = useMemo(() => {
    if (!reviews.length) return null;
    const total = reviews.length;
    const avg = reviews.reduce((s, r) => s + (r.rating || 0), 0) / total;
    const buckets = [0, 0, 0, 0, 0];
    for (const r of reviews) if (r.rating >= 1 && r.rating <= 5) buckets[5 - r.rating] += 1;
    return { total, avg, buckets };
  }, [reviews]);

  return (
    <div className="space-y-4">
      {/* Summary header */}
      {loading ? <SummarySkeleton /> : stats ? (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-4">
          <div className="flex items-start gap-4">
            <div className="text-center flex-shrink-0">
              <p className="text-4xl font-bold text-slate-900 leading-none tabular-nums" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>{stats.avg.toFixed(1)}</p>
              <div className="flex items-center justify-center gap-0.5 mt-1.5">
                {[1,2,3,4,5].map(n => <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(stats.avg) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">{stats.total} review{stats.total === 1 ? '' : 's'}</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {stats.buckets.map((count, i) => {
                const stars = 5 - i;
                const pct = stats.total ? (count / stats.total) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2.5 text-[11px]">
                    <span className="w-2.5 text-slate-500 font-bold tabular-nums">{stars}</span>
                    <Star className="w-2.5 h-2.5 text-slate-300 fill-slate-300" />
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-slate-400 tabular-nums text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {user && (
            <button onClick={() => setOpen(true)}
              className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition active:scale-[0.99]">
              <Plus className="w-3.5 h-3.5" /> Write a review
            </button>
          )}
        </div>
      ) : null}

      {loading ? (
        <ReviewsListSkeleton />
      ) : reviews.length === 0 ? (
        <EmptyReviews facilityName={facilityName} canWrite={!!user} onWrite={() => setOpen(true)} />
      ) : (
        <>
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {reviews.slice(0, visible).map((r, i) => <ReviewCard key={r.id} r={r} delay={i * 0.02} />)}
            </AnimatePresence>
          </div>
          {visible < reviews.length && (
            <button onClick={() => setVisible(v => v + 10)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition">
              Show {Math.min(10, reviews.length - visible)} more
            </button>
          )}
        </>
      )}

      {open && <WriteReviewModal facilityId={facilityId} facilityName={facilityName} onClose={() => setOpen(false)} onSubmitted={load} />}
    </div>
  );
}

function ReviewCard({ r, delay }: { r: Review; delay: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-2xl border border-slate-200/60 bg-white p-4 hover:border-slate-300/70 hover:shadow-[0_6px_18px_rgba(22,41,30,0.04)] transition"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex-shrink-0">
          {r.profiles?.profile_picture_url
            ? <img src={r.profiles.profile_picture_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-bold text-xs">{r.profiles?.full_name?.[0] || '?'}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-900">{r.profiles?.full_name || 'Member'}</p>
            <div className="flex items-center">
              {[1,2,3,4,5].map(n => <Star key={n} className={`w-3 h-3 ${n <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />)}
            </div>
            <span className="text-[10px] text-slate-400">·</span>
            <span className="text-[10px] text-slate-400 tabular-nums">{relTime(r.created_at)}</span>
          </div>
          {r.title && <p className="text-sm font-semibold text-slate-900 mt-1.5">{r.title}</p>}
          {r.content && <p className="text-sm text-slate-600 mt-1 leading-relaxed">{r.content}</p>}
        </div>
      </div>
    </motion.article>
  );
}

function WriteReviewModal({ facilityId, facilityName, onClose, onSubmitted }: { facilityId: string; facilityName: string; onClose: () => void; onSubmitted: () => void }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'rate' | 'write' | 'success'>('rate');

  const submit = async () => {
    if (!user || !rating) return;
    setBusy(true);
    const fullTitle = title || (tags.length ? `Loved: ${tags.join(', ')}` : null);
    const { error } = await supabase.from('facility_reviews').insert({
      facility_id: facilityId,
      user_id: user.id,
      rating,
      title: fullTitle,
      content: content || null,
    });
    setBusy(false);
    if (!error) { setStep('success'); setTimeout(() => { onSubmitted(); onClose(); }, 1200); }
  };

  const displayRating = hover || rating;
  const ratingLabel = displayRating === 0 ? 'Tap a star' : ['', 'Not great', 'Could be better', 'Good', 'Great', 'Loved it'][displayRating];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center sm:p-4 bg-black/55 backdrop-blur-sm">
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[88vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl">

        <div className="relative px-5 pt-5 pb-3 bg-gradient-to-br from-amber-50 via-white to-white">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white/60"><X className="w-4 h-4" /></button>
          <p className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-amber-700">Review</p>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>{facilityName}</h2>
        </div>

        {step === 'rate' && (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-slate-600 mb-4">How was your visit?</p>
            <div className="flex items-center justify-center gap-1.5 mb-2">
              {[1,2,3,4,5].map(n => (
                <button key={n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1 transition active:scale-[0.9]"
                >
                  <Star className={`w-9 h-9 transition-colors ${n <= displayRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 hover:text-amber-200'}`} />
                </button>
              ))}
            </div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-amber-700 h-4">{ratingLabel}</p>
            <button onClick={() => setStep('write')} disabled={!rating}
              className="mt-5 w-full px-4 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold disabled:opacity-50 transition">
              Continue
            </button>
          </div>
        )}

        {step === 'write' && (
          <>
            <div className="px-5 py-4 space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">What did you love?</p>
                <div className="flex flex-wrap gap-1.5">
                  {PROMPTS.map(t => {
                    const on = tags.includes(t);
                    return (
                      <button key={t}
                        onClick={() => setTags(s => on ? s.filter(x => x !== t) : [...s, t])}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${on ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}`}>
                        {on && <Check className="w-3 h-3" />}
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="One-line summary (optional)"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-700" />

              <textarea value={content} onChange={(e) => setContent(e.target.value)}
                placeholder="Anything specific? Tell other players what to expect."
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:border-emerald-700" />

              <button disabled className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 text-slate-400 text-[11px] font-bold cursor-not-allowed">
                <ImagePlus className="w-3.5 h-3.5" /> Add photos (coming soon)
              </button>
            </div>
            <div className="px-5 pb-5">
              <button onClick={submit} disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold disabled:opacity-60 transition active:scale-[0.98]">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smile className="w-4 h-4" />}
                Post review
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="px-5 py-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 ring-4 ring-emerald-50 mb-3">
              <Check className="w-7 h-7 text-emerald-700" strokeWidth={3} />
            </div>
            <p className="text-base font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Thanks for your review</p>
            <p className="text-xs text-slate-500 mt-1">It'll help other players find the right court.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function EmptyReviews({ facilityName, canWrite, onWrite }: { facilityName: string; canWrite: boolean; onWrite: () => void }) {
  return (
    <div className="rounded-3xl border border-amber-100/60 bg-gradient-to-br from-amber-50/40 to-white p-10 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 ring-4 ring-amber-50/60 mb-3">
        <MessageCircle className="w-7 h-7 text-amber-700" />
      </div>
      <p className="text-base font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Be the first to review</p>
      <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Share what you loved (or what could be better) about {facilityName}.</p>
      {canWrite && (
        <button onClick={onWrite} className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition">
          <Plus className="w-3.5 h-3.5" /> Write a review
        </button>
      )}
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-4">
      <div className="flex items-start gap-4">
        <div className="space-y-2 text-center flex-shrink-0">
          <div className="h-9 w-12 bg-slate-100 rounded-md mx-auto animate-pulse" />
          <div className="h-2.5 w-16 bg-slate-100 rounded-full mx-auto animate-pulse" />
          <div className="h-2 w-14 bg-slate-100 rounded-full mx-auto animate-pulse" />
        </div>
        <div className="flex-1 space-y-1.5">
          {[0,1,2,3,4].map(i => <div key={i} className="h-2 bg-slate-100 rounded-full animate-pulse" style={{ width: `${100 - i * 8}%` }} />)}
        </div>
      </div>
    </div>
  );
}

function ReviewsListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map(i => (
        <div key={i} className="rounded-2xl border border-slate-200/60 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-3 w-1/2 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-2.5 w-full bg-slate-100 rounded-full animate-pulse" />
              <div className="h-2.5 w-3/4 bg-slate-100 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86400_000;
  if (diff < day) return 'today';
  if (diff < 2 * day) return 'yesterday';
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  if (diff < 30 * day) return `${Math.floor(diff / (7 * day))}w ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', year: 'numeric' });
}
