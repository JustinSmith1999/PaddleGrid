/*
  # Fix handle_new_user Function for First/Last Name

  1. Changes
    - Update handle_new_user function to insert first_name and last_name instead of full_name
    - Extract first and last names from user metadata
    - Set default role to 'user'
    - Maintain backward compatibility

  2. Security
    - Function runs automatically on user creation via trigger
    - Uses ON CONFLICT to prevent duplicate inserts
*/

-- Drop and recreate the handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name,
    last_name,
    phone,
    role,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', CASE 
      WHEN NEW.raw_user_meta_data->>'full_name' LIKE '% %' 
      THEN substring(NEW.raw_user_meta_data->>'full_name' from position(' ' in NEW.raw_user_meta_data->>'full_name') + 1)
      ELSE ''
    END),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
