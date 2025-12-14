import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useFacilityPosts(facilityId: string | undefined) {
  return useQuery({
    queryKey: ['facility-posts', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];

      const { data, error } = await supabase.rpc('get_facility_posts_with_stats', {
        p_facility_id: facilityId,
        p_limit: 50,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!facilityId,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePostParticipants(postId: string | undefined) {
  return useQuery({
    queryKey: ['post-participants', postId],
    queryFn: async () => {
      if (!postId) return [];

      const { data, error } = await supabase.rpc('get_post_participants_optimized', {
        p_post_id: postId,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!postId,
    staleTime: 1 * 60 * 1000,
  });
}

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useFacilities() {
  return useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('*, courts(count)')
        .order('name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function useCourts(facilityId: string | undefined) {
  return useQuery({
    queryKey: ['courts', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];

      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('facility_id', facilityId)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!facilityId,
    staleTime: 15 * 60 * 1000,
  });
}

export function useUserBookings(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-bookings', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select('*, courts(name, facilities(name))')
        .eq('user_id', userId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
  });
}

export function useEventSeries(facilityId?: string) {
  return useQuery({
    queryKey: ['event-series', facilityId],
    queryFn: async () => {
      let query = supabase
        .from('event_series')
        .select('*, facilities(name, slug)')
        .order('created_at', { ascending: false });

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSocialInteractions(postIds: string[]) {
  return useQuery({
    queryKey: ['social-interactions', postIds],
    queryFn: async () => {
      if (postIds.length === 0) return { likes: [], comments: [] };

      const [likesData, commentsData] = await Promise.all([
        supabase
          .from('social_likes')
          .select('post_id, user_id')
          .in('post_id', postIds),
        supabase
          .from('social_comments')
          .select('id, post_id, user_id, content, created_at, profiles(full_name, profile_picture_url)')
          .in('post_id', postIds)
          .order('created_at', { ascending: true }),
      ]);

      return {
        likes: likesData.data || [],
        comments: commentsData.data || [],
      };
    },
    enabled: postIds.length > 0,
    staleTime: 30 * 1000,
  });
}

export function useCourtAvailability(courtId: string | undefined, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['court-availability', courtId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!courtId) return [];

      const { data, error } = await supabase
        .from('court_availability_blocks')
        .select('*')
        .eq('court_id', courtId)
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!courtId,
    staleTime: 30 * 1000,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: {
      user_id: string;
      facility_id: string;
      content: string;
      post_type: string;
      match_date?: string;
      spots_available?: number;
      media_url?: string;
    }) => {
      const { data, error } = await supabase
        .from('social_posts')
        .insert(post)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['facility-posts', variables.facility_id] });
    },
  });
}

export function useJoinMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId }: { postId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('match_participants')
        .insert({ post_id: postId, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-participants', variables.postId] });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId }: { postId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('social_likes')
        .insert({ post_id: postId, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-interactions'] });
    },
  });
}

export function useUnlikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId }: { postId: string; userId: string }) => {
      const { error } = await supabase
        .from('social_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-interactions'] });
    },
  });
}
