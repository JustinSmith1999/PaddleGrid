import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, ArrowRight, CheckCircle, BarChart3, CreditCard, Search, Clock, Trophy, MessageSquare, Bell, Flame, ChevronRight } from 'lucide-react';
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

export function HomePage({ onAuthRequired }: HomePageProps) {
  const { user } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

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

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* ── Nav ── */}
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="PaddleGrid" className="h-9 w-9 object-contain" />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-[#1B2A4A]">Paddle</span>
                <span className="text-[#6DB33F]">Grid</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#players" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Players</a>
              <a href="#venues" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Venues</a>
              <a href="/privacy" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">About</a>
              <button
                onClick={() => onAuthRequired('login')}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => onAuthRequired('signup')}
                className="bg-[#1B2A4A] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#243458] transition-colors"
              >
                Get started
              </button>
            </div>
            {/* Mobile menu button */}
            <button
              onClick={() => onAuthRequired('signup')}
              className="md:hidden bg-[#1B2A4A] text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              Get started
            </button>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <h1 className="text-4xl md:text-[44px] font-extrabold leading-[1.12] tracking-tight text-[#1B2A4A] mb-5">
                Book courts.{' '}
                <br className="hidden md:block" />
                Find players.{' '}
                <br className="hidden md:block" />
                <span className="text-[#6DB33F]">Own your game.</span>
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-md">
                PaddleGrid connects pickleball players with facilities, handles bookings and payments, and gives venue operators the tools to fill every court.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={() => onAuthRequired('signup')}
                  className="inline-flex items-center justify-center gap-2 bg-[#6DB33F] hover:bg-[#5E9A35] text-white font-semibold text-base px-7 py-3.5 rounded-xl transition-colors shadow-sm"
                >
                  Start playing
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onAuthRequired('facility')}
                  className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-[#1B2A4A] font-semibold text-base px-7 py-3.5 rounded-xl border border-gray-200 transition-colors"
                >
                  I run a venue
                </button>
              </div>
              {/* Social proof */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['#3BBFA0','#6DB33F','#1B2A4A','#E8A435','#5C6BC0'].map((bg, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white" style={{ background: bg }}>
                      {['JM','KR','TS','AL','PD'][i]}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">2,400+ players</span> across 85 venues
                </p>
              </div>
            </div>

            {/* Product preview — mock court listing */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="h-6 bg-gray-200 rounded-md flex-1 max-w-[200px]" />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Courts near you</p>
              {[
                { name: 'Sunset Pickleball Club', courts: 4, dist: '0.8 mi', badge: 'Open now', badgeColor: 'bg-green-50 text-green-700', price: '$12/hr', gradient: 'from-teal-400 to-green-500' },
                { name: 'Downtown Rec Center', courts: 6, dist: '1.2 mi', badge: '2 slots left', badgeColor: 'bg-green-50 text-green-700', price: '$15/hr', gradient: 'from-indigo-400 to-blue-600' },
                { name: 'Riverside Athletic Park', courts: 8, dist: '2.5 mi', badge: 'Peak hours', badgeColor: 'bg-orange-50 text-orange-700', price: '$18/hr', gradient: 'from-orange-400 to-red-500' },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3.5 bg-white rounded-xl border border-gray-200 p-3.5">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${c.gradient} flex items-center justify-center flex-shrink-0`}>
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{c.name}</h4>
                    <p className="text-xs text-gray-500">{c.courts} courts &bull; {c.dist} away</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.badgeColor}`}>{c.badge}</span>
                    <p className="text-sm font-bold text-[#1B2A4A] mt-1">{c.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats bar ── */}
        <section className="bg-[#1B2A4A] py-12">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '85+', label: 'Partner venues' },
              { value: '2,400', label: 'Active players' },
              { value: '12K', label: 'Bookings completed' },
              { value: '4.8', label: 'App Store rating' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-3xl md:text-4xl font-bold text-[#6DB33F]">{s.value}</p>
                <p className="text-xs text-white/60 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Player features ── */}
        <section id="players" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <p className="text-xs font-bold uppercase tracking-widest text-[#6DB33F] mb-3">For players</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1B2A4A] tracking-tight mb-3">Everything in one app</h2>
          <p className="text-base text-gray-500 mb-10 max-w-lg">No more texting around for court times or juggling multiple venue apps.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Calendar, title: 'Instant booking', desc: 'See real-time availability across every venue near you. Book and pay in two taps.', bg: 'bg-green-50', color: 'text-green-700' },
              { icon: Users, title: 'Find players', desc: 'Match with players at your skill level. Build a regular crew or drop into open games.', bg: 'bg-blue-50', color: 'text-blue-700' },
              { icon: Trophy, title: 'Track progress', desc: 'Log matches, track your rating, earn achievements. See how you stack up on leaderboards.', bg: 'bg-amber-50', color: 'text-amber-700' },
              { icon: MessageSquare, title: 'Community feed', desc: 'Share highlights, coordinate meetups, and stay connected with your local pickleball scene.', bg: 'bg-purple-50', color: 'text-purple-700' },
              { icon: Flame, title: 'Play streaks', desc: 'Stay motivated with daily and weekly streaks. Unlock badges the more you play.', bg: 'bg-red-50', color: 'text-red-700' },
              { icon: Bell, title: 'Smart reminders', desc: 'Get notified when your favorite court opens up or when a friend wants to play.', bg: 'bg-cyan-50', color: 'text-cyan-700' },
            ].map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl border border-gray-200 p-6 hover:border-gray-300 transition-colors">
                <div className={`w-10 h-10 rounded-lg ${f.bg} ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-[#1B2A4A] mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Venue section ── */}
        <section id="venues" className="bg-gray-50 border-y border-gray-200 py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#6DB33F] mb-3">For venue operators</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#1B2A4A] tracking-tight mb-3">Fill every court, automatically</h2>
              <p className="text-base text-gray-500 mb-8 max-w-md">
                PaddleGrid replaces your booking spreadsheet, payment terminal, and marketing emails with one dashboard.
              </p>
              <div className="space-y-5">
                {[
                  { title: 'Online booking system', desc: 'Customers book and pay online. No phone tag, no double-bookings.' },
                  { title: 'Revenue analytics', desc: 'See which courts perform, peak hours, and revenue trends at a glance.' },
                  { title: 'Stripe Connect payouts', desc: 'Funds go directly to your bank account. No invoicing, no chasing payments.' },
                  { title: 'Player acquisition', desc: 'Every player on PaddleGrid can discover your venue. Built-in demand generation.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-[#6DB33F] mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-[#1B2A4A]">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onAuthRequired('facility')}
                className="mt-8 inline-flex items-center gap-2 bg-[#1B2A4A] hover:bg-[#243458] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
              >
                List your venue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dashboard mock */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <p className="text-sm font-semibold text-[#1B2A4A]">Venue dashboard</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Today's bookings", value: '24', change: '+18% vs last week' },
                  { label: 'Revenue (MTD)', value: '$8,420', change: '+12% vs last month' },
                ].map((m, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{m.label}</p>
                    <p className="text-xl font-bold text-[#1B2A4A] mt-1">{m.value}</p>
                    <p className="text-xs font-semibold text-[#6DB33F] mt-0.5">{m.change}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Court utilization', value: '78%', pct: 78 },
                  { label: 'Avg. rating', value: '4.9', pct: 98 },
                ].map((m, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{m.label}</p>
                    <p className="text-xl font-bold text-[#1B2A4A] mt-1">{m.value}</p>
                    <div className="h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-[#6DB33F] rounded-full" style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 md:py-28 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6DB33F] mb-3">Get started</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1B2A4A] tracking-tight mb-4">Ready to play?</h2>
            <p className="text-base text-gray-500 mb-8">Download PaddleGrid and book your first court in under a minute.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => onAuthRequired('signup')}
                className="inline-flex items-center justify-center gap-2 bg-[#6DB33F] hover:bg-[#5E9A35] text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-colors shadow-sm"
              >
                Download the app
              </button>
              <button
                onClick={() => onAuthRequired('facility')}
                className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-[#1B2A4A] font-semibold text-base px-8 py-3.5 rounded-xl border border-gray-200 transition-colors"
              >
                List your venue
              </button>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-[#1B2A4A] text-white">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <img src="/logo.png" alt="PaddleGrid" className="h-8 w-8 object-contain" />
                  <span className="text-base font-bold">PaddleGrid</span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">Play. Connect. Compete.<br />The platform for pickleball players and venues.</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#players" className="text-white/60 hover:text-white transition-colors">Players</a></li>
                  <li><a href="#venues" className="text-white/60 hover:text-white transition-colors">Venues</a></li>
                  <li><a href="/sales" className="text-white/60 hover:text-white transition-colors">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/support" className="text-white/60 hover:text-white transition-colors">Support</a></li>
                  <li><a href="mailto:Justin@j20solutions.com" className="text-white/60 hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/privacy" className="text-white/60 hover:text-white transition-colors">Privacy policy</a></li>
                  <li><a href="/terms" className="text-white/60 hover:text-white transition-colors">Terms of service</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-xs text-white/30 gap-2">
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
