import { supabase, Match } from '../lib/supabase';

export interface MatchWithDetails extends Match {
  profiles?: {
    id: string;
    full_name: string;
    email: string;
  };
  facilities?: {
    id: string;
    name: string;
  };
  match_participants?: {
    user_id: string;
    team: string;
    score: number | null;
    profiles?: {
      id: string;
      full_name: string;
      skill_level: number | null;
    };
  }[];
}

export async function createMatch(match: {
  facility_id?: string;
  match_date: string;
  match_type: string;
  participants: {
    user_id: string;
    team: string;
    score?: number;
  }[];
}): Promise<{ success: boolean; match?: Match; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert({
        facility_id: match.facility_id,
        match_date: match.match_date,
        match_type: match.match_type,
        created_by: user.user.id,
      })
      .select()
      .single();

    if (matchError) throw matchError;

    const participantsToInsert = match.participants.map(p => ({
      match_id: matchData.id,
      user_id: p.user_id,
      team: p.team,
      score: p.score || null,
    }));

    const { error: participantsError } = await supabase
      .from('match_participants')
      .insert(participantsToInsert);

    if (participantsError) throw participantsError;

    return { success: true, match: matchData };
  } catch (error: any) {
    console.error('Error creating match:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserMatches(userId?: string): Promise<MatchWithDetails[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    const targetUserId = userId || user.user?.id;

    if (!targetUserId) return [];

    const { data: participations } = await supabase
      .from('match_participants')
      .select('match_id')
      .eq('user_id', targetUserId);

    if (!participations || participations.length === 0) return [];

    const matchIds = participations.map(p => p.match_id);

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        profiles (*),
        facilities (*),
        match_participants (
          user_id,
          team,
          score,
          profiles (
            id,
            full_name,
            skill_level
          )
        )
      `)
      .in('id', matchIds)
      .order('match_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user matches:', error);
    return [];
  }
}

export async function getMatchById(matchId: string): Promise<MatchWithDetails | null> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        profiles (*),
        facilities (*),
        match_participants (
          user_id,
          team,
          score,
          profiles (
            id,
            full_name,
            skill_level
          )
        )
      `)
      .eq('id', matchId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching match:', error);
    return null;
  }
}

export async function updateMatchScore(
  matchId: string,
  participants: { user_id: string; score: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    for (const participant of participants) {
      const { error } = await supabase
        .from('match_participants')
        .update({ score: participant.score })
        .eq('match_id', matchId)
        .eq('user_id', participant.user_id);

      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating match score:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteMatch(matchId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: match } = await supabase
      .from('matches')
      .select('created_by')
      .eq('id', matchId)
      .single();

    if (!match) {
      return { success: false, error: 'Match not found' };
    }

    if (match.created_by !== user.user.id) {
      return { success: false, error: 'Not authorized to delete this match' };
    }

    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting match:', error);
    return { success: false, error: error.message };
  }
}
