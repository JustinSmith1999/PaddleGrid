import { useEffect, useState } from 'react';
import { X, Share2, Trophy, Sparkles } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

interface AchievementCelebrationModalProps {
  achievement: Achievement | null;
  onClose: () => void;
  onShare?: () => void;
}

export default function AchievementCelebrationModal({
  achievement,
  onClose,
  onShare
}: AchievementCelebrationModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (achievement) {
      setTimeout(() => setIsVisible(true), 50);
      setTimeout(() => setShowConfetti(true), 300);
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      setIsVisible(false);
    }
  }, [achievement]);

  if (!achievement) return null;

  const getRarityColor = () => {
    switch (achievement.rarity) {
      case 'legendary': return 'from-yellow-400 via-amber-500 to-orange-500';
      case 'epic': return 'from-purple-400 via-pink-500 to-red-500';
      case 'rare': return 'from-blue-400 via-cyan-500 to-teal-500';
      case 'uncommon': return 'from-green-400 via-emerald-500 to-teal-500';
      default: return 'from-gray-400 via-gray-500 to-gray-600';
    }
  };

  const getRarityGlow = () => {
    switch (achievement.rarity) {
      case 'legendary': return 'shadow-[0_0_30px_rgba(251,191,36,0.6)]';
      case 'epic': return 'shadow-[0_0_30px_rgba(168,85,247,0.6)]';
      case 'rare': return 'shadow-[0_0_30px_rgba(59,130,246,0.6)]';
      case 'uncommon': return 'shadow-[0_0_30px_rgba(34,197,94,0.6)]';
      default: return 'shadow-[0_0_20px_rgba(156,163,175,0.4)]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                backgroundColor: ['#fbbf24', '#8b5cf6', '#3b82f6', '#10b981', '#ef4444'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <div
        className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full transform transition-all duration-500 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="mb-6 animate-bounce-slow">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${getRarityColor()} ${getRarityGlow()} transform transition-all duration-300 hover:scale-110`}>
              <Trophy className="w-16 h-16 text-white" />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-semibold uppercase tracking-wider">Achievement Unlocked!</span>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>

            <h2 className={`text-3xl font-bold bg-gradient-to-r ${getRarityColor()} bg-clip-text text-transparent`}>
              {achievement.name}
            </h2>

            <p className="text-gray-300 text-sm px-4">
              {achievement.description}
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">+{achievement.points}</div>
                <div className="text-xs text-gray-400">Points</div>
              </div>
              <div className="h-8 w-px bg-gray-700"></div>
              <div className="text-center">
                <div className={`text-sm font-semibold capitalize bg-gradient-to-r ${getRarityColor()} bg-clip-text text-transparent`}>
                  {achievement.rarity}
                </div>
                <div className="text-xs text-gray-400">Rarity</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {onShare && (
              <button
                onClick={onShare}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all transform hover:scale-105"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105"
            >
              Awesome!
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
