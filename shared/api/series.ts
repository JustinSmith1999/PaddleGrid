import { supabase } from '../lib/supabase';

export interface Series {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_participants: number;
  current_participants: number;
  entry_fee: number;
  skill_level: string;
  format: string;
  facility_id: string;
  facility_name?: string;
  image_url?: string;
  status: 'draft' | 'open' | 'in_progress' | 'completed';
  created_at: string;
}

export interface SeriesRegistration {
  id: string;
  series_id: string;
  user_id: string;
  registered_at: string;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_amount: number;
}

export interface SeriesStanding {
  user_id: string;
  player_name: string;
  wins: number;
  losses: number;
  points: number;
  matches_played: number;
  rank: number;
}

export interface SeriesMatch {
  id: string;
  series_id: string;
  scheduled_time: string;
  court_name?: string;
  player1_id: string;
  player2_id: string;
  player1_name?: string;
  player2_name?: string;
  player1_score?: number;
  player2_score?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export const seriesApi = {
  // Get all available series
  async getAllSeries(filters?: {
    skill_level?: string;
    status?: string;
    facility_id?: string;
  }) {
    let query = supabase
      .from('event_series')
      .select(`
        *,
        facilities!event_series_facility_id_fkey(name)
      `)
      .order('start_date', { ascending: true });

    if (filters?.skill_level) {
      query = query.eq('skill_level', filters.skill_level);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.facility_id) {
      query = query.eq('facility_id', filters.facility_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((series: any) => ({
      ...series,
      facility_name: series.facilities?.name,
    }));
  },

  // Get series details
  async getSeriesById(seriesId: string) {
    const { data, error } = await supabase
      .from('event_series')
      .select(`
        *,
        facilities!event_series_facility_id_fkey(name, address, city)
      `)
      .eq('id', seriesId)
      .single();

    if (error) throw error;
    return {
      ...data,
      facility_name: data.facilities?.name,
      facility_address: data.facilities?.address,
      facility_city: data.facilities?.city,
    };
  },

  // Get user's enrolled series
  async getUserSeries(userId: string) {
    const { data, error } = await supabase
      .from('series_registrations')
      .select(`
        *,
        event_series!series_registrations_series_id_fkey(
          id,
          name,
          description,
          start_date,
          end_date,
          status,
          facility_id
        )
      `)
      .eq('user_id', userId)
      .eq('payment_status', 'completed')
      .order('registered_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Register for a series
  async registerForSeries(seriesId: string, userId: string, paymentIntentId?: string) {
    const { data, error } = await supabase
      .from('series_registrations')
      .insert({
        series_id: seriesId,
        user_id: userId,
        payment_status: paymentIntentId ? 'completed' : 'pending',
        payment_intent_id: paymentIntentId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get series standings
  async getSeriesStandings(seriesId: string): Promise<SeriesStanding[]> {
    const { data, error } = await supabase.rpc('get_series_standings', {
      p_series_id: seriesId,
    });

    if (error) throw error;
    return data || [];
  },

  // Get series schedule
  async getSeriesSchedule(seriesId: string): Promise<SeriesMatch[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:profiles!matches_player1_id_fkey(id, full_name),
        player2:profiles!matches_player2_id_fkey(id, full_name),
        courts(name)
      `)
      .eq('series_id', seriesId)
      .order('scheduled_time', { ascending: true });

    if (error) throw error;

    return data.map((match: any) => ({
      ...match,
      player1_name: match.player1?.full_name,
      player2_name: match.player2?.full_name,
      court_name: match.courts?.name,
    }));
  },

  // Check if user is registered
  async isUserRegistered(seriesId: string, userId: string) {
    const { data, error } = await supabase
      .from('series_registrations')
      .select('id, payment_status')
      .eq('series_id', seriesId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return {
      isRegistered: !!data,
      paymentStatus: data?.payment_status,
    };
  },
};
