import { useState, useRef } from 'react';
import { Calendar, Clock, MapPin, TrendingUp, Users, Shield, Zap, Check, ArrowRight, Star, Trophy, CreditCard, BarChart3, Smartphone, Globe, Play, ChevronRight } from 'lucide-react';
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
        {/* ══════════════════ HERO ══════════════════ */}
        <div className="relative min-h-[90vh] flex items-center overflow-hidden">
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/hero-bg.jpg')" }}
          />

          {/* Dark overlay with green tint */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-green-950/70 to-slate-900/75" />

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
                  onClick={() => setShowDemo('checkout')}
                  className="bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-white/20 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
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
        <AnimatedSection className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
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
        <AnimatedSection className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
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

                <button
                  onClick={() => plan.name !== 'Enterprise' ? onAuthRequired('facility') : undefined}
                  className={`w-full py-3.5 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-green-700 hover:bg-green-800 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                  }`}
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                </button>
              </motion.div>
            ))}
          </div>

          <motion.p variants={fadeUp} className="text-center text-sm text-slate-500 mt-6">
            All plans include a 14-day free trial. No credit card required.
          </motion.p>
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
                  <button
                    onClick={() => setShowDemo('checkout')}
                    className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
                  >
                    Schedule a Demo
                  </button>
                </div>
              </motion.div>
            </AnimatedSection>
          </div>
        </div>

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
