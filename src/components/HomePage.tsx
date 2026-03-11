import { useState, useEffect } from 'react';
import { Calendar, MapPin, Loader2, Users, Shield, Zap, ArrowRight, Trophy, Sparkles, Target, TrendingUp, Heart, MessageCircle, Award, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CourtCard } from './CourtCard';
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
  const [error, setError] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      setError(false);
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setCourts(data || []);
    } catch (error) {
      console.error('Error fetching courts:', error);
      setError(true);
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
      <div className="min-h-screen bg-white overflow-hidden">
        {/* Hero Section - Premium Design */}
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Static gradient orbs */}
          <div
            className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30 blur-3xl"
            style={{
              top: '-20%',
              left: '-10%',
            }}
          />
          <div
            className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl"
            style={{
              bottom: '-10%',
              right: '-10%',
            }}
          />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDEyYzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02em0yNC0xMmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzFmMjkzNyIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
            <div className="text-center space-y-12">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium animate-fade-in">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                The All-in-One Pickleball Platform
              </div>

              {/* Main Headline */}
              <div className="space-y-6">
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-tight tracking-tight">
                  Your Pickleball
                  <br />
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    Community
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-white max-w-3xl mx-auto leading-relaxed font-bold tracking-wide">
                  Book courts instantly. Find playing partners. Track your progress.{' '}
                  Join the fastest-growing pickleball community.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => onAuthRequired('signup')}
                  className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white font-semibold text-lg shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-500/60 hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                <button
                  onClick={() => onAuthRequired('login')}
                  className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                >
                  Sign In
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-32 bg-white relative overflow-hidden">
          {/* Fade to next section */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-slate-900/20 pointer-events-none z-10" />
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-teal-50/50" />

          <div className="relative max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                Everything You Need
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Play Better.
                <br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Connect Easier.
                </span>
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Everything you need to take your pickleball game to the next level.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Calendar,
                  title: "Instant Court Booking",
                  description: "Reserve courts at your favorite facilities in seconds. Real-time availability across hundreds of venues.",
                  color: "from-blue-500 to-cyan-500",
                  bgColor: "bg-blue-50"
                },
                {
                  icon: Users,
                  title: "Find Your People",
                  description: "Match with players at your skill level. Build friendships that last beyond the court.",
                  color: "from-emerald-500 to-teal-500",
                  bgColor: "bg-emerald-50"
                },
                {
                  icon: Trophy,
                  title: "Compete & Win",
                  description: "Join tournaments, leagues, and ladder competitions. Track your rankings and celebrate victories.",
                  color: "from-amber-500 to-orange-500",
                  bgColor: "bg-amber-50"
                },
                {
                  icon: TrendingUp,
                  title: "Track Progress",
                  description: "Monitor your stats, analyze your game, and watch yourself improve week after week.",
                  color: "from-violet-500 to-purple-500",
                  bgColor: "bg-violet-50"
                },
                {
                  icon: MessageCircle,
                  title: "Stay Connected",
                  description: "Chat with players, share match highlights, and stay updated on community events.",
                  color: "from-pink-500 to-rose-500",
                  bgColor: "bg-pink-50"
                },
                {
                  icon: Award,
                  title: "Earn Rewards",
                  description: "Unlock achievements, earn loyalty points, and get exclusive perks at partner facilities.",
                  color: "from-indigo-500 to-blue-500",
                  bgColor: "bg-indigo-50"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-200 hover:border-slate-300 hover:-translate-y-2 mx-auto w-full max-w-md md:max-w-none text-center md:text-left"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mx-auto md:mx-0`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover gradient effect */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          {/* Fade to next section */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-emerald-600/30 pointer-events-none z-10" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDEyYzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02em0yNC0xMmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzFmMjkzNyIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-20" />

          <div className="relative max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-white mb-6">
                Trusted by Players
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Everywhere
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  quote: "PaddleGrid completely changed how I play pickleball. Finding games and tracking my progress has never been easier!",
                  author: "Sarah Mitchell",
                  role: "4.5 DUPR Player",
                  rating: 5
                },
                {
                  quote: "As a facility owner, this platform has streamlined our operations and increased court utilization by 40%.",
                  author: "Mike Thompson",
                  role: "Club Owner",
                  rating: 5
                },
                {
                  quote: "The community features are incredible. I've met so many amazing players and improved my game significantly.",
                  author: "Jessica Lee",
                  role: "Tournament Player",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 mx-auto w-full max-w-md md:max-w-none"
                >
                  <div className="flex items-center gap-1 text-yellow-400 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-white/90 text-lg leading-relaxed mb-6">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
                    <div>
                      <div className="font-semibold text-white">{testimonial.author}</div>
                      <div className="text-sm text-slate-400">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="py-32 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08),transparent_40%)]" />

          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to Level Up
              <br />
              Your Game?
            </h2>
            <p className="text-xl text-white/90 mb-12 leading-relaxed">
              Join thousands of players who are already using PaddleGrid to play better, connect easier, and have more fun.
            </p>
            <button
              onClick={() => onAuthRequired('signup')}
              className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-emerald-600 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all duration-300"
            >
              <Users className="w-6 h-6" />
              Create Free Account
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
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
