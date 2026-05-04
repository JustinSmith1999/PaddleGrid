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

export function HomePage({ onAuthRequired }: HomePageProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100/80" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="PaddleGrid" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold tracking-tight">
              <span className="text-[#1B2A4A]">Paddle</span>
              <span className="text-[#6DB33F]">Grid</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAuthRequired('login')}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-2 transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => onAuthRequired('signup')}
              className="bg-[#1B2A4A] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#243a60] transition-colors"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, #6DB33F 0%, transparent 70%)', transform: 'translate(20%, -30%)' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-5 pt-16 pb-20 sm:pt-24 sm:pb-28 md:pt-32 md:pb-36">
          <div className="max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[2.25rem] sm:text-5xl md:text-[3.5rem] font-extrabold leading-[1.08] tracking-tight text-[#1B2A4A]"
            >
              The pickleball app{' '}
              <span className="text-[#6DB33F]">that actually works</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-5 text-lg sm:text-xl text-gray-500 leading-relaxed max-w-lg"
            >
              Book courts, find players at your level, and connect with your local pickleball community. No more group texts. No more phone calls.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <button
                onClick={() => onAuthRequired('signup')}
                className="group inline-flex items-center justify-center gap-2 bg-[#6DB33F] text-white font-semibold text-base px-7 py-3.5 rounded-xl shadow-lg shadow-[#6DB33F]/20 hover:shadow-[#6DB33F]/30 hover:bg-[#5ea336] transition-all"
              >
                Create free account
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => onAuthRequired('facility')}
                className="inline-flex items-center justify-center gap-2 text-[#1B2A4A] font-semibold text-base px-7 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                I manage a venue
              </button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-5 text-sm text-gray-400"
            >
              Free for players. Always.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ─── What it does — 3 pillars ─── */}
      <section className="py-16 sm:py-24 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-5">
          <Reveal>
            <p className="text-sm font-semibold text-[#6DB33F] uppercase tracking-wider mb-3">How it works</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1B2A4A] tracking-tight max-w-lg">
              Three things, done right
            </h2>
          </Reveal>

          <div className="mt-12 grid sm:grid-cols-3 gap-8 sm:gap-6">
            {[
              {
                icon: Calendar,
                title: 'Book courts instantly',
                desc: 'See real-time availability at venues near you. Pick a time, pay online, show up and play. No phone calls.',
                color: '#6DB33F',
              },
              {
                icon: Users,
                title: 'Find your people',
                desc: 'Match with players at your skill level. Jump into open games or build your regular doubles crew.',
                color: '#1B2A4A',
              },
              {
                icon: MessageSquare,
                title: 'Stay connected',
                desc: 'A social feed built for pickleball. Share results, coordinate meetups, follow your local clubs.',
                color: '#5C6BC0',
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="group">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors"
                    style={{ backgroundColor: `${item.color}10` }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-[#1B2A4A] mb-2">{item.title}</h3>
                  <p className="text-[15px] text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── For players — feature list ─── */}
      <section id="players" className="py-16 sm:py-24 bg-gray-50/70">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            <div>
              <Reveal>
                <p className="text-sm font-semibold text-[#6DB33F] uppercase tracking-wider mb-3">For players</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1B2A4A] tracking-tight">
                  Stop texting around for court times
                </h2>
                <p className="mt-4 text-base text-gray-500 leading-relaxed">
                  You shouldn't need four apps and a group chat to play pickleball. PaddleGrid puts it all in one place.
                </p>
              </Reveal>
            </div>

            <div className="space-y-5">
              {[
                { icon: MapPin, title: 'Courts near you', desc: 'Browse every venue in your area with live availability and pricing.' },
                { icon: Trophy, title: 'Track your game', desc: 'Log matches, watch your rating climb, earn achievements as you play.' },
                { icon: Users, title: 'Player matching', desc: 'Get matched with players at your skill level. No more lopsided games.' },
                { icon: Calendar, title: 'One-tap booking', desc: 'Book and pay in seconds. Get reminders before your session.' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div className="flex gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-lg bg-[#6DB33F]/10 flex items-center justify-center flex-shrink-0">
                      <f.icon className="w-5 h-5 text-[#6DB33F]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#1B2A4A]">{f.title}</h4>
                      <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── For venues ─── */}
      <section id="venues" className="py-16 sm:py-24 bg-[#1B2A4A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div className="relative max-w-5xl mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            <div>
              <Reveal>
                <p className="text-sm font-semibold text-[#6DB33F] uppercase tracking-wider mb-3">For venue operators</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  Fill courts. Cut busywork.
                </h2>
                <p className="mt-4 text-base text-white/50 leading-relaxed max-w-md">
                  Replace your booking spreadsheet, payment terminal, and marketing emails with one dashboard.
                </p>
              </Reveal>

              <Reveal delay={0.2}>
                <button
                  onClick={() => onAuthRequired('facility')}
                  className="mt-8 group inline-flex items-center gap-2 bg-white text-[#1B2A4A] font-semibold text-sm px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  List your venue — it's free to start
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </Reveal>
            </div>

            <div className="space-y-5">
              {[
                { icon: Zap, title: 'Online booking system', desc: 'Customers book and pay online. No phone tag, no double-bookings.' },
                { icon: TrendingUp, title: 'Revenue dashboard', desc: 'See which courts perform, track peak hours, and watch revenue in real time.' },
                { icon: Shield, title: 'Stripe Connect payouts', desc: 'Funds go directly to your bank account. No invoicing, no chasing payments.' },
                { icon: Users, title: 'Built-in demand', desc: 'Every player on PaddleGrid can discover and book your venue.' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <f.icon className="w-5 h-5 text-[#6DB33F]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{f.title}</h4>
                      <p className="text-sm text-white/40 mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 sm:py-28">
        <Reveal>
          <div className="max-w-xl mx-auto px-5 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1B2A4A] tracking-tight">
              Ready to play?
            </h2>
            <p className="mt-4 text-base text-gray-500">
              Create a free account and find your next game.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => onAuthRequired('signup')}
                className="group inline-flex items-center justify-center gap-2 bg-[#6DB33F] text-white font-semibold text-base px-8 py-4 rounded-xl shadow-lg shadow-[#6DB33F]/20 hover:shadow-[#6DB33F]/30 hover:bg-[#5ea336] transition-all"
              >
                Get started free
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => onAuthRequired('facility')}
                className="inline-flex items-center justify-center gap-2 text-[#1B2A4A] font-semibold text-base px-8 py-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                List your venue
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#0F1A2E] text-white" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-5xl mx-auto px-5 py-10 sm:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="PaddleGrid" className="h-8 w-8 object-contain" />
                <span className="text-base font-bold">PaddleGrid</span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">
                The platform for pickleball players and venues.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/25 mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#players" className="text-white/50 hover:text-white transition-colors">Players</a></li>
                <li><a href="#venues" className="text-white/50 hover:text-white transition-colors">Venues</a></li>
                <li><a href="/sales" className="text-white/50 hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/25 mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="/support" className="text-white/50 hover:text-white transition-colors">Support</a></li>
                <li><a href="mailto:Justin@j20solutions.com" className="text-white/50 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/25 mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="/privacy" className="text-white/50 hover:text-white transition-colors">Privacy policy</a></li>
                <li><a href="/terms" className="text-white/50 hover:text-white transition-colors">Terms of service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-xs text-white/20 gap-2">
            <span>&copy; {new Date().getFullYear()} PaddleGrid. All rights reserved.</span>
            <span>J20 Solutions LLC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
