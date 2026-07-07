/**
 * Full-screen vertical live stream viewer (TikTok Shop style).
 *
 * Layout (top → bottom):
 *  - LIVE chip + viewer count + close (top safe area)
 *  - Streamer card (avatar + name + Pro badge + follow button)
 *  - Big spacer (the video underneath)
 *  - Featured product floating card (right side)
 *  - Chat overlay (left side, bottom 40%)
 *  - Heart-tap floating animation (right side, rising)
 *  - Bottom bar: chat input + heart button + product carousel toggle
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Send, ShoppingBag, Users, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  subscribeToStream, sendMessage, tapHeart,
  fetchRecentMessages, fetchStreamProducts,
  type LiveStreamMessage, type LiveStreamProduct,
} from '../../lib/liveStream';
import { purchase, PRODUCT_IDS } from '../../lib/iap';

interface Session {
  id: string;
  title: string;
  video_url: string | null;
  pro_id: string;
  viewer_count_peak: number;
  like_count: number;
  is_live: boolean;
  pro?: { id: string; full_name: string; profile_picture_url: string | null };
}

interface FloatingHeart { id: number; x: number; }

export default function LiveStreamViewer({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<LiveStreamMessage[]>([]);
  const [products, setProducts] = useState<LiveStreamProduct[]>([]);
  const [viewerCount, setViewerCount] = useState(1);
  const [draft, setDraft] = useState('');
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [showProducts, setShowProducts] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const heartIdRef = useRef(0);

  // Load session metadata + recent chat + products
  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('pro_live_sessions')
        .select('id, title, video_url, pro_id, viewer_count_peak, like_count, is_live')
        .eq('id', sessionId).single();
      if (!data) return;
      // Hydrate the streamer (two-step — pro_id refs auth.users)
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url')
        .eq('id', data.pro_id).single();
      setSession({ ...data, pro: prof || undefined });

      const recent = await fetchRecentMessages(sessionId, 30);
      setMessages(recent);

      const prods = await fetchStreamProducts(sessionId);
      setProducts(prods);
    })();
  }, [sessionId]);

  // Subscribe to realtime
  useEffect(() => {
    if (!sessionId) return;
    const ch = subscribeToStream(sessionId, {
      onMessage: (m) => setMessages((prev) => [...prev.slice(-49), m]),
      onLike: () => spawnHeart(),
      onSessionUpdate: (changes) => {
        if ('like_count' in changes || 'viewer_count_peak' in changes) {
          setSession((s) => s ? { ...s, ...changes } as Session : s);
        }
      },
      onPresenceSync: (count) => setViewerCount(Math.max(1, count)),
    });
    return () => { void ch.unsubscribe(); };
  }, [sessionId]);

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  function spawnHeart() {
    const id = ++heartIdRef.current;
    setHearts((h) => [...h, { id, x: 60 + Math.random() * 30 }]);
    setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 2400);
  }

  const onHeartTap = () => {
    spawnHeart();
    void tapHeart(sessionId);
  };

  const onSend = async () => {
    if (!draft.trim() || !user) return;
    const body = draft;
    setDraft('');
    await sendMessage(sessionId, body);
  };

  const featured = useMemo(() => products.find((p) => p.is_featured) || products[0], [products]);

  const onBuy = async (p: LiveStreamProduct) => {
    if (!p.product) return;
    setPurchasing(p.product_id);
    // Affiliate products → open the external link. Digital goods → IAP.
    if (p.product.affiliate_url) {
      window.open(p.product.affiliate_url, '_blank');
      setPurchasing(null);
      return;
    }
    // For digital, route through iap.ts (StoreKit on iOS, Stripe on web)
    const result = await purchase(PRODUCT_IDS.COACHING_SESSION as any);
    setPurchasing(null);
    if (!result.ok && result.error !== 'cancelled') alert(result.error);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black text-white flex flex-col overflow-hidden">
      {/* Video layer */}
      {session?.video_url ? (
        <video
          ref={videoRef}
          src={session.video_url}
          autoPlay loop playsInline muted={false}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1F3A2B] via-[#16291E] to-black flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-amber-400/40 animate-pulse" />
        </div>
      )}
      {/* Top gradient shade + bottom gradient shade for text legibility */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

      {/* ============ TOP CHROME ============ */}
      <div className="relative z-10 flex items-center gap-2 p-3 pt-safe-top">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-600 text-white text-[10px] font-extrabold tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-sm text-[11px] font-bold">
          <Users className="w-3 h-3" /> {viewerCount.toLocaleString()}
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-sm text-[11px] font-bold">
          <Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> {session?.like_count?.toLocaleString() || 0}
        </div>
        <div className="flex-1" />
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center active:scale-95 transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Streamer card */}
      {session?.pro && (
        <div className="relative z-10 mx-3 mt-1 inline-flex self-start items-center gap-2.5 px-3 py-2 rounded-full bg-black/45 backdrop-blur-md max-w-[80%]">
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
            {session.pro.profile_picture_url
              ? <img src={session.pro.profile_picture_url} alt={session.pro.full_name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center bg-amber-500 text-[#16291E] font-bold text-sm">{session.pro.full_name?.[0] || '?'}</div>}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold truncate" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>{session.pro.full_name}</p>
              <span className="px-1 py-0.5 bg-amber-500 text-[#16291E] rounded text-[8px] font-extrabold tracking-wider">PRO</span>
            </div>
            <p className="text-[10px] text-white/60 truncate">{session.title}</p>
          </div>
          <button className="ml-1 px-3 py-1 rounded-full bg-amber-400 text-[#16291E] text-[10px] font-extrabold tracking-wider active:scale-95 transition">
            FOLLOW
          </button>
        </div>
      )}

      {/* ============ FEATURED PRODUCT FLOATING CARD ============ */}
      <AnimatePresence>
        {featured?.product && !showProducts && (
          <motion.button
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={() => onBuy(featured)}
            className="absolute right-3 bottom-[36%] z-10 w-[140px] rounded-2xl bg-white/95 backdrop-blur-md text-left p-2 shadow-2xl active:scale-95 transition"
          >
            <div className="w-full aspect-square rounded-lg bg-slate-100 overflow-hidden mb-1.5">
              {featured.product.image_url
                ? <img src={featured.product.image_url} alt={featured.product.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-amber-200 to-amber-400" />}
            </div>
            <p className="text-[10px] text-[#B45309] font-extrabold tracking-wider uppercase">{featured.product.brand || 'Featured'}</p>
            <p className="text-xs font-bold text-slate-900 truncate">{featured.product.title}</p>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-sm font-extrabold text-slate-900">${((featured.product.price_cents || 0) / 100).toFixed(2)}</p>
              <span className="px-2 py-0.5 bg-[#16291E] text-amber-300 rounded-full text-[9px] font-extrabold tracking-wider">
                {purchasing === featured.product_id ? '...' : 'BUY'}
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ============ FLOATING HEARTS ============ */}
      <div className="absolute right-2 bottom-32 w-20 h-80 pointer-events-none z-10 overflow-hidden">
        <AnimatePresence>
          {hearts.map((h) => (
            <motion.div
              key={h.id}
              initial={{ y: 0, opacity: 1, scale: 0.6 }}
              animate={{ y: -260, opacity: 0, scale: 1.1, x: [0, 8, -6, 4, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              style={{ left: `${h.x}%` }}
              className="absolute bottom-0"
            >
              <Heart className="w-6 h-6 text-rose-400 fill-rose-400 drop-shadow-md" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ============ CHAT OVERLAY ============ */}
      <div ref={chatScrollRef} className="relative z-10 flex-1 overflow-y-auto px-3 pb-2 mt-auto max-h-[40%] flex flex-col justify-end gap-1.5"
           style={{ scrollbarWidth: 'none' }}>
        {messages.slice(-12).map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-2 max-w-[78%]"
          >
            <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 overflow-hidden">
              {m.profiles?.profile_picture_url
                ? <img src={m.profiles.profile_picture_url} alt={m.profiles.full_name} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-amber-400 flex items-center justify-center text-[#16291E] font-bold text-[10px]">{m.profiles?.full_name?.[0] || '?'}</div>}
            </div>
            <div className="bg-black/45 backdrop-blur-sm rounded-2xl px-3 py-1.5">
              <p className="text-[10px] font-bold text-amber-300 leading-none mb-0.5">{m.profiles?.full_name || 'Guest'}</p>
              <p className="text-xs text-white leading-snug break-words">{m.body}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ============ BOTTOM BAR ============ */}
      <div className="relative z-10 flex items-center gap-2 p-3 pb-safe-bottom">
        <div className="flex-1 flex items-center bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 280))}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder="Add a comment..."
            className="bg-transparent flex-1 text-sm placeholder-white/40 focus:outline-none"
          />
          {draft && (
            <button onClick={onSend} className="text-amber-300 active:scale-90 transition">
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowProducts(true)}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center relative active:scale-90 transition"
          aria-label="Browse products"
        >
          <ShoppingBag className="w-5 h-5" />
          {products.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-400 text-[#16291E] text-[9px] font-extrabold rounded-full flex items-center justify-center">
              {products.length}
            </span>
          )}
        </button>
        <button
          onClick={onHeartTap}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-90 transition"
          aria-label="Heart"
        >
          <Heart className="w-5 h-5 text-rose-400" />
        </button>
      </div>

      {/* ============ PRODUCT CAROUSEL SHEET ============ */}
      <AnimatePresence>
        {showProducts && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="absolute inset-x-0 bottom-0 z-20 bg-[#0d1812] rounded-t-3xl pt-3 pb-safe-bottom max-h-[70%] flex flex-col"
          >
            <div className="w-10 h-1 bg-white/20 rounded-full self-center mb-3" />
            <div className="px-5 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-amber-200" style={{ fontFamily: "'Cinzel','Trajan Pro',serif", letterSpacing: '0.04em' }}>
                In this stream
              </h3>
              <button onClick={() => setShowProducts(false)} className="text-white/60">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
              {products.map((p) => (
                <div key={p.product_id} className="bg-white/5 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-white/10 overflow-hidden flex-shrink-0">
                    {p.product?.image_url
                      ? <img src={p.product.image_url} alt={p.product.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-amber-300 to-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-amber-300 font-extrabold tracking-wider uppercase">{p.product?.brand}</p>
                    <p className="text-sm font-bold truncate">{p.product?.title}</p>
                    <p className="text-xs text-white/60 mt-0.5">${((p.product?.price_cents || 0) / 100).toFixed(2)} · {p.units_sold} sold</p>
                  </div>
                  <button onClick={() => onBuy(p)} className="px-4 py-2 rounded-full bg-amber-400 text-[#16291E] text-xs font-extrabold tracking-wider active:scale-95 transition">
                    {purchasing === p.product_id ? '...' : 'BUY'}
                  </button>
                </div>
              ))}
              {products.length === 0 && (
                <p className="text-sm text-white/50 text-center py-8">No products in this stream yet.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
