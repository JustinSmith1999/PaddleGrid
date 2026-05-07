import { useState } from 'react';
import { Check, ArrowRight, X, ChevronDown, ChevronRight } from 'lucide-react';
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

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function SalesPage({ onAuthRequired }: SalesPageProps) {
  const { user } = useAuth();
  const [showDemo, setShowDemo] = useState<'checkout' | 'pricing' | 'waitlist' | 'analytics' | 'family' | 'scheduling' | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
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
              <button onClick={() => onAuthRequired('login')} className="text-sm font-medium text-slate-500 hover:text-slate-800 px-4 py-2 transition-colors">
                Sign in
              </button>
              <button onClick={() => onAuthRequired('facility')} className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors">
                Start free trial
              </button>
            </div>
          </div>
        </nav>

        {/* HERO — clean, no gimmicks */}
        <section className="bg-slate-900 py-20 lg:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div initial="hidden" animate="visible" variants={fade} className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Stop managing courts with spreadsheets.
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
                PaddleGrid handles bookings, payments, waitlists, and player matching so you can focus on running your facility.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button onClick={() => onAuthRequired('facility')} className="bg-green-600 hover:bg-green-500 text-white px-7 py-3.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </button>
                <a href="mailto:Justin@j20solutions.com?subject=PaddleGrid%20Demo%20Request" className="text-white/70 hover:text-white px-7 py-3.5 rounded-lg font-medium transition-colors border border-white/20 hover:border-white/40 text-center">
                  Schedule a Demo
                </a>
              </div>
              <p className="text-sm text-slate-500">14-day free trial. No credit card. Setup in under 10 minutes.</p>
            </motion.div>
          </div>
        </section>

        {/* WHY PADDLEGRID — 3 differentiators, not 6 identical cards */}
        <section className="py-16 lg:py-24 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-12" style={{ fontFamily: 'Manrope, sans-serif' }}>
              What makes it different
            </h2>

            <div className="space-y-16">
              {/* Differentiator 1 */}
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    1% processing fee. That's it.
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    CourtReserve and PodPlay charge 2.9%+ per transaction. On $10K/month in bookings, that's $190 extra you're giving away. PaddleGrid uses Stripe Connect at 1% — funds go straight to your bank account.
                  </p>
                  <button onClick={() => setShowDemo('pricing')} className="text-green-700 text-sm font-medium hover:text-green-800 transition inline-flex items-center gap-1">
                    See the pricing breakdown <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="text-sm text-slate-500 mb-3">Monthly savings on $10K revenue</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">PaddleGrid (1%)</span>
                      <span className="text-sm font-bold text-slate-900">$100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">CourtReserve (2.9%+)</span>
                      <span className="text-sm text-slate-500">$290+</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">PodPlay (2.9%+)</span>
                      <span className="text-sm text-slate-500">$290+</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700">You keep</span>
                      <span className="text-sm font-bold text-green-700">$190+/mo more</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Differentiator 2 */}
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Player matching and community built in.
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    CourtReserve and PodPlay are booking systems. PaddleGrid is a booking system <em>and</em> a player network. Skill-based matching, player profiles, achievements, and a social layer that keeps players coming back to your facility.
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="text-sm text-slate-500 mb-3">Features neither competitor offers</div>
                  <ul className="space-y-2.5">
                    {['Skill-based player matching', 'Player profiles with stats', 'Family accounts — one login for everyone', 'Built-in community and social features'].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Differentiator 3 */}
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Three clicks to book. Zero double-bookings.
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Pick a court, pick a time, confirm. The system prevents conflicts automatically and texts the next person on the waitlist when a slot opens.
                  </p>
                  <button onClick={() => setShowDemo('checkout')} className="text-green-700 text-sm font-medium hover:text-green-800 transition inline-flex items-center gap-1">
                    Try the booking demo <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="text-sm text-slate-500 mb-3">Also included</div>
                  <ul className="space-y-2.5">
                    {['Real-time court availability calendar', 'Automated SMS waitlist notifications', 'Event & league management', 'Live analytics dashboard', 'CourtReserve data import'].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-16 lg:py-24 border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <div className="mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Pricing
              </h2>
              <p className="text-slate-500">
                Full platform access on every plan. No feature gates, no surprises.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                { name: 'Starter', price: '$179', desc: 'Up to 6 courts', features: ['Unlimited bookings', 'Player matching', 'Analytics dashboard', 'Waitlist with SMS', 'Email support'], popular: false },
                { name: 'Professional', price: '$349', desc: 'Up to 15 courts', features: ['Everything in Starter', 'Event & league management', 'Priority support', 'Custom branding', 'CourtReserve sync'], popular: true },
                { name: 'Enterprise', price: '$599', desc: 'Unlimited courts', features: ['Everything in Professional', 'Multi-location support', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'API access'], popular: false },
              ].map((plan, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-6 relative ${
                    plan.popular ? 'border-green-600 bg-green-50/30 ring-1 ring-green-600' : 'border-slate-200 bg-white'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 left-4 bg-green-700 text-white px-3 py-0.5 rounded text-xs font-semibold">Most popular</span>
                  )}
                  <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{plan.name}</h3>
                  <div className="mt-1 mb-1">
                    <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-slate-500 text-sm">/mo</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-5">{plan.desc}</p>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => plan.name === 'Enterprise'
                      ? window.location.href = 'mailto:Justin@j20solutions.com?subject=PaddleGrid%20Enterprise%20Inquiry'
                      : onAuthRequired('facility')
                    }
                    className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors ${
                      plan.popular
                        ? 'bg-green-700 hover:bg-green-800 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400 mt-4">All plans include a 14-day free trial. No credit card required. 1% processing fee on all plans.</p>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="py-16 lg:py-24 bg-slate-50 border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <div className="mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                PaddleGrid vs. CourtReserve vs. PodPlay
              </h2>
              <p className="text-slate-500">Side-by-side on the things that matter.</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left p-4 font-medium text-slate-500 w-[36%]"></th>
                    <th className="p-4 text-center">
                      <div className="font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>PaddleGrid</div>
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
            <p className="text-xs text-slate-400 mt-3">
              Competitor pricing and features based on publicly available information as of 2025. Subject to change.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 lg:py-24 border-b border-slate-100">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Common questions
            </h2>

            <div className="divide-y divide-slate-200">
              {[
                { q: 'How long does setup take?', a: 'Most venues are live within 10 minutes. Add your courts, set pricing, and you\'re ready. We handle migration from CourtReserve at no extra cost.' },
                { q: 'What does it cost?', a: 'Plans start at $179/month. 14-day free trial, no credit card required. Players never pay a fee — you pay the subscription plus a 1% processing fee, the lowest in the industry.' },
                { q: 'Can I import from CourtReserve?', a: 'Yes. Full bi-directional sync. Courts, schedules, members, booking history — we migrate everything.' },
                { q: 'How do payments work?', a: 'Stripe Connect. Players pay at booking, funds go to your bank account on a rolling basis. Every transaction is visible in your dashboard.' },
                { q: 'What if I need more than 15 courts?', a: 'Enterprise plan — unlimited courts and locations. Contact us for custom pricing.' },
                { q: 'Is there a contract?', a: 'No. Month-to-month. Cancel anytime, no fees.' },
              ].map((faq, i) => (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex items-center justify-between w-full py-4 text-left hover:text-slate-900 transition-colors"
                  >
                    <span className="text-[15px] font-medium text-slate-800 pr-4">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <p className="pb-4 text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-slate-900 py-16 lg:py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              See it for yourself.
            </h2>
            <p className="text-slate-400 mb-8">
              14-day free trial, no credit card. Most venues are live in under 10 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => onAuthRequired('facility')} className="bg-green-600 hover:bg-green-500 text-white px-7 py-3.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </button>
              <a href="mailto:Justin@j20solutions.com?subject=PaddleGrid%20Demo%20Request" className="border border-white/20 hover:border-white/40 text-white px-7 py-3.5 rounded-lg font-medium transition-colors text-center">
                Schedule a Demo
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-slate-900 border-t border-slate-800 text-white">
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
