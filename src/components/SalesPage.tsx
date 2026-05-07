import { useState } from 'react';
import { Check, ArrowRight, ChevronDown } from 'lucide-react';
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
      <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* NAV */}
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
          <div className="max-w-[1100px] mx-auto flex items-center justify-between px-6 py-3">
            <a href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="PaddleGrid" className="h-7 w-7 object-contain" />
              <span className="text-base font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Paddle<span className="text-green-700">Grid</span>
              </span>
            </a>
            <div className="flex items-center gap-2">
              <a href="#pricing" className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 px-3 py-2 transition-colors">Pricing</a>
              <button onClick={() => onAuthRequired('login')} className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 transition-colors">Sign in</button>
              <button onClick={() => onAuthRequired('facility')} className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Start free trial</button>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="pt-20 pb-16 lg:pt-28 lg:pb-20">
          <div className="max-w-[1100px] mx-auto px-6">
            <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4.25rem] font-extrabold text-gray-900 leading-[1.05] tracking-[-0.03em] max-w-3xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Fill your courts.<br />
              <span className="text-green-700">Keep your money.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-500 leading-relaxed max-w-xl">
              Court booking, payments, player matching, and waitlists for pickleball facilities that are tired of overpaying for clunky software.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
              <button onClick={() => onAuthRequired('facility')} className="bg-green-700 hover:bg-green-800 text-white text-base font-semibold px-8 py-3.5 rounded-lg transition-colors flex items-center gap-2">
                Start free trial <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 sm:self-center">14 days free · No credit card · Live in 10 minutes</span>
            </div>
          </div>
        </section>

        {/* THE MONEY ARGUMENT */}
        <section className="py-20 lg:py-28 border-t border-gray-100">
          <div className="max-w-[1100px] mx-auto px-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
                You're giving away $2,280 a year in processing fees.
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                CourtReserve and PodPlay charge 2.9% on every booking. PaddleGrid charges 1%.
                On $10,000/month in court revenue, that's $190/month back in your pocket.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-200 rounded-xl overflow-hidden mt-12">
              <div className="bg-green-700 p-8">
                <div className="text-sm text-green-200 mb-2">PaddleGrid</div>
                <div className="text-4xl font-extrabold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>$279<span className="text-lg font-normal text-green-200">/mo</span></div>
                <div className="text-sm text-green-200 mt-2">$179 plan + $100 processing (1%)</div>
              </div>
              <div className="bg-white p-8">
                <div className="text-sm text-gray-400 mb-2">CourtReserve</div>
                <div className="text-4xl font-extrabold text-gray-300" style={{ fontFamily: 'Manrope, sans-serif' }}>$449<span className="text-lg font-normal text-gray-300">+</span></div>
                <div className="text-sm text-gray-400 mt-2">$159 plan + $290 processing (2.9%)</div>
              </div>
              <div className="bg-white p-8">
                <div className="text-sm text-gray-400 mb-2">PodPlay</div>
                <div className="text-4xl font-extrabold text-gray-300" style={{ fontFamily: 'Manrope, sans-serif' }}>$500<span className="text-lg font-normal text-gray-300">+</span></div>
                <div className="text-sm text-gray-400 mt-2">Per-court pricing + 2.9% processing</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">Based on 8 courts, $10K/month in bookings. Competitor pricing from public sources, 2025.</p>
          </div>
        </section>

        {/* WHAT'S DIFFERENT — editorial sections, NOT identical cards */}
        <section className="py-20 lg:py-28 bg-gray-50">
          <div className="max-w-[1100px] mx-auto px-6">

            {/* Feature 1: Player matching */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start pb-24 border-b border-gray-200">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Players find games, not just open courts.
                </h2>
                <p className="text-gray-500 leading-relaxed mb-4">
                  PaddleGrid matches players by skill level and availability. A 3.5 looking for a Tuesday evening game gets paired with other 3.5s who are free — automatically.
                </p>
                <p className="text-gray-500 leading-relaxed">
                  Neither CourtReserve nor PodPlay does this. Their players book courts. Your players build a community.
                </p>
                <button onClick={() => setShowDemo('checkout')} className="mt-5 text-green-700 font-medium text-sm hover:text-green-900 transition-colors">
                  See how booking works →
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5 content-start">
                {[
                  { name: 'Sarah M.', rating: '3.5', color: 'bg-blue-500' },
                  { name: 'Jake P.', rating: '3.5', color: 'bg-amber-500' },
                  { name: 'Linda K.', rating: '4.0', color: 'bg-purple-500' },
                  { name: 'Tom R.', rating: '3.5', color: 'bg-rose-500' },
                  { name: 'Amy C.', rating: '4.0', color: 'bg-teal-500' },
                  { name: 'Dev S.', rating: '3.0', color: 'bg-indigo-500' },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-full pl-1 pr-4 py-1 shadow-sm border border-gray-100">
                    <div className={`w-8 h-8 rounded-full ${p.color} flex items-center justify-center text-xs font-bold text-white`}>
                      {p.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 leading-tight">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.rating} DUPR</div>
                    </div>
                  </div>
                ))}
                <div className="w-full mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <div className="flex -space-x-1.5">
                    <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-gray-50" />
                    <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-gray-50" />
                    <div className="w-5 h-5 rounded-full bg-rose-500 border-2 border-gray-50" />
                  </div>
                  3 matched for Tuesday 6 PM — Court 2
                </div>
              </div>
            </div>

            {/* Feature 2: Waitlist */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start py-24 border-b border-gray-200">
              <div className="lg:order-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Cancellations fill themselves.
                </h2>
                <p className="text-gray-500 leading-relaxed mb-4">
                  Someone cancels, the next person on the waitlist gets a text. They tap to confirm. The court stays full and you don't touch anything.
                </p>
                <button onClick={() => setShowDemo('waitlist')} className="mt-1 text-green-700 font-medium text-sm hover:text-green-900 transition-colors">
                  Try the waitlist demo →
                </button>
              </div>
              <div className="lg:order-1 space-y-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-green-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">Court 2 just opened up</div>
                    <div className="text-xs text-gray-400 mt-0.5">Tomorrow 6:00 PM — Sarah M. was notified</div>
                  </div>
                  <span className="text-xs text-green-700 font-medium ml-auto flex-shrink-0">Claimed</span>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-3 opacity-50">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">Court 5 — waitlist active</div>
                    <div className="text-xs text-gray-400 mt-0.5">3 players waiting for Friday 7:00 PM</div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-3 opacity-30">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">Court 1 — no waitlist</div>
                    <div className="text-xs text-gray-400 mt-0.5">Slot open, no one waiting</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Analytics */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start pt-24">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Know which courts make money and which sit empty.
                </h2>
                <p className="text-gray-500 leading-relaxed mb-4">
                  Revenue by court, utilization by hour, player retention, no-show rates. All real-time — not a monthly PDF somebody forgot to send.
                </p>
                <button onClick={() => setShowDemo('analytics')} className="mt-1 text-green-700 font-medium text-sm hover:text-green-900 transition-colors">
                  See live analytics demo →
                </button>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm font-medium text-gray-900">Court Utilization</span>
                  <span className="text-xs text-gray-400">This week</span>
                </div>
                <div className="flex items-end gap-2 h-28">
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
                        className={`w-full rounded-md transition-all ${d.pct > 85 ? 'bg-green-600' : d.pct > 65 ? 'bg-green-400' : 'bg-green-200'}`}
                        style={{ height: `${d.pct}%` }}
                      />
                      <span className="text-[10px] text-gray-400 font-medium">{d.day}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                  <div>
                    <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>76%</div>
                    <div className="text-xs text-gray-400">Avg utilization</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-700" style={{ fontFamily: 'Manrope, sans-serif' }}>$4,218</div>
                    <div className="text-xs text-gray-400">Revenue this week</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ALSO INCLUDED */}
        <section className="py-14 border-t border-gray-100">
          <div className="max-w-[1100px] mx-auto px-6">
            <h3 className="text-base font-bold text-gray-900 mb-5" style={{ fontFamily: 'Manrope, sans-serif' }}>Also included</h3>
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
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowDemo('family')} className="text-green-700 font-medium text-sm hover:text-green-900 transition-colors">Family accounts demo →</button>
              <button onClick={() => setShowDemo('scheduling')} className="text-green-700 font-medium text-sm hover:text-green-900 transition-colors">Scheduling demo →</button>
              <button onClick={() => setShowDemo('pricing')} className="text-green-700 font-medium text-sm hover:text-green-900 transition-colors">Fee breakdown →</button>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-20 lg:py-28 bg-gray-50">
          <div className="max-w-[960px] mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight tracking-tight mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Simple pricing
            </h2>
            <p className="text-gray-500 mb-10">Every feature on every plan. 1% processing fee. No surprises.</p>

            <div className="grid md:grid-cols-3 gap-px bg-gray-200 rounded-xl overflow-hidden">
              {[
                { name: 'Starter', price: '$179', courts: 'Up to 6 courts', cta: 'Start free trial', features: ['Unlimited bookings', 'Player matching', 'Analytics dashboard', 'Waitlist + SMS', 'Email support'] },
                { name: 'Professional', price: '$349', courts: 'Up to 15 courts', cta: 'Start free trial', features: ['Everything in Starter', 'Events & leagues', 'Priority support', 'Custom branding', 'CourtReserve sync'] },
                { name: 'Enterprise', price: '$599', courts: 'Unlimited courts', cta: 'Contact sales', features: ['Everything in Professional', 'Multi-location', 'Dedicated account manager', 'Custom integrations', 'SLA + API access'] },
              ].map((plan, i) => (
                <div key={i} className="bg-white p-8 flex flex-col">
                  <div className="text-sm font-medium text-gray-400 mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-extrabold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{plan.price}</span>
                    <span className="text-sm text-gray-400">/mo</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-6">{plan.courts}</div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => plan.name === 'Enterprise'
                      ? (window.location.href = 'mailto:Justin@j20solutions.com?subject=PaddleGrid%20Enterprise%20Inquiry')
                      : onAuthRequired('facility')
                    }
                    className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
                      i === 1 ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-4">14-day free trial on all plans. No credit card required. No contract — cancel anytime.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 lg:py-24">
          <div className="max-w-[640px] mx-auto px-6">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-8" style={{ fontFamily: 'Manrope, sans-serif' }}>Questions</h2>
            <div className="divide-y divide-gray-200">
              {[
                { q: 'How long does setup take?', a: 'Most venues are live within 10 minutes. Add your courts, set your pricing, and you\'re ready to accept bookings. We handle migration from CourtReserve at no extra cost.' },
                { q: 'What does the 1% processing fee cover?', a: 'That\'s the total cost per booking. Stripe handles the payment, funds go directly to your bank account on a rolling basis. No hidden fees, no monthly minimums.' },
                { q: 'Can I import my data from CourtReserve?', a: 'Yes. Courts, schedules, members, booking history — we migrate everything. We support full bi-directional sync while you transition.' },
                { q: 'Is there a contract?', a: 'No. Month-to-month. Cancel anytime, no fees, no penalties.' },
                { q: 'What if I need more than 15 courts?', a: 'Enterprise plan covers unlimited courts and locations. Contact us for custom pricing and a dedicated account manager.' },
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
        <section className="py-20 border-t border-gray-100">
          <div className="max-w-[640px] mx-auto px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Try it free for 14 days.
            </h2>
            <p className="text-gray-500 mb-8">No credit card required. Most venues go live in under 10 minutes.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => onAuthRequired('facility')} className="bg-green-700 hover:bg-green-800 text-white px-8 py-3.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                Get started <ArrowRight className="w-4 h-4" />
              </button>
              <a href="mailto:Justin@j20solutions.com?subject=PaddleGrid%20Demo%20Request" className="text-gray-500 hover:text-gray-800 px-8 py-3.5 rounded-lg font-medium transition-colors border border-gray-200 hover:border-gray-300 text-center">
                Schedule a demo
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-gray-200 py-8">
          <div className="max-w-[1100px] mx-auto px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="PaddleGrid" className="h-6 w-6 object-contain" />
                <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>PaddleGrid</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</a>
                <a href="/terms" className="hover:text-gray-600 transition-colors">Terms</a>
                <a href="/support" className="hover:text-gray-600 transition-colors">Support</a>
                <a href="mailto:Justin@j20solutions.com" className="hover:text-gray-600 transition-colors">Contact</a>
              </div>
              <span className="text-xs text-gray-400">&copy; {new Date().getFullYear()} J20 Solutions LLC</span>
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
