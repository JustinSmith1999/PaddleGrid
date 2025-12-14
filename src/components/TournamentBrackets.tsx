import { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, DollarSign, Award, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Tournament {
  id: string;
  name: string;
  description: string;
  tournament_type: string;
  bracket_size: number;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  current_participants: number;
  max_participants: number;
  entry_fee: number;
  prize_pool: number;
  status: string;
  format: string;
  image_url?: string;
  facilities: {
    name: string;
  };
}

interface Match {
  id: string;
  round_number: number;
  match_number: number;
  bracket_position: number;
  participant1?: {
    id: string;
    user_id: string;
    profiles: {
      full_name: string;
    };
  };
  participant2?: {
    id: string;
    user_id: string;
    profiles: {
      full_name: string;
    };
  };
  winner_id?: string;
  score: any;
  status: string;
}

export default function TournamentBrackets() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadMatches(selectedTournament);
    }
  }, [selectedTournament]);

  async function loadTournaments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        facilities(name)
      `)
      .order('start_date', { ascending: false });

    if (!error && data) {
      setTournaments(data);
      if (data.length > 0 && !selectedTournament) {
        setSelectedTournament(data[0].id);
      }
    }
    setLoading(false);
  }

  async function loadMatches(tournamentId: string) {
    const { data, error } = await supabase
      .from('tournament_matches')
      .select(`
        *,
        participant1:participant1_id(
          id,
          user_id,
          profiles(full_name)
        ),
        participant2:participant2_id(
          id,
          user_id,
          profiles(full_name)
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('round_number')
      .order('match_number');

    if (!error && data) {
      setMatches(data as Match[]);
    }
  }

  async function handleRegister(tournamentId: string) {
    if (!user) {
      alert('Please log in to register for tournaments');
      return;
    }

    const { error } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: tournamentId,
        user_id: user.id,
        payment_status: 'pending'
      });

    if (!error) {
      alert('Registration successful! Please complete payment.');
      loadTournaments();
    } else {
      alert('Failed to register. You may already be registered.');
    }
  }

  const selectedTournamentData = tournaments.find(t => t.id === selectedTournament);
  const maxRound = Math.max(...matches.map(m => m.round_number), 0);

  const renderMatch = (match: Match) => {
    const participant1Name = match.participant1?.profiles?.full_name || 'TBD';
    const participant2Name = match.participant2?.profiles?.full_name || 'TBD';
    const isParticipant1Winner = match.winner_id === match.participant1?.id;
    const isParticipant2Winner = match.winner_id === match.participant2?.id;

    return (
      <div key={match.id} className="bg-white border-2 border-gray-300 rounded-lg p-3 min-w-[200px]">
        <div className="text-xs text-gray-500 font-semibold mb-2">
          Match {match.match_number}
        </div>
        <div className={`flex items-center justify-between p-2 rounded mb-1 ${
          isParticipant1Winner ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-50'
        }`}>
          <span className={`text-sm ${isParticipant1Winner ? 'font-bold' : ''}`}>
            {participant1Name}
          </span>
          {match.status === 'completed' && match.score && (
            <span className="text-sm font-bold">{match.score[0] || '-'}</span>
          )}
        </div>
        <div className={`flex items-center justify-between p-2 rounded ${
          isParticipant2Winner ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-50'
        }`}>
          <span className={`text-sm ${isParticipant2Winner ? 'font-bold' : ''}`}>
            {participant2Name}
          </span>
          {match.status === 'completed' && match.score && (
            <span className="text-sm font-bold">{match.score[1] || '-'}</span>
          )}
        </div>
        <div className="mt-2 text-xs text-center">
          <span className={`px-2 py-1 rounded-full ${
            match.status === 'completed' ? 'bg-green-100 text-green-800' :
            match.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {match.status.replace('_', ' ')}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Tournaments</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              onClick={() => setSelectedTournament(tournament.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                selectedTournament === tournament.id
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg mb-1 truncate">{tournament.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{tournament.description}</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{tournament.facilities.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{tournament.current_participants}/{tournament.max_participants} players</span>
                    </div>
                    {tournament.entry_fee > 0 && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>${tournament.entry_fee} entry</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      tournament.status === 'registration' ? 'bg-blue-100 text-blue-800' :
                      tournament.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      tournament.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {tournament.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              {tournament.status === 'registration' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRegister(tournament.id);
                  }}
                  className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Register Now
                </button>
              )}
            </div>
          ))}
        </div>

        {tournaments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No tournaments available at this time.</p>
          </div>
        )}
      </div>

      {selectedTournamentData && matches.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-2">{selectedTournamentData.name} - Bracket</h3>
            <p className="text-gray-600">
              {selectedTournamentData.tournament_type.replace('_', ' ').toUpperCase()} - {selectedTournamentData.format.replace('_', ' ')}
            </p>
          </div>

          <div className="flex gap-8 pb-4">
            {Array.from({ length: maxRound }, (_, i) => i + 1).map((round) => {
              const roundMatches = matches.filter(m => m.round_number === round);
              const roundName = round === maxRound ? 'Finals' :
                               round === maxRound - 1 ? 'Semi-Finals' :
                               round === maxRound - 2 ? 'Quarter-Finals' :
                               `Round ${round}`;

              return (
                <div key={round} className="flex-shrink-0">
                  <h4 className="font-bold mb-4 text-center">{roundName}</h4>
                  <div className="space-y-8">
                    {roundMatches.map(match => renderMatch(match))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
