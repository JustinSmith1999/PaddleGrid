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
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
            <div className="text-center space-y-8">
              {/* Headline */}
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                  Your Pickleball
                  <br />
                  Community
                  <br />
                  <span className="text-emerald-100">Starts Here</span>
                </h1>

                <p className="text-xl sm:text-2xl text-emerald-50 leading-relaxed max-w-3xl mx-auto">
                  Connect with players, share your wins, find matches, and grow your game. The social network built for pickleball lovers.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button
                  onClick={() => onAuthRequired?.('signup')}
                  className="group relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-emerald-600 bg-white rounded-2xl shadow-2xl hover:shadow-emerald-900/50 transition-all duration-300 hover:scale-105"
                >
                  Join Free
                  <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => onAuthRequired?.('login')}
                  className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white border-3 border-white/40 rounded-2xl hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
                >
                  Sign In
                </button>
              </div>

              {/* Trust Badge */}
              <div className="pt-8">
                <p className="text-emerald-100 text-lg mb-3">Join thousands of players nationwide</p>
                <div className="flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-white text-white" />
                  ))}
                  <span className="ml-3 text-white font-bold text-xl">4.9/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { value: '50K+', label: 'Active Players' },
                { value: '100K+', label: 'Matches Logged' },
                { value: '500+', label: 'Clubs Connected' },
                { value: '1M+', label: 'Court Bookings' }
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
                Your Game.
                <br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Your Community.
                </span>
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Everything you need to connect, compete, and grow as a pickleball player.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Users,
                  title: "Find Playing Partners",
                  description: "Connect with players at your skill level. Build your network and never play alone.",
                  gradient: "from-blue-500 to-blue-600"
                },
                {
                  icon: Calendar,
                  title: "Book Courts Easily",
                  description: "Find and book courts at clubs near you. See availability in real-time.",
                  gradient: "from-emerald-500 to-teal-600"
                },
                {
                  icon: Trophy,
                  title: "Join Tournaments",
                  description: "Discover and register for tournaments, leagues, and events in your area.",
                  gradient: "from-amber-500 to-orange-600"
                },
                {
                  icon: TrendingUp,
                  title: "Track Your Progress",
                  description: "Log matches, monitor your rating, and watch your skills improve over time.",
                  gradient: "from-violet-500 to-purple-600"
                },
                {
                  icon: Star,
                  title: "Share Your Wins",
                  description: "Post highlights, celebrate victories, and engage with the community.",
                  gradient: "from-pink-500 to-rose-600"
                },
                {
                  icon: BarChart3,
                  title: "Analyze Your Game",
                  description: "Get insights into your playing patterns, strengths, and areas to improve.",
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
                Get Started in Seconds
              </h2>
              <p className="text-xl text-slate-600">
                Your pickleball journey begins now
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  step: '01',
                  icon: Target,
                  title: 'Create Your Profile',
                  description: 'Sign up free and set your skill level, location, and playing preferences.'
                },
                {
                  step: '02',
                  icon: Users,
                  title: 'Connect & Discover',
                  description: 'Find players, follow friends, join clubs, and discover events near you.'
                },
                {
                  step: '03',
                  icon: Zap,
                  title: 'Play & Share',
                  description: 'Book courts, log matches, share highlights, and grow your game.'
                }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <item.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
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
        <div className="py-24 bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Loved by Players Everywhere
              </h2>
              <p className="text-xl text-emerald-50">
                See what players are saying about PaddleGrid
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  quote: "Finally found consistent playing partners! This app has completely changed how I play pickleball.",
                  author: "Mike Rodriguez",
                  rating: "4.2 DUPR",
                  location: "Austin, TX"
                },
                {
                  quote: "Love tracking my progress and sharing wins with the community. The best pickleball app out there!",
                  author: "Sarah Chen",
                  rating: "3.8 DUPR",
                  location: "Portland, OR"
                },
                {
                  quote: "Booking courts is so easy now. Plus I've met so many great people through this platform.",
                  author: "Jennifer Park",
                  rating: "4.5 DUPR",
                  location: "Denver, CO"
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-white text-white" />
                    ))}
                  </div>
                  <p className="text-white leading-relaxed mb-6 text-lg">
                    "{testimonial.quote}"
                  </p>
                  <div className="border-t border-white/20 pt-4">
                    <div className="font-bold text-white">{testimonial.author}</div>
                    <div className="text-sm text-emerald-100">{testimonial.rating}</div>
                    <div className="text-sm text-emerald-100">{testimonial.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="relative py-32 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6">
              Ready to Level Up
              <br />
              Your Game?
            </h2>
            <p className="text-xl text-emerald-100 mb-12 max-w-2xl mx-auto">
              Join thousands of players connecting, competing, and growing together on PaddleGrid.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => onAuthRequired?.('signup')}
                className="group inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-emerald-600 bg-white rounded-2xl shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105"
              >
                Join Free Now
                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => onAuthRequired?.('login')}
                className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white border-3 border-white/40 rounded-2xl hover:bg-white/10 transition-all duration-300"
              >
                Sign In
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-emerald-100">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>100% Free</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Join in 30 Seconds</span>
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
