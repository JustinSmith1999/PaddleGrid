import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Calendar, MapPin, Users, ArrowRight, Trophy, MessageSquare, Zap, TrendingUp, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HomePageProps {
  onAuthRequired: (mode?: 'login' | 'signup' | 'facility') => void;
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export function HomePage({ onAuthRequired }: HomePageProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8F9FC]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="PaddleGrid" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <span className="text-slate-800">Paddle</span>
              <span className="text-green-700">Grid</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onAuthRequired('login')}
              className="text-sm font-medium text-slate-500 hover:text-slate-800 px-4 py-2 rounded-xl transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => onAuthRequired('signup')}
              className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all duration-200"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />

        {/* Dark overlay — heavy enough for white text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/85 to-slate-900/75" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 sm:py-28 md:py-36 w-full">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium text-white/80">Free for players. Always.</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[2.5rem] sm:text-5xl md:text-[3.5rem] lg:text-[4rem] font-extrabold leading-[1.08] tracking-tight text-white"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              <span className="whitespace-nowrap">Book courts. <span className="text-green-300">Find players.</span></span>
              <br />
              Own your game.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-6 text-lg sm:text-xl text-white/70 leading-relaxed max-w-xl"
            >
              The all-in-one platform for pickleball — instant court bookings, skill-matched partners, and a community built around your local scene.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row gap-3"
            >
              <button
                onClick={() => onAuthRequired('signup')}
                className="group inline-flex items-center justify-center gap-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold text-base px-8 py-4 rounded-xl shadow-lg shadow-green-900/30 hover:shadow-xl transition-all duration-200"
              >
                Create free account
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => onAuthRequired('facility')}
                className="inline-flex items-center justify-center gap-2 text-white font-semibold text-base px-8 py-4 rounded-xl border border-white/20 hover:border-white/40 hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
              >
                I manage a venue
              </button>
            </motion.div>
          </div>
        </div>

        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full h-auto block">
            <path d="M0 60L1440 60L1440 0C1440 0 1080 50 720 50C360 50 0 0 0 0L0 60Z" fill="#F8F9FC" />
          </svg>
        </div>
      </section>

      {/* ─── What it does -- 3 pillars ─── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-14">
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">How it works</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Three things, done right
              </h2>
            </div>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid sm:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Calendar,
                title: 'Book courts instantly',
                desc: 'See real-time availability at venues near you. Pick a time, pay online, show up and play. No phone calls.',
                tint: 'bg-green-50',
                iconColor: 'text-green-700',
              },
              {
                icon: Users,
                title: 'Find your people',
                desc: 'Match with players at your skill level. Jump into open games or build your regular doubles crew.',
                tint: 'bg-slate-50',
                iconColor: 'text-slate-700',
              },
              {
                icon: MessageSquare,
                title: 'Stay connected',
                desc: 'A social feed built for pickleball. Share results, coordinate meetups, follow your local clubs.',
                tint: 'bg-green-50',
                iconColor: 'text-green-700',
              },
            ].map((item, i) => (
              <motion.div key={i} variants={cardItem}>
                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 h-full"
                >
                  <div className={`w-11 h-11 rounded-xl ${item.tint} flex items-center justify-center mb-5`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>{item.title}</h3>
                  <p className="text-[15px] text-slate-500 leading-relaxed">{item.desc}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── For players -- feature list ─── */}
      <section id="players" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            <div>
              <Reveal>
                <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3">For players</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Stop texting around for court times
                </h2>
                <p className="mt-5 text-base text-slate-500 leading-relaxed">
                  You shouldn't need four apps and a group chat to play pickleball. PaddleGrid puts it all in one place.
                </p>
              </Reveal>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="space-y-4"
            >
              {[
                { icon: MapPin, title: 'Courts near you', desc: 'Browse every venue in your area with live availability and pricing.' },
                { icon: Trophy, title: 'Track your game', desc: 'Log matches, watch your rating climb, earn achievements as you play.' },
                { icon: Users, title: 'Player matching', desc: 'Get matched with players at your skill level. No more lopsided games.' },
                { icon: Calendar, title: 'One-tap booking', desc: 'Book and pay in seconds. Get reminders before your session.' },
              ].map((f, i) => (
                <motion.div key={i} variants={cardItem}>
                  <motion.div
                    whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-4 bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5"
                  >
                    <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <f.icon className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>{f.title}</h4>
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── For venues ─── */}
      <section id="venues" className="py-20 sm:py-28 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            <div>
              <Reveal>
                <p className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">For venue operators</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Fill courts. Cut busywork.
                </h2>
                <p className="mt-5 text-base text-slate-400 leading-relaxed max-w-md">
                  Replace your booking spreadsheet, payment terminal, and marketing emails with one dashboard.
                </p>
              </Reveal>

              <Reveal delay={0.2}>
                <button
                  onClick={() => onAuthRequired('facility')}
                  className="mt-8 group inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-sm transition-all duration-200"
                >
                  List your venue -- it's free to start
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </Reveal>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="space-y-4"
            >
              {[
                { icon: Zap, title: 'Online booking system', desc: 'Customers book and pay online. No phone tag, no double-bookings.' },
                { icon: TrendingUp, title: 'Revenue dashboard', desc: 'See which courts perform, track peak hours, and watch revenue in real time.' },
                { icon: Shield, title: 'Stripe Connect payouts', desc: 'Funds go directly to your bank account. No invoicing, no chasing payments.' },
                { icon: Users, title: 'Built-in demand', desc: 'Every player on PaddleGrid can discover and book your venue.' },
              ].map((f, i) => (
                <motion.div key={i} variants={cardItem}>
                  <div className="flex gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200">
                    <div className="w-11 h-11 rounded-xl bg-green-700/20 border border-green-600/20 flex items-center justify-center flex-shrink-0">
                      <f.icon className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>{f.title}</h4>
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 sm:py-32">
        <Reveal>
          <div className="max-w-6xl mx-auto px-6">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-10 sm:p-14 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Ready to play?
              </h2>
              <p className="mt-4 text-base text-slate-500 max-w-md mx-auto">
                Create a free account and find your next game.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => onAuthRequired('signup')}
                  className="group inline-flex items-center justify-center gap-2.5 bg-green-700 hover:bg-green-800 text-white font-semibold text-base px-8 py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Get started free
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  onClick={() => onAuthRequired('facility')}
                  className="inline-flex items-center justify-center gap-2 text-slate-700 font-semibold text-base px-8 py-4 rounded-xl border border-slate-200/60 hover:border-slate-300 hover:bg-slate-50/50 transition-all duration-200"
                >
                  List your venue
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-slate-900 text-white" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-6xl mx-auto px-6 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="PaddleGrid" className="h-8 w-8 object-contain" />
                <span className="text-base font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>PaddleGrid</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                The platform for pickleball players and venues.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#players" className="text-slate-400 hover:text-white transition-colors">Players</a></li>
                <li><a href="#venues" className="text-slate-400 hover:text-white transition-colors">Venues</a></li>
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
