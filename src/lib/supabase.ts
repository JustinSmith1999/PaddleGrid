import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    env: import.meta.env,
  });

  if (typeof window !== 'undefined') {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="position: fixed; inset: 0; background: white; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: system-ui, -apple-system, sans-serif; z-index: 9999;">
        <div style="text-align: center; max-width: 500px;">
          <div style="width: 64px; height: 64px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 8px;">Configuration Error</h2>
          <p style="color: #6b7280; margin-bottom: 16px;">The app is missing required configuration. Please contact support.</p>
          <button onclick="window.location.reload()" style="padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer;">
            Retry
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }

  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'paddlegrid-web',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

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
