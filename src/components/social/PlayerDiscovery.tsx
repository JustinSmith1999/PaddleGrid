import { useState, useEffect } from 'react';
import { Search, UserPlus, Award, Loader2, Users as UsersIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { followUser, isFollowing } from '../../lib/socialUtils';
import { useAuth } from '../../contexts/AuthContext';

interface Player {
  id: string;
  full_name: string;
  email: string;
  skill_level?: number;
  profile_picture_url?: string;
  bio?: string;
}

interface PlayerDiscoveryProps {
  onProfileClick?: (userId: string) => void;
}

export default function PlayerDiscovery({ onProfileClick }: PlayerDiscoveryProps) {
  const { user, profile } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'my_level' | 'my_club'>('all');
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadPlayers();
  }, [filter, profile]);

  async function loadPlayers() {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .limit(30);

      if (filter === 'my_level' && profile?.skill_level) {
        const minLevel = profile.skill_level - 0.5;
        const maxLevel = profile.skill_level + 0.5;
        query = query
          .gte('skill_level', minLevel)
          .lte('skill_level', maxLevel);
      } else if (filter === 'my_club' && (profile as any)?.facility_id) {
        const { data: facilityUsers } = await supabase
          .from('facility_users')
          .select('user_id')
          .eq('facility_id', (profile as any).facility_id);

        const userIds = facilityUsers?.map(fu => fu.user_id) || [];
        if (userIds.length > 0) {
          query = query.in('id', userIds);
        } else {
          setPlayers([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      const playersData = data || [];
      setPlayers(playersData);

      const statusPromises = playersData.map(p =>
        isFollowing(p.id).then(status => ({ id: p.id, status }))
      );
      const statuses = await Promise.all(statusPromises);
      const statusMap = statuses.reduce((acc, { id, status }) => {
        acc[id] = status;
        return acc;
      }, {} as Record<string, boolean>);

      setFollowingStatus(statusMap);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollow(playerId: string) {
    const result = await followUser(playerId);
    if (result.success) {
      setFollowingStatus(prev => ({ ...prev, [playerId]: true }));
    }
  }

  const filteredPlayers = players.filter(player =>
    player.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white">
      {/* Header with filters */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Discover Players</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('my_level')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              filter === 'my_level'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            My Level
          </button>
          <button
            onClick={() => setFilter('my_club')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              filter === 'my_club'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            My Club
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      {/* Players list */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : filteredPlayers.length > 0 ? (
        <div>
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold cursor-pointer flex-shrink-0"
                onClick={() => onProfileClick?.(player.id)}
                style={
                  player.profile_picture_url
                    ? { backgroundImage: `url(${player.profile_picture_url})`, backgroundSize: 'cover' }
                    : {}
                }
              >
                {!player.profile_picture_url && player.full_name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onProfileClick?.(player.id)}>
                <h3 className="font-bold text-gray-900 truncate">{player.full_name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                  {player.skill_level && (
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {player.skill_level.toFixed(1)}
                    </span>
                  )}
                  {player.bio && (
                    <span className="text-gray-500 truncate text-xs">
                      {player.bio}
                    </span>
                  )}
                </div>
              </div>

              {!followingStatus[player.id] ? (
                <button
                  onClick={() => handleFollow(player.id)}
                  className="px-4 py-1.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors font-semibold text-sm flex items-center gap-1.5 flex-shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  Follow
                </button>
              ) : (
                <button
                  className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-full font-semibold text-sm flex-shrink-0"
                  disabled
                >
                  Following
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4">
          <UsersIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium mb-2">No players found</p>
          <p className="text-sm text-gray-500">
            {searchTerm ? 'Try a different search term' : 'Adjust your filters to find players'}
          </p>
        </div>
      )}
    </div>
  );
}
