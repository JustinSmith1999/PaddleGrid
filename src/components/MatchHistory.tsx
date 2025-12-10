import { useEffect, useState } from 'react';
import { Trophy, Calendar, Users, TrendingUp, TrendingDown, Clock, AlertCircle, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Match {
  id: string;
  match_date: string;
  match_time: string;
  match_type: string;
  match_format: string;
  status: string;
  team_number: number;
  score: number;
  opponent_score: number;
  is_winner: boolean;
  rating_before: number | null;
  rating_after: number | null;
  rating_change: number | null;
  teammates: string[];
  opponents: string[];
  court_name: string | null;
  reported_by_name: string;
  verification_notes: string | null;
}

export function MatchHistory() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeMatchId, setDisputeMatchId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  useEffect(() => {
    if (user) {
      loadMatches();
    }
  }, [user]);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredMatches(matches);
    } else {
      setFilteredMatches(matches.filter(m => m.status === filter));
    }
  }, [filter, matches]);

  async function loadMatches() {
    try {
      const { data: matchResultsData, error } = await supabase
        .from('dupr_match_results')
        .select(`
          id,
          match_id,
          team_number,
          score,
          is_winner,
          rating_before,
          rating_after,
          rating_change,
          player1_id,
          player2_id,
          dupr_matches!inner (
            id,
            match_date,
            match_time,
            match_type,
            match_format,
            status,
            verification_notes,
            reported_by,
            court_id,
            courts (
              name
            ),
            profiles!dupr_matches_reported_by_fkey (
              full_name
            )
          )
        `)
        .or(`player1_id.eq.${user!.id},player2_id.eq.${user!.id}`)
        .order('dupr_matches(match_date)', { ascending: false });

      if (error) throw error;

      const formattedMatches: Match[] = [];

      for (const result of matchResultsData || []) {
        const match = (result as any).dupr_matches;

        const { data: allResults } = await supabase
          .from('dupr_match_results')
          .select(`
            team_number,
            score,
            player1_id,
            player2_id,
            profiles!dupr_match_results_player1_id_fkey (
              full_name
            )
          `)
          .eq('match_id', match.id);

        const myTeamNumber = result.team_number;
        const opponentTeamNumber = myTeamNumber === 1 ? 2 : 1;

        const teammates: string[] = [];
        const opponents: string[] = [];
        let opponentScore = 0;

        for (const res of allResults || []) {
          if (res.team_number === myTeamNumber) {
            const profile = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', res.player1_id)
              .maybeSingle();

            if (profile.data && profile.data.full_name !== user?.user_metadata?.full_name) {
              teammates.push(profile.data.full_name);
            }

            if (res.player2_id) {
              const profile2 = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', res.player2_id)
                .maybeSingle();

              if (profile2.data) {
                teammates.push(profile2.data.full_name);
              }
            }
          } else {
            opponentScore = res.score;

            const profile = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', res.player1_id)
              .maybeSingle();

            if (profile.data) {
              opponents.push(profile.data.full_name);
            }

            if (res.player2_id) {
              const profile2 = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', res.player2_id)
                .maybeSingle();

              if (profile2.data) {
                opponents.push(profile2.data.full_name);
              }
            }
          }
        }

        formattedMatches.push({
          id: match.id,
          match_date: match.match_date,
          match_time: match.match_time,
          match_type: match.match_type,
          match_format: match.match_format,
          status: match.status,
          team_number: myTeamNumber,
          score: result.score,
          opponent_score: opponentScore,
          is_winner: result.is_winner,
          rating_before: result.rating_before,
          rating_after: result.rating_after,
          rating_change: result.rating_change,
          teammates,
          opponents,
          court_name: match.courts?.name || null,
          reported_by_name: match.profiles?.full_name || 'Unknown',
          verification_notes: match.verification_notes
        });
      }

      setMatches(formattedMatches);
      setFilteredMatches(formattedMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  }

  async function submitDispute() {
    if (!disputeMatchId || !disputeReason.trim()) return;

    try {
      const { error } = await supabase
        .from('match_disputes')
        .insert({
          match_id: disputeMatchId,
          disputed_by_user_id: user!.id,
          reason: disputeReason
        });

      if (error) throw error;

      alert('Dispute submitted successfully. An admin will review it.');
      setShowDisputeModal(false);
      setDisputeMatchId(null);
      setDisputeReason('');
    } catch (error) {
      console.error('Error submitting dispute:', error);
      alert('Failed to submit dispute. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-800">Match History</h2>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Matches</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No matches found</p>
            <p className="text-gray-400 text-sm mt-2">Start playing and reporting matches to see your history</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                className={`border-2 rounded-xl overflow-hidden transition-all ${
                  match.status === 'approved'
                    ? match.is_winner
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                    : match.status === 'pending'
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 rounded-xl ${
                        match.status === 'approved'
                          ? match.is_winner ? 'bg-green-200' : 'bg-red-200'
                          : match.status === 'pending'
                          ? 'bg-yellow-200'
                          : 'bg-gray-200'
                      }`}>
                        {match.status === 'approved' ? (
                          match.is_winner ? (
                            <Trophy className="w-6 h-6 text-green-700" />
                          ) : (
                            <TrendingDown className="w-6 h-6 text-red-700" />
                          )
                        ) : match.status === 'pending' ? (
                          <Clock className="w-6 h-6 text-yellow-700" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-gray-700" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-800">
                            {match.match_type.replace('_', ' ').toUpperCase()}
                          </h3>
                          <span className="text-sm px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                            {match.match_format.replace('_', ' ')}
                          </span>
                          <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                            match.status === 'approved' ? 'bg-green-200 text-green-800' :
                            match.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-red-200 text-red-800'
                          }`}>
                            {match.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(match.match_date).toLocaleDateString()}
                          </div>
                          {match.court_name && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {match.court_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-800">
                          {match.score} - {match.opponent_score}
                        </div>
                        {match.status === 'approved' && match.rating_change !== null && (
                          <div className={`text-sm font-semibold ${match.rating_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {match.rating_change > 0 ? '+' : ''}{match.rating_change.toFixed(2)}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition"
                      >
                        {expandedMatch === match.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedMatch === match.id && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Your Team</h4>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-700">You</div>
                            {match.teammates.map((name, idx) => (
                              <div key={idx} className="text-sm text-gray-700">{name}</div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Opponents</h4>
                          <div className="space-y-1">
                            {match.opponents.map((name, idx) => (
                              <div key={idx} className="text-sm text-gray-700">{name}</div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {match.status === 'approved' && (
                        <div className="bg-white rounded-lg p-3 mb-3">
                          <h4 className="font-semibold text-gray-800 mb-2">Rating Impact</h4>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">Before: {match.rating_before?.toFixed(2)}</span>
                            <TrendingUp className={`w-4 h-4 ${match.rating_change && match.rating_change > 0 ? 'text-green-600' : 'text-red-600'}`} />
                            <span className="text-gray-600">After: {match.rating_after?.toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Reported by: {match.reported_by_name}
                        </div>

                        {match.status === 'approved' && (
                          <button
                            onClick={() => {
                              setDisputeMatchId(match.id);
                              setShowDisputeModal(true);
                            }}
                            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                          >
                            <AlertCircle className="w-4 h-4" />
                            Dispute Match
                          </button>
                        )}
                      </div>

                      {match.verification_notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 text-sm mb-1">Admin Notes</h4>
                          <p className="text-sm text-blue-800">{match.verification_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDisputeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Dispute Match</h3>

            <p className="text-sm text-gray-600 mb-4">
              Please provide a detailed reason for disputing this match. An admin will review your dispute.
            </p>

            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Explain why you're disputing this match..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              rows={4}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowDisputeModal(false);
                  setDisputeMatchId(null);
                  setDisputeReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitDispute}
                disabled={!disputeReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
