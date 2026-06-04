import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PollPostProps {
  postId: string;
  question: string;
  options: string[];
}

interface VoteRow {
  option_index: number;
  user_id: string;
}

export default function PollPost({ postId, question, options }: PollPostProps) {
  const { user } = useAuth();
  const [tallies, setTallies] = useState<number[]>(options.map(() => 0));
  const [myVote, setMyVote] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('poll_votes')
        .select('option_index, user_id')
        .eq('post_id', postId);
      if (!mounted) return;
      if (error) { setLoaded(true); return; }
      const rows = (data || []) as VoteRow[];
      const next = options.map(() => 0);
      for (const r of rows) {
        if (r.option_index >= 0 && r.option_index < next.length) next[r.option_index]++;
      }
      setTallies(next);
      const mine = user ? rows.find((r) => r.user_id === user.id) : undefined;
      setMyVote(mine ? mine.option_index : null);
      setLoaded(true);
    })();
    return () => { mounted = false; };
  }, [postId, options.length, user?.id]);

  const total = tallies.reduce((a, b) => a + b, 0);

  const vote = async (optionIndex: number) => {
    if (!user) return;
    if (myVote === optionIndex) return;
    setSubmitting(optionIndex);
    const prevVote = myVote;
    // Optimistic update
    const next = [...tallies];
    if (prevVote !== null) next[prevVote] = Math.max(0, next[prevVote] - 1);
    next[optionIndex] = next[optionIndex] + 1;
    setTallies(next);
    setMyVote(optionIndex);
    // Upsert by (post_id, user_id) unique key
    const { error } = await supabase
      .from('poll_votes')
      .upsert(
        { post_id: postId, user_id: user.id, option_index: optionIndex },
        { onConflict: 'post_id,user_id' }
      );
    if (error) {
      // Rollback
      setTallies(tallies);
      setMyVote(prevVote);
      console.error('Vote failed', error);
    }
    setSubmitting(null);
  };

  return (
    <div
      className="w-full rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50/40 to-white p-4 sm:p-5 space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold tracking-wide uppercase">Poll</div>
        <span className="text-xs text-slate-400">{total} {total === 1 ? 'vote' : 'votes'}</span>
      </div>
      <p
        className="text-[15px] sm:text-base font-semibold text-slate-900 leading-snug"
        style={{ fontFamily: 'Manrope, sans-serif' }}
      >
        {question}
      </p>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const count = tallies[i] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const selected = myVote === i;
          const showResults = myVote !== null || !user;
          const disabled = submitting !== null || !user;
          return (
            <button
              key={i}
              onClick={() => vote(i)}
              disabled={disabled}
              className={`group relative w-full text-left rounded-xl border transition-all duration-150 overflow-hidden
                ${selected ? 'border-emerald-400 bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-emerald-300'}
                ${disabled && !selected ? 'opacity-80' : ''}
                ${!user ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {/* Fill bar */}
              {showResults && (
                <motion.div
                  className={`absolute inset-y-0 left-0 ${selected ? 'bg-emerald-100' : 'bg-slate-100'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              )}
              <div className="relative flex items-center justify-between gap-3 px-4 py-2.5 sm:py-3">
                <div className="flex items-center gap-2 min-w-0">
                  {selected && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <span className={`text-sm ${selected ? 'font-semibold text-slate-900' : 'text-slate-700'} truncate`}>
                    {opt}
                  </span>
                  {submitting === i && (
                    <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin flex-shrink-0" />
                  )}
                </div>
                {showResults && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-500 tabular-nums">{count}</span>
                    <span className={`text-xs font-semibold tabular-nums ${selected ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {pct}%
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {!user && (
        <p className="text-[11px] text-slate-400 mt-1">Sign in to cast your vote</p>
      )}
      {myVote !== null && user && (
        <p className="text-[11px] text-emerald-700 mt-1">Your vote is in. Tap another option to change it.</p>
      )}
      {!loaded && user && (
        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Loading votes…</p>
      )}
    </div>
  );
}
