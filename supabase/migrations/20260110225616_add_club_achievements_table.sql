/*
  # Club Achievements Configuration Table
  
  1. New Table
    - `club_achievements` - Which achievements each club has enabled
*/

CREATE TABLE IF NOT EXISTS club_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL,
  achievement_definition_id uuid REFERENCES achievement_definitions(id) ON DELETE CASCADE NOT NULL,
  custom_threshold integer,
  is_enabled boolean DEFAULT true,
  custom_name text,
  custom_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add facility_id foreign key separately
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'club_achievements_facility_id_fkey' 
    AND table_name = 'club_achievements'
  ) THEN
    ALTER TABLE club_achievements 
    ADD CONSTRAINT club_achievements_facility_id_fkey 
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add unique constraint separately
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'club_achievements_facility_achievement_key' 
    AND table_name = 'club_achievements'
  ) THEN
    ALTER TABLE club_achievements 
    ADD CONSTRAINT club_achievements_facility_achievement_key 
    UNIQUE(facility_id, achievement_definition_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_club_achievements_facility ON club_achievements(facility_id);
CREATE INDEX IF NOT EXISTS idx_club_achievements_enabled ON club_achievements(facility_id, is_enabled);

ALTER TABLE club_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enabled club achievements"
  ON club_achievements
  FOR SELECT
  USING (is_enabled = true);

CREATE POLICY "Facility admins can manage club achievements"
  ON club_achievements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = club_achievements.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = club_achievements.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  );
