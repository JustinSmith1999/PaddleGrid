/*
  # Add Social Posts Media Storage

  1. New Storage
    - `social-posts` bucket for user-uploaded images and videos
  
  2. Security
    - Public bucket (posts are publicly accessible)
    - Authenticated users can upload media
*/

-- Create storage bucket for social post media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'social-posts',
  'social-posts',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload social post media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'social-posts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view social post media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'social-posts');

CREATE POLICY "Users can delete own social post media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'social-posts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );