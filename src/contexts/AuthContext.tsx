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
    facilityState?: string
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (() => {
        (async () => {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
            setLoading(false);
          }
        })();
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      // Fetch facility association
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
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, phone?: string) => {
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
    facilityState?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
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
            is_active: true,
            subscription_tier: 'trial',
            subscription_status: 'active',
          })
          .select()
          .single();

        if (facilityError) throw facilityError;

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            role: 'owner',
          });

        if (profileError) throw profileError;

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

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
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
    signOut,
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
