import { useState, useRef } from 'react';
import { Calendar, Clock, MapPin, TrendingUp, Users, Shield, Zap, Check, ArrowRight, Star, Trophy, CreditCard, BarChart3, Smartphone, Globe, Play, ChevronRight, X, ChevronDown, HelpCircle } from 'lucide-react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SalesPage({ onAuthRequired }: SalesPageProps) {
  const { user } = useAuth();
  const [showDemo, setShowDemo] = useState<'checkout' | 'pricing' | 'waitlist' | 'analytics' | 'family' | 'scheduling' | null>(null);

  return (
    <>
      <div className="min-h-screen bg-[#F8F9FC]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* ══════════════════ NAV ══════════════════ */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5">
            <a href="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="PaddleGrid" className="h-8 w-8 object-contain" />
              <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <span className="text-slate-800">Paddle</span>
                <span className="text-green-700">Grid</span>
              </span>
            </a>
            <div className="flex items-center gap-1 sm:gap-3">
              <a href="/#players" className="hidden sm:inline text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl transition-colors">Players</a>
              <a href="/#venues" className="hidden sm:inline text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl transition-colors">Venues</a>
              <a href="#pricing" className="hidden sm:inline text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl transition-colors">Pricing</a>
              <button
                onClick={() => onAuthRequired('login')}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 px-4 py-2 rounded-xl transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => onAuthRequired('facility')}
                className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all duration-200"
              >
                Start free trial
              </button>
            </div>
          </div>
        </nav>

        {/* ══════════════════ HERO ══════════════════ */}
        <div className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#0a0f1a]">
          {/* Gradient mesh background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-transparent to-emerald-900/30" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-green-600/10 blur-[120px]" style={{ transform: 'translate(20%, -30%)' }} />
            <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[100px]" style={{ transform: 'translate(-50%, 30%)' }} />
          </div>
          {/* Dot grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-32 w-full">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="max-w-3xl"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-medium text-green-200">Now serving 500+ facilities</span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Your Courts Deserve
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-400">
                  Smarter Management.
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-8 max-w-xl">
                PaddleGrid replaces outdated booking systems with a modern platform that fills courts, automates operations, and keeps players coming back.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => onAuthRequired('facility')}
                  className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg shadow-green-900/30 hover:shadow-green-900/40 flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-white/20 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  See How It Works
                </button>
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-6 mt-8 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  14-day free trial
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Setup in under 10 minutes
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* Curved bottom edge */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 80V30C360 0 720 60 1080 30C1260 15 1380 30 1440 40V80H0Z" fill="#F8F9FC" />
            </svg>
          </div>
        </div>

        {/* ══════════════════ SOCIAL PROOF BAR ══════════════════ */}
        <AnimatedSection className="max-w-6xl mx-auto px-6 py-12">
          <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: '500+', label: 'Active Facilities' },
                { value: '12K+', label: 'Monthly Bookings' },
                { value: '14s', label: 'Avg. Booking Time' },
                { value: '99.9%', label: 'Uptime SLA' },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{stat.value}</div>
                  <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatedSection>

        {/* ══════════════════ FEATURES GRID ══════════════════ */}
        <AnimatedSection id="features" className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Everything to Run Your Facility
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              From court reservations to player engagement — one platform that handles it all.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Calendar, title: 'Court Reservations', desc: 'Visual booking calendar with real-time availability. Players book in seconds.', features: ['Real-time availability', 'Conflict prevention', 'Flexible scheduling'] },
              { icon: Users, title: 'Memberships', desc: 'Flexible tiers with automated billing and credits. Grow recurring revenue.', features: ['Multiple tiers', 'Auto-renewal', 'Benefits tracking'] },
              { icon: Trophy, title: 'Events & Leagues', desc: 'Tournaments, clinics, leagues — full registration and payment flow.', features: ['Tournament brackets', 'Online registration', 'Capacity management'] },
              { icon: BarChart3, title: 'Analytics', desc: 'Real-time insights into revenue, utilization, and player behavior.', features: ['Revenue tracking', 'Court utilization', 'Custom reports'] },
              { icon: Smartphone, title: 'Mobile-First', desc: 'Responsive design that works perfectly on every device. Book on the go.', features: ['Mobile-optimized', 'Touch-friendly', 'Works offline'] },
              { icon: Globe, title: 'Player Portal', desc: 'Profiles with stats, achievements, and booking history. Players love it.', features: ['Activity tracking', 'Achievements', 'Social features'] },
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-7 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-5 group-hover:bg-green-100 transition-colors">
                  <f.icon className="w-6 h-6 text-green-700" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{f.desc}</p>
                <ul className="space-y-1.5">
                  {f.features.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* ══════════════════ CAPABILITIES ══════════════════ */}
        <div className="bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }} />

          <AnimatedSection className="max-w-7xl mx-auto px-6 py-20 lg:py-32 relative">
            <motion.div variants={fadeUp} className="text-center mb-16">
              <p className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">Built Different</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Capabilities That Move the Needle
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Every feature engineered for performance, reliability, and the experience your players expect.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-5">
              {[
                { title: 'Instant Booking', desc: 'Three clicks from login to confirmation. 14-second average booking time. Zero friction.', metric: '14s', label: 'Avg booking', demo: 'checkout' as const },
                { title: 'Transparent Pricing', desc: '1% processing fee, clearly displayed. No surprises, no hidden costs, no fine print.', metric: '1%', label: 'Fee cap', demo: 'pricing' as const },
                { title: 'Smart Waitlist', desc: 'Court opens up? We instantly text the next player. Spots refill in 30 seconds.', metric: '30s', label: 'Refill time', demo: 'waitlist' as const },
                { title: 'Conflict-Free Scheduling', desc: 'AI prevents double bookings and optimizes utilization. Smart suggestions maximize revenue.', metric: 'Zero', label: 'Conflicts', demo: 'scheduling' as const },
                { title: 'Family Accounts', desc: 'Parents manage bookings, payments, and schedules for the whole family from one dashboard.', metric: 'Single', label: 'Dashboard', demo: 'family' as const },
                { title: 'Live Analytics', desc: 'Real-time revenue, occupancy, and player insights. Make decisions with up-to-the-second data.', metric: 'Live', label: 'Updates', demo: 'analytics' as const },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="bg-white/[0.04] backdrop-blur-sm rounded-2xl p-7 border border-white/[0.06] hover:bg-white/[0.07] transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>{item.title}</h3>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-2xl font-extrabold text-green-400">{item.metric}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</div>
                    </div>
                  </div>
                  <p className="text-slate-400 leading-relaxed mb-4">{item.desc}</p>
                  {item.demo && (
                    <button
                      onClick={() => setShowDemo(item.demo)}
                      className="text-green-400 text-sm font-medium hover:text-green-300 transition inline-flex items-center gap-1.5 group/btn"
                    >
                      Try Interactive Demo
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>

        {/* ══════════════════ PRICING ══════════════════ */}
        <AnimatedSection id="pricing" className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Simple Plans, No Surprises
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Every plan includes full platform access. Pick what fits your facility.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: '$99', period: '/mo', desc: 'For small facilities getting started', features: ['Up to 5 courts', 'Unlimited bookings', 'Basic analytics', 'Email support'], popular: false },
              { name: 'Professional', price: '$199', period: '/mo', desc: 'For growing multi-court facilities', features: ['Up to 15 courts', 'Advanced analytics', 'Event management', 'Priority support', 'Custom branding'], popular: true },
              { name: 'Enterprise', price: 'Custom', period: '', desc: 'For large-scale operations', features: ['Unlimited courts', 'Multi-location', 'Dedicated support', 'Custom integrations', 'SLA guarantee'], popular: false },
            ].map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`bg-white rounded-2xl border-2 p-7 relative transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] ${
                  plan.popular ? 'border-green-600 shadow-[0_4px_12px_rgba(0,0,0,0.06)]' : 'border-slate-200/60'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-700 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide">MOST POPULAR</span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-slate-500">{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">{plan.desc}</p>
                </div>

                <ul className="space-y-2.5 mb-7">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.name === 'Enterprise' ? (
                  <a
                    href="mailto:Justin@j20solutions.com?subject=PaddleGrid%20Enterprise%20Inquiry"
                    className="block w-full py-3.5 rounded-xl font-semibold text-center transition-all bg-slate-100 hover:bg-slate-200 text-slate-900"
                  >
                    Contact Sales
                  </a>
                ) : (
                  <button
                    onClick={() => onAuthRequired('facility')}
                    className={`w-full py-3.5 rounded-xl font-semibold transition-all ${
                      plan.popular
                        ? 'bg-green-700 hover:bg-green-800 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                    }`}
                  >
                    Start Free Trial
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          <motion.p variants={fadeUp} className="text-center text-sm text-slate-500 mt-6">
            All plans include a 14-day free trial. No credit card required.
          </motion.p>
        </AnimatedSection>

        {/* ══════════════════ TESTIMONIALS ══════════════════ */}
        <AnimatedSection className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">Venue success stories</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Venues That Switched See Results Fast
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Mike Rodriguez', role: 'Facility owner, Scottsdale AZ', metric: '+89%', metricLabel: 'court utilization', text: 'Our court utilization went from 60% to 89% in the first month. The automated waitlist alone has been a game-changer for filling empty slots.' },
              { name: 'Tom Whitfield', role: 'Venue manager, Austin TX', metric: '+35%', metricLabel: 'revenue increase', text: 'Revenue is up 35% since we switched. The analytics dashboard shows me exactly where the money is coming from and which time slots to push.' },
              { name: 'Jenny Park', role: 'Club organizer, Portland OR', metric: '200+', metricLabel: 'members managed', text: 'Managing our 200-member club used to be chaos. PaddleGrid handles registration, court assignments, and payments. I actually enjoy running events now.' },
            ].map((t, i) => (
              <motion.div key={i} variants={fadeUp}>
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 h-full">
                  <div className="bg-green-50 rounded-xl p-3 mb-4 inline-block">
                    <div className="text-2xl font-extrabold text-green-700" style={{ fontFamily: 'Manrope, sans-serif' }}>{t.metric}</div>
                    <div className="text-xs text-green-600 font-medium">{t.metricLabel}</div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
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
          </div>
        </AnimatedSection>

        {/* ══════════════════ COMPARISON TABLE ══════════════════ */}
        <div className="bg-white py-16 lg:py-24">
          <AnimatedSection className="max-w-4xl mx-auto px-6">
            <motion.div variants={fadeUp} className="text-center mb-12">
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">Why switch</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                PaddleGrid vs. the Old Way
              </h2>
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-2xl border border-slate-200/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-4 font-semibold text-slate-500 w-[40%]">Capability</th>
                    <th className="p-4 font-bold text-green-700 text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>PaddleGrid</th>
                    <th className="p-4 font-semibold text-slate-400 text-center">Spreadsheets</th>
                    <th className="p-4 font-semibold text-slate-400 text-center">Generic SaaS</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Pickleball-specific features', pg: true, ss: false, gen: false },
                    { feature: 'Online booking & payments', pg: true, ss: false, gen: true },
                    { feature: 'Player skill matching', pg: true, ss: false, gen: false },
                    { feature: 'Automated waitlists', pg: true, ss: false, gen: false },
                    { feature: 'Built-in player community', pg: true, ss: false, gen: false },
                    { feature: 'Real-time analytics', pg: true, ss: false, gen: true },
                    { feature: 'Event & league management', pg: true, ss: false, gen: false },
                    { feature: 'CourtReserve data sync', pg: true, ss: false, gen: false },
                    { feature: 'Mobile-first experience', pg: true, ss: false, gen: true },
                    { feature: 'Setup in under 10 min', pg: true, ss: true, gen: false },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-4 text-slate-700 font-medium">{row.feature}</td>
                      <td className="p-4 text-center">{row.pg ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />}</td>
                      <td className="p-4 text-center">{row.ss ? <Check className="w-5 h-5 text-slate-400 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />}</td>
                      <td className="p-4 text-center">{row.gen ? <Check className="w-5 h-5 text-slate-400 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </AnimatedSection>
        </div>

        {/* ══════════════════ FAQ ══════════════════ */}
        <AnimatedSection className="max-w-3xl mx-auto px-6 py-16 lg:py-24">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Questions from Venue Operators
            </h2>
          </motion.div>

          <div className="space-y-3">
            {[
              { q: 'How long does setup take?', a: 'Most venues are live within 10 minutes. Add your courts, set pricing, and you\'re ready to accept bookings. Our team is available to help with migration from existing systems.' },
              { q: 'What does it cost?', a: 'Plans start at $99/month with a 14-day free trial. No credit card required. Players never pay a fee — you only pay the subscription. Processing fees are 1%, the lowest in the industry.' },
              { q: 'Can I import from CourtReserve?', a: 'Yes. We offer full bi-directional sync with CourtReserve. Import your courts, schedules, members, and booking history. We handle the migration at no extra cost.' },
              { q: 'How do payments work?', a: 'Payments go through Stripe Connect. Players pay at booking, and funds are deposited directly to your bank account on a rolling basis. You see every transaction in your dashboard.' },
              { q: 'What if I need more than 15 courts?', a: 'Our Enterprise plan supports unlimited courts and multiple locations. Contact us for custom pricing — we\'ll build a plan that fits your operation.' },
              { q: 'Is there a long-term contract?', a: 'No. All plans are month-to-month. You can cancel anytime. We earn your business every month — no lock-in, no cancellation fees.' },
            ].map((faq, i) => (
              <motion.div key={i} variants={fadeUp}>
                <details className="group bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50/50 transition-colors">
                    <span className="text-[15px] font-semibold text-slate-800 pr-4" style={{ fontFamily: 'Manrope, sans-serif' }}>{faq.q}</span>
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-slate-500 leading-relaxed">{faq.a}</div>
                </details>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* ══════════════════ FINAL CTA ══════════════════ */}
        <div className="relative overflow-hidden">
          <div className="bg-gradient-to-br from-green-700 via-green-800 to-green-900">
            <AnimatedSection className="max-w-4xl mx-auto px-6 py-20 lg:py-28 text-center">
              <motion.div variants={fadeUp}>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Ready to Modernize Your Courts?
                </h2>
                <p className="text-lg text-green-100 mb-8 max-w-xl mx-auto">
                  Join hundreds of facilities that switched to PaddleGrid. Setup takes less than 10 minutes.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => onAuthRequired('facility')}
                    className="bg-white text-green-800 px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-50 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <a
                    href="mailto:Justin@j20solutions.com?subject=PaddleGrid%20Demo%20Request"
                    className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all inline-flex items-center justify-center"
                  >
                    Schedule a Demo
                  </a>
                </div>
              </motion.div>
            </AnimatedSection>
          </div>
        </div>

        {/* ══════════════════ FOOTER ══════════════════ */}
        <footer className="bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-6 py-12 sm:py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              <div className="col-span-2 md:col-span-1">
                <a href="/" className="flex items-center gap-2 mb-4">
                  <img src="/logo.png" alt="PaddleGrid" className="h-8 w-8 object-contain" />
                  <span className="text-base font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>PaddleGrid</span>
                </a>
                <p className="text-sm text-slate-400 leading-relaxed">
                  The platform for pickleball players and venues.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>Product</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="/#players" className="text-slate-400 hover:text-white transition-colors">Players</a></li>
                  <li><a href="/#venues" className="text-slate-400 hover:text-white transition-colors">Venues</a></li>
                  <li><a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a></li>
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
