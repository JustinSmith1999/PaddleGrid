/*
  # Create leagues table

  1. New Tables
    - `leagues`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `season` (text, not null)
      - `format` (text, not null) - singles, doubles, mixed
      - `skill_level` (text, not null) - beginner, intermediate, advanced, all
      - `max_teams` (integer, not null)
      - `current_teams` (integer, default 0)
      - `start_date` (date, not null)
      - `end_date` (date, not null)
      - `price_per_team` (numeric, not null)
      - `status` (text, default 'registration') - registration, active, completed
      - `is_published` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `leagues` table
    - Add policy for anyone to view published leagues
    - Add policy for admins to manage all leagues
*/

CREATE TABLE IF NOT EXISTS leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  season text NOT NULL,
  format text NOT NULL CHECK (format IN ('singles', 'doubles', 'mixed')),
  skill_level text NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all')),
  max_teams integer NOT NULL CHECK (max_teams > 0),
  current_teams integer DEFAULT 0 CHECK (current_teams >= 0),
  start_date date NOT NULL,
  end_date date NOT NULL,
  price_per_team numeric(10,2) NOT NULL CHECK (price_per_team >= 0),
  status text DEFAULT 'registration' CHECK (status IN ('registration', 'active', 'completed')),
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraint to ensure end_date is after start_date
ALTER TABLE leagues ADD CONSTRAINT leagues_date_check CHECK (end_date > start_date);

-- Add constraint to ensure current_teams doesn't exceed max_teams
ALTER TABLE leagues ADD CONSTRAINT leagues_teams_check CHECK (current_teams <= max_teams);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leagues_status ON leagues(status);
CREATE INDEX IF NOT EXISTS idx_leagues_published ON leagues(is_published);
CREATE INDEX IF NOT EXISTS idx_leagues_dates ON leagues(start_date, end_date);

-- Enable RLS
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view published leagues"
  ON leagues
  FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage all leagues"
  ON leagues
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leagues_updated_at
  BEFORE UPDATE ON leagues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data
INSERT INTO leagues (name, season, format, skill_level, max_teams, start_date, end_date, price_per_team, status, is_published) VALUES
('Spring Singles League', 'Spring 2024', 'singles', 'intermediate', 16, '2024-03-01', '2024-05-31', 150.00, 'registration', true),
('Summer Doubles Championship', 'Summer 2024', 'doubles', 'advanced', 12, '2024-06-01', '2024-08-31', 200.00, 'registration', true),
('Fall Mixed League', 'Fall 2024', 'mixed', 'all', 20, '2024-09-01', '2024-11-30', 175.00, 'active', true);