import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { createRequestLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ExpiringBooking {
  booking_id: string;
  user_id: string;
  user_email: string;
  court_id: string;
  court_name: string;
  facility_id: string;
  end_time: string;
  can_extend: boolean;
  alternative_court_id: string | null;
  alternative_court_name: string | null;
}

Deno.serve(async (req: Request) => {
  const log = createRequestLogger('booking-expiry-check', req);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { minutesBefore = 5 } = await req.json().catch(() => ({ minutesBefore: 5 }));

    // Get expiring bookings
    const { data: expiringBookings, error: bookingsError } = await supabase
      .rpc('get_expiring_bookings', { p_minutes_before: minutesBefore });

    if (bookingsError) {
      log.error('Error fetching expiring bookings', { error: bookingsError });
      throw bookingsError;
    }

    const notifications: any[] = [];
    const pushNotifications: any[] = [];

    for (const booking of expiringBookings as ExpiringBooking[]) {
      // Get user's push tokens
      const { data: tokens } = await supabase
        .from('push_notification_tokens')
        .select('token, device_type')
        .eq('user_id', booking.user_id);

      // Prepare notification message
      const message = {
        title: 'Court Time Ending Soon',
        body: `Your booking at ${booking.court_name} ends in ${minutesBefore} minutes`,
        data: {
          booking_id: booking.booking_id,
          court_id: booking.court_id,
          can_extend: booking.can_extend,
          alternative_court_id: booking.alternative_court_id,
          alternative_court_name: booking.alternative_court_name,
          type: 'booking_expiring'
        }
      };

      // Store notification record
      const { data: notificationRecord, error: notifError } = await supabase
        .from('booking_notifications')
        .insert({
          booking_id: booking.booking_id,
          user_id: booking.user_id,
          notification_type: 'expiring_soon',
          status: 'pending',
          metadata: message
        })
        .select()
        .single();

      if (notifError) {
        log.error('Error creating notification record', { error: notifError, booking_id: booking.booking_id });
        continue;
      }

      notifications.push(notificationRecord);

      // In a real implementation, you would send push notifications here
      // For iOS: Use APNs (Apple Push Notification service)
      // For Android: Use FCM (Firebase Cloud Messaging)
      // For Web: Use Web Push API
      
      if (tokens && tokens.length > 0) {
        for (const token of tokens) {
          pushNotifications.push({
            token: token.token,
            device_type: token.device_type,
            message: message
          });
        }

        // Update notification status to sent
        await supabase
          .from('booking_notifications')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', notificationRecord.id);
      }
    }

    log.info('Booking expiry check completed', {
      expiring_bookings: expiringBookings.length,
      notifications_created: notifications.length,
      push_notifications_queued: pushNotifications.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        checked_at: new Date().toISOString(),
        expiring_bookings: expiringBookings.length,
        notifications_created: notifications.length,
        push_notifications_queued: pushNotifications.length,
        details: expiringBookings.map((b: ExpiringBooking) => ({
          booking_id: b.booking_id,
          court_name: b.court_name,
          end_time: b.end_time,
          can_extend: b.can_extend,
          has_alternative: !!b.alternative_court_id
        }))
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    log.error('Error in booking-expiry-check', { error });
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});