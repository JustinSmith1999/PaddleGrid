export interface AppEnvironment {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

export const getEnvironment = (): AppEnvironment => {
  if (typeof window !== 'undefined') {
    return {
      SUPABASE_URL: (import.meta as any).env.VITE_SUPABASE_URL || '',
      SUPABASE_ANON_KEY: (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '',
    };
  } else {
    return {
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    };
  }
};
