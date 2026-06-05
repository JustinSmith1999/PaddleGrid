import { useEffect, useState } from 'react';
import { Star, Loader2, Plus, X } from 'lucide-react';
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

export default function ReviewsTab({ facilityId, facilityName }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

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

  const avg = reviews.length ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="text-2xl font-bold text-slate-900">{avg ? avg.toFixed(1) : '—'}</span>
            <span className="text-sm text-slate-500">({reviews.length} review{reviews.length === 1 ? '' : 's'})</span>
          </div>
        </div>
        {user && (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition">
            <Plus className="w-3.5 h-3.5" /> Write a review
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-10 flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-10 text-center">
          <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-700 font-semibold">No reviews yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Be the first to leave a review for {facilityName}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-slate-200/60 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                  {r.profiles?.profile_picture_url
                    ? <img src={r.profiles.profile_picture_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-bold text-xs">{r.profiles?.full_name?.[0] || '?'}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{r.profiles?.full_name || 'Member'}</p>
                    <div className="flex items-center">
                      {[1,2,3,4,5].map(n => <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />)}
                    </div>
                  </div>
                  {r.title && <p className="text-sm font-semibold text-slate-800 mt-1">{r.title}</p>}
                  {r.content && <p className="text-sm text-slate-600 mt-1 leading-relaxed">{r.content}</p>}
                  <p className="text-[11px] text-slate-400 mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && <WriteReviewModal facilityId={facilityId} facilityName={facilityName} onClose={() => setOpen(false)} onSubmitted={load} />}
    </div>
  );
}

function WriteReviewModal({ facilityId, facilityName, onClose, onSubmitted }: { facilityId: string; facilityName: string; onClose: () => void; onSubmitted: () => void }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user || !rating) return;
    setBusy(true);
    const { error } = await supabase.from('facility_reviews').insert({
      facility_id: facilityId,
      user_id: user.id,
      rating,
      title: title || null,
      content: content || null,
    });
    setBusy(false);
    if (!error) { onSubmitted(); onClose(); }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(22,41,30,0.55)' }}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-5">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Review {facilityName}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-300 hover:text-slate-700 hover:bg-slate-50"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-1 mb-4">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)} className="p-0.5">
              <Star className={`w-7 h-7 transition-colors ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
            </button>
          ))}
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="One-line summary (optional)" className="w-full px-3 py-2 mb-2 rounded-xl border border-slate-200 text-sm" />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What was it like?" rows={4} className="w-full px-3 py-2 mb-3 rounded-xl border border-slate-200 text-sm resize-none" />
        <button onClick={submit} disabled={busy || !rating} className="w-full px-4 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm disabled:opacity-60">
          {busy ? 'Posting…' : 'Post review'}
        </button>
      </div>
    </div>
  );
}
