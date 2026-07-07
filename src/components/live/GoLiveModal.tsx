/**
 * Streamer "Go Live" flow.
 *
 * Path A (fake-live): Pro picks a pre-recorded video, types a title, picks
 * products to feature, taps Go Live. We upload the video to Supabase Storage,
 * create the pro_live_sessions row with is_live=true + video_url, attach
 * products, then call an edge function to push to followers.
 *
 * When you swap to real WebRTC streaming (Mux/Cloudflare/LiveKit), this same
 * flow asks for camera+mic permission instead and starts an RTMP push.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Video, X, Sparkles, ChevronRight, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Capacitor } from '@capacitor/core';

interface Product {
  id: string;
  title: string;
  price_cents: number;
  image_url: string | null;
  brand: string | null;
}

interface Props {
  onClose: () => void;
  onLive: (sessionId: string) => void;
}

export default function GoLiveModal({ onClose, onLive }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<'title' | 'video' | 'products' | 'uploading' | 'live'>('title');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from('pro_products')
        .select('id, title, price_cents, image_url, brand')
        .eq('pro_id', user.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      setProducts((data as Product[]) || []);
    })();
  }, [user]);

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const goLive = async () => {
    if (!user || !videoFile) return;
    setStep('uploading');
    setError(null);
    try {
      // 1. Upload video to live-streams bucket under user_id/<ts>.mp4
      const ts = Date.now();
      const ext = videoFile.name.split('.').pop() || 'mp4';
      const path = `${user.id}/${ts}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('live-streams')
        .upload(path, videoFile, { upsert: false, contentType: videoFile.type || 'video/mp4' });
      if (upErr) throw upErr;
      setUploadPct(80);

      const { data: pub } = supabase.storage.from('live-streams').getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      // 2. Create session row
      const { data: session, error: sErr } = await supabase
        .from('pro_live_sessions')
        .insert({
          pro_id: user.id,
          title: title || 'Going live',
          description: description || null,
          video_url: publicUrl,
          is_live: true,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (sErr || !session) throw sErr || new Error('create session failed');
      setUploadPct(90);

      // 3. Attach products
      if (selectedIds.size > 0) {
        const rows = Array.from(selectedIds).map((pid, i) => ({
          session_id: session.id,
          product_id: pid,
          display_order: i,
          is_featured: i === 0,
          featured_at: i === 0 ? new Date().toISOString() : null,
        }));
        await supabase.from('live_stream_products').insert(rows);
      }

      // 4. Fire push notification to followers (best-effort)
      void supabase.functions.invoke('notify-followers-live', {
        body: { session_id: session.id, streamer_id: user.id, title: title || 'Going live' },
      });
      setUploadPct(100);

      setStep('live');
      setTimeout(() => onLive(session.id), 900);
    } catch (e: any) {
      setError(e?.message || 'Failed to go live');
      setStep('video');
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3">
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 26 }}
        className="bg-[#0d1812] text-[#E5DACE] rounded-3xl w-full sm:max-w-md p-5 sm:p-6 shadow-2xl border border-amber-500/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#16291E]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-200" style={{ fontFamily: "'Cinzel','Trajan Pro',serif", letterSpacing: '0.04em' }}>Go Live</h2>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                {step === 'title' ? '1 / 3 — title' : step === 'video' ? '2 / 3 — video' : step === 'products' ? '3 / 3 — products' : step === 'uploading' ? 'Going live...' : 'You are live'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* TITLE STEP */}
        {step === 'title' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-amber-300/80 font-bold">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                placeholder="Reviewing the new Joola Perseus IV"
                className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none placeholder-white/30"
              />
              <p className="text-[10px] text-white/40 mt-1">{title.length}/80</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-amber-300/80 font-bold">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 280))}
                placeholder="Live demo + Q&A. Bring your drive questions."
                rows={3}
                className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none placeholder-white/30 resize-none"
              />
            </div>
            <button
              onClick={() => setStep('video')}
              disabled={!title.trim()}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-[#16291E] font-extrabold text-sm tracking-wider rounded-full disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              Next: pick a video <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* VIDEO STEP */}
        {step === 'video' && (
          <div className="space-y-4">
            <p className="text-xs text-white/60 leading-relaxed">
              {Capacitor.isNativePlatform()
                ? 'Pick a recorded video from your camera roll. Real-time camera streaming launches Q3.'
                : 'Upload an MP4 or MOV. Max 5GB. Plays as live to viewers.'}
            </p>
            <label className="block">
              <input
                type="file"
                accept="video/mp4,video/quicktime"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setVideoFile(f);
                    setVideoUrl(URL.createObjectURL(f));
                  }
                }}
              />
              <div className="border-2 border-dashed border-amber-400/30 rounded-2xl p-6 text-center cursor-pointer hover:border-amber-400/60 hover:bg-amber-400/5 transition">
                {videoUrl ? (
                  <>
                    <video src={videoUrl} className="w-full max-h-48 rounded-xl object-cover mb-3" controls />
                    <p className="text-xs text-amber-300 font-bold">{videoFile?.name}</p>
                    <p className="text-[10px] text-white/40 mt-1">Tap to replace</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 mx-auto flex items-center justify-center mb-3">
                      <Video className="w-6 h-6 text-amber-300/70" />
                    </div>
                    <p className="text-sm font-bold text-white">Pick a video</p>
                    <p className="text-[11px] text-white/40 mt-1">MP4 or MOV · up to 5GB</p>
                  </>
                )}
              </div>
            </label>
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep('title')} className="px-4 py-3 text-xs font-bold text-white/60 hover:text-white transition rounded-full">Back</button>
              <button
                onClick={() => setStep('products')}
                disabled={!videoFile}
                className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-[#16291E] font-extrabold text-sm tracking-wider rounded-full disabled:opacity-40 transition flex items-center justify-center gap-2"
              >
                Next: pick products <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PRODUCTS STEP */}
        {step === 'products' && (
          <div className="space-y-3">
            <p className="text-xs text-white/60 leading-relaxed">Pick what you'll feature on stream. The first selected becomes the floating "BUY" card.</p>
            <div className="max-h-72 overflow-y-auto -mx-1 px-1 space-y-1.5">
              {products.length === 0 ? (
                <p className="text-xs text-white/40 text-center py-6">You have no active products yet. Add some in your Pro shop.</p>
              ) : (
                products.map((p) => {
                  const on = selectedIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition text-left ${on ? 'bg-amber-400/15 ring-1 ring-amber-400/40' : 'bg-white/3 hover:bg-white/8'}`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0 overflow-hidden">
                        {p.image_url ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-amber-300 to-amber-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-amber-300 font-extrabold tracking-wider uppercase">{p.brand || 'Pro'}</p>
                        <p className="text-xs font-bold truncate text-white">{p.title}</p>
                        <p className="text-[10px] text-white/50">${(p.price_cents / 100).toFixed(2)}</p>
                      </div>
                      {on && <Check className="w-4 h-4 text-amber-300 flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep('video')} className="px-4 py-3 text-xs font-bold text-white/60 hover:text-white transition rounded-full">Back</button>
              <button
                onClick={goLive}
                className="flex-1 py-3 bg-gradient-to-br from-rose-500 to-rose-700 text-white font-extrabold text-sm tracking-widest rounded-full active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                GO LIVE
              </button>
            </div>
          </div>
        )}

        {/* UPLOADING STEP */}
        {step === 'uploading' && (
          <div className="py-10 text-center">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-amber-200">Uploading...</p>
            <div className="w-full bg-white/10 h-1 rounded-full mt-3 overflow-hidden">
              <motion.div
                animate={{ width: `${uploadPct}%` }}
                className="h-full bg-gradient-to-r from-amber-400 to-amber-300"
              />
            </div>
            <p className="text-[11px] text-white/40 mt-2">{uploadPct}%</p>
          </div>
        )}

        {/* LIVE STEP */}
        {step === 'live' && (
          <AnimatePresence>
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center mb-4 shadow-2xl shadow-rose-500/40">
                <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
              </div>
              <p className="text-base font-extrabold tracking-widest text-rose-300">YOU ARE LIVE</p>
              <p className="text-xs text-white/50 mt-2">Sending push to your followers...</p>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
