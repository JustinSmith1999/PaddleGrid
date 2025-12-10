import { supabase } from './supabase';

export interface Activity {
  id: string;
  user_id: string;
  facility_id?: string;
  court_id?: string;
  activity_type: 'match' | 'practice' | 'drill' | 'tournament';
  match_type?: 'singles' | 'doubles' | 'mixed_doubles';
  activity_date: string;
  start_time?: string;
  duration_minutes?: number;
  score_us?: number;
  score_them?: number;
  is_win?: boolean;
  rating_before?: number;
  rating_after?: number;
  rating_change?: number;
  effort_level?: number;
  description?: string;
  photos?: string[];
  weather?: any;
  privacy: 'public' | 'followers' | 'private';
  kudos_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    profile_picture_url?: string;
  };
  facilities?: {
    id: string;
    name: string;
    logo_url?: string;
  };
  courts?: {
    id: string;
    name: string;
  };
  activity_participants?: ActivityParticipant[];
  user_has_given_kudos?: boolean;
}

export interface ActivityParticipant {
  id: string;
  activity_id: string;
  user_id: string;
  role: 'partner' | 'opponent';
  confirmed: boolean;
  profiles?: {
    id: string;
    full_name: string;
    profile_picture_url?: string;
  };
}

export interface Streak {
  id: string;
  user_id: string;
  streak_type: 'daily' | 'weekly' | 'win_streak';
  current_count: number;
  longest_count: number;
  last_activity_date?: string;
  started_at?: string;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  record_type: 'win_streak' | 'rating_gain' | 'most_matches_week' | 'highest_rating' | 'longest_match' | 'biggest_comeback';
  value: number;
  previous_value?: number;
  activity_id?: string;
  achieved_at: string;
  metadata?: any;
}

export interface WeeklySummary {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  total_activities: number;
  total_duration_minutes: number;
  wins: number;
  losses: number;
  rating_change: number;
  courts_visited: number;
  new_prs: number;
  achievements_unlocked: number;
  kudos_received: number;
}

export async function createActivity(activity: {
  facility_id?: string;
  court_id?: string;
  activity_type: 'match' | 'practice' | 'drill' | 'tournament';
  match_type?: 'singles' | 'doubles' | 'mixed_doubles';
  activity_date: string;
  start_time?: string;
  duration_minutes?: number;
  score_us?: number;
  score_them?: number;
  is_win?: boolean;
  rating_before?: number;
  rating_after?: number;
  rating_change?: number;
  effort_level?: number;
  description?: string;
  photos?: string[];
  privacy?: 'public' | 'followers' | 'private';
  participants?: Array<{ user_id: string; role: 'partner' | 'opponent' }>;
}): Promise<{ success: boolean; activity?: Activity; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { participants, ...activityData } = activity;

    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.user.id,
        ...activityData
      })
      .select('*, profiles(*), facilities(*), courts(*)')
      .single();

    if (error) throw error;

    if (participants && participants.length > 0) {
      const participantData = participants.map(p => ({
        activity_id: data.id,
        ...p
      }));

      await supabase
        .from('activity_participants')
        .insert(participantData);
    }

    return { success: true, activity: data };
  } catch (error: any) {
    console.error('Error creating activity:', error);
    return { success: false, error: error.message };
  }
}

export async function getActivityFeed(options: {
  userId?: string;
  facilityId?: string;
  followingOnly?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<Activity[]> {
  try {
    const { data: user } = await supabase.auth.getUser();

    let query = supabase
      .from('activities')
      .select(`
        *,
        profiles (id, full_name, email, profile_picture_url),
        facilities (id, name, logo_url),
        courts (id, name),
        activity_participants (id, user_id, role, confirmed, profiles:user_id (id, full_name, profile_picture_url))
      `)
      .order('activity_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options.facilityId) {
      query = query.eq('facility_id', options.facilityId);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (user?.user) {
      const activitiesWithKudos = await Promise.all(
        (data || []).map(async (activity) => {
          const { data: kudosData } = await supabase
            .from('activity_kudos')
            .select('user_id')
            .eq('activity_id', activity.id)
            .eq('user_id', user.user.id)
            .maybeSingle();

          return {
            ...activity,
            user_has_given_kudos: !!kudosData
          };
        })
      );

      return activitiesWithKudos;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return [];
  }
}

export async function giveKudos(activityId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('activity_kudos')
      .insert({
        activity_id: activityId,
        user_id: user.user.id
      });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error giving kudos:', error);
    return { success: false, error: error.message };
  }
}

export async function removeKudos(activityId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('activity_kudos')
      .delete()
      .eq('activity_id', activityId)
      .eq('user_id', user.user.id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error removing kudos:', error);
    return { success: false, error: error.message };
  }
}

export async function addComment(activityId: string, content: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('activity_comments')
      .insert({
        activity_id: activityId,
        user_id: user.user.id,
        content
      });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return { success: false, error: error.message };
  }
}

export async function getComments(activityId: string) {
  try {
    const { data, error } = await supabase
      .from('activity_comments')
      .select('*, profiles (id, full_name, email, profile_picture_url)')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

export async function getUserStreaks(userId: string): Promise<Streak[]> {
  try {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching streaks:', error);
    return [];
  }
}

export async function getUserPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching personal records:', error);
    return [];
  }
}

export async function getWeeklySummary(userId: string, weekStart: string): Promise<WeeklySummary | null> {
  try {
    const { data, error } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    return null;
  }
}

export async function getUserStats(userId: string) {
  try {
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId);

    if (activitiesError) throw activitiesError;

    const totalMatches = activities?.length || 0;
    const wins = activities?.filter(a => a.is_win === true).length || 0;
    const losses = activities?.filter(a => a.is_win === false).length || 0;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    const totalDuration = activities?.reduce((sum, a) => sum + (a.duration_minutes || 0), 0) || 0;

    const ratingData = activities
      ?.filter(a => a.rating_after !== null)
      .map(a => a.rating_after) || [];

    const currentRating = ratingData.length > 0 ? ratingData[ratingData.length - 1] : null;

    const courtIds = new Set(activities?.map(a => a.court_id).filter(Boolean));
    const courtsVisited = courtIds.size;

    const totalKudos = activities?.reduce((sum, a) => sum + (a.kudos_count || 0), 0) || 0;

    return {
      totalMatches,
      wins,
      losses,
      winRate,
      totalDuration,
      currentRating,
      courtsVisited,
      totalKudos
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
}