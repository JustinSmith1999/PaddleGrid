import { useState, useRef } from 'react';
import { Calendar, Clock, Users, Check, ArrowRight, X, ChevronDown, ChevronRight, CreditCard, BarChart3, Bell, Shield, Zap, Trophy, Smartphone, Heart } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ThreeClickCheckout } from './ThreeClickCheckout';
import { TransparentPricing } from './TransparentPricing';
import { WaitlistManager } from './WaitlistManager';
import { LiveAnalyticsDemo } from './LiveAnalyticsDemo';
import { FamilyAccountDemo } from './FamilyAccountDemo';
import { ConflictFreeDemo } from './ConflictFreeDemo';

interface SalesPageProps {
  onAuthRequired: (mode?: 'login' | 'signup' | 'facility') => void;
}

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

export function SalesPage({ onAuthRequired }: SalesPageProps) {
  const { user } = useAuth();
  const [showDemo, setShowDemo] = useState<'checkout' | 'pricing' | 'waitlist' | 'analytics' | 'family' | 'scheduling' | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <div className="min-h-screen bg-[#FAFBFC]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* NAV */}
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5">
            <a href="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="PaddleGrid" className="h-8 w-8 object-contain" />
              <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <span className="text-slate-800">Paddle</span>
                <span className="text-green-700">Grid</span>
              </span>
            </a>
            <div className="hidden md:flex items-center gap-1">
              <a href="/#players" className="text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg transition-colors">Players</a>
              <a href="/#venues" className="text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg transition-colors">Venues</a>
              <a href="#pricing" className="text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => onAuthRequired('login')} className="text-sm font-medium text-slate-500 hover:text-slate-800 px-4 py-2 transition-colors">Sign in</button>
              <button onClick={() => onAuthRequired('facility')} className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors">Start free trial</button>
            </div>
          </div>
        </nav>

        {/* HERO with product UI preview */}
        <section className="bg-slate-900 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-white leading-[1.1] tracking-tight mb-5" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Stop managing courts with spreadsheets.
                </h1>
                <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
                  PaddleGrid handles bookings, payments, waitlists, and player matching so you can focus on running your facility.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <button onClick={() => onAuthRequired('facility')} className="bg-green-600 hover:bg-green-500 text-white px-7 py-3.5 rounded-lg font-semibold transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2">
                    Start Free Trial <ArrowRight className="w-4 h-4" />
                  </button>
                  <a href="mailto:Justin@j20solutions.com?subject=PaddleGrid%20Demo%20Request" className="text-white/70 hover:text-white px-7 py-3.5 rounded-lg font-medium transition-colors border border-white/20 hover:border-white/40 text-center">
                    Schedule a Demo
                  </a>
                </div>
                <p className="text-sm text-slate-500">14-day free trial. No credit card. Setup in under 10 minutes.</p>
              </motion.div>

              {/* Product UI mockup */}
              <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="hidden lg:block">
                <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/[0.08] p-5 shadow-2xl shadow-black/20">
                  {/* Mini nav bar */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                    <span className="ml-3 text-xs text-white/30">paddlegrid.com/dashboard</span>
                  </div>
                  {/* Booking card */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-green-600/20 flex items-center justify-center"><Calendar className="w-4 h-4 text-green-400" /></div>
                    <div>
                      <div className="text-white font-semibold text-sm">Court 3 — Pickleball Heaven</div>
                      <div className="text-white/40 text-xs">Tomorrow · 6:00 – 7:30 PM</div>
                    </div>
                    <div className="ml-auto bg-green-500/15 text-green-400 text-xs font-semibold px-2.5 py-1 rounded-full">Confirmed</div>
                  </div>
                  {/* Time grid */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {['6:00 AM', '7:30 AM', '9:00 AM', '10:30 AM', '12:00 PM', '1:30 PM', '3:00 PM', '4:30 PM'].map((t, i) => (
                      <div key={t} className={`text-center text-xs py-2 rounded-lg border transition-all ${i === 0 ? 'bg-green-500/15 border-green-500/30 text-green-400 font-semibold' : i < 3 ? 'border-white/[0.06] text-white/30' : 'border-white/[0.04] text-white/15'}`}>{t}</div>
                    ))}
                  </div>
                  {/* Players row */}
                  <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
                    <div className="flex -space-x-2">
                      {['bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'].map((c, i) => (
                        <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white`}>
                          {['J', 'M', 'S', 'K'][i]}
                        </div>
                      ))}
                    </div>
                    <span className="text-white/40 text-xs">4 players matched</span>
                    <button className="ml-auto text-green-400 text-xs font-semibold">Join game →</button>
                  </div>
                  {/* Stats bar */}
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/[0.06]">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">84%</div>
                      <div className="text-[10px] text-white/30">Court utilization</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">$4.2K</div>
                      <div className="text-[10px] text-white/30">This month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">127</div>
                      <div className="text-[10px] text-white/30">Active players</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* BENTO GRID — visual feature showcase */}
        <section className="py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <FadeIn>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Everything you need to run a facility
              </h2>
              <p className="text-slate-500 mb-10 max-w-lg">Booking, payments, player management, and analytics — all from one dashboard.</p>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Large card: Booking */}
              <FadeIn className="md:col-span-2 bg-slate-900 rounded-2xl p-7 text-white relative overflow-hidden group cursor-pointer" delay={0.05}>
                <div onClick={() => setShowDemo('checkout')}>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-green-400" />
                    <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Instant Booking</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Three clicks. Court booked.</h3>
                  <p className="text-sm text-slate-400 max-w-sm mb-6">Pick a court, pick a time, confirm. The system prevents double-bookings automatically.</p>
                  {/* Mini booking UI */}
                  <div className="bg-white/[0.05] rounded-xl p-4 border border-white/[0.08]">
                    <div className="flex gap-2 mb-3">
                      {['Court 1', 'Court 2', 'Court 3'].map((c, i) => (
                        <div key={c} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${i === 2 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-white/30 border border-white/[0.06]'}`}>{c}</div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {['6:00 PM', '7:30 PM', '9:00 PM'].map((t, i) => (
                        <div key={t} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${i === 1 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-white/30 border border-white/[0.06]'}`}>{t}</div>
                      ))}
                    </div>
                  </div>
                  <span className="text-green-400 text-sm font-medium mt-4 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Try interactive demo <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </FadeIn>

              {/* Small card: Payments */}
              <FadeIn className="bg-green-700 rounded-2xl p-7 text-white cursor-pointer group" delay={0.1}>
                <div onClick={() => setShowDemo('pricing')}>
                  <CreditCard className="w-6 h-6 text-green-200 mb-4" />
                  <div className="text-4xl font-extrabold mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>1%</div>
                  <div className="text-green-200 text-sm font-medium mb-2">Processing fee</div>
                  <p className="text-sm text-green-100/70">Competitors charge 2.9%+. On $10K/month, you save $190.</p>
                  <span className="text-green-200 text-sm font-medium mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    See breakdown <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </FadeIn>

              {/* Small card: Player matching */}
              <FadeIn className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm" delay={0.15}>
                <Users className="w-6 h-6 text-green-700 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Player Matching</h3>
                <p className="text-sm text-slate-500 mb-3">Skill-based matching pairs players at similar levels. Neither CourtReserve nor PodPlay offers this.</p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {['bg-blue-500', 'bg-amber-500', 'bg-purple-500'].map((c, i) => (
                      <div key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-white text-[9px] font-bold text-white flex items-center justify-center`}>
                        {['3.5', '3.5', '4.0'][i]}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">Matched by rating</span>
                </div>
              </FadeIn>

              {/* Small card: Waitlist */}
              <FadeIn className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm cursor-pointer group" delay={0.2}>
                <div onClick={() => setShowDemo('waitlist')}>
                  <Bell className="w-6 h-6 text-green-700 mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Smart Waitlist</h3>
                  <p className="text-sm text-slate-500 mb-3">Court opens up? Next person in line gets a text automatically. No manual follow-up.</p>
                  <span className="text-green-700 text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Try demo <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </FadeIn>

              {/* Large card: Analytics */}
              <FadeIn className="md:col-span-1 bg-white rounded-2xl p-7 border border-slate-200 shadow-sm cursor-pointer group" delay={0.25}>
                <div onClick={() => setShowDemo('analytics')}>
                  <BarChart3 className="w-6 h-6 text-green-700 mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Live Analytics</h3>
                  <p className="text-sm text-slate-500 mb-4">Revenue, utilization, player trends — updating in real time.</p>
                  {/* Mini chart */}
                  <div className="flex items-end gap-1.5 h-16">
                    {[40, 55, 35, 65, 50, 75, 60, 80, 70, 85, 78, 92].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm bg-green-100" style={{ height: `${h}%` }}>
                        {i === 11 && <div className="w-full h-full rounded-sm bg-green-600" />}
                        {i === 10 && <div className="w-full h-full rounded-sm bg-green-400" />}
                        {i === 9 && <div className="w-full h-full rounded-sm bg-green-300" />}
                      </div>
                    ))}
                  </div>
                  <span className="text-green-700 text-sm font-medium mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Try demo <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </FadeIn>
            </div>

            {/* Second row: smaller feature pills */}
            <FadeIn className="flex flex-wrap gap-3 mt-6" delay={0.3}>
              {[
                { icon: Heart, label: 'Family accounts', demo: 'family' as const },
                { icon: Shield, label: 'Conflict-free scheduling', demo: 'scheduling' as const },
                { icon: Trophy, label: 'Events & leagues' },
                { icon: Smartphone, label: 'Mobile-first design' },
                { icon: Calendar, label: 'CourtReserve import' },
              ].map((f, i) => (
                <button
                  key={i}
                  onClick={() => f.demo ? setShowDemo(f.demo) : undefined}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    f.demo ? 'bg-white border-slate-200 text-slate-700 hover:border-green-300 hover:text-green-700 cursor-pointer shadow-sm' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
                  }`}
                >
                  <f.icon className="w-4 h-4" />
                  {f.label}
                  {f.demo && <ChevronRight className="w-3 h-3 text-slate-400" />}
                </button>
              ))}
            </FadeIn>
          </div>
        </section>

        {/* COST COMPARISON — visual, not just text */}
        <section className="py-16 lg:py-24 bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-6">
            <FadeIn>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                You're overpaying. Here's the math.
              </h2>
              <p className="text-slate-400 mb-10 max-w-lg">On $10,000/month in court bookings, here's what each platform actually costs you.</p>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'PaddleGrid', sub: 'from $179/mo', fee: '1%', cost: '$100', total: '$279', highlight: true },
                  { name: 'CourtReserve', sub: 'from $159/mo', fee: '2.9%+', cost: '$290+', total: '$449+', highlight: false },
                  { name: 'PodPlay', sub: '$30–350/court', fee: '2.9%+', cost: '$290+', total: '$500+', highlight: false },
                ].map((p, i) => (
                  <div key={i} className={`rounded-2xl p-6 ${p.highlight ? 'bg-green-600 ring-2 ring-green-400' : 'bg-white/[0.05] border border-white/[0.08]'}`}>
                    <div className="text-lg font-bold mb-0.5" style={{ fontFamily: 'Manrope, sans-serif' }}>{p.name}</div>
                    <div className={`text-xs mb-4 ${p.highlight ? 'text-green-200' : 'text-slate-500'}`}>{p.sub}</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={p.highlight ? 'text-green-100' : 'text-slate-400'}>Processing ({p.fee})</span>
                        <span className="font-medium">{p.cost}</span>
                      </div>
                      <div className={`border-t pt-2 flex justify-between ${p.highlight ? 'border-green-500' : 'border-white/[0.08]'}`}>
                        <span className="font-semibold">Total / month</span>
                        <span className="font-bold text-lg">{p.total}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.15} className="mt-6 text-center">
              <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                <Check className="w-4 h-4 text-green-400" />
                No annual contract. No setup fees. Cancel anytime.
              </span>
            </FadeIn>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-16 lg:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <FadeIn>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>Pricing</h2>
              <p className="text-slate-500 mb-10">Full platform access on every plan. No feature gates.</p>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: 'Starter', price: '$179', desc: 'Up to 6 courts', features: ['Unlimited bookings', 'Player matching', 'Analytics dashboard', 'Waitlist with SMS', 'Email support'], popular: false },
                { name: 'Professional', price: '$349', desc: 'Up to 15 courts', features: ['Everything in Starter', 'Event & league management', 'Priority support', 'Custom branding', 'CourtReserve sync'], popular: true },
                { name: 'Enterprise', price: '$599', desc: 'Unlimited courts', features: ['Everything in Professional', 'Multi-location support', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'API access'], popular: false },
              ].map((plan, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <div className={`rounded-2xl border p-6 relative h-full ${plan.popular ? 'border-green-600 bg-green-50/40 ring-1 ring-green-600 shadow-lg shadow-green-100' : 'border-slate-200 bg-white'}`}>
                    {plan.popular && <span className="absolute -top-2.5 left-4 bg-green-700 text-white px-3 py-0.5 rounded text-xs font-semibold">Most popular</span>}
                    <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{plan.name}</h3>
                    <div className="mt-1 mb-1">
                      <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                      <span className="text-slate-500 text-sm">/mo</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-5">{plan.desc}</p>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => plan.name === 'Enterprise' ? window.location.href = 'mailto:Justin@j20solutions.com?subject=PaddleGrid%20Enterprise%20Inquiry' : onAuthRequired('facility')}
                      className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors ${plan.popular ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
                    >
                      {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                    </button>
                  </div>
                </FadeIn>
              ))}
            </div>
            <p className="text-sm text-slate-400 mt-4">All plans include a 14-day free trial. No credit card required. 1% processing fee on all plans.</p>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="py-16 lg:py-24 bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <FadeIn>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                PaddleGrid vs. CourtReserve vs. PodPlay
              </h2>
              <p className="text-slate-500 mb-8">Side-by-side on the things that matter.</p>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left p-4 font-medium text-slate-500 w-[36%]"></th>
                      <th className="p-4 text-center">
                        <div className="font-bold text-green-700" style={{ fontFamily: 'Manrope, sans-serif' }}>PaddleGrid</div>
                        <div className="text-xs text-slate-400 mt-0.5">from $179/mo</div>
                      </th>
                      <th className="p-4 text-center">
                        <div className="font-medium text-slate-600" style={{ fontFamily: 'Manrope, sans-serif' }}>CourtReserve</div>
                        <div className="text-xs text-slate-400 mt-0.5">from $159/mo</div>
                      </th>
                      <th className="p-4 text-center">
                        <div className="font-medium text-slate-600" style={{ fontFamily: 'Manrope, sans-serif' }}>PodPlay</div>
                        <div className="text-xs text-slate-400 mt-0.5">$30–350/court/mo</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: 'Player skill matching', pg: true, cr: false, pp: false },
                      { feature: 'Built-in player community', pg: true, cr: false, pp: false },
                      { feature: 'Automated waitlist with SMS', pg: true, cr: true, pp: false },
                      { feature: 'Event & league management', pg: true, cr: true, pp: true },
                      { feature: 'Real-time analytics dashboard', pg: true, cr: true, pp: true },
                      { feature: 'Stripe Connect payments', pg: true, cr: false, pp: false },
                      { feature: 'Family accounts', pg: true, cr: false, pp: false },
                      { feature: 'CourtReserve data import', pg: true, cr: false, pp: false },
                      { feature: 'Per-court pricing', pg: false, cr: false, pp: true },
                      { feature: 'Processing fee', pg: '1%', cr: '2.9%+', pp: '2.9%+' },
                      { feature: 'Free trial', pg: '14 days', cr: 'Demo only', pp: 'Demo only' },
                      { feature: 'Long-term contract', pg: 'None', cr: 'Annual', pp: 'Annual' },
                    ].map((row, i) => (
                      <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                        <td className="p-4 text-slate-700 font-medium">{row.feature}</td>
                        {(['pg', 'cr', 'pp'] as const).map((col) => {
                          const val = row[col];
                          return (
                            <td key={col} className="p-4 text-center">
                              {val === true ? <Check className={`w-4 h-4 mx-auto ${col === 'pg' ? 'text-green-600' : 'text-slate-400'}`} /> :
                               val === false ? <X className="w-4 h-4 text-slate-300 mx-auto" /> :
                               <span className={`text-sm font-medium ${col === 'pg' ? 'text-green-700' : 'text-slate-500'}`}>{val}</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-3">Competitor pricing and features based on publicly available information as of 2025. Subject to change.</p>
            </FadeIn>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 lg:py-24 border-t border-slate-100">
          <div className="max-w-3xl mx-auto px-6">
            <FadeIn>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8" style={{ fontFamily: 'Manrope, sans-serif' }}>Common questions</h2>
            </FadeIn>
            <div className="divide-y divide-slate-200">
              {[
                { q: 'How long does setup take?', a: 'Most venues are live within 10 minutes. Add your courts, set pricing, and you\'re ready. We handle migration from CourtReserve at no extra cost.' },
                { q: 'What does it cost?', a: 'Plans start at $179/month. 14-day free trial, no credit card required. Players never pay a fee — you pay the subscription plus a 1% processing fee, the lowest in the industry.' },
                { q: 'Can I import from CourtReserve?', a: 'Yes. Full bi-directional sync. Courts, schedules, members, booking history — we migrate everything.' },
                { q: 'How do payments work?', a: 'Stripe Connect. Players pay at booking, funds go to your bank account on a rolling basis. Every transaction is visible in your dashboard.' },
                { q: 'What if I need more than 15 courts?', a: 'Enterprise plan — unlimited courts and locations. Contact us for custom pricing.' },
                { q: 'Is there a contract?', a: 'No. Month-to-month. Cancel anytime, no fees.' },
              ].map((faq, i) => (
                <FadeIn key={i} delay={i * 0.03}>
                  <div>
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex items-center justify-between w-full py-4 text-left">
                      <span className="text-[15px] font-medium text-slate-800 pr-4">{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaq === i && <p className="pb-4 text-sm text-slate-500 leading-relaxed">{faq.a}</p>}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-green-700 py-16 lg:py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>See it for yourself.</h2>
            <p className="text-green-100/80 mb-8">14-day free trial, no credit card. Most venues are live in under 10 minutes.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => onAuthRequired('facility')} className="bg-white text-green-800 px-7 py-3.5 rounded-lg font-bold transition-all hover:bg-green-50 shadow-lg flex items-center justify-center gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </button>
              <a href="mailto:Justin@j20solutions.com?subject=PaddleGrid%20Demo%20Request" className="border-2 border-white/30 text-white px-7 py-3.5 rounded-lg font-medium transition-colors hover:bg-white/10 text-center">
                Schedule a Demo
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              <div className="col-span-2 md:col-span-1">
                <a href="/" className="flex items-center gap-2 mb-3">
                  <img src="/logo.png" alt="PaddleGrid" className="h-8 w-8 object-contain" />
                  <span className="text-base font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>PaddleGrid</span>
                </a>
                <p className="text-sm text-slate-400">The platform for pickleball players and venues.</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/#players" className="text-slate-400 hover:text-white transition-colors">Players</a></li>
                  <li><a href="/#venues" className="text-slate-400 hover:text-white transition-colors">Venues</a></li>
                  <li><a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/support" className="text-slate-400 hover:text-white transition-colors">Support</a></li>
                  <li><a href="mailto:Justin@j20solutions.com" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy policy</a></li>
                  <li><a href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of service</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-10 pt-5 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
              <span>&copy; {new Date().getFullYear()} PaddleGrid. All rights reserved.</span>
              <span>J20 Solutions LLC</span>
            </div>
          </div>
        </footer>

        {/* Demo Modals */}
        {showDemo === 'checkout' && <ThreeClickCheckout onClose={() => setShowDemo(null)} />}
        {showDemo === 'pricing' && <TransparentPricing onClose={() => setShowDemo(null)} />}
        {showDemo === 'waitlist' && <WaitlistManager onClose={() => setShowDemo(null)} />}
        {showDemo === 'analytics' && <LiveAnalyticsDemo onClose={() => setShowDemo(null)} />}
        {showDemo === 'family' && <FamilyAccountDemo onClose={() => setShowDemo(null)} />}
        {showDemo === 'scheduling' && <ConflictFreeDemo onClose={() => setShowDemo(null)} />}
      </div>
    </>
  );
}
