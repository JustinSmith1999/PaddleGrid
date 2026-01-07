/*
  # Liability Waiver System
  
  1. New Tables
    - `facility_waivers`
      - `id` (uuid, primary key)
      - `facility_id` (uuid, foreign key to facilities)
      - `title` (text) - Waiver title
      - `content` (text) - Full waiver text
      - `address` (text) - Facility address
      - `requires_parent_guardian` (boolean) - For minors
      - `active` (boolean) - Whether this waiver is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `signed_waivers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `facility_id` (uuid, foreign key to facilities)
      - `waiver_id` (uuid, foreign key to facility_waivers)
      - `full_name` (text) - Signed name
      - `email` (text) - Email address
      - `phone` (text) - Phone number
      - `signature` (text) - Digital signature (typed name)
      - `ip_address` (text) - IP address when signed
      - `signed_at` (timestamptz)
      - `is_minor` (boolean) - Whether signer is a minor
      - `parent_guardian_name` (text) - For minors
      - `parent_guardian_signature` (text) - For minors
      
  2. Security
    - Enable RLS on both tables
    - Anyone can view active facility waivers
    - Only authenticated users can sign waivers
    - Users can view their own signed waivers
    - Facility admins can view all signed waivers for their facility
*/

-- Create facility_waivers table
CREATE TABLE IF NOT EXISTS facility_waivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'Player Waiver, Release of Liability and Indemnification Agreement',
  content text NOT NULL,
  address text,
  requires_parent_guardian boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create signed_waivers table
CREATE TABLE IF NOT EXISTS signed_waivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  waiver_id uuid REFERENCES facility_waivers(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  signature text NOT NULL,
  ip_address text,
  signed_at timestamptz DEFAULT now(),
  is_minor boolean DEFAULT false,
  parent_guardian_name text,
  parent_guardian_signature text,
  UNIQUE(user_id, facility_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_facility_waivers_facility_id ON facility_waivers(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_waivers_active ON facility_waivers(active);
CREATE INDEX IF NOT EXISTS idx_signed_waivers_user_id ON signed_waivers(user_id);
CREATE INDEX IF NOT EXISTS idx_signed_waivers_facility_id ON signed_waivers(facility_id);
CREATE INDEX IF NOT EXISTS idx_signed_waivers_user_facility ON signed_waivers(user_id, facility_id);

-- Enable RLS
ALTER TABLE facility_waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE signed_waivers ENABLE ROW LEVEL SECURITY;

-- Facility waivers policies
CREATE POLICY "Anyone can view active facility waivers"
  ON facility_waivers FOR SELECT
  USING (active = true);

CREATE POLICY "Facility admins can manage waivers"
  ON facility_waivers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = facility_waivers.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin')
    )
  );

-- Signed waivers policies
CREATE POLICY "Users can create their own signed waivers"
  ON signed_waivers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own signed waivers"
  ON signed_waivers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Facility admins can view signed waivers"
  ON signed_waivers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = signed_waivers.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin')
    )
  );

-- Function to check if user has signed waiver for facility
CREATE OR REPLACE FUNCTION has_signed_waiver(p_user_id uuid, p_facility_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM signed_waivers
    WHERE user_id = p_user_id
    AND facility_id = p_facility_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert Pickleball Heaven waiver
INSERT INTO facility_waivers (facility_id, title, content, address, active)
SELECT 
  id,
  'Player Waiver, Release of Liability and Indemnification Agreement',
  'I, the undersigned player, acknowledge, agree and understand that:

1. Voluntarily and of my own free will, elect to participate in the activity of pickleball. Furthermore, I agree that I am in good health and proper physical condition to participate in pickleball.

2. I understand that there are certain risks and hazards involved in participating that may result in injury or death to me or other players including, but not limited to those hazards associated with, playing conditions, equipment, fencing and other participants.

3. I understand that pickleball is dangerous to me and to other players and may result in serious injury or death.

4. I understand that the very nature of pickleball is hazardous and risky, including, but not limited to, the acts of running, jumping, stretching, sliding, diving and collisions with other players and with stationary objects, all of which can cause serious injury or death to me and to other players.

Further, I, the undersigned player, agree that in consideration for the right to play and in consideration for permission to play:

1. I voluntarily elect to accept and assume all risks of injury incurred or suffered by me (a) while practicing or playing as a member of the team so designated, (b) while serving in a non-playing capacity as a team member during practice or play by other teams or by other players on my team, and (c) while on or upon the premises of any and all of the ice arranged for by my team or league for practice or play.

2. I hereby release, discharge and agree not to sue the Pickleball Heaven, or their owners, officers, agents, associates, associations, employees, or any person or entity connected with for any claim, damages, costs or cause of action which I have or may in the future have as a result of injuries or damages sustained or incurred by me from whatever cause including but not limited to the negligence, breach of contract or wrongful conduct of the parties hereby released.

I ACKNOWLEDGE THAT I HAVE READ AND THAT I UNDERSTAND EACH AND EVERY ONE OF THE PROVISIONS IN THIS WAIVER, RELEASE OF LIABILITY AND INDEMNIFICATION AGREEMENT AND AGREE TO ABIDE BY THEM.',
  '645 National Blvd Medford, New York 11763',
  true
FROM facilities
WHERE name = 'Pickleball Heaven'
ON CONFLICT DO NOTHING;
