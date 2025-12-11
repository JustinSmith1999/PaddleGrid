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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        {/* Hero Section with Video Background */}
        <div className="relative overflow-hidden min-h-screen flex items-center">
          {/* Video Background */}
          <div className="absolute inset-0 w-full h-full">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{
                filter: 'grayscale(100%) contrast(1.1)',
                opacity: 0.3
              }}
            >
              <source src="https://videos.pexels.com/video-files/20219054/20219054-uhd_2560_1440_50fps.mp4" type="video/mp4" />
              <source src="https://videos.pexels.com/video-files/17290112/17290112-hd_1920_1080_30fps.mp4" type="video/mp4" />
            </video>
            {/* Greenish grey overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/50 via-slate-800/40 to-emerald-950/30"></div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 w-full px-6 sm:px-8 lg:px-16 xl:px-24 py-16 sm:py-20 lg:py-24">
            <div className="w-full max-w-6xl mx-auto">
              {/* Logo */}
              <div className="mb-10 sm:mb-12 lg:mb-14 flex justify-center">
                <img
                  src="/untitled_design__2_-removebg-preview.png"
                  alt="PaddleGrid Logo"
                  className="h-16 sm:h-20 md:h-20 lg:h-24 w-auto drop-shadow-2xl"
                />
              </div>

              {/* Hero Content */}
              <div className="text-center">
                <div className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl xl:text-8xl text-white mb-12 sm:mb-14 lg:mb-16 xl:mb-20 mx-auto leading-[1.1] font-extrabold drop-shadow-2xl space-y-2 sm:space-y-3 lg:space-y-4">
                  <div>Connect.</div>
                  <div>Play.</div>
                  <div>Discover.</div>
                  <div className="bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">Achieve.</div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 lg:gap-5 justify-center items-center max-w-3xl mx-auto px-4">
                  <button
                    onClick={() => onAuthRequired?.('signup')}
                    className="w-full sm:w-auto min-w-[200px] px-8 sm:px-10 lg:px-12 py-4 sm:py-4 lg:py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-lg sm:text-xl lg:text-xl font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200 shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 border-2 border-emerald-400/50"
                  >
                    Create Free Account
                  </button>
                  <button
                    onClick={() => onAuthRequired?.('login')}
                    className="w-full sm:w-auto min-w-[200px] px-8 sm:px-10 lg:px-12 py-4 sm:py-4 lg:py-5 bg-white/95 backdrop-blur text-emerald-700 text-lg sm:text-xl lg:text-xl font-bold rounded-xl border-2 border-white hover:bg-white hover:shadow-2xl transition-all duration-200 hover:scale-105 shadow-xl"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Section with Color Background */}
        <div className="relative bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 py-24 overflow-hidden">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
          </div>

          <div className="relative container mx-auto px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Everything You Need to <span className="text-emerald-400">Elevate Your Game</span>
                </h2>
                <p className="text-emerald-100/70 text-lg max-w-2xl mx-auto">
                  Join the most comprehensive pickleball platform designed for players of all levels
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
                <div className="group bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-2 border border-white/10 hover:border-emerald-400/50 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-emerald-500/50 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-300 transition-colors">Connect with Players</h3>
                  <p className="text-emerald-100/80 leading-relaxed text-base">Find playing partners, follow friends, and build your pickleball network in your community.</p>
                </div>

                <div className="group bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-2 border border-white/10 hover:border-emerald-400/50 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-300 transition-colors">Join Events & Series</h3>
                  <p className="text-emerald-100/80 leading-relaxed text-base">Discover tournaments, leagues, and social play events at your favorite facilities.</p>
                </div>

                <div className="group bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-2 border border-white/10 hover:border-emerald-400/50 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-orange-500/50 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-300 transition-colors">Track Your Progress</h3>
                  <p className="text-emerald-100/80 leading-relaxed text-base">Log matches, track your rating, and celebrate your achievements as you improve.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="relative bg-gradient-to-b from-white via-emerald-50/50 to-white py-24 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
          </div>

          <div className="relative container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              {/* Main rating display */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 sm:gap-3 bg-white rounded-full px-4 py-2 sm:px-6 sm:py-3 shadow-lg border border-emerald-100 mb-4 sm:mb-6">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-emerald-700 text-xs sm:text-sm font-bold uppercase tracking-wide">Trusted by Pickleball Players Everywhere</p>
                </div>

                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-3 sm:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-400 fill-yellow-400 drop-shadow-lg animate-[pulse_2s_ease-in-out_infinite]"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>

                <div className="mb-3 sm:mb-4">
                  <p className="text-5xl sm:text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                    4.9
                  </p>
                  <p className="text-slate-600 text-base sm:text-xl font-medium">out of 5 stars</p>
                </div>

                <p className="text-slate-500 text-sm sm:text-lg px-4">
                  Rated by <span className="font-bold text-emerald-600">thousands of players</span> across the country
                </p>
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
