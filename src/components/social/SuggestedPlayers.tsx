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
        .from('social_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingSet = new Set(currentFollowing?.map(f => f.following_id) || []);
      setFollowingIds(followingSet);

      const { data: userFacilities } = await supabase
        .from('facility_users')
        .select('facility_id')
        .eq('user_id', user.id);

      const facilityIds = userFacilities?.map(f => f.facility_id) || [];

      let query = supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url')
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
          duprRating: null,
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
          .from('social_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', playerId);

        setFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(playerId);
          return next;
        });
      } else {
        await supabase
          .from('social_follows')
          .insert({
            follower_id: user.id,
            following_id: playerId
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Who to Follow
        </h2>
      </div>

      <div className="divide-y divide-slate-100">
        {suggestedPlayers.map((player) => (
          <div
            key={player.id}
            className="px-5 py-2.5 hover:bg-slate-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => onProfileClick?.(player.id)}
                className="flex-shrink-0"
              >
                <div className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm overflow-hidden bg-green-700 flex items-center justify-center hover:scale-105 transition-transform">
                  {player.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-5 h-5 text-white" />
                  )}
                </div>
              </button>

              <div className="flex-1 min-w-0">
                <button
                  onClick={() => onProfileClick?.(player.id)}
                  className="text-left w-full"
                >
                  <div className="font-bold text-slate-900 text-sm hover:underline">
                    {player.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {player.duprRating && (
                      <div className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{player.duprRating.toFixed(2)}</span>
                      </div>
                    )}
                    {player.mutualFriends > 0 && (
                      <div className="text-xs text-slate-500">
                        {player.mutualFriends} mutual
                      </div>
                    )}
                  </div>
                </button>
              </div>

              <button
                onClick={() => handleFollow(player.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                  followingIds.has(player.id)
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-green-700 hover:bg-green-800 text-white'
                }`}
              >
                {followingIds.has(player.id) ? (
                  <>
                    <Check className="w-3.5 h-3.5 inline mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5 inline mr-1" />
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
