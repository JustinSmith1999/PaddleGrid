import { supabase } from './supabase';

export interface PushNotificationToken {
  token: string;
  device_type: 'ios' | 'android' | 'web';
}

export const registerPushToken = async (token: string, deviceType: 'ios' | 'android' | 'web') => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('push_notification_tokens')
      .upsert({
        user_id: session.session.user.id,
        token: token,
        device_type: deviceType,
        last_used_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error registering push token:', error);
    throw error;
  }
};

export const unregisterPushToken = async (token: string) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      throw new Error('Not authenticated');
    }

    const { error } = await supabase
      .from('push_notification_tokens')
      .delete()
      .eq('user_id', session.session.user.id)
      .eq('token', token);

    if (error) throw error;
  } catch (error) {
    console.error('Error unregistering push token:', error);
    throw error;
  }
};

export const getUserPushTokens = async () => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('push_notification_tokens')
      .select('*')
      .eq('user_id', session.session.user.id);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting push tokens:', error);
    throw error;
  }
};

export const requestWebPushPermission = async (): Promise<string | null> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    console.log('This browser does not support service workers');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      )
    });

    return JSON.stringify(subscription);
  } catch (error) {
    console.error('Error requesting web push permission:', error);
    return null;
  }
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const simulateExpiringBooking = async (bookingId: string) => {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/booking-expiry-check`;
    const { data: session } = await supabase.auth.getSession();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ minutesBefore: 5 })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error simulating expiring booking:', error);
    throw error;
  }
};
