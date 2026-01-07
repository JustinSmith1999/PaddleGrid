import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'user' | 'admin' | 'owner' | 'desk' | 'coach';
  profile_picture_url: string | null;
  facility_id?: string;
  facility_role?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<{ error: Error | null }>;
  signUpWithFacility: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
    facilityName: string,
    facilityAddress?: string,
    facilityCity?: string,
    facilityState?: string,
    estimatedPatronBase?: number,
    ownerName?: string,
    ownerPhone?: string
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('[Auth] Starting initialization...');

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout after 10s')), 10000)
        );

        const authPromise = supabase.auth.getSession();

        const { data: { session }, error: sessionError } = await Promise.race([authPromise, timeoutPromise]) as any;

        if (!mounted) return;

        if (sessionError) {
          console.error('[Auth] Session error:', sessionError);
          throw sessionError;
        }

        console.log('[Auth] Session retrieved:', session ? 'user logged in' : 'no session');

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('[Auth] Initialization error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (() => {
        (async () => {
          try {
            if (!mounted) return;
            console.log('[Auth] State change event:', event);
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
              await fetchProfile(session.user.id);
            } else {
              setProfile(null);
              setLoading(false);
            }
          } catch (error) {
            console.error('[Auth] State change error:', error);
            if (mounted) {
              setLoading(false);
            }
          }
        })();
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('[Auth] Fetching profile for user:', userId);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout after 8s')), 8000)
      );

      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      let { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error) {
        console.error('[Auth] Profile fetch error:', error);
        throw error;
      }

      if (!data) {
        console.log('[Auth] Profile not found, creating new profile...');
        const { data: userData } = await supabase.auth.getUser();
        const userEmail = userData.user?.email || '';
        const userName = userData.user?.user_metadata?.full_name || '';
        const [firstName, ...lastNameParts] = userName.split(' ');
        const lastName = lastNameParts.join(' ');

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userEmail,
            first_name: firstName || '',
            last_name: lastName || '',
            phone: null,
            role: 'user',
          })
          .select()
          .single();

        if (insertError) {
          console.error('[Auth] Profile creation error:', insertError);
          throw insertError;
        }
        console.log('[Auth] Profile created successfully');
        data = newProfile;
      } else {
        console.log('[Auth] Profile loaded successfully');
      }

      const { data: facilityUser } = await supabase
        .from('facility_users')
        .select('facility_id, role')
        .eq('user_id', userId)
        .maybeSingle();

      setProfile({
        ...data,
        facility_id: facilityUser?.facility_id,
        facility_role: facilityUser?.role,
      });
      console.log('[Auth] Profile setup complete');
    } catch (error) {
      console.error('[Auth] Error in fetchProfile:', error);
      setProfile(null);
    } finally {
      console.log('[Auth] Setting loading to false');
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, phone?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            role: 'user',
          }
        }
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithFacility = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
    facilityName: string,
    facilityAddress?: string,
    facilityCity?: string,
    facilityState?: string,
    estimatedPatronBase?: number,
    ownerName?: string,
    ownerPhone?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            role: 'owner',
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        const slug = facilityName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        const { data: facility, error: facilityError } = await supabase
          .from('facilities')
          .insert({
            name: facilityName,
            slug: `${slug}-${Date.now()}`,
            email,
            phone,
            address: facilityAddress,
            city: facilityCity,
            state: facilityState,
            estimated_patron_base: estimatedPatronBase,
            owner_name: ownerName,
            owner_phone: ownerPhone,
            is_active: true,
            subscription_tier: 'trial',
            subscription_status: 'active',
          })
          .select()
          .single();

        if (facilityError) throw facilityError;

        await supabase
          .from('profiles')
          .update({ role: 'owner' })
          .eq('id', data.user.id);

        const { error: facilityUserError } = await supabase
          .from('facility_users')
          .insert({
            facility_id: facility.id,
            user_id: data.user.id,
            role: 'owner',
          });

        if (facilityUserError) throw facilityUserError;
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithApple = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'desk' || profile?.role === 'coach';

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signUpWithFacility,
    signIn,
    signInWithApple,
    signOut,
    resetPassword,
    refreshProfile,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
