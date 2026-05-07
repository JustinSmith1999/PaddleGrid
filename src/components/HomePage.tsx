import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, MapPin, Users, ArrowRight, Trophy, MessageSquare,
  TrendingUp, Shield, Check, Clock, CreditCard,
  Search, ChevronDown, Zap, Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HomePageProps {
  onAuthRequired: (mode?: 'login' | 'signup' | 'facility') => void;
}

/* ── FAQ item ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200/60">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left group">
        <span className="text-[15px] font-semibold text-slate-800 pr-4 group-hover:text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{q}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="pb-5 text-sm text-slate-500 leading-relaxed">{a}</div>
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
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-transparent to-emerald-900/30" />

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
                Find open courts, book instantly, get matched with players at your level. No group texts, no calling the front desk.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="mt-8">
                <button onClick={() => onAuthRequired('signup')} className="group inline-flex items-center justify-center gap-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold text-base px-7 py-3.5 rounded-xl shadow-lg shadow-green-900/30 hover:shadow-xl transition-all duration-200">
                  Create free account <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
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
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Three steps. That's it.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-0 relative">
            <div className="hidden md:block absolute top-12 left-[16.6%] right-[16.6%] h-[2px] bg-gradient-to-r from-green-200 via-green-400 to-green-200" />

            {[
              { step: '01', icon: Search, title: 'Find a court', desc: 'Search by location or venue name. See what\'s open right now, what it costs, and book it.' },
              { step: '02', icon: CreditCard, title: 'Book & pay', desc: 'Pick a time slot, pay through Stripe. Apple Pay, Google Pay, or card. Confirmation is instant.' },
              { step: '03', icon: Users, title: 'Play', desc: 'Show up. Need opponents? Player matching pairs you with people at your skill level.' },
            ].map((item, i) => (
              <div key={i} className="text-center px-4 py-6">
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-5 mx-auto">
                  <item.icon className="w-8 h-8 text-green-700" />
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-700 text-white text-xs font-bold flex items-center justify-center shadow-sm">{item.step}</div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR PLAYERS — alternating layout, not a card grid */}
      <section className="bg-white">

        {/* Player feature 1: Court search + booking */}
        <div className="border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                  <MapPin className="w-3.5 h-3.5" /> Find & book courts
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Stop texting around for court times.
                </h2>
                <p className="text-slate-500 leading-relaxed mb-3">
                  Search by location, see real-time availability and pricing, book and pay in under 30 seconds. Apple Pay, Google Pay, or card.
                </p>
                <p className="text-slate-500 leading-relaxed">
                  No more group chat coordination, no more calling the front desk, no more showing up to find the court's already taken.
                </p>
              </div>
              {/* Matches real CourtCard styling: white card, green-700 accents, availability header */}
              <div className="space-y-3">
                {[
                  { venue: 'Pickleball Heaven', court: 'Court 3', price: '$12', available: true, next: '6:00 PM' },
                  { venue: 'Central Rec Center', court: 'Court 1', price: '$8', available: true, next: '7:30 PM' },
                  { venue: 'Sunset Sports Club', court: 'Court 5', price: '$15', available: false, next: null },
                ].map((v, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className={`px-4 py-2 flex items-center gap-2 ${v.available ? 'bg-green-700' : 'bg-slate-300'}`}>
                      <Clock className="w-3 h-3 text-white" />
                      <span className="text-xs font-medium text-white">{v.available ? `Next Available · ${v.next}` : 'Fully Booked'}</span>
                    </div>
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{v.court}</div>
                        <div className="text-xs text-slate-400">{v.venue}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-green-700">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span className="text-sm font-bold">{v.price}/hr</span>
                        </div>
                        {v.available ? (
                          <span className="text-xs font-semibold bg-green-700 text-white px-3 py-1.5 rounded-lg">Book Now</span>
                        ) : (
                          <span className="text-xs font-semibold bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg">Booked</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Player feature 2: Player matching */}
        <div className="border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="lg:order-2">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                  <Users className="w-3.5 h-3.5" /> Player matching
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Find games, not just open courts.
                </h2>
                <p className="text-slate-500 leading-relaxed mb-3">
                  Set your skill level when you sign up. We match you with players at a similar rating so games are competitive and fun.
                </p>
                <p className="text-slate-500 leading-relaxed">
                  As you log matches, your rating adjusts automatically. No more lopsided games because someone said they were "intermediate."
                </p>
              </div>
              {/* Matches real PlayerCard: emerald gradient, frosted glass stat boxes */}
              <div className="lg:order-1 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-6 shadow-xl">
                <div className="text-xs font-semibold text-white/60 mb-4">MATCHED FOR TUESDAY 6 PM — COURT 2</div>
                <div className="space-y-2.5">
                  {[
                    { name: 'Sarah M.', rating: '3.5', color: 'bg-blue-400', status: 'Confirmed' },
                    { name: 'Jake P.', rating: '3.5', color: 'bg-amber-400', status: 'Confirmed' },
                    { name: 'Tom R.', rating: '3.5', color: 'bg-rose-400', status: 'Confirmed' },
                    { name: 'You', rating: '3.5', color: 'bg-white', textColor: 'text-emerald-700', status: 'Joined' },
                  ].map((p, i) => (
                    <div key={i} className={`flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 ${i === 3 ? 'ring-2 ring-white/30' : ''}`}>
                      <div className={`w-9 h-9 rounded-full ${p.color} flex items-center justify-center text-xs font-bold ${'textColor' in p ? p.textColor : 'text-white'}`}>
                        {p.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{p.name}</div>
                        <div className="text-xs text-white/50">{p.rating} DUPR</div>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        p.status === 'Joined' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                      }`}>{p.status}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
                  {[
                    { icon: Trophy, label: 'Avg Rating', value: '3.5' },
                    { icon: Users, label: 'Players', value: '4/4' },
                    { icon: Clock, label: 'Duration', value: '1.5 hrs' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 text-center">
                      <div className="text-sm font-bold text-white">{s.value}</div>
                      <div className="text-[10px] text-white/50">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player feature 3: Community + stats */}
        <div className="border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                  <Trophy className="w-3.5 h-3.5" /> Stats & community
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Track your game. Find your people.
                </h2>
                <p className="text-slate-500 leading-relaxed mb-3">
                  DUPR-style ratings, full match history, win/loss stats. See how you stack up locally and track your improvement over time.
                </p>
                <p className="text-slate-500 leading-relaxed">
                  Follow local clubs, coordinate meetups, share results. A community feed built for pickleball — not a repurposed Facebook group.
                </p>
              </div>
              {/* Matches real PlayerCard gradient + ActivityCard styling */}
              <div className="space-y-3">
                {/* Player card — emerald gradient like real PlayerCard */}
                <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-white border-[3px] border-white flex items-center justify-center text-base font-bold text-emerald-700">JM</div>
                    <div>
                      <div className="text-base font-semibold text-white">Jamie Martinez</div>
                      <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full mt-1">
                        <span className="text-xs font-semibold text-white">3.5</span>
                        <span className="text-[10px] text-white/60">DUPR</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: Trophy, value: '32', label: 'Wins' },
                      { icon: TrendingUp, value: '68%', label: 'Win Rate' },
                      { icon: Zap, value: '5', label: 'Streak' },
                    ].map((s, i) => (
                      <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                        <s.icon className="w-3.5 h-3.5 text-white/60 mx-auto mb-1" />
                        <div className="text-lg font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>{s.value}</div>
                        <div className="text-[10px] text-white/50">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity feed items — matches real ActivityCard */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">SM</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">Won vs. Sarah M.</div>
                      <div className="text-xs text-slate-400">Singles · 11-7, 11-9</div>
                    </div>
                    <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-[10px] font-semibold text-green-700">+0.02</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Pickleball Heaven</span>
                    <span>2h ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ALSO FREE — quick feature list */}
      <section className="py-14 bg-[#F8F9FC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h3 className="text-base font-bold text-slate-900 mb-5" style={{ fontFamily: 'Manrope, sans-serif' }}>Also included, free for every player</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
            {[
              'Waitlist with instant alerts',
              'Automated reminders',
              'Apple Pay & Google Pay',
              'Court reviews & photos',
              'Family sub-accounts',
              'Game history & stats',
              'Club & group feeds',
              'Mobile-optimized experience',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16">
            {/* Left column: heading + support link */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Common questions
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">
                Can't find what you're looking for? Reach out and we'll get back to you within a few hours.
              </p>
              <a href="mailto:Justin@j20solutions.com" className="inline-flex items-center gap-2 text-green-700 font-semibold text-sm hover:text-green-900 transition-colors">
                <MessageSquare className="w-4 h-4" /> Contact support
              </a>
            </div>

            {/* Right column: FAQ cards */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {[
                { q: 'Is PaddleGrid really free for players?', a: 'Yes. Players don\'t pay us anything — no subscription, no platform fee. You just pay the venue for your court time. We make money from venue subscriptions.' },
                { q: 'How do I book a court?', a: 'Search for courts near you, pick a time slot, and pay through Stripe. You\'ll get a confirmation email and a reminder before your session.' },
                { q: 'What if the court I want is full?', a: 'Join the waitlist. If someone cancels, you get notified immediately and can grab the slot.' },
                { q: 'How does player matching work?', a: 'You set your skill level when you sign up. As you log matches, your rating adjusts. We match you with players at a similar level so games are competitive.' },
                { q: 'Is my payment info safe?', a: 'Payments go through Stripe, which is PCI Level 1 certified. We never see or store your card number.' },
              ].map((faq, i) => (
                <div key={i} className="px-6">
                  <FaqItem q={faq.q} a={faq.a} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-green-700 py-16 lg:py-20">
        <div className="max-w-[640px] mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
            See it for yourself.
          </h2>
          <p className="text-green-100/80 mb-8">
            Free forever. No credit card required.
          </p>
          <button onClick={() => onAuthRequired('signup')} className="group inline-flex items-center justify-center gap-2.5 bg-white text-green-800 font-bold text-base px-8 py-4 rounded-xl shadow-lg hover:bg-green-50 transition-all duration-200">
            Create free account <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-10" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="PaddleGrid" className="h-6 w-6 object-contain" />
              <span className="text-sm font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>PaddleGrid</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-slate-300 transition-colors">Terms</a>
              <a href="/support" className="hover:text-slate-300 transition-colors">Support</a>
              <a href="mailto:Justin@j20solutions.com" className="hover:text-slate-300 transition-colors">Contact</a>
            </div>
            <span className="text-xs text-slate-600">&copy; {new Date().getFullYear()} J20 Solutions LLC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
