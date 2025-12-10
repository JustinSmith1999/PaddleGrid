import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnvironment } from '../config/environment';

const env = getEnvironment();

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          full_name: string;
          phone: string | null;
          role: 'user' | 'admin' | 'owner' | 'desk' | 'coach';
          profile_picture_url: string | null;
          skill_level: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          role?: 'user' | 'admin' | 'owner' | 'desk' | 'coach';
          profile_picture_url?: string | null;
          skill_level?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          role?: 'user' | 'admin' | 'owner' | 'desk' | 'coach';
          profile_picture_url?: string | null;
          skill_level?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      facilities: {
        Row: {
          id: string;
          name: string;
          slug: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          logo_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      courts: {
        Row: {
          id: string;
          facility_id: string;
          name: string;
          description: string | null;
          hourly_rate: number;
          status: string;
          surface_type: string | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          court_id: string;
          user_id: string;
          start_time: string;
          end_time: string;
          total_cost: number;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          payment_status: 'pending' | 'paid' | 'refunded';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          court_id: string;
          user_id: string;
          start_time: string;
          end_time: string;
          total_cost: number;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          payment_status?: 'pending' | 'paid' | 'refunded';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      social_posts: {
        Row: {
          id: string;
          author_id: string;
          facility_id: string | null;
          court_id: string | null;
          post_type: 'general' | 'match_invite';
          content: string;
          media_urls: string[] | null;
          sport: string | null;
          skill_min: number | null;
          skill_max: number | null;
          play_date: string | null;
          play_start_time: string | null;
          play_end_time: string | null;
          spots_needed: number | null;
          spots_filled: number;
          visibility: 'facility' | 'friends' | 'public';
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          facility_id?: string | null;
          court_id?: string | null;
          post_type: 'general' | 'match_invite';
          content: string;
          media_urls?: string[] | null;
          sport?: string | null;
          skill_min?: number | null;
          skill_max?: number | null;
          play_date?: string | null;
          play_start_time?: string | null;
          play_end_time?: string | null;
          spots_needed?: number | null;
          spots_filled?: number;
          visibility?: 'facility' | 'friends' | 'public';
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          facility_id: string | null;
          match_date: string;
          match_type: string;
          result: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          facility_id?: string | null;
          match_date: string;
          match_type: string;
          result?: string | null;
          created_by: string;
          created_at?: string;
        };
      };
    };
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Facility = Database['public']['Tables']['facilities']['Row'];
export type Court = Database['public']['Tables']['courts']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type SocialPost = Database['public']['Tables']['social_posts']['Row'];
export type Match = Database['public']['Tables']['matches']['Row'];
