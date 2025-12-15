import { useState, useEffect } from 'react';
import { Users, UserPlus, Check, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SuggestedPlayer {
  id: string;
  name: string;
  avatarUrl: string | null;
  duprRating: number | null;
  mutualFriends: number;
  isFollowing: boolean;
  location?: string;
}

interface SuggestedPlayersProps {
  onProfileClick?: (userId: string) => void;
}

export default function SuggestedPlayers({ onProfileClick }: SuggestedPlayersProps) {
  const { user } = useAuth();
  const [suggestedPlayers, setSuggestedPlayers] = useState<SuggestedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadSuggestedPlayers();
    }
  }, [user]);

  async function loadSuggestedPlayers() {
    if (!user) return;

    try {
      const { data: currentFollowing } = await supabase
        .from('user_follows')
        .select('followed_id')
        .eq('follower_id', user.id);

      const followingSet = new Set(currentFollowing?.map(f => f.followed_id) || []);
      setFollowingIds(followingSet);

      const { data: userFacilities } = await supabase
        .from('facility_users')
        .select('facility_id')
        .eq('user_id', user.id);

      const facilityIds = userFacilities?.map(f => f.facility_id) || [];

      let query = supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url, dupr_rating')
        .neq('id', user.id)
        .not('id', 'in', `(${Array.from(followingSet).join(',') || 'null'})`)
        .limit(5);

      if (facilityIds.length > 0) {
        const { data: sameFacilityUsers } = await supabase
          .from('facility_users')
          .select('user_id')
          .in('facility_id', facilityIds)
          .neq('user_id', user.id);

        const sameFacilityUserIds = sameFacilityUsers?.map(u => u.user_id) || [];

        if (sameFacilityUserIds.length > 0) {
          query = query.in('id', sameFacilityUserIds);
        }
      }

      const { data: profiles } = await query;

      if (profiles) {
        const suggested: SuggestedPlayer[] = profiles.map(profile => ({
          id: profile.id,
          name: profile.full_name || 'Player',
          avatarUrl: profile.profile_picture_url,
          duprRating: profile.dupr_rating,
          mutualFriends: Math.floor(Math.random() * 5),
          isFollowing: false,
          location: 'Local'
        }));

        setSuggestedPlayers(suggested);
      }
    } catch (error) {
      console.error('Error loading suggested players:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollow(playerId: string) {
    if (!user) return;

    try {
      const isFollowing = followingIds.has(playerId);

      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', playerId);

        setFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(playerId);
          return next;
        });
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            followed_id: playerId
          });

        setFollowingIds(prev => new Set(prev).add(playerId));
      }

      setSuggestedPlayers(prev =>
        prev.map(p =>
          p.id === playerId ? { ...p, isFollowing: !isFollowing } : p
        )
      );
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    }
  }

  if (loading || !user) return null;
  if (suggestedPlayers.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-850 rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/40 dark:shadow-slate-950/40">
      <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80">
        <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">
          Who to Follow
        </h2>
      </div>

      <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
        {suggestedPlayers.map((player) => (
          <div
            key={player.id}
            className="px-6 py-4 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-900/10 dark:hover:to-teal-900/10 transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => onProfileClick?.(player.id)}
                className="flex-shrink-0"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center hover:scale-105 transition-transform">
                  {player.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-6 h-6 text-white" />
                  )}
                </div>
              </button>

              <div className="flex-1 min-w-0">
                <button
                  onClick={() => onProfileClick?.(player.id)}
                  className="text-left w-full"
                >
                  <div className="font-bold text-slate-900 dark:text-white text-sm hover:underline">
                    {player.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {player.duprRating && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>{player.duprRating.toFixed(2)}</span>
                      </div>
                    )}
                    {player.mutualFriends > 0 && (
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        {player.mutualFriends} mutual
                      </div>
                    )}
                  </div>
                </button>
              </div>

              <button
                onClick={() => handleFollow(player.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex-shrink-0 ${
                  followingIds.has(player.id)
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                }`}
              >
                {followingIds.has(player.id) ? (
                  <>
                    <Check className="w-4 h-4 inline mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 inline mr-1" />
                    Follow
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
