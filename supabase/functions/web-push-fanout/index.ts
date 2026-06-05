/**
 * Edge function — supabase/functions/web-push-fanout/index.ts
 *
 * POST { audience, facility_id?, group_id?, title, body, link_url? }
 *   → { recipients, delivered }
 *
 * audience: 'facility_followers' | 'facility_members' | 'group:<id>' | 'user:<id>' | 'all'
 *
 * Requires secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST')    return new Response('Method not allowed', { status: 405, headers: cors });

  try {
    const body = await req.json();
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    webpush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT') || 'mailto:support@paddlegrid.com',
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!,
    );

    // Resolve audience → user_ids
    let userIds: string[] = [];
    if (body.audience === 'facility_followers' && body.facility_id) {
      const { data } = await sb.from('favorite_facilities').select('user_id').eq('facility_id', body.facility_id);
      userIds = (data || []).map((r: any) => r.user_id);
    } else if (body.audience === 'facility_members' && body.facility_id) {
      const { data } = await sb.from('facility_members').select('user_id').eq('facility_id', body.facility_id).eq('status', 'active');
      userIds = (data || []).map((r: any) => r.user_id);
    } else if (body.audience?.startsWith('group:')) {
      const groupId = body.audience.split(':')[1];
      const { data } = await sb.from('group_members').select('user_id').eq('group_id', groupId);
      userIds = (data || []).map((r: any) => r.user_id);
    } else if (body.audience?.startsWith('user:')) {
      userIds = [body.audience.split(':')[1]];
    } else if (body.audience === 'all') {
      const { data } = await sb.from('push_subscriptions').select('user_id');
      userIds = Array.from(new Set((data || []).map((r: any) => r.user_id)));
    }

    if (userIds.length === 0) return json({ recipients: 0, delivered: 0 });

    const { data: subs } = await sb.from('push_subscriptions').select('id, endpoint, p256dh, auth, user_id').in('user_id', userIds);
    const subscriptions = (subs || []) as any[];

    const payload = JSON.stringify({
      title: body.title,
      body:  body.body,
      url:   body.link_url || '/',
      tag:   'pg-' + Date.now(),
      icon:  '/favicon-192.png',
    });

    let delivered = 0;
    const expiredIds: string[] = [];
    await Promise.all(subscriptions.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        delivered++;
      } catch (e: any) {
        // 404 / 410 = subscription expired or invalid
        if (e?.statusCode === 404 || e?.statusCode === 410) expiredIds.push(s.id);
      }
    }));
    if (expiredIds.length) await sb.from('push_subscriptions').delete().in('id', expiredIds);

    // Log the blast
    await sb.from('push_blast_log').insert({
      sender_user_id: null,
      facility_id:    body.facility_id || null,
      audience:       body.audience,
      title:          body.title,
      body:           body.body,
      link_url:       body.link_url || null,
      recipients:     userIds.length,
      delivered,
    });

    return json({ recipients: userIds.length, delivered });
  } catch (e: any) {
    return json({ error: e.message || 'Server error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
