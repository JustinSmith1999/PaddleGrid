import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import {
  signIn as apiSignIn,
  signUp as apiSignUp,
  signOut as apiSignOut,
  getSession,
  getProfile,
  onAuthStateChange,
} from '@shared/api';
import { Profile } from '@shared/types';
import { supabase } from '@shared/lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<{ error: Error | null }>;
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
    loadSession();

    const subscription = onAuthStateChange((event, newSession) => {
      try {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          fetchProfile(newSession.user.id);
          if (newSession.access_token) {
            SecureStore.setItemAsync('access_token', newSession.access_token).catch(console.error);
          }
          if (newSession.refresh_token) {
            SecureStore.setItemAsync('refresh_token', newSession.refresh_token).catch(console.error);
          }
        } else {
          setProfile(null);
          setLoading(false);
          SecureStore.deleteItemAsync('access_token').catch(console.error);
          SecureStore.deleteItemAsync('refresh_token').catch(console.error);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setLoading(false);
      }
    });

    return () => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from auth:', error);
      }
    };
  }, []);

  const loadSession = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('access_token');
      const refreshToken = await SecureStore.getItemAsync('refresh_token');

      if (accessToken && refreshToken) {
        const { data: { session: restoredSession }, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Error restoring session:', error);
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');
        } else if (restoredSession) {
          setSession(restoredSession);
          setUser(restoredSession.user);
          await fetchProfile(restoredSession.user.id);
          return;
        }
      }

      const { session: currentSession, user: currentUser } = await getSession();
      setSession(currentSession);
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string
  ) => {
    try {
      const result = await apiSignUp(email, password, firstName, lastName, phone);
      return result;
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await apiSignIn(email, password);
      return result;
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await apiSignOut();
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
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
