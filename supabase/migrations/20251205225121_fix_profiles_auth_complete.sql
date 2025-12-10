/*
  # Complete Fix for Authentication Schema Error
  
  This migration completely resolves the "Database error querying schema" issue by:
  1. Adding missing INSERT policy for profiles
  2. Creating a trigger to auto-create profiles when users sign up
  3. Ensuring no circular dependencies during authentication
  
  ## Changes
  1. Add INSERT policy for new user profiles
  2. Create handle_new_user trigger function
  3. Add trigger on auth.users to auto-create profiles
  
  ## Security
  - Users can only insert their own profile during signup
  - Profiles are automatically created with default 'user' role
  - RLS policies remain secure
*/

-- Add INSERT policy for profiles (was missing!)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create a function to handle new user signups
-- This will automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
