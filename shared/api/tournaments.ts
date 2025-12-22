import { supabase } from '../lib/supabase';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin';
  max_participants: number;
  current_participants: number;
  entry_fee: number;
  prize_pool?: number;
  facility_id: string;
  facility_name?: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  image_url?: string;
  created_at: string;
}

export interface BracketMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  player1_name?: string;
  player2_name?: string;
  player1_score?: number;
  player2_score?: number;
  winner_id?: string;
  scheduled_time?: string;
  completed_at?: string;
  status: 'pending' | 'in_progress' | 'completed';
  next_match_id?: string;
}

export interface LiveScore {
  match_id: string;
  player1_id: string;
  player2_id: string;
  player1_score: number;
  player2_score: number;
  current_game: number;
  status: 'in_progress' | 'completed';
  updated_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  player_name: string;
  rank: number;
  rating: number;
  wins: number;
  losses: number;
  win_percentage: number;
  tournaments_won: number;
  total_matches: number;
  avatar_url?: string;
}

export const tournamentsApi = {
  // Get all tournaments
  async getAllTournaments(filters?: {
    status?: string;
    facility_id?: string;
  }) {
    let query = supabase
      .from('tournament_brackets')
      .select(`
        *,
        facilities!tournament_brackets_facility_id_fkey(name)
      `)
      .order('start_date', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.facility_id) {
      query = query.eq('facility_id', filters.facility_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((tournament: any) => ({
      ...tournament,
      facility_name: tournament.facilities?.name,
    }));
  },

  // Get tournament details
  async getTournamentById(tournamentId: string) {
    const { data, error } = await supabase
      .from('tournament_brackets')
      .select(`
        *,
        facilities!tournament_brackets_facility_id_fkey(name, address, city)
      `)
      .eq('id', tournamentId)
      .single();

    if (error) throw error;
    return {
      ...data,
      facility_name: data.facilities?.name,
    };
  },

  // Get bracket matches
  async getBracketMatches(tournamentId: string): Promise<BracketMatch[]> {
    const { data, error } = await supabase
      .from('bracket_matches')
      .select(`
        *,
        player1:profiles!bracket_matches_player1_id_fkey(id, full_name, avatar_url),
        player2:profiles!bracket_matches_player2_id_fkey(id, full_name, avatar_url)
      `)
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true })
      .order('match_number', { ascending: true });

    if (error) throw error;

    return data.map((match: any) => ({
      ...match,
      player1_name: match.player1?.full_name,
      player2_name: match.player2?.full_name,
    }));
  },

  // Subscribe to live score updates
  subscribeToLiveScores(matchId: string, callback: (score: LiveScore) => void) {
    const channel = supabase
      .channel(`live-score-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          const match = payload.new as any;
          callback({
            match_id: match.id,
            player1_id: match.player1_id,
            player2_id: match.player2_id,
            player1_score: match.player1_score || 0,
            player2_score: match.player2_score || 0,
            current_game: match.current_game || 1,
            status: match.status,
            updated_at: match.updated_at,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Get global leaderboard
  async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        rating,
        avatar_url,
        matches_won:matches!matches_winner_id_fkey(count),
        matches_played:matches!matches_player1_id_fkey(count)
      `)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((player: any, index: number) => ({
      user_id: player.id,
      player_name: player.full_name || 'Unknown Player',
      rank: index + 1,
      rating: player.rating || 1000,
      wins: player.matches_won || 0,
      losses: (player.matches_played || 0) - (player.matches_won || 0),
      win_percentage: player.matches_played > 0
        ? (player.matches_won / player.matches_played) * 100
        : 0,
      tournaments_won: 0,
      total_matches: player.matches_played || 0,
      avatar_url: player.avatar_url,
    }));
  },

  // Get facility leaderboard
  async getFacilityLeaderboard(facilityId: string, limit: number = 50): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('facility_users')
      .select(`
        user_id,
        profiles!facility_users_user_id_fkey(
          id,
          full_name,
          rating,
          avatar_url
        )
      `)
      .eq('facility_id', facilityId)
      .limit(limit);

    if (error) throw error;

    const leaderboardData = data
      .filter((item: any) => item.profiles)
      .map((item: any) => item.profiles)
      .sort((a: any, b: any) => (b.rating || 1000) - (a.rating || 1000));

    return leaderboardData.map((player: any, index: number) => ({
      user_id: player.id,
      player_name: player.full_name || 'Unknown Player',
      rank: index + 1,
      rating: player.rating || 1000,
      wins: 0,
      losses: 0,
      win_percentage: 0,
      tournaments_won: 0,
      total_matches: 0,
      avatar_url: player.avatar_url,
    }));
  },

  // Register for tournament
  async registerForTournament(tournamentId: string, userId: string) {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .insert({
        tournament_id: tournamentId,
        user_id: userId,
        registered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Check if user is registered for tournament
  async isUserRegistered(tournamentId: string, userId: string) {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },
};
