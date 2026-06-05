import { useEffect, useState } from 'react';
import SponsorSlot from '../SponsorSlot';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Trophy, DollarSign, Plus, Loader2, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AvatarStack from '../AvatarStack';
import { useAuth } from '../../contexts/AuthContext';
import MatchRequestComposer from './MatchRequestComposer';

interface Request {
  id: string;
  author_id: string;
  content: string;
  play_date: string;
  play_start_time: string;
  play_end_time: string;
  spots_needed: number;
  spots_filled: number;
  participants?: { id: string; name: string | null; avatarUrl: string | null }[];
  skill_min: number | null;
  skill_max: number | null;
  requires_payment: boolean;
  price_per_person: number | null;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    profile_picture_url: string | null;
  } | null;
  joined: boolean;
}

interface Props {
  facilityId?: string;
  /** Optional filter — only show requests within the next N days */
  withinDays?: number;
}

/**
 * "Request to Play" discoverable board.
 *
 * Lists open match requests. Players can join with one click (writes to
 * social_post_participants + increments spots_filled). Card shows skill,
 * time, players, host avatar, and a join CTA.
 */
export default function MatchRequestsBoard({ facilityId, withinDays = 14 }: Props) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const horizon = new Date(Date.now() + withinDays * 86400000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    let q = supabase
      .from('social_posts')
      .select(`
        id, author_id, content, play_date, play_start_time, play_end_time,
        spots_needed, spots_filled, skill_min, skill_max, requires_payment, price_per_person, created_at,
        profiles!social_posts_author_id_fkey(id, full_name, profile_picture_url)
      `)
      .eq('post_type', 'match_invite')
      .eq('is_archived', false)
      .gte('play_date', today)
      .lte('play_date', horizon)
      .order('play_date', { ascending: true })
      .order('play_start_time', { ascending: true })
      .limit(40);
    if (facilityId) q = q.eq('facility_id', facilityId);
    const { data } = await q;
    const rows = (data || []) as unknown as Request[];

    // Check which the current user has already joined
    if (user && rows.length) {
      const ids = rows.map(r => r.id);
      const { data: parts } = await supabase
        .from('social_post_participants')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', ids);
      const joinedSet = new Set((parts || []).map((p: any) => p.post_id));
      rows.forEach(r => { r.joined = joinedSet.has(r.id); });
    }

    // Batched fetch of joined player avatars for every request shown
    if (rows.length) {
      const ids = rows.map(r => r.id);
      const { data: pRows } = await supabase
        .from('social_post_participants')
        .select('post_id, profiles!social_post_participants_user_id_fkey(id, full_name, profile_picture_url)')
        .in('post_id', ids)
        .limit(rows.length * 8);
      const participantsMap = new Map<string, { id: string; name: string | null; avatarUrl: string | null }[]>();
      ((pRows as any) || []).forEach((row: any) => {
        if (!row.profiles) return;
        const arr = participantsMap.get(row.post_id) || [];
        if (arr.length >= 5) return;
        arr.push({
          id: row.profiles.id,
          name: row.profiles.full_name,
          avatarUrl: row.profiles.profile_picture_url,
        });
        participantsMap.set(row.post_id, arr);
      });
      rows.forEach(r => { r.participants = participantsMap.get(r.id) || []; });
    }

    setRequests(rows);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [facilityId]);

  const join = async (req: Request) => {
    if (!user) return;
    if (req.joined) return;
    if (req.spots_filled >= req.spots_needed) return;
    setJoining(req.id);
    // Optimistic
    setRequests(rs => rs.map(r => r.id === req.id ? { ...r, joined: true, spots_filled: r.spots_filled + 1 } : r));
    const { error: pErr } = await supabase.from('social_post_participants').insert({
      post_id: req.id, user_id: user.id, status: 'going',
    });
    if (!pErr) {
      await supabase.from('social_posts').update({ spots_filled: req.spots_filled + 1 }).eq('id', req.id);
    } else {
      // Rollback
      setRequests(rs => rs.map(r => r.id === req.id ? { ...r, joined: false, spots_filled: req.spots_filled } : r));
    }
    setJoining(null);
  };

  const fmtDate = (d: string) => {
    const dt = new Date(d + 'T00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const tom = new Date(today.getTime() + 86400000);
    if (dt.toDateString() === today.toDateString()) return 'Today';
    if (dt.toDateString() === tom.toDateString()) return 'Tomorrow';
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  const fmtTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'pm' : 'am';
    const hh = h % 12 || 12;
    return `${hh}:${String(m).padStart(2, '0')}${period}`;
  };

  return (
    <div className="space-y-4">
      <SponsorSlot location="match_requests_top" facilityId={facilityId} />
      <div className="flex items-center justify-between px-4 sm:px-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Manrope',serif" }}>Request to play</h2>
          <p className="text-xs text-slate-500 mt-0.5">Open invites from the community. Tap to drop in.</p>
        </div>
        <button
          onClick={() => setComposerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New request</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[0,1,2].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse mx-3 sm:mx-0" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center mx-3 sm:mx-0">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-emerald-100 items-center justify-center text-emerald-700 mb-3">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">No open requests yet</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">Be the first to post — most requests fill within an hour.</p>
          <button
            onClick={() => setComposerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" /> Post a request
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {requests.map((r, idx) => {
            const open = r.spots_needed - r.spots_filled;
            const isFull = open <= 0;
            const isMine = user?.id === r.author_id;
            const skillLabel = r.skill_min !== null && r.skill_max !== null ? `${r.skill_min}–${r.skill_max}` : 'Any level';
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                className="rounded-2xl border border-slate-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden mx-3 sm:mx-0"
              >
                <div className="flex items-start gap-3 px-4 py-3.5">
                  {/* Host avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 ring-2 ring-white shadow-sm flex-shrink-0">
                    {r.profiles?.profile_picture_url ? (
                      <img src={r.profiles.profile_picture_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-800 text-white text-sm font-bold">
                        {r.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-slate-900 truncate">{r.profiles?.full_name || 'Member'}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wide">Request</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-snug line-clamp-2">{r.content}</p>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {fmtDate(r.play_date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {fmtTime(r.play_start_time)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-slate-400" />
                        {skillLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <AvatarStack
                          size="xs"
                          max={3}
                          members={[
                            { id: r.profiles?.id || r.author_id, name: r.profiles?.full_name || null, avatarUrl: r.profiles?.profile_picture_url || null },
                            ...(r.participants || []),
                          ]}
                          totalCount={r.spots_filled}
                        />
                        <span className="text-slate-600">{r.spots_filled}/{r.spots_needed}</span>
                      </span>
                      {r.requires_payment && r.price_per_person ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <DollarSign className="w-3.5 h-3.5" />
                          ${r.price_per_person.toFixed(0)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0">
                    {isMine ? (
                      <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold">Hosting</span>
                    ) : r.joined ? (
                      <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold">
                        <Check className="w-3.5 h-3.5" /> You're in
                      </span>
                    ) : isFull ? (
                      <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold">Full</span>
                    ) : (
                      <button
                        onClick={() => join(r)}
                        disabled={joining === r.id}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold disabled:opacity-60 transition"
                      >
                        {joining === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Drop in
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom progress bar */}
                <div className="h-1 bg-slate-100">
                  <div
                    className="h-1 bg-emerald-600 transition-all"
                    style={{ width: `${Math.min(100, (r.spots_filled / Math.max(r.spots_needed, 1)) * 100)}%` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {composerOpen && (
          <MatchRequestComposer
            facilityId={facilityId}
            onClose={() => setComposerOpen(false)}
            onCreated={() => load()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
