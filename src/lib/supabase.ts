import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          role: 'user' | 'admin' | 'owner' | 'desk' | 'coach';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          role?: 'user' | 'admin' | 'owner' | 'desk' | 'coach';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          role?: 'user' | 'admin' | 'owner' | 'desk' | 'coach';
          created_at?: string;
          updated_at?: string;
        };
      };
      courts: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          hourly_rate: number;
          is_active: boolean;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          hourly_rate: number;
          is_active?: boolean;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          hourly_rate?: number;
          is_active?: boolean;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          court_id: string;
          user_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          duration_hours: number;
          total_amount: number;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          payment_status: 'pending' | 'paid' | 'refunded';
          payment_intent_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          court_id: string;
          user_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          duration_hours: number;
          total_amount: number;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          payment_status?: 'pending' | 'paid' | 'refunded';
          payment_intent_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          court_id?: string;
          user_id?: string;
          booking_date?: string;
          start_time?: string;
          end_time?: string;
          duration_hours?: number;
          total_amount?: number;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          payment_status?: 'pending' | 'paid' | 'refunded';
          payment_intent_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_transactions: {
        Row: {
          id: string;
          booking_id: string;
          user_id: string;
          amount: number;
          currency: string;
          stripe_payment_intent_id: string | null;
          stripe_charge_id: string | null;
          status: 'pending' | 'succeeded' | 'failed' | 'refunded';
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          user_id: string;
          amount: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded';
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded';
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
    };
  };
};
