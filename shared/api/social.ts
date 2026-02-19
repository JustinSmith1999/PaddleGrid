import { supabase } from '../lib/supabase';

export interface SocialPost {
  id: string;
  author_id: string;
  facility_id?: string;
  court_id?: string;
  post_type: 'general' | 'match_invite';
  content: string;
  media_urls?: string[];
  sport?: string;
  skill_min?: number;
  skill_max?: number;
  play_date?: string;
  play_start_time?: string;
  play_end_time?: string;
  spots_needed?: number;
  spots_filled: number;
  visibility: 'facility' | 'friends' | 'public';
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    skill_level?: number;
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
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    profile_picture_url?: string;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'match_join' | 'mention';
  data: any;
  is_read: boolean;
  created_at: string;
}

export async function createPost(post: {
  post_type: 'general' | 'match_invite';
  content: string;
  facility_id?: string;
  visibility?: 'facility' | 'friends' | 'public';
  sport?: string;
  skill_min?: number;
  skill_max?: number;
  play_date?: string;
  play_start_time?: string;
  play_end_time?: string;
  spots_needed?: number;
}): Promise<{ success: boolean; post?: SocialPost; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('social_posts')
      .insert({
        author_id: user.user.id,
        ...post
      })
      .select(`
        *,
        profiles!social_posts_author_id_fkey(*),
        facilities!social_posts_facility_id_fkey(*)
      `)
      .single();

    if (error) throw error;

    return { success: true, post: data };
  } catch (error: any) {
    console.error('Error creating post:', error);
    return { success: false, error: error.message };
  }
}

export async function getFeedPosts(filter: {
  type?: 'my_club' | 'following' | 'all_local';
  facilityId?: string;
  limit?: number;
  offset?: number;
}): Promise<SocialPost[]> {
  try {
    const { data: user } = await supabase.auth.getUser();

    let query = supabase
      .from('social_posts')
      .select(`
        *,
        profiles!social_posts_author_id_fkey(*),
        facilities!social_posts_facility_id_fkey(*),
        courts!social_posts_court_id_fkey(*)
      `)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .range(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20) - 1);

    if (filter.type === 'my_club' && filter.facilityId) {
      if (!user.user) return [];
      query = query.eq('facility_id', filter.facilityId);
    } else if (filter.type === 'following') {
      if (!user.user) return [];
      const { data: following } = await supabase
        .from('social_follows')
        .select('following_id')
        .eq('follower_id', user.user.id);

      const followingIds = following?.map(f => f.following_id) || [];
      if (followingIds.length > 0) {
        query = query.in('author_id', followingIds);
      } else {
        return [];
      }
    } else {
      if (!user.user) {
        query = query.eq('visibility', 'public');
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching feed:', error);
    return [];
  }
}

export async function getPostById(postId: string): Promise<SocialPost | null> {
  try {
    const { data, error } = await supabase
      .from('social_posts')
      .select(`
        *,
        profiles!social_posts_author_id_fkey(*),
        facilities!social_posts_facility_id_fkey(*),
        courts!social_posts_court_id_fkey(*)
      `)
      .eq('id', postId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export async function toggleLike(postId: string): Promise<{ success: boolean; liked: boolean }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, liked: false };
    }

    const { data: existing } = await supabase
      .from('social_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.user.id)
      .eq('reaction_type', 'like')
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('social_post_likes')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;
      return { success: true, liked: false };
    } else {
      const { error } = await supabase
        .from('social_post_likes')
        .insert({
          post_id: postId,
          user_id: user.user.id,
          reaction_type: 'like'
        });

      if (error) throw error;
      return { success: true, liked: true };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return { success: false, liked: false };
  }
}

export async function getPostLikes(postId: string): Promise<{ count: number; userLiked: boolean }> {
  try {
    const { data: user } = await supabase.auth.getUser();

    const { count } = await supabase
      .from('social_post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    let userLiked = false;
    if (user.user) {
      const { data } = await supabase
        .from('social_post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.user.id)
        .maybeSingle();

      userLiked = !!data;
    }

    return { count: count || 0, userLiked };
  } catch (error) {
    console.error('Error getting likes:', error);
    return { count: 0, userLiked: false };
  }
}

export async function addComment(postId: string, content: string): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('social_comments')
      .insert({
        post_id: postId,
        author_id: user.user.id,
        content
      })
      .select('*, profiles!social_comments_author_id_fkey(*)')
      .single();

    if (error) throw error;

    return { success: true, comment: data };
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return { success: false, error: error.message };
  }
}

export async function getPostComments(postId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('social_comments')
      .select('*, profiles!social_comments_author_id_fkey(*)')
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

export async function joinMatch(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('social_post_participants')
      .insert({
        post_id: postId,
        user_id: user.user.id
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Already joined this match' };
      }
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error joining match:', error);
    return { success: false, error: error.message };
  }
}

export async function leaveMatch(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('social_post_participants')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.user.id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error leaving match:', error);
    return { success: false, error: error.message };
  }
}

export async function getNotifications(limit: number = 20): Promise<Notification[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('social_notifications')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('social_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return 0;

    const { count } = await supabase
      .from('social_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.user.id)
      .eq('is_read', false);

    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

export function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return then.toLocaleDateString();
}
