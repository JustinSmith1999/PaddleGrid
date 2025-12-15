import { useState } from 'react';
import { Plus, Users, Calendar, TrendingUp, Star, Check, ArrowRight, Sparkles, Target, Zap, Shield, Bell, BarChart3, Trophy, Building2 } from 'lucide-react';
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeView, setActiveView] = useState<string>('feed');

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700">
          {/* Background Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="https://videos.pexels.com/video-files/8327739/8327739-uhd_2560_1440_25fps.mp4" type="video/mp4" />
          </video>

          {/* Green Tint Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/50 via-teal-700/45 to-emerald-800/50"></div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28">
            <div className="text-center space-y-10">
              {/* Headline */}
              <div className="space-y-6">
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight">
                  Your Pickleball
                  <br />
                  <span className="text-emerald-100">Community</span>
                </h1>

                <p className="text-xl sm:text-2xl text-emerald-50 leading-relaxed max-w-2xl mx-auto">
                  Connect with players. Share your wins. Find matches. Grow your game.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <button
                  onClick={() => onAuthRequired?.('signup')}
                  className="group relative inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-emerald-700 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Sparkles className="w-5 h-5 mr-2 text-emerald-500" />
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => onAuthRequired?.('login')}
                  className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white border-2 border-white rounded-xl hover:bg-white hover:text-emerald-600 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Sign In
                </button>
              </div>

              {/* Simple Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 max-w-4xl mx-auto">
                {[
                  { icon: Users, label: "Find Players" },
                  { icon: Calendar, label: "Book Courts" },
                  { icon: Trophy, label: "Join Events" },
                  { icon: TrendingUp, label: "Track Stats" }
                ].map((feature, index) => (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm mb-3">
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-white font-semibold">{feature.label}</div>
                  </div>
                ))}
              </div>

              {/* Facility Manager Link - Mobile Only */}
              <div className="md:hidden pt-8">
                <button
                  onClick={() => navigate('/admin')}
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl hover:bg-white/20 hover:border-white/50 transition-all duration-200"
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  Facility Manager
                </button>
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
        key={refreshTrigger}
        onCreatePost={() => setShowComposer(true)}
        onPostClick={(postId) => navigate(`/post/${postId}`)}
        onProfileClick={(userId) => navigate(`/player/${userId}`)}
        onClubClick={handleClubClick}
        onViewChange={(view) => setActiveView(view)}
      />

      {/* Floating action button */}
      {activeView !== 'messages' && (
        <button
          onClick={() => setShowComposer(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg hover:scale-110 z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Post Composer Modal */}
      {showComposer && (
        <PostComposer
          onClose={() => setShowComposer(false)}
          onSuccess={() => {
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
