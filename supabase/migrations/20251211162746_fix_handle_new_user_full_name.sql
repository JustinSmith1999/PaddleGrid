/*
  # Fix handle_new_user to populate full_name

  1. Changes
    - Update handle_new_user function to also populate the full_name column
    - Combine first_name and last_name to create full_name
    - Maintain backward compatibility with existing data

  2. Notes
    - The full_name column is NOT NULL and must be populated
    - Function will create full_name from first_name + last_name
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_full_name text;
BEGIN
  -- Extract first and last names
  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name', 
    split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', 1)
  );
  
  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name', 
    CASE 
      WHEN NEW.raw_user_meta_data->>'full_name' LIKE '% %' 
      THEN substring(NEW.raw_user_meta_data->>'full_name' from position(' ' in NEW.raw_user_meta_data->>'full_name') + 1)
      ELSE ''
    END
  );
  
  -- Create full_name
  v_full_name := TRIM(CONCAT(v_first_name, ' ', v_last_name));
  IF v_full_name = '' THEN
    v_full_name := NEW.email;
  END IF;

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
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
