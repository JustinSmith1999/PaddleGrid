import { useState } from 'react';
import { Plus, Users, Calendar, TrendingUp, Star } from 'lucide-react';
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
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="relative bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
            <div className="lg:grid lg:grid-cols-2 gap-20 items-center">
              {/* Mobile Logo */}
              <div className="flex justify-center mb-12 lg:hidden">
                <img
                  src="/screenshot_2025-12-05_150441-removebg-preview.png"
                  alt="PaddleGrid Logo"
                  className="h-32 w-auto"
                />
              </div>

              {/* Content */}
              <div className="space-y-8 text-center lg:text-left">
                <div className="space-y-6">
                  <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                    Court management
                    <span className="block text-emerald-600">reimagined</span>
                  </h1>

                  <p className="text-xl text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                    The complete platform for modern sports facilities. Seamlessly manage courts, members, and events.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={() => onAuthRequired?.('signup')}
                    className="bg-emerald-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Get started
                  </button>
                  <button
                    onClick={() => onAuthRequired?.('login')}
                    className="border border-slate-300 bg-white text-slate-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-50 transition-colors"
                  >
                    Sign in
                  </button>
                </div>

                <div className="flex flex-wrap gap-6 text-sm text-slate-600 justify-center lg:justify-start">
                  <span className="flex items-center">
                    <Star className="w-4 h-4 text-emerald-600 mr-2 fill-current" />
                    Free to join
                  </span>
                  <span className="flex items-center">
                    <Users className="w-4 h-4 text-emerald-600 mr-2" />
                    500+ facilities
                  </span>
                  <span className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600 mr-2" />
                    Growing fast
                  </span>
                </div>
              </div>

              {/* Desktop Logo */}
              <div className="hidden lg:flex justify-center">
                <img
                  src="/screenshot_2025-12-05_150441-removebg-preview.png"
                  alt="PaddleGrid Logo"
                  className="h-96 w-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-24 bg-slate-50 border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                Everything you need in one platform
              </h2>
              <p className="text-lg text-slate-600">
                Connect with players, find courts, and join events in your community
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Users,
                    title: "Connect with Players",
                    description: "Find playing partners, follow friends, and build your network in your community"
                  },
                  {
                    icon: Calendar,
                    title: "Join Events & Series",
                    description: "Discover tournaments, leagues, and social play events at your favorite facilities"
                  },
                  {
                    icon: TrendingUp,
                    title: "Track Your Progress",
                    description: "Log matches, track your rating, and celebrate your achievements as you improve"
                  }
                ].map((feature, index) => (
                  <div key={index} className="group">
                    <div className="bg-white p-8 rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all">
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                        <feature.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 bg-slate-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
                Join the community
              </h2>

              <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
                Connect with thousands of players, find courts, and elevate your game
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => onAuthRequired?.('signup')}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Get started free
                </button>

                <button
                  onClick={() => onAuthRequired?.('login')}
                  className="border border-slate-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-800 transition-colors"
                >
                  Sign in
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
