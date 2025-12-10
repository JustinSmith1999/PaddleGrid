import { useState, useEffect } from 'react';
import { Search, Users, Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Player {
  id: string;
  full_name: string;
  dupr_rating: number | null;
}

interface HeadToHeadStats {
  player1_id: string;
  player2_id: string;
  player1_wins: number;
  player2_wins: number;
  total_matches: number;
}

export function HeadToHeadStats() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<HeadToHeadStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchPlayers();
    } else {
      setPlayers([]);
    }
  }, [searchQuery]);

  async function searchPlayers() {
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          player_stats (
            dupr_rating
          )
        `)
        .ilike('full_name', `%${searchQuery}%`)
        .neq('id', user!.id)
        .limit(10);

      if (error) throw error;

      const formattedPlayers = data.map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        dupr_rating: p.player_stats?.[0]?.dupr_rating || null
      }));

      setPlayers(formattedPlayers);
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setSearching(false);
    }
  }

  async function loadHeadToHeadStats(opponentId: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_head_to_head_stats', {
        p_player1_id: user!.id,
        p_player2_id: opponentId
      });

      if (error) throw error;

      setStats(data);
    } catch (error) {
      console.error('Error loading head-to-head stats:', error);
    } finally {
      setLoading(false);
    }
  }

  function selectPlayer(player: Player) {
    setSelectedPlayer(player);
    setSearchQuery('');
    setPlayers([]);
    loadHeadToHeadStats(player.id);
  }

  const winRate = stats && stats.total_matches > 0
    ? ((stats.player1_wins / stats.total_matches) * 100).toFixed(1)
    : '0';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-gray-800">Head-to-Head Stats</h2>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a player..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />

            {searching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
              </div>
            )}
          </div>

          {players.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => selectPlayer(player)}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-gray-800">{player.full_name}</div>
                    {player.dupr_rating && (
                      <div className="text-sm text-gray-600">
                        DUPR: {player.dupr_rating.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <Trophy className="w-5 h-5 text-emerald-600" />
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPlayer && (
          <div className="border-t border-gray-200 pt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              </div>
            ) : stats ? (
              <div>
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 mb-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      You vs {selectedPlayer.full_name}
                    </h3>
                    {selectedPlayer.dupr_rating && (
                      <div className="text-sm text-gray-600">
                        Opponent DUPR: {selectedPlayer.dupr_rating.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <div className="text-3xl font-bold text-emerald-600 mb-1">
                        {stats.player1_wins}
                      </div>
                      <div className="text-sm text-gray-600">Your Wins</div>
                    </div>

                    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <div className="text-3xl font-bold text-gray-800 mb-1">
                        {stats.total_matches}
                      </div>
                      <div className="text-sm text-gray-600">Total Matches</div>
                    </div>

                    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {stats.player2_wins}
                      </div>
                      <div className="text-sm text-gray-600">Their Wins</div>
                    </div>
                  </div>
                </div>

                {stats.total_matches > 0 ? (
                  <div>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-800">Win Rate</h4>
                        <div className={`flex items-center gap-1 text-lg font-bold ${
                          parseFloat(winRate) >= 50 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className="w-5 h-5" />
                          {winRate}%
                        </div>
                      </div>

                      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
                          style={{ width: `${winRate}%` }}
                        ></div>
                        <div
                          className="absolute top-0 right-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                          style={{ width: `${100 - parseFloat(winRate)}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between mt-2 text-sm text-gray-600">
                        <span>You</span>
                        <span>{selectedPlayer.full_name}</span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <div className="text-sm text-emerald-700 font-medium mb-1">
                          Your Record
                        </div>
                        <div className="text-2xl font-bold text-emerald-800">
                          {stats.player1_wins}W - {stats.player2_wins}L
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="text-sm text-blue-700 font-medium mb-1">
                          Their Record
                        </div>
                        <div className="text-2xl font-bold text-blue-800">
                          {stats.player2_wins}W - {stats.player1_wins}L
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No matches played yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Challenge {selectedPlayer.full_name} to a match!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Unable to load statistics</p>
              </div>
            )}
          </div>
        )}

        {!selectedPlayer && searchQuery.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Search for a player</p>
            <p className="text-sm text-gray-500 mt-1">
              See your head-to-head record against any opponent
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
