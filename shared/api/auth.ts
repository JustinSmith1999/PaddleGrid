import { supabase, Profile } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export interface AuthResult {
  error: Error | null;
  user?: User;
}

export interface SessionResult {
  session: Session | null;
  user: User | null;
}

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone?: string
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          role: 'user',
        });

      if (profileError) throw profileError;
    }

    return { error: null, user: data.user || undefined };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { error: null, user: data.user };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<SessionResult> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;

    return {
      session: session,
      user: session?.user || null,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return {
      session: null,
      user: null,
    };
  }
}

export async function getUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return { success: false, error: error.message };
  }
}

export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}
