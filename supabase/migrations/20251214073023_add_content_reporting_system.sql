/*
  # Content Reporting System for App Store Compliance

  1. New Tables
    - `content_reports`
      - `id` (uuid, primary key)
      - `reporter_id` (uuid, references profiles)
      - `post_id` (uuid, references social_posts)
      - `reason` (text)
      - `description` (text, optional)
      - `status` (text) - pending, reviewed, dismissed, removed
      - `reviewed_by` (uuid, references profiles, nullable)
      - `reviewed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `content_reports` table
    - Users can create reports for any post
    - Users can view their own reports
    - Admins can view and manage all reports

  3. Functions
    - Auto-hide posts with 5+ reports pending review
*/

-- Create content reports table
CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES social_posts(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'removed')),
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(reporter_id, post_id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_content_reports_post_id ON content_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON content_reports(reporter_id);

-- Enable RLS
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can report content (authenticated users)
CREATE POLICY "Authenticated users can report content"
  ON content_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Policy: Users can view their own reports
CREATE POLICY "Users can view their own reports"
  ON content_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Policy: Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON content_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update reports (mark as reviewed, etc.)
CREATE POLICY "Admins can update reports"
  ON content_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add a reported_count column to social_posts for easier querying
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_posts' AND column_name = 'report_count'
  ) THEN
    ALTER TABLE social_posts ADD COLUMN report_count integer DEFAULT 0;
  END IF;
END $$;

-- Function to update report count
CREATE OR REPLACE FUNCTION update_post_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts
    SET report_count = report_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts
    SET report_count = GREATEST(0, report_count - 1)
    WHERE id = OLD.post_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to maintain report count
DROP TRIGGER IF EXISTS trigger_update_post_report_count ON content_reports;
CREATE TRIGGER trigger_update_post_report_count
  AFTER INSERT OR DELETE ON content_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_post_report_count();