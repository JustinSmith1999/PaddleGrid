import { supabase } from './supabase';

export interface PodPlayConfig {
  facilityId: string;
  podplayFacilityId: string;
  apiKey: string;
  apiEndpoint?: string;
  webhookSecret?: string;
}

export interface PodPlayBooking {
  id: string;
  memberId: string;
  courtId: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  amount?: number;
  notes?: string;
}

export interface PodPlayMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  membershipType?: string;
  membershipStatus?: 'active' | 'inactive' | 'expired';
  membershipExpiresAt?: string;
}

export interface PodPlayEvent {
  id: string;
  name: string;
  type: 'league' | 'tournament' | 'clinic' | 'open_play' | 'private_event';
  startDate: string;
  endDate: string;
  description?: string;
  maxParticipants?: number;
  registrationDeadline?: string;
  price?: number;
}

export class PodPlayClient {
  private config: PodPlayConfig;
  private baseUrl: string;

  constructor(config: PodPlayConfig) {
    this.config = config;
    this.baseUrl = config.apiEndpoint || 'https://api.podplay.app/v1';
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'X-Facility-ID': this.config.podplayFacilityId,
    };
  }

  private async logSync(
    type: 'bookings' | 'members' | 'events' | 'full' | 'webhook',
    status: 'started' | 'success' | 'failed' | 'partial',
    direction: 'pull' | 'push' | 'bidirectional',
    details: any = {}
  ) {
    try {
      const { data: facilityData } = await supabase
        .from('podplay_facilities')
        .select('id')
        .eq('facility_id', this.config.facilityId)
        .single();

      if (facilityData) {
        await supabase.from('podplay_sync_logs').insert({
          podplay_facility_id: facilityData.id,
          sync_type: type,
          status,
          direction,
          ...details,
        });
      }
    } catch (error) {
      console.error('Error logging sync:', error);
    }
  }

  async fetchBookings(startDate?: string, endDate?: string): Promise<PodPlayBooking[]> {
    try {
      await this.logSync('bookings', 'started', 'pull');

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(
        `${this.baseUrl}/facilities/${this.config.podplayFacilityId}/bookings?${params}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`PodPlay API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const bookings = Array.isArray(data) ? data : data.bookings || [];

      await this.logSync('bookings', 'success', 'pull', {
        records_processed: bookings.length,
      });

      return bookings;
    } catch (error) {
      await this.logSync('bookings', 'failed', 'pull', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async createBooking(booking: Partial<PodPlayBooking>): Promise<PodPlayBooking> {
    try {
      const response = await fetch(
        `${this.baseUrl}/facilities/${this.config.podplayFacilityId}/bookings`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(booking),
        }
      );

      if (!response.ok) {
        throw new Error(`PodPlay API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating PodPlay booking:', error);
      throw error;
    }
  }

  async updateBooking(bookingId: string, updates: Partial<PodPlayBooking>): Promise<PodPlayBooking> {
    try {
      const response = await fetch(
        `${this.baseUrl}/facilities/${this.config.podplayFacilityId}/bookings/${bookingId}`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error(`PodPlay API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating PodPlay booking:', error);
      throw error;
    }
  }

  async cancelBooking(bookingId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/facilities/${this.config.podplayFacilityId}/bookings/${bookingId}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`PodPlay API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error cancelling PodPlay booking:', error);
      throw error;
    }
  }

  async fetchMembers(): Promise<PodPlayMember[]> {
    try {
      await this.logSync('members', 'started', 'pull');

      const response = await fetch(
        `${this.baseUrl}/facilities/${this.config.podplayFacilityId}/members`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`PodPlay API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const members = Array.isArray(data) ? data : data.members || [];

      await this.logSync('members', 'success', 'pull', {
        records_processed: members.length,
      });

      return members;
    } catch (error) {
      await this.logSync('members', 'failed', 'pull', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async createMember(member: Partial<PodPlayMember>): Promise<PodPlayMember> {
    try {
      const response = await fetch(
        `${this.baseUrl}/facilities/${this.config.podplayFacilityId}/members`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(member),
        }
      );

      if (!response.ok) {
        throw new Error(`PodPlay API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating PodPlay member:', error);
      throw error;
    }
  }

  async updateMember(memberId: string, updates: Partial<PodPlayMember>): Promise<PodPlayMember> {
    try {
      const response = await fetch(
        `${this.baseUrl}/facilities/${this.config.podplayFacilityId}/members/${memberId}`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error(`PodPlay API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating PodPlay member:', error);
      throw error;
    }
  }

  async fetchEvents(startDate?: string, endDate?: string): Promise<PodPlayEvent[]> {
    try {
      await this.logSync('events', 'started', 'pull');

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(
        `${this.baseUrl}/facilities/${this.config.podplayFacilityId}/events?${params}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`PodPlay API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const events = Array.isArray(data) ? data : data.events || [];

      await this.logSync('events', 'success', 'pull', {
        records_processed: events.length,
      });

      return events;
    } catch (error) {
      await this.logSync('events', 'failed', 'pull', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async createEvent(event: Partial<PodPlayEvent>): Promise<PodPlayEvent> {
    try {
      const response = await fetch(
        `${this.baseUrl}/facilities/${this.config.podplayFacilityId}/events`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error(`PodPlay API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating PodPlay event:', error);
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/facilities/${this.config.podplayFacilityId}`,
        { headers: this.getHeaders() }
      );

      return response.ok;
    } catch (error) {
      console.error('Error verifying PodPlay connection:', error);
      return false;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      return false;
    }

    try {
      const crypto = window.crypto || (globalThis as any).crypto;
      const encoder = new TextEncoder();
      const data = encoder.encode(payload + this.config.webhookSecret);

      return signature === btoa(String.fromCharCode(...new Uint8Array(data)));
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}

export async function getPodPlayClient(facilityId: string): Promise<PodPlayClient | null> {
  try {
    const { data, error } = await supabase
      .from('podplay_facilities')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('sync_enabled', true)
      .single();

    if (error || !data) {
      return null;
    }

    return new PodPlayClient({
      facilityId,
      podplayFacilityId: data.podplay_facility_id,
      apiKey: data.api_key_encrypted,
      apiEndpoint: data.api_endpoint,
      webhookSecret: data.webhook_secret_encrypted,
    });
  } catch (error) {
    console.error('Error getting PodPlay client:', error);
    return null;
  }
}
