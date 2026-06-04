import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

      const playersData = (data || []).filter(player => {
        const name = player.full_name?.toLowerCase() || '';
        const facilityPatterns = ['pickleball heaven', 'pickle n par', 'patchogue ymca', 'pickleheads'];
        return !facilityPatterns.some(pattern => name.includes(pattern));
      });
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

  const filterOptions = [
    { key: 'all' as const, label: 'All Players' },
    { key: 'my_level' as const, label: 'My Level' },
    { key: 'my_club' as const, label: 'My Club' },
  ];

  return (
    <div className="bg-[#F8F9FC] min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/60 p-5">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Discover Players
        </h2>

        {/* Filter Pills */}
        <div className="flex gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`flex-1 px-3 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                filter === opt.key
                  ? 'bg-green-700 text-white shadow-sm'
                  : 'bg-slate-50/50 text-slate-500 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm transition-all duration-200 outline-none"
          />
        </div>
      </div>

      {/* Players List */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-7 h-7 text-green-700 animate-spin" />
        </div>
      ) : filteredPlayers.length > 0 ? (
        <div className="px-4 pb-4 space-y-2">
          {filteredPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
              whileHover={{ y: -1 }}
              className="flex items-center gap-3.5 p-3.5 bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-pointer"
              onClick={() => onProfileClick?.(player.id)}
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden ring-2 ring-white shadow-sm"
                style={
                  player.profile_picture_url
                    ? { backgroundImage: `url(${player.profile_picture_url})`, backgroundSize: 'cover' }
                    : {}
                }
              >
                {!player.profile_picture_url && player.full_name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 truncate text-sm">
                  {player.full_name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {player.skill_level && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      <Award className="w-3 h-3" />
                      {player.skill_level.toFixed(1)}
                    </span>
                  )}
                  {player.bio && (
                    <span className="text-slate-400 truncate text-xs">
                      {player.bio}
                    </span>
                  )}
                </div>
              </div>

              {/* Follow Button */}
              {!followingStatus[player.id] ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollow(player.id);
                  }}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 flex-shrink-0 transition-colors duration-200 shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Follow
                </motion.button>
              ) : (
                <span className="px-4 py-2 border border-slate-200/60 text-slate-500 rounded-xl font-semibold text-xs flex-shrink-0 bg-slate-50/50">
                  Following
                </span>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-6">
          <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-slate-800 font-semibold text-sm">No players found</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchTerm ? 'Try a different search term' : 'Adjust your filters to find players'}
          </p>
        </div>
      )}
    </div>
  );
}
