import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Heart, X, MapPin, Sparkles, Loader2, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ProBadge from './social/ProBadge';

interface Card {
  id: string;
  full_name: string;
  profile_picture_url: string | null;
  skill_level: number | null;
  bio?: string | null;
  city?: string | null;
  is_pro: boolean | null;
  recent_wins?: number;
}

/**
 * Tinder-style swipe deck for finding a playing partner.
 * Swipe right = "want to play", swipe left = pass. Right swipes create a
 * social_follow row + open a match-invite composer; mutual right = "It's a match".
 */
export default function SwipePartnerDeck({ facilityId }: { facilityId?: string }) {
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [matched, setMatched] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState<'any' | '2.5-3.0' | '3.0-3.5' | '3.5-4.0' | '4.0+'>('any');

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('profiles')
      .select('id, full_name, profile_picture_url, skill_level, bio, city, is_pro')
      .neq('id', user?.id || '00000000-0000-0000-0000-000000000000')
      .not('profile_picture_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (skill !== 'any') {
      const [lo, hi] = skill.endsWith('+') ? [4.0, 7.0] : skill.split('-').map(Number);
      q = q.gte('skill_level', lo).lte('skill_level', hi);
    }
    const { data } = await q;
    setCards(((data as any) || []).filter((c: Card) => c.full_name) as Card[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, [skill, user?.id]);

  const top = cards[0];
  const peek = cards[1];

  const swipe = async (dir: 'left' | 'right') => {
    if (!top) return;
    const card = top;
    setCards((cs) => cs.slice(1));
    if (dir === 'right' && user) {
      const { error } = await supabase.from('social_follows').upsert({ follower_id: user.id, following_id: card.id }, { onConflict: 'follower_id,following_id' });
      if (!error) {
        // Check mutual
        const { data: mutual } = await supabase
          .from('social_follows')
          .select('follower_id')
          .eq('follower_id', card.id)
          .eq('following_id', user.id)
          .maybeSingle();
        if (mutual) setMatched(card);
      }
    }
  };

  return (
    <div className="px-4 sm:px-6 py-4 max-w-md mx-auto">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Find a partner</h1>
        <p className="text-xs text-slate-500 mt-0.5">Swipe right if you'd play. Mutual = it's a match.</p>
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {(['any','2.5-3.0','3.0-3.5','3.5-4.0','4.0+'] as const).map(s => (
          <button key={s} onClick={() => setSkill(s)} className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition flex-shrink-0 ${skill === s ? 'bg-emerald-800 text-white' : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="relative h-[480px] w-full">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : !top ? (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6">
            <div>
              <Sparkles className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No more partners at this level</p>
              <p className="text-xs text-slate-500 mt-1">Try a different skill range, or check back tomorrow.</p>
            </div>
          </div>
        ) : (
          <>
            {peek && <SwipeCard key={peek.id} card={peek} stacked />}
            <AnimatePresence>
              <SwipeCard key={top.id} card={top} onSwipe={swipe} />
            </AnimatePresence>
          </>
        )}
      </div>

      {top && (
        <div className="flex items-center justify-center gap-6 mt-5">
          <button onClick={() => swipe('left')} className="w-14 h-14 rounded-full bg-white ring-2 ring-rose-300 text-rose-600 flex items-center justify-center hover:bg-rose-50 transition shadow-sm">
            <X className="w-7 h-7" />
          </button>
          <button onClick={() => swipe('right')} className="w-14 h-14 rounded-full bg-emerald-700 text-white flex items-center justify-center hover:bg-emerald-800 transition shadow-md">
            <Heart className="w-7 h-7 fill-white" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {matched && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6"
            style={{ background: 'rgba(22,41,30,0.7)' }}>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }}
              className="text-center text-white max-w-xs">
              <Sparkles className="w-12 h-12 text-amber-300 mx-auto mb-3" />
              <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>It's a match!</h2>
              <p className="text-sm text-emerald-100 mb-5">{matched.full_name} wants to play too. Say hi or send a match invite.</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setMatched(null)} className="px-4 py-2 rounded-xl bg-white/10 ring-1 ring-white/20 text-sm font-bold">Keep swiping</button>
                <button onClick={() => setMatched(null)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold">Send message</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SwipeCard({ card, onSwipe, stacked }: { card: Card; onSwipe?: (d: 'left' | 'right') => void; stacked?: boolean }) {
  const onDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) onSwipe?.(info.offset.x > 0 ? 'right' : 'left');
  };
  return (
    <motion.div
      drag={!stacked ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={onDragEnd}
      initial={stacked ? { scale: 0.95, y: 8 } : { x: 0, opacity: 1 }}
      animate={stacked ? { scale: 0.95, y: 8 } : { x: 0, opacity: 1 }}
      exit={{ x: 600, opacity: 0, rotate: 12 }}
      whileDrag={{ rotate: 0 }}
      style={{ position: 'absolute', inset: 0, transformOrigin: 'center bottom' }}
      className="rounded-3xl overflow-hidden shadow-xl ring-1 ring-slate-200/60 bg-white"
    >
      <div className="relative h-full">
        {card.profile_picture_url
          ? <img src={card.profile_picture_url} alt={card.full_name} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          : <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 to-emerald-900" />}
        <div className="absolute inset-x-0 bottom-0 p-5 text-white"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))' }}>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>{card.full_name}</h3>
            <ProBadge isPro={card.is_pro} size="sm" />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[12px] mb-2">
            {card.skill_level && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/15 ring-1 ring-white/10"><Trophy className="w-3 h-3" /> {card.skill_level.toFixed(1)}</span>}
            {card.city && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10"><MapPin className="w-3 h-3" /> {card.city}</span>}
          </div>
          {card.bio && <p className="text-[13px] line-clamp-2 leading-relaxed text-white/90">{card.bio}</p>}
        </div>
      </div>
    </motion.div>
  );
}
