// Edge function: notify followers when a Pro goes live.
// Triggered from GoLiveModal.goLive(). Reads social_follows + device_push_tokens
// + push_subscriptions, then fans out APNs + web push.
//
// Idempotent: pro_live_sessions.followers_notified_at is set on success so we
// don't re-notify on accidental re-invocations.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const { session_id, streamer_id, title } = await req.json();
  if (!session_id || !streamer_id) {
    return Response.json({ error: 'missing fields' }, { status: 400 });
  }

  // Idempotency
  const { data: session } = await supabase
    .from('pro_live_sessions')
    .select('id, followers_notified_at, title')
    .eq('id', session_id)
    .single();
  if (session?.followers_notified_at) {
    return Response.json({ ok: true, deduped: true });
  }

  // Streamer name for the notification body
  const { data: pro } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', streamer_id)
    .single();
  const streamerName = pro?.full_name || 'A Pro you follow';

  // Pull all followers
  const { data: follows } = await supabase
    .from('social_follows')
    .select('follower_id')
    .eq('following_id', streamer_id);

  const followerIds = (follows || []).map((f) => f.follower_id);
  if (followerIds.length === 0) {
    await supabase.from('pro_live_sessions')
      .update({ followers_notified_at: new Date().toISOString() })
      .eq('id', session_id);
    return Response.json({ ok: true, count: 0 });
  }

  // Pull push tokens (native iOS) + web push subscriptions
  const [{ data: nativeTokens }, { data: webSubs }] = await Promise.all([
    supabase.from('device_push_tokens').select('token, platform').in('user_id', followerIds),
    supabase.from('push_subscriptions').select('endpoint, p256dh, auth').in('user_id', followerIds),
  ]);

  const payload = {
    title: `${streamerName} is live`,
    body: title || session?.title || 'Tap to join the stream',
    data: { route: `/pro-live/${session_id}` },
  };

  // Fan out web push via the existing web-push-fanout function
  if (webSubs && webSubs.length > 0) {
    try {
      await supabase.functions.invoke('web-push-fanout', {
        body: { subscriptions: webSubs, payload },
      });
    } catch (e) { console.error('[notify-live] web-push-fanout failed', e); }
  }

  // Fan out native push (APNs + FCM) — stub here; wire to your APNs provider
  if (nativeTokens && nativeTokens.length > 0) {
    try {
      const APNS_URL = Deno.env.get('APNS_PROVIDER_URL'); // e.g. your edge fn or 3rd-party provider
      if (APNS_URL) {
        await fetch(APNS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokens: nativeTokens, payload }),
        });
      }
    } catch (e) { console.error('[notify-live] native push failed', e); }
  }

  // Mark notified
  await supabase.from('pro_live_sessions')
    .update({ followers_notified_at: new Date().toISOString() })
    .eq('id', session_id);

  return Response.json({ ok: true, count: followerIds.length });
});
