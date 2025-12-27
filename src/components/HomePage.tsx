import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Loader2, TrendingUp, Users, Shield, Zap, Check, ArrowRight, Star, Trophy, CreditCard, BarChart3, Smartphone, Globe, FileText, CheckCircle, DollarSign, Sparkles, Target, Activity, Bell, Layout } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CourtCard } from './CourtCard';
import { AdvancedBookingCalendar } from './AdvancedBookingCalendar';
import { useAuth } from '../contexts/AuthContext';
import { ThreeClickCheckout } from './ThreeClickCheckout';
import { TransparentPricing } from './TransparentPricing';
import { WaitlistManager } from './WaitlistManager';
import { LiveAnalyticsDemo } from './LiveAnalyticsDemo';
import { FamilyAccountDemo } from './FamilyAccountDemo';
import { ConflictFreeDemo } from './ConflictFreeDemo';

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
  const [showDemo, setShowDemo] = useState<'checkout' | 'pricing' | 'waitlist' | 'analytics' | 'family' | 'scheduling' | null>(null);

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
    } catch (error) {
      console.error('Error fetching courts:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08),transparent_40%)]" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-80px)] py-20 lg:py-0">
              {/* Left Content */}
              <div className="text-center lg:text-left space-y-8">
                {/* Headline */}
                <div className="space-y-6">
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.05] tracking-tight">
                    Your Pickleball Community
                  </h1>

                  <p className="text-xl sm:text-2xl lg:text-3xl text-white/95 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
                    Connect with players. Share your wins. Find matches.
                    <br className="hidden sm:block" />
                    Grow your game.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={() => onAuthRequired('signup')}
                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-teal-600 bg-white rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                  >
                    <Users className="w-5 h-5" />
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => onAuthRequired('login')}
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                  >
                    Sign In
                  </button>
                </div>
              </div>

              {/* Right Content - Feature Grid */}
              <div className="grid grid-cols-2 gap-6 lg:gap-8">
                {[
                  {
                    icon: Users,
                    title: "Find Players",
                    description: "Connect with players at your skill level"
                  },
                  {
                    icon: Calendar,
                    title: "Book Courts",
                    description: "Reserve courts at your favorite facilities"
                  },
                  {
                    icon: Trophy,
                    title: "Join Events",
                    description: "Compete in tournaments and leagues"
                  },
                  {
                    icon: TrendingUp,
                    title: "Track Stats",
                    description: "Monitor your progress and improve"
                  }
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg lg:text-xl font-bold text-white">
                          {feature.title}
                        </h3>
                        <p className="text-sm lg:text-base text-white/80 leading-snug">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {[
                { value: '50K+', label: 'Active Players' },
                { value: '500+', label: 'Courts Available' },
                { value: '10K+', label: 'Matches Played' },
                { value: '200+', label: 'Weekly Events' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm lg:text-base text-slate-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 lg:py-24 bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Everything You Love About Pickleball.
                <br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  All In One Place.
                </span>
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                From booking courts to tracking your progress, PaddleGrid makes playing pickleball easier than ever.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  icon: Calendar,
                  title: "Easy Court Booking",
                  description: "Find and book courts at your favorite clubs in seconds. Real-time availability.",
                  gradient: "from-blue-500 to-blue-600"
                },
                {
                  icon: Users,
                  title: "Find Playing Partners",
                  description: "Connect with players at your skill level. Build your pickleball network.",
                  gradient: "from-emerald-500 to-teal-600"
                },
                {
                  icon: Trophy,
                  title: "Join Tournaments",
                  description: "Compete in local events and track your tournament results.",
                  gradient: "from-amber-500 to-orange-600"
                },
                {
                  icon: TrendingUp,
                  title: "Track Your Progress",
                  description: "Monitor your stats, track your rating, and see your improvement over time.",
                  gradient: "from-violet-500 to-purple-600"
                },
                {
                  icon: Bell,
                  title: "Stay Connected",
                  description: "Get notifications for matches, events, and when your friends are playing.",
                  gradient: "from-pink-500 to-rose-600"
                },
                {
                  icon: Activity,
                  title: "Share Your Wins",
                  description: "Post match results, share highlights, and celebrate with the community.",
                  gradient: "from-cyan-500 to-blue-600"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-2xl p-6 lg:p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-slate-300"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6 shadow-lg`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_50%)]" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6">
              Ready to Play?
            </h2>
            <p className="text-xl lg:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
              Join thousands of players finding matches, booking courts, and growing their game.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onAuthRequired('signup')}
                className="group inline-flex items-center justify-center gap-2 px-10 py-5 text-lg font-semibold text-teal-600 bg-white rounded-xl shadow-2xl hover:shadow-white/25 transition-all duration-300 hover:scale-105"
              >
                <Users className="w-5 h-5" />
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => onAuthRequired('login')}
                className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white border-2 border-white/40 rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        {/* Demo Modals */}
        {selectedCourt && user && (
          <AdvancedBookingCalendar
            court={selectedCourt}
            userId={user.id}
            onClose={() => setSelectedCourt(null)}
            onSuccess={() => {
              setSelectedCourt(null);
              alert('Booking created successfully!');
            }}
          />
        )}

        {showDemo === 'checkout' && (
          <ThreeClickCheckout onClose={() => setShowDemo(null)} />
        )}
        
        {showDemo === 'pricing' && (
          <TransparentPricing onClose={() => setShowDemo(null)} />
        )}
        
        {showDemo === 'waitlist' && (
          <WaitlistManager onClose={() => setShowDemo(null)} />
        )}

        {showDemo === 'analytics' && (
          <LiveAnalyticsDemo onClose={() => setShowDemo(null)} />
        )}

        {showDemo === 'family' && (
          <FamilyAccountDemo onClose={() => setShowDemo(null)} />
        )}

        {showDemo === 'scheduling' && (
          <ConflictFreeDemo onClose={() => setShowDemo(null)} />
        )}
      </div>
    </>
  );
}