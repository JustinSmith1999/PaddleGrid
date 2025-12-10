import { supabase, Facility, Court } from '../lib/supabase';

export interface FacilityWithCourts extends Facility {
  courts?: Court[];
  member_count?: number;
}

export async function getAllFacilities(): Promise<FacilityWithCourts[]> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching facilities:', error);
    return [];
  }
}

export async function getFacilityById(facilityId: string): Promise<FacilityWithCourts | null> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select(`
        *,
        courts (*)
      `)
      .eq('id', facilityId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching facility:', error);
    return null;
  }
}

export async function getFacilityBySlug(slug: string): Promise<FacilityWithCourts | null> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select(`
        *,
        courts (*)
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching facility by slug:', error);
    return null;
  }
}

export async function getCourts(facilityId: string): Promise<Court[]> {
  try {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching courts:', error);
    return [];
  }
}

export async function getCourtById(courtId: string): Promise<Court | null> {
  try {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .eq('id', courtId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching court:', error);
    return null;
  }
}

export async function getUserFacility(userId: string): Promise<FacilityWithCourts | null> {
  try {
    const { data: facilityUser, error: facilityUserError } = await supabase
      .from('facility_users')
      .select('facility_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (facilityUserError) throw facilityUserError;
    if (!facilityUser) return null;

    const { data, error } = await supabase
      .from('facilities')
      .select(`
        *,
        courts (*)
      `)
      .eq('id', facilityUser.facility_id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user facility:', error);
    return null;
  }
}

export async function joinFacility(facilityId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('facility_users')
      .insert({
        facility_id: facilityId,
        user_id: user.user.id,
        role: 'member',
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Already a member of this facility' };
      }
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error joining facility:', error);
    return { success: false, error: error.message };
  }
}

export async function leaveFacility(facilityId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('facility_users')
      .delete()
      .eq('facility_id', facilityId)
      .eq('user_id', user.user.id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error leaving facility:', error);
    return { success: false, error: error.message };
  }
}

export async function isFacilityMember(facilityId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data } = await supabase
      .from('facility_users')
      .select('id')
      .eq('facility_id', facilityId)
      .eq('user_id', user.user.id)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.error('Error checking facility membership:', error);
    return false;
  }
}
