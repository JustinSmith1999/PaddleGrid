import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Calendar, MapPin, Users, ArrowRight, Trophy, MessageSquare, Zap,
  TrendingUp, Shield, ChevronRight, Star, Check, X, Clock, CreditCard,
  BarChart3, Heart, Bell, Search, HelpCircle, ChevronDown, Smartphone,
  Globe, Target, Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HomePageProps {
  onAuthRequired: (mode?: 'login' | 'signup' | 'facility') => void;
}

/* ── Animation helpers ── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }} className={className}>
      {children}
    </motion.div>
  );
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

/* ── FAQ item ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200/60 rounded-2xl overflow-hidden bg-white">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/50 transition-colors">
        <span className="text-[15px] font-semibold text-slate-800 pr-4" style={{ fontFamily: 'Manrope, sans-serif' }}>{q}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-5 pb-5 text-sm text-slate-500 leading-relaxed">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HomePage({ onAuthRequired }: HomePageProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8F9FC]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ═══════════════════════════════════════════════
          NAV
      ═══════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="PaddleGrid" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <span className="text-slate-800">Paddle</span>
              <span className="text-green-700">Grid</span>
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <a href="#how-it-works" className="hidden md:inline text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl transition-colors">How it works</a>
            <a href="#players" className="hidden md:inline text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl transition-colors">Players</a>
            <a href="#venues" className="hidden md:inline text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl transition-colors">Venues</a>
            <a href="/sales" className="hidden md:inline text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl transition-colors">Pricing</a>
            <button onClick={() => onAuthRequired('login')} className="text-sm font-medium text-slate-500 hover:text-slate-800 px-4 py-2 rounded-xl transition-colors">Sign in</button>
            <button onClick={() => onAuthRequired('signup')} className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all duration-200">Get started</button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════
          1. ABOVE THE FOLD — Hero + Social proof bar
      ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#0a0f1a]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-transparent to-emerald-900/30" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-green-600/10 blur-[120px]" style={{ transform: 'translate(20%, -30%)' }} />
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[100px]" style={{ transform: 'translate(-50%, 30%)' }} />
        </div>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-20 sm:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — copy */}
            <div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-medium text-white/80">Free for players. Always.</span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.08] tracking-tight text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <span className="whitespace-nowrap">Book courts. <span className="text-green-300">Find players.</span></span><br />Own your game.
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-5 text-lg text-white/70 leading-relaxed max-w-lg">
                The all-in-one pickleball platform — real-time court bookings, skill-matched opponents, and a community built around your local scene.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="mt-8 flex flex-col sm:flex-row gap-3">
                <button onClick={() => onAuthRequired('signup')} className="group inline-flex items-center justify-center gap-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold text-base px-8 py-4 rounded-xl shadow-lg shadow-green-900/30 hover:shadow-xl transition-all duration-200">
                  Create free account <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button onClick={() => onAuthRequired('facility')} className="inline-flex items-center justify-center gap-2 text-white font-semibold text-base px-8 py-4 rounded-xl border border-white/20 hover:border-white/40 hover:bg-white/10 backdrop-blur-sm transition-all duration-200">
                  I manage a venue
                </button>
              </motion.div>

              {/* Trust signals */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 flex flex-wrap items-center gap-5 text-sm text-white/50">
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> No credit card required</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> Set up in 2 minutes</span>
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-400" /> Stripe-secured payments</span>
              </motion.div>
            </div>

            {/* Right — app preview mockup */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="hidden lg:block">
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/[0.08] p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-600/30 flex items-center justify-center"><Calendar className="w-5 h-5 text-green-300" /></div>
                  <div>
                    <div className="text-white font-semibold text-sm">Court 3 — Pickleball Heaven</div>
                    <div className="text-white/50 text-xs">Tomorrow · 6:00 – 7:30 PM</div>
                  </div>
                  <div className="ml-auto bg-green-600/20 text-green-300 text-xs font-bold px-3 py-1 rounded-full">Confirmed</div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['6:00 AM', '7:30 AM', '9:00 AM', '10:30 AM', '12:00 PM', '1:30 PM'].map((t) => (
                    <div key={t} className={`text-center text-xs py-2.5 rounded-lg border ${t === '6:00 AM' ? 'bg-green-600/20 border-green-500/30 text-green-300 font-semibold' : 'border-white/[0.06] text-white/40'}`}>{t}</div>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
                  <div className="flex -space-x-2">
                    {['bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'].map((c, i) => (
                      <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-[#0a0f1a] flex items-center justify-center text-[10px] font-bold text-white`}>
                        {['J', 'M', 'S', 'K'][i]}
                      </div>
                    ))}
                  </div>
                  <span className="text-white/50 text-xs">4 players joined</span>
                  <button className="ml-auto text-green-400 text-xs font-semibold hover:text-green-300">Join game →</button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Social proof bar */}
        <div className="relative border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-6 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { val: '12,000+', label: 'Players active' },
                { val: '500+', label: 'Venues listed' },
                { val: '85,000+', label: 'Games booked' },
                { val: '4.9 ★', label: 'App Store rating' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                  <div className="text-xl sm:text-2xl font-extrabold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>{s.val}</div>
                  <div className="text-xs text-white/40 mt-1">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full h-auto block"><path d="M0 40L1440 40V0C1080 35 360 35 0 0V40Z" fill="#F8F9FC" /></svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          2. THE TRANSFORMATION — Before → After
      ═══════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">How it works</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                From download to court time in 3 steps
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-0 md:gap-0 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[16.6%] right-[16.6%] h-[2px] bg-gradient-to-r from-green-200 via-green-400 to-green-200" />

            {[
              { step: '01', icon: Search, title: 'Find a court', desc: 'Search by location, time, or venue. See real-time availability and pricing at hundreds of courts near you.' },
              { step: '02', icon: CreditCard, title: 'Book & pay instantly', desc: 'Reserve your spot in seconds. Pay securely through Stripe — Apple Pay, Google Pay, or saved cards.' },
              { step: '03', icon: Users, title: 'Show up & play', desc: 'Get matched with players at your level, or invite friends. Show your confirmation and hit the court.' },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div className="text-center px-4 py-6">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-5 mx-auto">
                    <item.icon className="w-8 h-8 text-green-700" />
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-700 text-white text-xs font-bold flex items-center justify-center shadow-sm">{item.step}</div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          3. BENEFITS (deep, visual) — For players
      ═══════════════════════════════════════════════ */}
      <section id="players" className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">For players</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Stop texting around for court times
              </h2>
              <p className="mt-4 text-base text-slate-500 leading-relaxed">
                You shouldn't need four apps and a group chat to play pickleball. PaddleGrid puts everything in one place.
              </p>
            </div>
          </Reveal>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: MapPin, title: 'Courts near you', desc: 'Browse every venue in your area with live availability, pricing, and photos. Filter by sport, surface, and amenities.', tint: 'bg-green-50', color: 'text-green-700' },
              { icon: Users, title: 'Player matching', desc: 'Our skill-rating algorithm matches you with compatible players. No more lopsided games — just competitive, fun pickleball.', tint: 'bg-blue-50', color: 'text-blue-700' },
              { icon: Calendar, title: 'One-tap booking', desc: 'Book and pay in seconds with Apple Pay, Google Pay, or saved cards. Get reminders before your session.', tint: 'bg-green-50', color: 'text-green-700' },
              { icon: Trophy, title: 'Track your game', desc: 'Log matches, watch your DUPR-style rating climb, and earn achievements. See your full match history and stats.', tint: 'bg-amber-50', color: 'text-amber-700' },
              { icon: MessageSquare, title: 'Social feed', desc: 'A community built for pickleball. Share results, post highlights, coordinate meetups, and follow your local clubs.', tint: 'bg-purple-50', color: 'text-purple-700' },
              { icon: Bell, title: 'Smart notifications', desc: 'Get pinged when a court opens up, a friend starts a game, or your skill-matched opponent is looking for a partner.', tint: 'bg-rose-50', color: 'text-rose-700' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp}>
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 h-full hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200">
                  <div className={`w-11 h-11 rounded-xl ${item.tint} flex items-center justify-center mb-4`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          4. MID-PAGE CTA + PROOF
      ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20">
        <Reveal>
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Join 12,000+ pickleball players
                </h2>
                <p className="text-green-100/80 text-base mb-6 max-w-md mx-auto">
                  Create your free account in under 2 minutes. No credit card, no commitment.
                </p>
                <button onClick={() => onAuthRequired('signup')} className="group bg-white text-green-800 font-bold text-base px-8 py-4 rounded-xl hover:bg-green-50 shadow-lg transition-all inline-flex items-center gap-2.5">
                  Get started free <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>

                <div className="mt-8 flex flex-wrap justify-center gap-8">
                  {[
                    { icon: Star, text: '4.9 App Store rating' },
                    { icon: Users, text: '500+ venues nationwide' },
                    { icon: Shield, text: 'PCI-compliant payments' },
                  ].map((t, i) => (
                    <span key={i} className="flex items-center gap-2 text-sm text-green-100/70">
                      <t.icon className="w-4 h-4" /> {t.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════
          5. FOR VENUES — Features + What's included
      ═══════════════════════════════════════════════ */}
      <section id="venues" className="py-16 sm:py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">For venue operators</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Fill courts. Cut busywork. Grow revenue.
              </h2>
              <p className="mt-4 text-base text-slate-400 leading-relaxed">
                Replace your booking spreadsheet, payment terminal, and marketing emails with one dashboard. Setup takes under 10 minutes.
              </p>
            </div>
          </Reveal>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {[
              { icon: Zap, title: 'Online booking system', desc: 'Customers book and pay online. No phone tag, no double-bookings, no manual scheduling.' },
              { icon: TrendingUp, title: 'Revenue dashboard', desc: 'See which courts perform, track peak hours, monitor utilization, and watch revenue in real time.' },
              { icon: Shield, title: 'Stripe Connect payouts', desc: 'Funds go directly to your bank. 1% platform fee, transparent pricing, no surprises.' },
              { icon: Users, title: 'Built-in demand', desc: 'Every player on PaddleGrid can discover and book your venue. New customers, zero ad spend.' },
              { icon: BarChart3, title: 'Smart analytics', desc: 'AI-powered insights on pricing, peak demand, and player behavior. Make data-driven decisions.' },
              { icon: Globe, title: 'Custom branding', desc: 'Your venue page, your brand. Custom colors, photos, policies, and messaging.' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp}>
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200 h-full">
                  <div className="w-10 h-10 rounded-xl bg-green-700/20 border border-green-600/20 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-green-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1.5" style={{ fontFamily: 'Manrope, sans-serif' }}>{item.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* What's included */}
          <Reveal>
            <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/[0.06] p-8">
              <h3 className="text-lg font-bold text-white mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>Everything included in every plan:</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  'Unlimited bookings', 'Real-time court calendar', 'Automated reminders',
                  'Waitlist management', 'Event & league tools', 'Membership management',
                  'Player profiles & stats', 'Mobile-optimized pages', 'Email & SMS notifications',
                  'Custom pricing rules', 'Multi-court management', 'CourtReserve data sync',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" /> {item}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button onClick={() => onAuthRequired('facility')} className="group inline-flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-sm transition-all">
                  Start your free trial <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <a href="/sales" className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold text-sm px-6 py-3.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition-all">
                  See pricing & demos
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          6. SOCIAL PROOF — Testimonials (layered)
      ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-12">
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">What players & venues say</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Trusted by the pickleball community
              </h2>
            </div>
          </Reveal>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Sarah K.', role: 'Recreational player', rating: 5, text: 'I used to spend 20 minutes texting friends to find a game. Now I open PaddleGrid and I\'m booked in seconds. The player matching is spot-on.' },
              { name: 'Mike Rodriguez', role: 'Facility owner, AZ', rating: 5, text: 'Our court utilization went from 60% to 89% in the first month. The automated waitlist alone has been a game-changer for filling empty slots.' },
              { name: 'David & Lisa T.', role: 'Competitive doubles', rating: 5, text: 'We track all our matches here. The rating system is fair, the community is great, and the booking experience is light-years ahead of calling the front desk.' },
              { name: 'Jenny Park', role: 'Club organizer', rating: 5, text: 'Managing our 200-member club used to be chaos. PaddleGrid handles registration, court assignments, and payments. I actually enjoy running events now.' },
              { name: 'Tom Whitfield', role: 'Venue manager, TX', rating: 5, text: 'Revenue is up 35% since we switched. The analytics dashboard shows me exactly where the money\'s coming from and which time slots to push.' },
              { name: 'Ana Morales', role: 'New to pickleball', rating: 5, text: 'Started playing 3 months ago and PaddleGrid helped me find beginner-friendly games near me. Everyone was welcoming. Now I play 4 times a week!' },
            ].map((t, i) => (
              <motion.div key={i} variants={fadeUp}>
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 h-full">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">{t.name[0]}</div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{t.name}</div>
                      <div className="text-xs text-slate-400">{t.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          7. COMPARISON TABLE
      ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">Why PaddleGrid</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                How we compare
              </h2>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-2xl border border-slate-200/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-4 font-semibold text-slate-500 w-[40%]">Feature</th>
                    <th className="p-4 font-bold text-green-700 text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>PaddleGrid</th>
                    <th className="p-4 font-semibold text-slate-400 text-center">Phone / Email</th>
                    <th className="p-4 font-semibold text-slate-400 text-center">Generic booking</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Real-time court availability', pg: true, phone: false, generic: true },
                    { feature: 'Player skill matching', pg: true, phone: false, generic: false },
                    { feature: 'Social community & feed', pg: true, phone: false, generic: false },
                    { feature: 'Automated waitlists', pg: true, phone: false, generic: false },
                    { feature: 'Integrated payments', pg: true, phone: false, generic: true },
                    { feature: 'Venue analytics dashboard', pg: true, phone: false, generic: false },
                    { feature: 'Mobile-first experience', pg: true, phone: false, generic: false },
                    { feature: 'Free for players', pg: true, phone: true, generic: false },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-4 text-slate-700 font-medium">{row.feature}</td>
                      <td className="p-4 text-center">{row.pg ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />}</td>
                      <td className="p-4 text-center">{row.phone ? <Check className="w-5 h-5 text-slate-400 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />}</td>
                      <td className="p-4 text-center">{row.generic ? <Check className="w-5 h-5 text-slate-400 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          8. FAQ
      ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">FAQ</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Common questions
              </h2>
            </div>
          </Reveal>

          <div className="space-y-3">
            {[
              { q: 'Is PaddleGrid really free for players?', a: 'Yes, 100% free. Players never pay a subscription or platform fee. You only pay for court bookings, and that money goes to the venue. We make money from venue subscriptions, not from players.' },
              { q: 'How do I book a court?', a: 'Search for courts near you, pick a time slot, and pay securely through Stripe. You\'ll get a confirmation email and a reminder before your session. The whole process takes about 14 seconds.' },
              { q: 'What if a court opens up that I want?', a: 'Join the waitlist for any fully-booked time slot. When a cancellation happens, PaddleGrid instantly notifies the next person in line. Most spots refill within 30 seconds.' },
              { q: 'How does player matching work?', a: 'When you create an account, you set your skill level. As you log matches, your rating adjusts dynamically. We match you with players within a similar rating band so games are competitive and fun.' },
              { q: 'I run a venue — how much does it cost?', a: 'Plans start at $99/month with a 14-day free trial. No credit card required to start. Every plan includes unlimited bookings, analytics, and all platform features. See our pricing page for full details.' },
              { q: 'Can I import data from CourtReserve or another system?', a: 'Yes. We offer bi-directional sync with CourtReserve and can import data from most existing booking systems. Our team will help with migration — it\'s included at no extra cost.' },
              { q: 'Is my payment info safe?', a: 'All payments are processed through Stripe, a PCI Level 1 certified processor. We never see or store your full card number. Stripe handles security so you don\'t have to worry.' },
            ].map((faq, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <FaqItem q={faq.q} a={faq.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          9. FINAL CTA (positive close)
      ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative">
              <Reveal>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Ready to play?
                </h2>
                <p className="text-base text-slate-400 max-w-lg mx-auto mb-8">
                  Join thousands of pickleball players who stopped chasing court times and started playing more. Free forever for players.
                </p>
              </Reveal>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => onAuthRequired('signup')} className="group inline-flex items-center justify-center gap-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-base px-8 py-4 rounded-xl shadow-lg shadow-green-900/30 hover:shadow-xl transition-all duration-200">
                  Create free account <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button onClick={() => onAuthRequired('facility')} className="inline-flex items-center justify-center gap-2 text-white font-semibold text-base px-8 py-4 rounded-xl border border-white/20 hover:border-white/40 hover:bg-white/[0.05] transition-all duration-200">
                  I manage a venue
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-5">No credit card required. Set up in 2 minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════ */}
      <footer className="bg-slate-900 text-white" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-6xl mx-auto px-6 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="PaddleGrid" className="h-8 w-8 object-contain" />
                <span className="text-base font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>PaddleGrid</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">The all-in-one platform for pickleball players and venue operators.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">How it works</a></li>
                <li><a href="#players" className="text-slate-400 hover:text-white transition-colors">For players</a></li>
                <li><a href="#venues" className="text-slate-400 hover:text-white transition-colors">For venues</a></li>
                <li><a href="/sales" className="text-slate-400 hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="/support" className="text-slate-400 hover:text-white transition-colors">Support</a></li>
                <li><a href="mailto:Justin@j20solutions.com" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy policy</a></li>
                <li><a href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
            <span>&copy; {new Date().getFullYear()} PaddleGrid. All rights reserved.</span>
            <span>J20 Solutions LLC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
