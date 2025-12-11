import { useState } from 'react';
import { Plus, Users, Calendar, TrendingUp, Star, Check, ArrowRight, Sparkles, Target, Zap, Shield, Bell, BarChart3, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CommunityFeed from './social/CommunityFeed';
import PostComposer from './social/PostComposer';
import PostDetail from './social/PostDetail';

interface CommunityHubProps {
  onAuthRequired?: (mode: 'login' | 'signup') => void;
}

export default function CommunityHub({ onAuthRequired }: CommunityHubProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComposer, setShowComposer] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-emerald-100/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-teal-100/20 to-transparent rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-40">
            <div className="lg:grid lg:grid-cols-12 gap-12 items-center">
              {/* Left Content */}
              <div className="lg:col-span-7 text-center lg:text-left space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2 text-sm font-medium text-emerald-900">
                  <Sparkles className="w-4 h-4" />
                  Trusted by 500+ Elite Facilities
                </div>

                {/* Headline */}
                <div className="space-y-4">
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                    The Court
                    <br />
                    Management
                    <br />
                    Platform That
                    <br />
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                      Just Works
                    </span>
                  </h1>

                  <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    Transform your facility with the platform built for scale. Effortless booking, intelligent automation, and insights that drive revenue.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={() => onAuthRequired?.('signup')}
                    className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => onAuthRequired?.('login')}
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all duration-300"
                  >
                    Sign In
                  </button>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span>Free forever</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span>Setup in 2 minutes</span>
                  </div>
                </div>
              </div>

              {/* Right Visual */}
              <div className="hidden lg:block lg:col-span-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/20 to-teal-400/20 rounded-3xl blur-2xl" />
                  <img
                    src="https://images.pexels.com/photos/6253903/pexels-photo-6253903.jpeg?auto=compress&cs=tinysrgb&w=800"
                    alt="Pickleball Court"
                    className="relative rounded-2xl shadow-2xl w-full aspect-square object-cover ring-1 ring-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-20 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { value: '500+', label: 'Facilities Nationwide' },
                { value: '2M+', label: 'Bookings Processed' },
                { value: '99.9%', label: 'Uptime Guarantee' },
                { value: '< 1s', label: 'Average Load Time' }
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
        <div className="py-24 bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Everything You Need.
                <br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Nothing You Don't.
                </span>
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Purpose-built for modern sports facilities. Every feature designed to save time and drive revenue.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Calendar,
                  title: "Smart Booking System",
                  description: "Real-time calendar with instant confirmations. Zero conflicts, zero friction.",
                  gradient: "from-blue-500 to-blue-600"
                },
                {
                  icon: Users,
                  title: "Member Management",
                  description: "Automated billing, credits, and renewals. Set it and forget it.",
                  gradient: "from-emerald-500 to-teal-600"
                },
                {
                  icon: Trophy,
                  title: "Events & Tournaments",
                  description: "Complete registration, brackets, and payment handling built-in.",
                  gradient: "from-amber-500 to-orange-600"
                },
                {
                  icon: BarChart3,
                  title: "Real-Time Analytics",
                  description: "Track revenue, utilization, and trends. Make informed decisions.",
                  gradient: "from-violet-500 to-purple-600"
                },
                {
                  icon: Bell,
                  title: "Smart Notifications",
                  description: "Automated reminders, waitlist alerts, and booking confirmations.",
                  gradient: "from-pink-500 to-rose-600"
                },
                {
                  icon: Shield,
                  title: "Enterprise Security",
                  description: "SOC 2 compliant. Your data is protected by industry-leading encryption.",
                  gradient: "from-slate-600 to-slate-800"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-slate-300"
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

        {/* How It Works */}
        <div className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Get Started in Minutes
              </h2>
              <p className="text-xl text-slate-600">
                Our team handles everything. You just show up ready to launch.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  step: '01',
                  icon: Target,
                  title: 'Sign Up & Configure',
                  description: 'Create your account and customize your facility settings. Takes less than 5 minutes.'
                },
                {
                  step: '02',
                  icon: Users,
                  title: 'Import Your Data',
                  description: 'Migrate members, courts, and bookings from your existing system. We handle the technical details.'
                },
                {
                  step: '03',
                  icon: Zap,
                  title: 'Go Live',
                  description: 'Launch your new booking system. Your members get instant access via web and mobile.'
                }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <item.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="py-24 bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Trusted by Industry Leaders
              </h2>
              <p className="text-xl text-slate-600">
                Join hundreds of facilities transforming their operations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  quote: "PaddleGrid cut our booking time in half and increased our revenue by 40%. The platform just works.",
                  author: "Sarah Chen",
                  role: "Operations Director",
                  facility: "Apex Racquet Club"
                },
                {
                  quote: "Switching to PaddleGrid was the best decision we made. Our members love it, and management is effortless.",
                  author: "Michael Rodriguez",
                  role: "Facility Manager",
                  facility: "Summit Sports Complex"
                },
                {
                  quote: "The analytics alone are worth it. We've optimized our pricing and scheduling based on real data.",
                  author: "Jennifer Park",
                  role: "General Manager",
                  facility: "Elite Athletic Center"
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                    ))}
                  </div>
                  <p className="text-slate-700 leading-relaxed mb-6">
                    "{testimonial.quote}"
                  </p>
                  <div className="border-t border-slate-200 pt-4">
                    <div className="font-bold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                    <div className="text-sm text-emerald-600 font-medium">{testimonial.facility}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="relative py-32 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.pexels.com/photos/5067709/pexels-photo-5067709.jpeg?auto=compress&cs=tinysrgb&w=1920"
              alt="Pickleball Players"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-emerald-900/90" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6">
              Ready to Transform
              <br />
              Your Facility?
            </h2>
            <p className="text-xl text-slate-200 mb-12 max-w-2xl mx-auto">
              Join 500+ facilities delivering exceptional member experiences. Start your free trial today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => onAuthRequired?.('signup')}
                className="group inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-slate-900 bg-white rounded-xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => onAuthRequired?.('login')}
                className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white border-2 border-white/40 rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                Sign In
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Setup in minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleClubClick = (slug: string) => {
    navigate(`/club/${slug}`);
  };

  if (selectedPostId) {
    return (
      <PostDetail
        postId={selectedPostId}
        onBack={() => setSelectedPostId(null)}
        onProfileClick={(userId) => navigate(`/player/${userId}`)}
        onClubClick={handleClubClick}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <CommunityFeed
        onCreatePost={() => setShowComposer(true)}
        onPostClick={(postId) => navigate(`/post/${postId}`)}
        onProfileClick={(userId) => navigate(`/player/${userId}`)}
        onClubClick={handleClubClick}
      />

      {/* Floating action button */}
      <button
        onClick={() => setShowComposer(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg hover:scale-110 z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Post Composer Modal */}
      {showComposer && (
        <PostComposer
          onClose={() => setShowComposer(false)}
          onSuccess={() => {
            setShowComposer(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
