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
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-40">
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
                  className="group relative inline-flex items-center justify-center px-12 py-6 text-xl font-bold text-emerald-600 bg-white rounded-2xl shadow-2xl hover:shadow-emerald-900/50 transition-all duration-300 hover:scale-105"
                >
                  Get Started Free
                  <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => onAuthRequired?.('login')}
                  className="inline-flex items-center justify-center px-12 py-6 text-xl font-bold text-white border-3 border-white/40 rounded-2xl hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
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
