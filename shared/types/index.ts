export interface Profile {
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
}

export type PaymentProcessorType = 'stripe' | 'safesave' | 'square' | 'none';

export interface PaymentProcessorInfo {
  id: string;
  display_name: string;
  description: string;
  supports_apple_pay: boolean;
  supports_google_pay: boolean;
  supports_auto_billing: boolean;
  is_active: boolean;
}

export interface Facility {
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
  payment_processor: PaymentProcessorType;
  payment_config: Record<string, any>;
  stripe_account_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Court {
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
}

export interface Booking {
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
}

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
}

export interface Match {
  id: string;
  facility_id: string | null;
  match_date: string;
  match_type: string;
  result: string | null;
  created_by: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'match_join' | 'mention' | 'booking_expiring';
  data: any;
  is_read: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
