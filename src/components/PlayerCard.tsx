import { Award, TrendingUp, Trophy, Target, Share2, Download, Medal, Star, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PlayerCardProps {
  playerId?: string;
  playerData?: any;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  unlocked_at: string;
}

export default function PlayerCard({ playerId, playerData }: PlayerCardProps) {
  const { profile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const player = playerData || profile;
  const profileUrl = `${window.location.origin}/players/${playerId || player?.id}`;

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!player?.id) return;

      try {
        const { data, error } = await supabase
          .from('user_achievements')
          .select(`
            id,
            unlocked_at,
            achievements (
              id,
              name,
              description,
              icon,
              rarity
            )
          `)
          .eq('user_id', player.id)
          .order('unlocked_at', { ascending: false });

        if (error) throw error;

        const formattedAchievements = data?.map(item => ({
          id: item.achievements.id,
          name: item.achievements.name,
          description: item.achievements.description,
          icon: item.achievements.icon,
          rarity: item.achievements.rarity,
          unlocked_at: item.unlocked_at
        })) || [];

        setAchievements(formattedAchievements);
      } catch (error) {
        console.error('Error fetching achievements:', error);
      }
    };

    fetchAchievements();
  }, [player?.id]);

  if (!player) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <p className="text-gray-500">Player data not available</p>
      </div>
    );
  }

  const handleDownload = () => {
    const cardElement = document.getElementById('player-card');
    if (!cardElement) return;

    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(cardElement, {
        backgroundColor: '#ffffff',
        scale: 2,
      }).then((canvas) => {
        const link = document.createElement('a');
        link.download = `${player.full_name.replace(/\s+/g, '-')}-player-card.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }).catch(err => {
      console.error('Error downloading card:', err);
      alert('Could not download card. Please try again.');
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${player.full_name}'s Player Card`,
          text: `Check out my pickleball stats! Skill Level: ${player.skill_level?.toFixed(1) || 'N/A'}`,
          url: profileUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(profileUrl);
      alert('Profile link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div id="player-card" className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl shadow-2xl p-5 sm:p-8 text-white">
        <div className="space-y-4 sm:space-y-0 sm:flex sm:items-start sm:justify-between mb-5 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 sm:border-4 border-white shadow-lg flex items-center justify-center text-xl sm:text-2xl font-bold bg-white text-emerald-600 flex-shrink-0"
              style={
                player.profile_picture_url
                  ? { backgroundImage: `url(${player.profile_picture_url})`, backgroundSize: 'cover' }
                  : {}
              }
            >
              {!player.profile_picture_url && player.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-3xl font-bold truncate">{player.full_name}</h2>
              {player.facilities?.name && (
                <p className="text-sm sm:text-base text-emerald-100 truncate">{player.facilities.name}</p>
              )}
            </div>
          </div>

          {player.skill_level && (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 sm:px-6 py-2 sm:py-3 text-center self-start">
              <div className="text-3xl sm:text-4xl font-bold">{player.skill_level.toFixed(1)}</div>
              <div className="text-xs sm:text-sm text-emerald-100 whitespace-nowrap">Skill Level</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5 sm:mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-4 text-center">
            <Trophy className="w-4 h-4 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-2xl font-bold">{player.matches_won || 0}</div>
            <div className="text-[10px] sm:text-xs text-emerald-100">Wins</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-4 text-center">
            <Target className="w-4 h-4 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-2xl font-bold">
              {player.matches_won && player.matches_played
                ? Math.round((player.matches_won / player.matches_played) * 100)
                : 0}%
            </div>
            <div className="text-[10px] sm:text-xs text-emerald-100">Win Rate</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-4 text-center">
            <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-2xl font-bold">{player.current_streak || 0}</div>
            <div className="text-[10px] sm:text-xs text-emerald-100">Streak</div>
          </div>
        </div>

        {player.bio && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm text-center">{player.bio}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-emerald-100">
          <Award className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Player Card • {new Date().getFullYear()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handleShare}
          className="w-full px-4 sm:px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          Share Card
        </button>

        <button
          onClick={handleDownload}
          className="w-full px-4 sm:px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-all font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          Download
        </button>
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Achievements</h3>
          {achievements.length > 0 && (
            <span className="ml-auto text-xs sm:text-sm text-gray-500">{achievements.length} unlocked</span>
          )}
        </div>

        {achievements.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Medal className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
            <p className="text-gray-500 text-xs sm:text-sm">No achievements unlocked yet</p>
            <p className="text-gray-400 text-[10px] sm:text-xs mt-1">Keep playing to earn badges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {achievements.map((achievement) => {
              const getRarityColor = (rarity: string) => {
                switch (rarity?.toLowerCase()) {
                  case 'legendary': return 'from-amber-400 to-yellow-600';
                  case 'epic': return 'from-purple-400 to-purple-600';
                  case 'rare': return 'from-blue-400 to-blue-600';
                  default: return 'from-gray-300 to-gray-500';
                }
              };

              const getRarityIcon = (rarity: string) => {
                switch (rarity?.toLowerCase()) {
                  case 'legendary': return <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
                  case 'epic': return <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
                  default: return <Medal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
                }
              };

              return (
                <div
                  key={achievement.id}
                  className="group relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-2 sm:p-3 border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-full bg-gradient-to-br ${getRarityColor(achievement.rarity)} flex items-center justify-center text-white shadow-md`}>
                    {getRarityIcon(achievement.rarity)}
                  </div>
                  <h4 className="text-[10px] sm:text-xs font-semibold text-gray-800 text-center mb-0.5 sm:mb-1 line-clamp-1">
                    {achievement.name}
                  </h4>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 text-center line-clamp-2">
                    {achievement.description}
                  </p>

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden sm:group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg max-w-[200px]">
                      <p className="font-semibold mb-1">{achievement.name}</p>
                      <p className="text-gray-300 mb-1">{achievement.description}</p>
                      <p className="text-gray-400 text-[10px]">
                        Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
