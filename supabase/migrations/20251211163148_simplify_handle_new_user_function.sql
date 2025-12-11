/*
  # Simplify and fix handle_new_user function
  
  1. Changes
    - Simplify the handle_new_user trigger function
    - Use simpler logic for name extraction
    - Add better null handling
    - Remove complex COALESCE chains that might fail
  
  2. Security
    - Maintains SECURITY DEFINER for proper permissions
    - No changes to RLS policies
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_full_name text;
  v_role text;
BEGIN
  -- Extract first name
  v_first_name := NEW.raw_user_meta_data->>'first_name';
  IF v_first_name IS NULL OR v_first_name = '' THEN
    v_first_name := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Extract last name
  v_last_name := NEW.raw_user_meta_data->>'last_name';
  IF v_last_name IS NULL THEN
    v_last_name := '';
  END IF;
  
  -- Create full_name
  IF v_last_name != '' THEN
    v_full_name := v_first_name || ' ' || v_last_name;
  ELSE
    v_full_name := v_first_name;
  END IF;
  
  -- Get role
  v_role := NEW.raw_user_meta_data->>'role';
  IF v_role IS NULL OR v_role = '' THEN
    v_role := 'user';
  END IF;

  -- Insert or update profile
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    full_name,
    phone,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_full_name,
    NEW.raw_user_meta_data->>'phone',
    v_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    full_name = EXCLUDED.full_name,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role = EXCLUDED.role,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;
