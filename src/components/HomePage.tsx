import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Loader2, TrendingUp, Users, Shield, Zap, Check, ArrowRight, Star, Trophy, CreditCard, BarChart3, Smartphone, Globe, FileText, CheckCircle, DollarSign } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="min-h-[50vh] flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-24 w-full">
              <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
                {/* Mobile Logo - Above text on mobile only */}
                <div className="flex justify-center mb-6 sm:mb-8 lg:hidden">
                  <img
                    src="/screenshot_2025-12-05_150441-removebg-preview.png"
                    alt="PaddleGrid Logo"
                    className="h-24 sm:h-32 md:h-40 w-auto"
                  />
                </div>

                {/* Content */}
                <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-center lg:text-left">
                  <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                      <div>Connect.</div>
                      <div>Play.</div>
                      <div>Discover.</div>
                      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Achieve.</div>
                    </h1>

                    <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 px-2 sm:px-0">
                      The most advanced court management platform for racquet and paddle sports facilities.
                      Built for clubs that demand excellence.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start px-2 sm:px-0">
                    <button
                      onClick={() => onAuthRequired('facility')}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Start Free Trial
                    </button>
                    <button className="border-2 border-slate-200 bg-white text-slate-700 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:border-emerald-200 hover:bg-emerald-50 transition-all duration-200 shadow-sm">
                      Watch Demo
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-6 text-sm text-slate-600 justify-center lg:justify-start px-2 sm:px-0">
                    <span className="flex items-center justify-center lg:justify-start">
                      <Check className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                      14-day free trial
                    </span>
                    <span className="flex items-center justify-center lg:justify-start">
                      <Check className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                      Cancel anytime
                    </span>
                  </div>
                </div>

                {/* Desktop Logo - Hidden on mobile */}
                <div className="hidden lg:flex justify-center lg:justify-end">
                  <img
                    src="/screenshot_2025-12-05_150441-removebg-preview.png"
                    alt="PaddleGrid Logo"
                    className="h-72 xl:h-80 w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-12 sm:py-16 md:py-20 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                <span className="text-emerald-600 font-semibold text-xs sm:text-sm uppercase tracking-wider">Platform Features</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 sm:mb-4 px-2">
                Everything You Need to Manage Your Facility
              </h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-2">
                From court reservations to event management, PaddleGrid delivers powerful features designed for modern sports facilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  icon: Calendar,
                  title: "Court Reservations",
                  description: "Visual booking calendar with real-time availability. Players book in seconds, you manage effortlessly.",
                  features: ["Real-time availability", "Conflict prevention", "Flexible scheduling"]
                },
                {
                  icon: Users,
                  title: "Memberships",
                  description: "Flexible membership tiers with automated billing and credits. Increase recurring revenue.",
                  features: ["Multiple tier options", "Auto-renewal billing", "Member benefits tracking"]
                },
                {
                  icon: Trophy,
                  title: "Events & Programs",
                  description: "Run tournaments, clinics, and leagues. Full registration and payment management.",
                  features: ["Tournament brackets", "Online registration", "Capacity management"]
                },
                {
                  icon: BarChart3,
                  title: "Analytics & Reporting",
                  description: "Real-time insights into revenue, utilization, and performance. Data-driven decisions.",
                  features: ["Revenue tracking", "Court utilization", "Custom reports"]
                },
                {
                  icon: Smartphone,
                  title: "Mobile Experience",
                  description: "Responsive design that works perfectly on any device. Your players book on the go.",
                  features: ["Mobile-optimized", "Touch-friendly interface", "Works offline"]
                },
                {
                  icon: Globe,
                  title: "Player Portal",
                  description: "Comprehensive player profiles with statistics, achievements, and history tracking.",
                  features: ["Activity tracking", "Achievement system", "Booking history"]
                }
              ].map((feature, index) => (
                <div key={index} className="group bg-gradient-to-br from-slate-50 to-white p-6 sm:p-8 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 hover:shadow-xl transition-all duration-300 text-center md:text-left">
                  <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white w-12 h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg mx-auto md:mx-0 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">
                    {feature.title}
                  </h3>

                  <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">
                    {feature.description}
                  </p>

                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-center md:justify-start text-sm text-slate-600">
                        <Check className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials Section */}

        {/* Pricing Section */}
        <div className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                <span className="text-emerald-600 font-semibold text-xs sm:text-sm uppercase tracking-wider">Pricing Plans</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 sm:mb-4 px-2">
                Simple, Transparent Pricing
              </h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-2">
                Choose the plan that fits your facility. All plans include full access to our platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {[
                {
                  name: "Starter",
                  price: "$99",
                  period: "/mo",
                  description: "Perfect for small facilities",
                  features: ["Up to 5 courts", "Unlimited bookings", "Basic analytics", "Email support"],
                  popular: false,
                  buttonText: "Start Free Trial"
                },
                {
                  name: "Professional",
                  price: "$199",
                  period: "/mo",
                  description: "For growing facilities",
                  features: ["Up to 15 courts", "Advanced analytics", "Event management", "Priority support", "Custom branding"],
                  popular: true,
                  buttonText: "Start Free Trial"
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  period: "",
                  description: "For large operations",
                  features: ["Unlimited courts", "Multi-location support", "Dedicated support", "Custom integrations"],
                  popular: false,
                  buttonText: "Contact Sales"
                }
              ].map((plan, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-2xl shadow-lg border-2 p-6 sm:p-8 relative transition-all duration-300 hover:shadow-2xl ${
                    plan.popular ? 'border-emerald-600 scale-105' : 'border-slate-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6 sm:mb-8">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <div className="mb-3 sm:mb-4">
                      <span className="text-3xl sm:text-4xl font-bold text-slate-900">{plan.price}</span>
                      <span className="text-slate-600">{plan.period}</span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-600">{plan.description}</p>
                  </div>

                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm sm:text-base">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mr-2 sm:mr-3 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      if (plan.buttonText === 'Start Free Trial') {
                        onAuthRequired('facility');
                      }
                    }}
                    className={`w-full py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              ))}
            </div>

            <div className="text-center mt-6 sm:mt-8 px-2">
              <p className="text-sm sm:text-base text-slate-600">All plans include a 14-day free trial.</p>
            </div>
          </div>
        </div>

        {/* Premium Capabilities Section */}
        <div className="py-16 sm:py-20 md:py-24 lg:py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
            {/* Section Header */}
            <div className="mb-12 sm:mb-16 md:mb-20 max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 mb-6 sm:mb-8">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-emerald-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">Platform Excellence</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
                Built for Scale. Designed for Excellence.
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto px-2">
                Every capability engineered to deliver exceptional performance, reliability, and member experience.
              </p>
            </div>

            {/* Capabilities Grid */}
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
              {[
                {
                  title: "Instant Booking Experience",
                  description: "Members complete reservations in 14 seconds. Three clicks from login to confirmation. Zero friction, maximum conversion.",
                  metric: "14s",
                  label: "Average booking time",
                  demo: 'checkout',
                },
                {
                  title: "Complete Transparency",
                  description: "1% processing fee, clearly displayed on every transaction. No surprises, no fine print. Your members trust you because we earn theirs.",
                  metric: "1%",
                  label: "Transparent fee cap",
                  demo: 'pricing',
                },
                {
                  title: "Intelligent Waitlist",
                  description: "When a court opens up, we instantly text members on the waitlist. Spots refill in 30 seconds without any staff involvement.",
                  metric: "30s",
                  label: "Average refill time",
                  demo: 'waitlist',
                },
                {
                  title: "Uninterrupted Operations",
                  description: "Full offline capability ensures zero downtime during network issues. All transactions sync seamlessly when connectivity returns.",
                  metric: "100%",
                  label: "Guaranteed uptime",
                  demo: null,
                },
                {
                  title: "Unified Family Accounts",
                  description: "Parents manage entire family bookings, payments, and schedules from one dashboard. Simplified administration, happier members.",
                  metric: "Single",
                  label: "Household dashboard",
                  demo: 'family',
                },
                {
                  title: "Conflict-Free Scheduling",
                  description: "AI-powered allocation prevents double bookings and optimizes court utilization. Smart suggestions maximize revenue per hour.",
                  metric: "Zero",
                  label: "Booking conflicts",
                  demo: 'scheduling',
                },
                {
                  title: "Live Performance Data",
                  description: "Real-time revenue tracking, occupancy rates, and member analytics. Make data-driven decisions with up-to-the-second insights.",
                  metric: "Live",
                  label: "Dashboard updates",
                  demo: 'analytics',
                },
                {
                  title: "Enterprise-Grade Security",
                  description: "SOC 2 Type II certified infrastructure with end-to-end encryption. Multi-factor authentication standard. Your data is fortress-level protected.",
                  metric: "SOC 2",
                  label: "Security certification",
                  demo: null,
                },
                {
                  title: "Global Performance",
                  description: "Sub-second page loads worldwide. CDN-optimized delivery ensures instant responsiveness regardless of location or device.",
                  metric: "<1s",
                  label: "Global page load",
                  demo: null,
                },
                {
                  title: "Dedicated Success Partner",
                  description: "Every client receives a personal success manager. Direct phone, email, and chat support included. Your growth is our mission.",
                  metric: "Included",
                  label: "Success management",
                  demo: null,
                }
              ].map((item, index) => (
                <div key={index} className="group">
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-10 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/70 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4 sm:mb-6">
                      <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight flex-1 pr-3 sm:pr-4">
                        {item.title}
                      </h3>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{item.metric}</div>
                        <div className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">{item.label}</div>
                      </div>
                    </div>

                    <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-4 sm:mb-6">
                      {item.description}
                    </p>

                    {item.demo && (
                      <button
                        onClick={() => setShowDemo(item.demo as any)}
                        className="text-emerald-400 text-sm sm:text-base font-semibold hover:text-emerald-300 transition-colors inline-flex items-center group"
                      >
                        View Interactive Demo
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transform Your Facility Section */}
        <div className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 md:gap-16 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  <span className="text-emerald-600 font-semibold text-xs sm:text-sm uppercase tracking-wider">Trusted by Industry Leaders</span>
                </div>
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight px-2 lg:px-0">
                  Transform Your Facility Operations
                </h3>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6 sm:mb-8 px-2 lg:px-0">
                  Join 500+ elite facilities delivering exceptional member experiences with PaddleGrid.
                </p>
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
                  <div className="flex items-center gap-3 text-sm sm:text-base text-slate-700 justify-center lg:justify-start">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                    <span>Full implementation support and training</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm sm:text-base text-slate-700 justify-center lg:justify-start">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                    <span>Seamless data migration from any system</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm sm:text-base text-slate-700 justify-center lg:justify-start">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                    <span>Zero risk with 14-day trial period</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-8 sm:p-10 lg:p-12 shadow-2xl">
                <div className="mb-6 sm:mb-8">
                  <div className="text-white text-lg sm:text-xl font-bold mb-2">Start Your Free Trial</div>
                  <div className="text-white/90 text-sm">Cancel anytime during your 14-day trial.</div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <button
                    onClick={() => !user && onAuthRequired('facility')}
                    className="w-full bg-white text-emerald-700 px-6 sm:px-8 py-4 sm:py-5 rounded-xl font-semibold hover:bg-slate-50 transition-all inline-flex items-center justify-center text-base sm:text-lg shadow-xl"
                  >
                    Get Started Now
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </button>

                  <button
                    onClick={() => setShowDemo('checkout')}
                    className="w-full border-2 border-white/30 text-white px-6 sm:px-8 py-4 sm:py-5 rounded-xl font-semibold hover:bg-white/10 transition-all text-base sm:text-lg"
                  >
                    Schedule Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-emerald-600 to-teal-600 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-white px-2">
              Ready to Transform Your Facility?
            </h2>

            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/90 px-2">
              Join hundreds of facilities using PaddleGrid to streamline operations and grow revenue.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8">
              <button
                onClick={() => onAuthRequired('facility')}
                className="bg-white text-emerald-700 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-slate-50 transition-all duration-200 shadow-xl hover:shadow-2xl"
              >
                Start Free Trial
              </button>

              <button
                onClick={() => setShowDemo('checkout')}
                className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-white/20 transition-all duration-200"
              >
                Try Demo
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