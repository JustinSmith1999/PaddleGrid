import { useState } from 'react';
import { Check, ArrowRight, ChevronDown, Calendar, Clock, Users, BarChart3, CreditCard, Bell, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
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

export function SalesPage({ onAuthRequired }: SalesPageProps) {
  const { user } = useAuth();
  const [showDemo, setShowDemo] = useState<'checkout' | 'pricing' | 'waitlist' | 'analytics' | 'family' | 'scheduling' | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Nav is provided by the global Navbar component */}
      <div className="min-h-screen" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* HERO — green gradient with floating product UI */}
        <section className="relative overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-emerald-600">
          {/* Subtle texture */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

          <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 lg:pt-20 lg:pb-28">
            <div className="grid lg:grid-cols-5 gap-12 items-center">
              <div className="lg:col-span-3">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    The pickleball platform your players will actually use.
                  </h1>
                  <p className="mt-5 text-lg text-green-100/80 leading-relaxed max-w-lg">
                    Built-in player matching, automated waitlists, and 1% processing fees. Not another generic court booking tool.
                  </p>
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <button onClick={() => onAuthRequired('facility')} className="bg-white text-green-800 px-7 py-3.5 rounded-xl font-bold transition-all hover:bg-green-50 shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 text-base">
                      Start free trial <ArrowRight className="w-4 h-4" />
                    </button>
                    <a href="mailto:Justin@j20solutions.com?subject=PaddleGrid%20Demo" className="text-white/80 hover:text-white px-7 py-3.5 rounded-xl font-medium transition-colors border border-white/20 hover:border-white/40 text-center">
                      Book a demo
                    </a>
                  </div>
                  <p className="mt-4 text-sm text-green-200/60">14-day trial · No credit card · Live in 10 minutes</p>
                  <div className="mt-6 flex items-center gap-3 text-sm text-green-200/50">
                    <div className="flex -space-x-1.5">
                      {['bg-blue-400', 'bg-amber-400', 'bg-rose-400', 'bg-teal-400', 'bg-purple-400'].map((c, i) => (
                        <div key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-green-700 text-[9px] font-bold text-white flex items-center justify-center`}>
                          {['R', 'S', 'M', 'D', 'J'][i]}
                        </div>
                      ))}
                    </div>
                    <span>Trusted by venues across the US</span>
                  </div>
                </motion.div>
              </div>

              {/* Floating product cards */}
              <motion.div
                className="lg:col-span-2 hidden lg:block"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <div className="space-y-3">
                  {/* Booking card */}
                  <div className="bg-white/[0.12] backdrop-blur-sm rounded-2xl p-5 border border-white/[0.1]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-green-200" />
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">Court 3 — Pickleball Heaven</div>
                        <div className="text-white/40 text-xs">Tomorrow · 6:00 – 7:30 PM</div>
                      </div>
                      <span className="ml-auto text-xs font-semibold text-green-300 bg-green-400/10 px-2.5 py-1 rounded-full">Confirmed</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                      <div className="flex -space-x-1.5">
                        {['bg-blue-400', 'bg-amber-400', 'bg-purple-400', 'bg-rose-400'].map((c, i) => (
                          <div key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-green-700 text-[9px] font-bold text-white flex items-center justify-center`}>
                            {['J', 'M', 'S', 'K'][i]}
                          </div>
                        ))}
                      </div>
                      <span className="text-white/40 text-xs">4 players · 3.5 avg</span>
                    </div>
                  </div>

                  {/* Waitlist notification */}
                  <div className="bg-white/[0.12] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.1] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4 h-4 text-amber-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-white text-sm font-medium">Court 5 opened up</div>
                      <div className="text-white/40 text-xs">Sarah M. auto-claimed from waitlist</div>
                    </div>
                  </div>

                  {/* Stats strip */}
                  <div className="bg-white/[0.12] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.1] grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">84%</div>
                      <div className="text-[10px] text-white/40">Utilization</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-300">$4.2K</div>
                      <div className="text-[10px] text-white/40">This month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">127</div>
                      <div className="text-[10px] text-white/40">Players</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* WHAT MAKES IT DIFFERENT — three sections, each visually distinct */}
        <section className="bg-white">

          {/* 1: Player Matching */}
          <div className="border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                    <Users className="w-3.5 h-3.5" /> Only on PaddleGrid
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Players find games, not just open courts.
                  </h2>
                  <p className="text-gray-500 leading-relaxed mb-3">
                    Skill-based matching pairs a 3.5 player looking for a Tuesday evening game with other 3.5s who are free. Automatically. No group texts, no Facebook posts.
                  </p>
                  <p className="text-gray-500 leading-relaxed">
                    CourtReserve and PodPlay don't do this. Their players book courts. Yours build a community.
                  </p>
                  <button onClick={() => setShowDemo('checkout')} className="mt-5 text-green-700 font-semibold text-sm hover:text-green-900 transition-colors">
                    See how booking works →
                  </button>
                </div>
                <div>
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="text-xs font-semibold text-gray-400 mb-4">MATCHED FOR TUESDAY 6 PM — COURT 2</div>
                    <div className="space-y-3">
                      {[
                        { name: 'Sarah M.', rating: '3.5', color: 'bg-blue-500', status: 'Confirmed' },
                        { name: 'Jake P.', rating: '3.5', color: 'bg-amber-500', status: 'Confirmed' },
                        { name: 'Tom R.', rating: '3.5', color: 'bg-rose-500', status: 'Confirmed' },
                        { name: 'Amy C.', rating: '4.0', color: 'bg-teal-500', status: 'Waiting' },
                      ].map((p, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
                          <div className={`w-9 h-9 rounded-full ${p.color} flex items-center justify-center text-xs font-bold text-white`}>
                            {p.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">{p.name}</div>
                            <div className="text-xs text-gray-400">{p.rating} DUPR</div>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            p.status === 'Confirmed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'
                          }`}>{p.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2: Waitlist + 3-click booking */}
          <div className="border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="lg:order-2">
                  <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                    <Zap className="w-3.5 h-3.5" /> Automated
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Cancellations fill themselves. Bookings take three clicks.
                  </h2>
                  <p className="text-gray-500 leading-relaxed mb-3">
                    Someone cancels? Next player on the waitlist gets a text, taps to confirm, court stays full. You don't touch a thing.
                  </p>
                  <p className="text-gray-500 leading-relaxed">
                    Booking is pick a court, pick a time, confirm. No account setup, no 6-step checkout flow.
                  </p>
                  <div className="mt-5 flex gap-4">
                    <button onClick={() => setShowDemo('waitlist')} className="text-green-700 font-semibold text-sm hover:text-green-900 transition-colors">Waitlist demo →</button>
                    <button onClick={() => setShowDemo('checkout')} className="text-green-700 font-semibold text-sm hover:text-green-900 transition-colors">Booking demo →</button>
                  </div>
                </div>
                <div className="lg:order-1 space-y-3">
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <div className="text-xs font-semibold text-gray-400 mb-3">WAITLIST ACTIVITY</div>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-green-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">Court 2 opened → Sarah claimed</div>
                          <div className="text-xs text-gray-400">Auto-filled in 12 seconds</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm opacity-60">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">Court 5 — 3 on waitlist</div>
                          <div className="text-xs text-gray-400">Friday 7 PM</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm opacity-30">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">Court 1 — no waitlist</div>
                          <div className="text-xs text-gray-400">Open slots available</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3: Analytics */}
          <div className="border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                    <BarChart3 className="w-3.5 h-3.5" /> Real-time
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Know exactly which courts make money and which sit empty.
                  </h2>
                  <p className="text-gray-500 leading-relaxed mb-3">
                    Revenue by court, utilization by hour, player retention, no-show rates — all updating live. Not a monthly PDF somebody forgot to email.
                  </p>
                  <button onClick={() => setShowDemo('analytics')} className="mt-2 text-green-700 font-semibold text-sm hover:text-green-900 transition-colors">
                    See live analytics →
                  </button>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-900">Court Utilization</span>
                    <span className="text-xs text-gray-400">This week</span>
                  </div>
                  <div className="flex items-end gap-2.5 h-32">
                    {[
                      { day: 'M', pct: 45 },
                      { day: 'T', pct: 72 },
                      { day: 'W', pct: 58 },
                      { day: 'T', pct: 81 },
                      { day: 'F', pct: 93 },
                      { day: 'S', pct: 96 },
                      { day: 'S', pct: 88 },
                    ].map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div
                          className={`w-full rounded-lg transition-all ${d.pct > 85 ? 'bg-green-600' : d.pct > 65 ? 'bg-green-400' : 'bg-green-200'}`}
                          style={{ height: `${d.pct}%` }}
                        />
                        <span className="text-[10px] text-gray-400 font-medium">{d.day}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>76%</div>
                      <div className="text-xs text-gray-400">Avg utilization</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-700" style={{ fontFamily: 'Manrope, sans-serif' }}>$4,218</div>
                      <div className="text-xs text-gray-400">Revenue</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>3.2%</div>
                      <div className="text-xs text-gray-400">No-show rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COST COMPARISON — colored background */}
        <section className="bg-gray-900 text-white py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
              You're giving away $2,280/year in processing fees.
            </h2>
            <p className="text-gray-400 mb-10 max-w-lg">
              On $10K/month in bookings, here's what each platform actually costs.
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-green-600 rounded-2xl p-6 ring-2 ring-green-400 ring-offset-2 ring-offset-gray-900">
                <div className="text-green-100 text-sm mb-1">PaddleGrid</div>
                <div className="text-3xl font-extrabold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>$279<span className="text-base font-normal text-green-200">/mo</span></div>
                <div className="text-green-200 text-sm mt-2">$179 plan + 1% processing</div>
              </div>
              <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl p-6">
                <div className="text-gray-500 text-sm mb-1">CourtReserve</div>
                <div className="text-3xl font-extrabold text-gray-400" style={{ fontFamily: 'Manrope, sans-serif' }}>$449<span className="text-base font-normal text-gray-500">+</span></div>
                <div className="text-gray-500 text-sm mt-2">$159 plan + 2.9% processing</div>
              </div>
              <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl p-6">
                <div className="text-gray-500 text-sm mb-1">PodPlay</div>
                <div className="text-3xl font-extrabold text-gray-400" style={{ fontFamily: 'Manrope, sans-serif' }}>$500<span className="text-base font-normal text-gray-500">+</span></div>
                <div className="text-gray-500 text-sm mt-2">Per-court + 2.9% processing</div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-4">Based on 8 courts, $10K/month. Competitor pricing from public sources, 2025.</p>
          </div>
        </section>

        {/* ALSO INCLUDED */}
        <section className="bg-white py-14 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6">
            <h3 className="text-base font-bold text-gray-900 mb-5" style={{ fontFamily: 'Manrope, sans-serif' }}>Everything else that's included</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
              {[
                'Family accounts & sub-profiles',
                'Conflict-free scheduling',
                'Event & league management',
                'Mobile-first design',
                'CourtReserve data import',
                'Stripe Connect payments',
                'Automated SMS notifications',
                'Custom venue branding',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-4">
              <button onClick={() => setShowDemo('family')} className="text-green-700 font-semibold text-sm hover:text-green-900 transition-colors">Family accounts →</button>
              <button onClick={() => setShowDemo('scheduling')} className="text-green-700 font-semibold text-sm hover:text-green-900 transition-colors">Scheduling →</button>
              <button onClick={() => setShowDemo('pricing')} className="text-green-700 font-semibold text-sm hover:text-green-900 transition-colors">Fee breakdown →</button>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="bg-gray-50 py-20 lg:py-28">
          <div className="max-w-[960px] mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight tracking-tight mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Simple pricing
            </h2>
            <p className="text-gray-500 mb-10">Every feature on every plan. 1% processing. No upsells.</p>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: 'Starter', price: '$179', courts: 'Up to 6 courts', cta: 'Start free trial', popular: false, features: ['Unlimited bookings', 'Player matching', 'Analytics dashboard', 'Waitlist + SMS', 'Email support'] },
                { name: 'Professional', price: '$349', courts: 'Up to 15 courts', cta: 'Start free trial', popular: true, features: ['Everything in Starter', 'Events & leagues', 'Priority support', 'Custom branding', 'CourtReserve sync'] },
                { name: 'Enterprise', price: '$599', courts: 'Unlimited courts', cta: 'Contact sales', popular: false, features: ['Everything in Professional', 'Multi-location', 'Dedicated account manager', 'Custom integrations', 'SLA + API access'] },
              ].map((plan, i) => (
                <div key={i} className={`rounded-2xl p-7 flex flex-col ${plan.popular ? 'bg-green-700 text-white ring-4 ring-green-200 shadow-xl' : 'bg-white border border-gray-200 shadow-sm'}`}>
                  <div className={`text-sm font-medium mb-1 ${plan.popular ? 'text-green-200' : 'text-gray-400'}`}>{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif' }}>{plan.price}</span>
                    <span className={`text-sm ${plan.popular ? 'text-green-200' : 'text-gray-400'}`}>/mo</span>
                  </div>
                  <div className={`text-sm mb-6 ${plan.popular ? 'text-green-200' : 'text-gray-500'}`}>{plan.courts}</div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className={`flex items-start gap-2 text-sm ${plan.popular ? 'text-green-100' : 'text-gray-600'}`}>
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-green-300' : 'text-green-600'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => plan.name === 'Enterprise'
                      ? (window.location.href = 'mailto:Justin@j20solutions.com?subject=PaddleGrid%20Enterprise')
                      : onAuthRequired('facility')
                    }
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                      plan.popular ? 'bg-white text-green-800 hover:bg-green-50' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-5">14-day free trial. No credit card. No contract — cancel anytime.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white py-20 lg:py-24">
          <div className="max-w-[640px] mx-auto px-6">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-8" style={{ fontFamily: 'Manrope, sans-serif' }}>Questions</h2>
            <div className="divide-y divide-gray-200">
              {[
                { q: 'How long does setup take?', a: 'Most venues are live within 10 minutes. Add your courts, set pricing, done. We handle CourtReserve migration at no cost.' },
                { q: 'What does the 1% processing fee cover?', a: 'That\'s the total cost per booking. Stripe handles payment, funds go directly to your bank account. No hidden fees.' },
                { q: 'Can I import from CourtReserve?', a: 'Yes. Courts, schedules, members, booking history. Full bi-directional sync while you transition.' },
                { q: 'Is there a contract?', a: 'No. Month-to-month. Cancel anytime, no fees.' },
                { q: 'What if I need more than 15 courts?', a: 'Enterprise plan: unlimited courts and locations. Contact us for custom pricing.' },
              ].map((faq, i) => (
                <div key={i}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex items-center justify-between w-full py-4 text-left group">
                    <span className="text-[15px] font-medium text-gray-800 pr-4 group-hover:text-gray-900">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && <p className="pb-4 text-sm text-gray-500 leading-relaxed">{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-green-700 py-16 lg:py-20">
          <div className="max-w-[640px] mx-auto px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              See it for yourself.
            </h2>
            <p className="text-green-100/80 mb-8">14-day trial, no credit card. Most venues go live in under 10 minutes.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => onAuthRequired('facility')} className="bg-white text-green-800 px-8 py-3.5 rounded-xl font-bold transition-all hover:bg-green-50 shadow-lg flex items-center justify-center gap-2">
                Start free trial <ArrowRight className="w-4 h-4" />
              </button>
              <a href="mailto:Justin@j20solutions.com?subject=PaddleGrid%20Demo" className="text-white/80 hover:text-white px-8 py-3.5 rounded-xl font-medium transition-colors border border-white/25 hover:border-white/40 text-center">
                Book a demo
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-gray-900 text-white py-10">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="PaddleGrid" className="h-6 w-6 object-contain" />
                <span className="text-sm font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>PaddleGrid</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <a href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</a>
                <a href="/terms" className="hover:text-gray-300 transition-colors">Terms</a>
                <a href="/support" className="hover:text-gray-300 transition-colors">Support</a>
                <a href="mailto:Justin@j20solutions.com" className="hover:text-gray-300 transition-colors">Contact</a>
              </div>
              <span className="text-xs text-gray-600">&copy; {new Date().getFullYear()} J20 Solutions LLC</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Demo Modals */}
      {showDemo === 'checkout' && <ThreeClickCheckout onClose={() => setShowDemo(null)} />}
      {showDemo === 'pricing' && <TransparentPricing onClose={() => setShowDemo(null)} />}
      {showDemo === 'waitlist' && <WaitlistManager onClose={() => setShowDemo(null)} />}
      {showDemo === 'analytics' && <LiveAnalyticsDemo onClose={() => setShowDemo(null)} />}
      {showDemo === 'family' && <FamilyAccountDemo onClose={() => setShowDemo(null)} />}
      {showDemo === 'scheduling' && <ConflictFreeDemo onClose={() => setShowDemo(null)} />}
    </>
  );
}
