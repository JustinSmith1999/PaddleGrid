/**
 * Browser web-push helpers — register the SW push handler, ask permission,
 * subscribe, and persist the subscription on the user's profile so server-side
 * jobs can fan-out push notifications.
 *
 * iOS native push needs a Capacitor + APNs setup with an Apple developer
 * account — that's deferred. This file gives every browser (Chrome/Safari 16+
 * desktop, Android Chrome) push without needing the App Store loop.
 */
import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function pushPermission(): Promise<NotificationPermission> {
  if (!pushSupported()) return 'denied';
  return Notification.permission;
}

export async function pushSubscribe(): Promise<boolean> {
  if (!pushSupported()) return false;
  if (!VAPID_PUBLIC_KEY) {
    console.warn('[push] VITE_VAPID_PUBLIC_KEY not set — push disabled');
    return false;
  }
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const json = sub.toJSON();
  // Idempotent upsert keyed on endpoint
  await supabase.from('push_subscriptions').upsert({
    user_id:     user.id,
    endpoint:    json.endpoint!,
    p256dh:      json.keys?.p256dh || '',
    auth:        json.keys?.auth || '',
    user_agent:  navigator.userAgent,
  }, { onConflict: 'endpoint' });
  return true;
}

export async function pushUnsubscribe(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    const { endpoint } = sub.toJSON();
    await sub.unsubscribe();
    if (endpoint) await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
