-- Live streaming feature.
-- Path A (fake-live MVP): pre-recorded video stored in Supabase Storage, played
-- back as if live, real-time chat + likes + product carousel layered on top.
-- Swap to Mux/Cloudflare Stream later by changing pro_live_sessions.video_url
-- to an HLS manifest URL — the viewer code stays identical.

-- Extend pro_live_sessions with the runtime fields the viewer needs.
ALTER TABLE pro_live_sessions
  ADD COLUMN IF NOT EXISTS is_live boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS viewer_count_peak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS message_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz,
  ADD COLUMN IF NOT EXISTS followers_notified_at timestamptz;

CREATE INDEX IF NOT EXISTS pls_live_idx ON pro_live_sessions(is_live) WHERE is_live = true;
CREATE INDEX IF NOT EXISTS pls_pinned_idx ON pro_live_sessions(is_pinned, pinned_at DESC) WHERE is_pinned = true;

-- =============== live_stream_messages ===============
-- Chat overlay during a stream. Realtime channel pushes new rows to viewers.
CREATE TABLE IF NOT EXISTS live_stream_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES pro_live_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 280),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lsm_session_time_idx ON live_stream_messages(session_id, created_at DESC);

ALTER TABLE live_stream_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lsm_select_all ON live_stream_messages;
CREATE POLICY lsm_select_all ON live_stream_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS lsm_insert_self ON live_stream_messages;
CREATE POLICY lsm_insert_self ON live_stream_messages FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS lsm_delete_owner ON live_stream_messages;
CREATE POLICY lsm_delete_owner ON live_stream_messages FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Mod can delete any message in their stream — extend later via streamer_can_moderate(uid)

-- Bump message_count on insert
CREATE OR REPLACE FUNCTION bump_session_msg_count() RETURNS trigger AS $$
BEGIN
  UPDATE pro_live_sessions SET message_count = message_count + 1 WHERE id = NEW.session_id;
  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_bump_session_msg_count ON live_stream_messages;
CREATE TRIGGER trg_bump_session_msg_count AFTER INSERT ON live_stream_messages
  FOR EACH ROW EXECUTE FUNCTION bump_session_msg_count();

-- =============== live_stream_likes ===============
-- Each heart tap is a row (so we can animate one heart per tap on screen).
-- Aggregate count cached on pro_live_sessions.like_count via trigger.
CREATE TABLE IF NOT EXISTS live_stream_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES pro_live_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lsl_session_time_idx ON live_stream_likes(session_id, created_at DESC);

ALTER TABLE live_stream_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lsl_select_all ON live_stream_likes;
CREATE POLICY lsl_select_all ON live_stream_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS lsl_insert_self ON live_stream_likes;
CREATE POLICY lsl_insert_self ON live_stream_likes FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION bump_session_like_count() RETURNS trigger AS $$
BEGIN
  UPDATE pro_live_sessions SET like_count = like_count + 1 WHERE id = NEW.session_id;
  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_bump_session_like_count ON live_stream_likes;
CREATE TRIGGER trg_bump_session_like_count AFTER INSERT ON live_stream_likes
  FOR EACH ROW EXECUTE FUNCTION bump_session_like_count();

-- =============== live_stream_products ===============
-- Junction table: which pro_products are featured in this stream + display order.
-- The streamer can pin one product to "featured" position during the stream.
CREATE TABLE IF NOT EXISTS live_stream_products (
  session_id uuid NOT NULL REFERENCES pro_live_sessions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES pro_products(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  featured_at timestamptz,
  units_sold integer NOT NULL DEFAULT 0,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, product_id)
);

CREATE INDEX IF NOT EXISTS lsp_session_order_idx ON live_stream_products(session_id, display_order);

ALTER TABLE live_stream_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lsp_select_all ON live_stream_products;
CREATE POLICY lsp_select_all ON live_stream_products FOR SELECT USING (true);

DROP POLICY IF EXISTS lsp_streamer_writes ON live_stream_products;
CREATE POLICY lsp_streamer_writes ON live_stream_products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM pro_live_sessions s
    WHERE s.id = session_id AND s.pro_id = (select auth.uid())
  ));

-- =============== Realtime publication ===============
-- Add the new tables to the realtime publication so Supabase Realtime can
-- broadcast new rows to subscribed clients.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_stream_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE live_stream_likes;
    ALTER PUBLICATION supabase_realtime ADD TABLE pro_live_sessions;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Idempotent: skip if already added or publication missing
  NULL;
END $$;

-- =============== Storage bucket: live-streams ===============
-- Holds pre-recorded MP4s that get played back as fake-live. ~5GB cap per file.
-- When you swap to real live streaming (Mux/Cloudflare), this bucket becomes
-- the archive for replays.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('live-streams', 'live-streams', true, 5368709120,
        ARRAY['video/mp4', 'video/quicktime', 'application/x-mpegURL'])
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (it's the streaming content). Only Pros can upload.
DROP POLICY IF EXISTS "live_streams_public_read" ON storage.objects;
CREATE POLICY "live_streams_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'live-streams');

DROP POLICY IF EXISTS "live_streams_pro_insert" ON storage.objects;
CREATE POLICY "live_streams_pro_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'live-streams'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_pro = true)
  );

DROP POLICY IF EXISTS "live_streams_owner_delete" ON storage.objects;
CREATE POLICY "live_streams_owner_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'live-streams'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );
