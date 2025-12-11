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
          <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8 sm:py-16 w-full">
            <div className="max-w-5xl mx-auto">
              {/* Logo */}
              <div className="mb-8 sm:mb-12 flex justify-center">
                <img
                  src="/untitled_design__2_-removebg-preview.png"
                  alt="PaddleGrid Logo"
                  className="h-12 sm:h-16 md:h-20 w-auto drop-shadow-2xl"
                />
              </div>

              {/* Hero Content */}
              <div className="text-center">
                <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-10 sm:mb-14 md:mb-16 max-w-3xl mx-auto leading-tight font-extrabold drop-shadow-lg space-y-2 sm:space-y-3">
                  <div>Connect.</div>
                  <div>Play.</div>
                  <div>Discover.</div>
                  <div className="text-emerald-300">Achieve.</div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                  <button
                    onClick={() => onAuthRequired?.('signup')}
                    className="px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-base sm:text-lg md:text-xl font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200 shadow-2xl hover:shadow-xl hover:scale-105"
                  >
                    Create Free Account
                  </button>
                  <button
                    onClick={() => onAuthRequired?.('login')}
                    className="px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-white/95 backdrop-blur text-emerald-600 text-base sm:text-lg md:text-xl font-semibold rounded-xl border-2 border-white hover:bg-white transition-all duration-200 hover:scale-105 shadow-xl"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Section with Color Background */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Connect with Players</h3>
                  <p className="text-gray-600 leading-relaxed">Find playing partners, follow friends, and build your pickleball network.</p>
                </div>

                <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Join Events & Series</h3>
                  <p className="text-gray-600 leading-relaxed">Discover tournaments, leagues, and social play events near you.</p>
                </div>

                <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Track Your Progress</h3>
                  <p className="text-gray-600 leading-relaxed">Log matches, track your rating, and celebrate your achievements.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto text-center">
              <p className="text-gray-500 text-sm mb-4">Trusted by pickleball players everywhere</p>
              <div className="flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                ))}
                <span className="ml-3 text-gray-700 font-semibold text-lg">4.9/5 rating</span>
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
