import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, ArrowRight, CheckCircle, Trophy, MessageSquare, Bell, Flame, ChevronRight, Zap, Shield, TrendingUp, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdvancedBookingCalendar } from './AdvancedBookingCalendar';
import { useAuth } from '../contexts/AuthContext';

interface Court {
  id: string;
  name: string;
  description: string | null;
  hourly_rate: number;
  image_url: string | null;
  is_active: boolean;
}

interface HomePageProps {
  onAuthRequired: (mode?: 'login' | 'signup' | 'facility') => void;
}

/* ── Reusable animation wrappers ── */
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated counter ── */
function Counter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ── Floating orbs for hero background ── */
function HeroOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #6DB33F 0%, transparent 70%)', top: '-10%', right: '-10%' }}
        animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, #6DB33F 0%, transparent 70%)', bottom: '-15%', left: '-5%' }}
        animate={{ scale: [1, 1.2, 1], x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full opacity-[0.04]"
        style={{ background: 'radial-gradient(circle, #4A9EDB 0%, transparent 70%)', top: '30%', left: '20%' }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/* ── Grid pattern for hero ── */
function GridPattern() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(27,42,74,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(27,42,74,0.3) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
    </div>
  );
}

export function HomePage({ onAuthRequired }: HomePageProps) {
  const { user } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      setCourts(data || []);
    } catch (err) {
      console.error('Error fetching courts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookCourt = (court: Court) => {
    if (!user) {
      onAuthRequired();
      return;
    }
    setSelectedCourt(court);
  };

  const playerFeatures = [
    { icon: Calendar, title: 'Instant booking', desc: 'See real-time availability across every venue near you. Book and pay in two taps.', gradient: 'from-emerald-500 to-green-600' },
    { icon: Users, title: 'Find players', desc: 'Match with players at your skill level. Build a regular crew or drop into open games.', gradient: 'from-blue-500 to-indigo-600' },
    { icon: Trophy, title: 'Track progress', desc: 'Log matches, track your rating, earn achievements. See how you stack up.', gradient: 'from-amber-500 to-orange-600' },
    { icon: MessageSquare, title: 'Community feed', desc: 'Share highlights, coordinate meetups, and stay connected with your local scene.', gradient: 'from-violet-500 to-purple-600' },
    { icon: Flame, title: 'Play streaks', desc: 'Stay motivated with daily and weekly streaks. Unlock badges the more you play.', gradient: 'from-rose-500 to-red-600' },
    { icon: Bell, title: 'Smart reminders', desc: 'Get notified when your favorite court opens up or when a friend wants to play.', gradient: 'from-cyan-500 to-teal-600' },
  ];

  const venueFeatures = [
    { icon: Zap, title: 'Online booking system', desc: 'Customers book and pay online. No phone tag, no double-bookings.' },
    { icon: TrendingUp, title: 'Revenue analytics', desc: 'See which courts perform, peak hours, and revenue trends at a glance.' },
    { icon: Shield, title: 'Stripe Connect payouts', desc: 'Funds go directly to your bank. No invoicing, no chasing payments.' },
    { icon: Users, title: 'Player acquisition', desc: 'Every player on PaddleGrid can discover your venue. Built-in demand.' },
  ];

  return (
    <>
      <div className="min-h-screen bg-white overflow-x-hidden">
        {/* ── Nav ── */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5">
            <motion.div className="flex items-center gap-2.5" whileHover={{ scale: 1.02 }}>
              <img src="/logo.png" alt="PaddleGrid" className="h-9 w-9 object-contain" />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-[#1B2A4A]">Paddle</span>
                <span className="text-[#6DB33F]">Grid</span>
              </span>
            </motion.div>
            <div className="hidden md:flex items-center gap-8">
              {['Players', 'Venues'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm font-medium text-gray-400 hover:text-gray-900 transition-all duration-300"
                >
                  {item}
                </a>
              ))}
              <motion.button
                onClick={() => onAuthRequired('login')}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Sign in
              </motion.button>
              <motion.button
                onClick={() => onAuthRequired('signup')}
                className="relative bg-[#1B2A4A] text-white text-sm font-semibold px-5 py-2.5 rounded-lg overflow-hidden group"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="relative z-10">Get started</span>
                <motion.div
                  className="absolute inset-0 bg-[#243a60]"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </div>
            <motion.button
              onClick={() => onAuthRequired('signup')}
              className="md:hidden bg-[#1B2A4A] text-white text-sm font-semibold px-4 py-2 rounded-lg"
              whileTap={{ scale: 0.95 }}
            >
              Get started
            </motion.button>
          </div>
        </motion.nav>

        {/* ── Hero ── */}
        <section ref={heroRef} className="relative min-h-[85vh] flex items-center overflow-hidden">
          <HeroOrbs />
          <GridPattern />
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 w-full"
          >
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div>
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="inline-flex items-center gap-2 bg-[#6DB33F]/10 border border-[#6DB33F]/20 rounded-full px-4 py-1.5 mb-6"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6DB33F] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6DB33F]"></span>
                  </span>
                  <span className="text-xs font-semibold text-[#6DB33F]">Now available on iOS</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="text-4xl md:text-[52px] font-extrabold leading-[1.08] tracking-tight text-[#1B2A4A] mb-6"
                >
                  Book courts.{' '}
                  <br className="hidden md:block" />
                  Find players.{' '}
                  <br className="hidden md:block" />
                  <span className="relative">
                    <span className="bg-gradient-to-r from-[#6DB33F] to-[#4A9E2A] bg-clip-text text-transparent">
                      Own your game.
                    </span>
                    <motion.span
                      className="absolute -bottom-1 left-0 h-[3px] bg-gradient-to-r from-[#6DB33F] to-[#4A9E2A] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.8, delay: 1, ease: 'easeOut' }}
                    />
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  className="text-lg text-gray-500 leading-relaxed mb-8 max-w-md"
                >
                  The all-in-one platform for pickleball. Real-time court booking, player matching, and venue management — built for the fastest-growing sport in America.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-3 mb-10"
                >
                  <motion.button
                    onClick={() => onAuthRequired('signup')}
                    className="group inline-flex items-center justify-center gap-2 bg-[#6DB33F] text-white font-semibold text-base px-7 py-3.5 rounded-xl shadow-lg shadow-[#6DB33F]/25 transition-all"
                    whileHover={{ scale: 1.03, boxShadow: '0 20px 40px -12px rgba(109,179,63,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Start playing free
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </motion.button>
                  <motion.button
                    onClick={() => onAuthRequired('facility')}
                    className="inline-flex items-center justify-center gap-2 bg-white text-[#1B2A4A] font-semibold text-base px-7 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    I run a venue
                  </motion.button>
                </motion.div>

                {/* Social proof */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.7 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex -space-x-2.5">
                    {['#3BBFA0', '#6DB33F', '#1B2A4A', '#E8A435', '#5C6BC0'].map((bg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.8 + i * 0.08 }}
                        className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                        style={{ background: bg }}
                      >
                        {['JM', 'KR', 'TS', 'AL', 'PD'][i]}
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">2,400+ players</span> already on PaddleGrid
                  </p>
                </motion.div>
              </div>

              {/* Product preview */}
              <motion.div
                initial={{ opacity: 0, x: 40, rotateY: -5 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 0.9, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-[#6DB33F]/10 via-transparent to-[#1B2A4A]/10 rounded-3xl blur-2xl" />
                <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200/50 p-5 space-y-3">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="h-6 bg-gray-100 rounded-md flex-1 max-w-[200px]" />
                  </div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Courts near you</p>
                  {[
                    { name: 'Sunset Pickleball Club', courts: 4, dist: '0.8 mi', badge: 'Open now', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100', price: '$12/hr', gradient: 'from-emerald-400 to-green-500' },
                    { name: 'Downtown Rec Center', courts: 6, dist: '1.2 mi', badge: '2 slots left', badgeColor: 'bg-blue-50 text-blue-700 border-blue-100', price: '$15/hr', gradient: 'from-blue-400 to-indigo-500' },
                    { name: 'Riverside Athletic Park', courts: 8, dist: '2.5 mi', badge: 'Peak hours', badgeColor: 'bg-amber-50 text-amber-700 border-amber-100', price: '$18/hr', gradient: 'from-amber-400 to-orange-500' },
                  ].map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.7 + i * 0.12 }}
                      whileHover={{ scale: 1.02, y: -2, boxShadow: '0 8px 24px -8px rgba(0,0,0,0.1)' }}
                      className="flex items-center gap-3.5 bg-white rounded-xl border border-gray-100 p-3.5 cursor-pointer transition-colors hover:border-gray-200"
                    >
                      <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${c.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{c.name}</h4>
                        <p className="text-xs text-gray-400">{c.courts} courts &bull; {c.dist}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.badgeColor}`}>{c.badge}</span>
                        <p className="text-sm font-bold text-[#1B2A4A] mt-1">{c.price}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ── Logos / Social proof bar ── */}
        <FadeIn>
          <section className="border-y border-gray-100 py-10 bg-gray-50/50">
            <div className="max-w-6xl mx-auto px-6">
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-300 mb-6">
                Trusted by facilities and players nationwide
              </p>
              <div className="flex items-center justify-center gap-12 md:gap-16 flex-wrap opacity-40">
                {['Sunset Pickleball', 'Metro Courts', 'PlayTime Sports', 'Rally Point', 'NetPro Facilities'].map((name, i) => (
                  <motion.span
                    key={i}
                    className="text-sm md:text-base font-bold text-gray-400 tracking-wide"
                    whileHover={{ opacity: 1, scale: 1.05 }}
                  >
                    {name}
                  </motion.span>
                ))}
              </div>
            </div>
          </section>
        </FadeIn>

        {/* ── Stats ── */}
        <section className="py-20 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: 85, suffix: '+', label: 'Partner venues', icon: MapPin },
                { value: 2400, suffix: '+', label: 'Active players', icon: Users },
                { value: 12, suffix: 'K+', label: 'Bookings completed', icon: Calendar },
                { value: 4.8, suffix: '', label: 'App Store rating', icon: Star },
              ].map((s, i) => (
                <FadeUp key={i} delay={i * 0.1}>
                  <div className="text-center group">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#6DB33F]/10 mb-4 group-hover:bg-[#6DB33F]/20 transition-colors">
                      <s.icon className="w-5 h-5 text-[#6DB33F]" />
                    </div>
                    <p className="text-3xl md:text-4xl font-bold text-[#1B2A4A]">
                      {s.value === 4.8 ? '4.8' : <Counter target={s.value} suffix={s.suffix} />}
                      {s.value === 4.8 && <span className="text-[#6DB33F]"> ★</span>}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">{s.label}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── Player features ── */}
        <section id="players" className="py-20 md:py-28 bg-gradient-to-b from-white via-gray-50/50 to-white">
          <div className="max-w-6xl mx-auto px-6">
            <FadeUp>
              <div className="text-center mb-16">
                <span className="inline-flex items-center gap-2 bg-[#6DB33F]/10 border border-[#6DB33F]/20 rounded-full px-4 py-1.5 mb-4">
                  <span className="text-xs font-semibold text-[#6DB33F]">For players</span>
                </span>
                <h2 className="text-3xl md:text-[42px] font-extrabold text-[#1B2A4A] tracking-tight mb-4">
                  Everything you need,{' '}
                  <span className="bg-gradient-to-r from-[#6DB33F] to-[#4A9E2A] bg-clip-text text-transparent">one app</span>
                </h2>
                <p className="text-lg text-gray-400 max-w-lg mx-auto">
                  No more texting around for court times or juggling multiple venue apps.
                </p>
              </div>
            </FadeUp>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {playerFeatures.map((f, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <motion.div
                    onHoverStart={() => setHoveredFeature(i)}
                    onHoverEnd={() => setHoveredFeature(null)}
                    whileHover={{ y: -4, transition: { duration: 0.25 } }}
                    className="relative bg-white rounded-2xl border border-gray-100 p-6 cursor-default overflow-hidden group hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/80 transition-all duration-300"
                  >
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(109,179,63,0.04), transparent 40%)`,
                      }}
                    />
                    <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-sm`}>
                      <f.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="relative text-base font-semibold text-[#1B2A4A] mb-2">{f.title}</h3>
                    <p className="relative text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── Venue section ── */}
        <section id="venues" className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#1B2A4A]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(rgba(109,179,63,0.3) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }} />

          <div className="relative z-10 max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-center">
            <div>
              <FadeUp>
                <span className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-1.5 mb-6">
                  <span className="text-xs font-semibold text-[#6DB33F]">For venue operators</span>
                </span>
                <h2 className="text-3xl md:text-[42px] font-extrabold text-white tracking-tight mb-4 leading-tight">
                  Fill every court,{' '}
                  <span className="bg-gradient-to-r from-[#6DB33F] to-[#85D455] bg-clip-text text-transparent">automatically</span>
                </h2>
                <p className="text-base text-white/50 mb-10 max-w-md leading-relaxed">
                  PaddleGrid replaces your booking spreadsheet, payment terminal, and marketing emails with one dashboard.
                </p>
              </FadeUp>

              <div className="space-y-6">
                {venueFeatures.map((item, i) => (
                  <FadeUp key={i} delay={i * 0.1}>
                    <motion.div
                      className="flex gap-4 group cursor-default"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#6DB33F]/20 group-hover:border-[#6DB33F]/30 transition-all duration-300">
                        <item.icon className="w-5 h-5 text-[#6DB33F]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-0.5">{item.title}</h4>
                        <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  </FadeUp>
                ))}
              </div>

              <FadeUp delay={0.4}>
                <motion.button
                  onClick={() => onAuthRequired('facility')}
                  className="mt-10 group inline-flex items-center gap-2 bg-white text-[#1B2A4A] font-semibold text-sm px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-white/10 transition-all"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  List your venue
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </FadeUp>
            </div>

            {/* Dashboard mock */}
            <FadeUp delay={0.2}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#6DB33F]/20 to-transparent rounded-3xl blur-2xl" />
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Venue dashboard</p>
                    <span className="text-[10px] font-semibold text-[#6DB33F] bg-[#6DB33F]/10 px-2.5 py-0.5 rounded-full">Live</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Today's bookings", value: '24', change: '+18%' },
                      { label: 'Revenue (MTD)', value: '$8,420', change: '+12%' },
                    ].map((m, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/5 rounded-xl border border-white/10 p-3.5"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/30">{m.label}</p>
                        <p className="text-xl font-bold text-white mt-1">{m.value}</p>
                        <p className="text-xs font-semibold text-[#6DB33F] mt-0.5">{m.change}</p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Court utilization', value: '78%', pct: 78 },
                      { label: 'Avg. rating', value: '4.9', pct: 98 },
                    ].map((m, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/5 rounded-xl border border-white/10 p-3.5"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/30">{m.label}</p>
                        <p className="text-xl font-bold text-white mt-1">{m.value}</p>
                        <div className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#6DB33F] to-[#85D455] rounded-full"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${m.pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute w-[500px] h-[500px] rounded-full opacity-[0.06]"
              style={{ background: 'radial-gradient(circle, #6DB33F 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <FadeUp>
            <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
              <h2 className="text-3xl md:text-[42px] font-extrabold text-[#1B2A4A] tracking-tight mb-4 leading-tight">
                Ready to{' '}
                <span className="bg-gradient-to-r from-[#6DB33F] to-[#4A9E2A] bg-clip-text text-transparent">play?</span>
              </h2>
              <p className="text-lg text-gray-400 mb-10">
                Join thousands of players already booking courts on PaddleGrid.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  onClick={() => onAuthRequired('signup')}
                  className="group inline-flex items-center justify-center gap-2 bg-[#6DB33F] text-white font-semibold text-base px-8 py-4 rounded-xl shadow-lg shadow-[#6DB33F]/25 transition-all"
                  whileHover={{ scale: 1.03, boxShadow: '0 20px 40px -12px rgba(109,179,63,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  Get started — it's free
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </motion.button>
                <motion.button
                  onClick={() => onAuthRequired('facility')}
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#1B2A4A] font-semibold text-base px-8 py-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  List your venue
                </motion.button>
              </div>
            </div>
          </FadeUp>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-[#0F1A2E] text-white">
          <div className="max-w-6xl mx-auto px-6 py-14">
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
                  <li><a href="#players" className="text-white/50 hover:text-white transition-colors duration-200">Players</a></li>
                  <li><a href="#venues" className="text-white/50 hover:text-white transition-colors duration-200">Venues</a></li>
                  <li><a href="/sales" className="text-white/50 hover:text-white transition-colors duration-200">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/25 mb-4">Company</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="/support" className="text-white/50 hover:text-white transition-colors duration-200">Support</a></li>
                  <li><a href="mailto:Justin@j20solutions.com" className="text-white/50 hover:text-white transition-colors duration-200">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/25 mb-4">Legal</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="/privacy" className="text-white/50 hover:text-white transition-colors duration-200">Privacy policy</a></li>
                  <li><a href="/terms" className="text-white/50 hover:text-white transition-colors duration-200">Terms of service</a></li>
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

      {selectedCourt && (
        <AdvancedBookingCalendar
          court={selectedCourt}
          onClose={() => setSelectedCourt(null)}
        />
      )}
    </>
  );
}
