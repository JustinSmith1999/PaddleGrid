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

      {/* Nav is provided by the global Navbar component */}

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0a0f1a]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-transparent to-emerald-900/30" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-green-600/10 blur-[120px]" style={{ transform: 'translate(20%, -30%)' }} />
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[100px]" style={{ transform: 'translate(-50%, 30%)' }} />
        </div>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-14 sm:pb-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-medium text-white/80">Free for players — always</span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Pickleball booking<br />
                <span className="text-green-300">that actually works.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-5 text-base sm:text-lg text-white/70 leading-relaxed max-w-lg">
                Find open courts, book instantly, get matched with players at your level. Venues get a dashboard that replaces spreadsheets and phone calls.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="mt-8 flex flex-col sm:flex-row gap-3">
                <button onClick={() => onAuthRequired('signup')} className="group inline-flex items-center justify-center gap-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold text-base px-7 py-3.5 rounded-xl shadow-lg shadow-green-900/30 hover:shadow-xl transition-all duration-200">
                  Create free account <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button onClick={() => onAuthRequired('facility')} className="inline-flex items-center justify-center gap-2 text-white font-semibold text-base px-7 py-3.5 rounded-xl border border-white/20 hover:border-white/40 hover:bg-white/10 backdrop-blur-sm transition-all duration-200">
                  I manage a venue
                </button>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> No credit card required</span>
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-400" /> Payments via Stripe</span>
              </motion.div>
            </div>

            {/* App preview mockup */}
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

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 32" fill="none" className="w-full h-auto block"><path d="M0 32L1440 32V0C1080 28 360 28 0 0V32Z" fill="#F8F9FC" /></svg>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">How it works</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Three steps. That's it.
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-0 relative">
            <div className="hidden md:block absolute top-12 left-[16.6%] right-[16.6%] h-[2px] bg-gradient-to-r from-green-200 via-green-400 to-green-200" />

            {[
              { step: '01', icon: Search, title: 'Find a court', desc: 'Search by location or venue name. See what\'s open right now, what it costs, and book it.' },
              { step: '02', icon: CreditCard, title: 'Book & pay', desc: 'Pick a time slot, pay through Stripe. Apple Pay, Google Pay, or card. You get a confirmation instantly.' },
              { step: '03', icon: Users, title: 'Play', desc: 'Show up. If you need opponents, player matching pairs you with people at a similar skill level.' },
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

      {/* FOR PLAYERS */}
      <section id="players" className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">For players</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Stop texting around for court times
              </h2>
              <p className="mt-4 text-base text-slate-500 leading-relaxed">
                No more group chat coordination, no more calling the front desk.
              </p>
            </div>
          </Reveal>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: MapPin, title: 'Court search', desc: 'See every venue near you with live availability and pricing. Filter by surface type and amenities.', tint: 'bg-green-50', color: 'text-green-700' },
              { icon: Users, title: 'Player matching', desc: 'Set your skill level and get matched with compatible players. Ratings adjust as you play.', tint: 'bg-blue-50', color: 'text-blue-700' },
              { icon: Calendar, title: 'Instant booking', desc: 'Pick a slot, pay with Apple Pay / Google Pay / card. Confirmation and reminders are automatic.', tint: 'bg-green-50', color: 'text-green-700' },
              { icon: Trophy, title: 'Stats & ratings', desc: 'Log matches and track your DUPR-style rating over time. Full match history and win/loss stats.', tint: 'bg-amber-50', color: 'text-amber-700' },
              { icon: MessageSquare, title: 'Community feed', desc: 'Follow local clubs, coordinate meetups, share results. Built specifically for pickleball players.', tint: 'bg-purple-50', color: 'text-purple-700' },
              { icon: Bell, title: 'Waitlist alerts', desc: 'Court you want is full? Join the waitlist. You get notified the moment a slot opens up.', tint: 'bg-rose-50', color: 'text-rose-700' },
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

      {/* MID-PAGE CTA */}
      <section className="py-16 sm:py-20">
        <Reveal>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Try it free
                </h2>
                <p className="text-green-100/80 text-base mb-6 max-w-md mx-auto">
                  Players never pay. Create an account in under 2 minutes and see what's available near you.
                </p>
                <button onClick={() => onAuthRequired('signup')} className="group bg-white text-green-800 font-bold text-base px-8 py-4 rounded-xl hover:bg-green-50 shadow-lg transition-all inline-flex items-center gap-2.5">
                  Get started <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOR VENUES */}
      <section id="venues" className="py-16 sm:py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">For venue operators</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Your courts, your dashboard
              </h2>
              <p className="mt-4 text-base text-slate-400 leading-relaxed">
                Online bookings, automatic payments, real-time availability. Replace the spreadsheet.
              </p>
            </div>
          </Reveal>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {[
              { icon: Zap, title: 'Online bookings', desc: 'Players book and pay online. No phone calls, no double-bookings, no manual entry.' },
              { icon: TrendingUp, title: 'Revenue tracking', desc: 'See which courts are busy, track peak hours, and monitor revenue in real time.' },
              { icon: Shield, title: 'Stripe payouts', desc: 'Money goes straight to your bank via Stripe Connect. 1% platform fee. That\'s it.' },
              { icon: Users, title: 'Player discovery', desc: 'Every PaddleGrid player can find and book your venue. New customers without ad spend.' },
              { icon: BarChart3, title: 'Usage analytics', desc: 'Court utilization, peak demand patterns, booking trends. Data you can actually act on.' },
              { icon: Globe, title: 'Your branding', desc: 'Custom venue page with your photos, pricing, policies, and contact info.' },
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
            <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 sm:p-8">
              <h3 className="text-lg font-bold text-white mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>Included in every plan</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  'Unlimited bookings', 'Real-time calendar', 'Automated reminders',
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
                  Start free trial <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <a href="/sales" className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold text-sm px-6 py-3.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition-all">
                  See pricing
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">Why PaddleGrid</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                How we compare
              </h2>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-2xl border border-slate-200/60 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-3 sm:p-4 font-semibold text-slate-500 w-[40%]">Feature</th>
                    <th className="p-3 sm:p-4 font-bold text-green-700 text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>PaddleGrid</th>
                    <th className="p-3 sm:p-4 font-semibold text-slate-400 text-center">Phone / Email</th>
                    <th className="p-3 sm:p-4 font-semibold text-slate-400 text-center">Generic booking</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Real-time availability', pg: true, phone: false, generic: true },
                    { feature: 'Player skill matching', pg: true, phone: false, generic: false },
                    { feature: 'Community & social feed', pg: true, phone: false, generic: false },
                    { feature: 'Automated waitlists', pg: true, phone: false, generic: false },
                    { feature: 'Integrated payments', pg: true, phone: false, generic: true },
                    { feature: 'Venue analytics', pg: true, phone: false, generic: false },
                    { feature: 'CourtReserve sync', pg: true, phone: false, generic: false },
                    { feature: 'Free for players', pg: true, phone: true, generic: false },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-3 sm:p-4 text-slate-700 font-medium">{row.feature}</td>
                      <td className="p-3 sm:p-4 text-center">{row.pg ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />}</td>
                      <td className="p-3 sm:p-4 text-center">{row.phone ? <Check className="w-5 h-5 text-slate-400 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />}</td>
                      <td className="p-3 sm:p-4 text-center">{row.generic ? <Check className="w-5 h-5 text-slate-400 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
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
              { q: 'Is PaddleGrid really free for players?', a: 'Yes. Players don\'t pay us anything — no subscription, no platform fee. You just pay the venue for your court time. We make money from venue subscriptions.' },
              { q: 'How do I book a court?', a: 'Search for courts near you, pick a time slot, and pay through Stripe. You\'ll get a confirmation email and a reminder before your session.' },
              { q: 'What if the court I want is full?', a: 'Join the waitlist. If someone cancels, you get notified immediately and can grab the slot.' },
              { q: 'How does player matching work?', a: 'You set your skill level when you sign up. As you log matches, your rating adjusts. We match you with players at a similar level so games are competitive.' },
              { q: 'I run a venue — how much does it cost?', a: 'Plans start at $179/month. 14-day free trial, no credit card required to start. Every plan includes unlimited bookings, analytics, player matching, and CourtReserve sync. See the pricing page for details.' },
              { q: 'Can I import data from CourtReserve?', a: 'Yes — full bi-directional sync. Import courts, schedules, members, and booking history. We help with the migration at no extra cost.' },
              { q: 'Is my payment info safe?', a: 'Payments go through Stripe, which is PCI Level 1 certified. We never see or store your card number.' },
            ].map((faq, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <FaqItem q={faq.q} a={faq.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative">
              <Reveal>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  See it for yourself
                </h2>
                <p className="text-base text-slate-400 max-w-lg mx-auto mb-8">
                  Free for players. 14-day free trial for venues. No credit card required.
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
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="PaddleGrid" className="h-8 w-8 object-contain" />
                <span className="text-base font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>PaddleGrid</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">Court bookings and venue management for pickleball.</p>
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
