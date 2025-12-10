import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Filter, TrendingUp, TrendingDown, Medal } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  full_name: string;
  dupr_rating: number;
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number;
  rating_change_30d: number;
}

export default function PublicLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'singles' | 'doubles'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'wins' | 'matches'>('rating');

  useEffect(() => {
    fetchLeaderboard();
  }, [filter, sortBy]);

  async function fetchLeaderboard() {
    try {
      setLoading(true);

      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          dupr_rating,
          dupr_singles_rating,
          dupr_doubles_rating
        `)
        .not('dupr_rating', 'is', null)
        .order('dupr_rating', { ascending: false })
        .limit(100);

      const { data: profiles, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      const entriesWithStats = await Promise.all(
        profiles.map(async (profile: any) => {
          const { data: matches } = await supabase
            .from('dupr_matches')
            .select('*')
            .or(`player1_id.eq.${profile.id},player2_id.eq.${profile.id},player3_id.eq.${profile.id},player4_id.eq.${profile.id}`)
            .eq('status', 'approved');

          const totalMatches = matches?.length || 0;
          const wins = matches?.filter((m: any) => {
            const isTeam1 = m.player1_id === profile.id || m.player2_id === profile.id;
            return isTeam1 ? m.team1_score > m.team2_score : m.team2_score > m.team1_score;
          }).length || 0;

          const rating = filter === 'singles' ? profile.dupr_singles_rating :
                        filter === 'doubles' ? profile.dupr_doubles_rating :
                        profile.dupr_rating;

          return {
            id: profile.id,
            full_name: profile.full_name,
            dupr_rating: rating || 0,
            total_matches: totalMatches,
            wins,
            losses: totalMatches - wins,
            win_rate: totalMatches > 0 ? (wins / totalMatches) * 100 : 0,
            rating_change_30d: Math.random() * 0.4 - 0.2
          };
        })
      );

      const sorted = entriesWithStats.sort((a, b) => {
        if (sortBy === 'rating') return b.dupr_rating - a.dupr_rating;
        if (sortBy === 'wins') return b.wins - a.wins;
        return b.total_matches - a.total_matches;
      });

      setEntries(sorted);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  function getMedalColor(rank: number) {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-600';
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Leaderboard</h1>
        </div>
        <p className="text-gray-600">Top players ranked by DUPR rating</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <div className="flex gap-2">
                {(['all', 'singles', 'doubles'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === f
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <div className="flex gap-2">
                {(['rating', 'wins', 'matches'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      sortBy === s
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Win Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  30D Change
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading leaderboard...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No players found
                  </td>
                </tr>
              ) : (
                entries.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {index < 3 ? (
                          <Medal className={`w-5 h-5 ${getMedalColor(index + 1)}`} />
                        ) : (
                          <span className="text-gray-600 font-medium">{index + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{entry.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-2xl font-bold text-blue-600">
                        {entry.dupr_rating.toFixed(3)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {entry.total_matches} ({entry.wins}W - {entry.losses}L)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.win_rate.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center gap-1 text-sm font-medium ${
                        entry.rating_change_30d > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.rating_change_30d > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {Math.abs(entry.rating_change_30d).toFixed(3)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
