import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PodPlayWebhookPayload {
  event: string;
  facilityId: string;
  data: any;
  timestamp: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const signature = req.headers.get("X-PodPlay-Signature");
    const payload = await req.text();
    const webhookData: PodPlayWebhookPayload = JSON.parse(payload);

    const { data: facilityConfig } = await supabase
      .from("podplay_facilities")
      .select("*")
      .eq("podplay_facility_id", webhookData.facilityId)
      .single();

    if (!facilityConfig) {
      return new Response(
        JSON.stringify({ error: "Facility not configured" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("podplay_webhooks").insert({
      podplay_facility_id: facilityConfig.id,
      webhook_type: webhookData.event,
      payload: webhookData,
      signature,
      processed: false,
    });

    switch (webhookData.event) {
      case "booking.created":
      case "booking.updated":
        await handleBookingWebhook(supabase, facilityConfig, webhookData.data);
        break;

      case "booking.cancelled":
        await handleBookingCancellation(supabase, webhookData.data.id);
        break;

      case "member.created":
      case "member.updated":
        await handleMemberWebhook(supabase, facilityConfig, webhookData.data);
        break;

      case "event.created":
      case "event.updated":
        await handleEventWebhook(supabase, facilityConfig, webhookData.data);
        break;

      default:
        console.log(`Unhandled webhook event: ${webhookData.event}`);
    }

    return new Response(
      JSON.stringify({ success: true, event: webhookData.event }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("PodPlay webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleBookingWebhook(supabase: any, facilityConfig: any, bookingData: any) {
  const { data: existingMapping } = await supabase
    .from("podplay_bookings")
    .select("booking_id")
    .eq("podplay_booking_id", bookingData.id)
    .eq("podplay_facility_id", facilityConfig.id)
    .maybeSingle();

  if (existingMapping) {
    await supabase
      .from("bookings")
      .update({
        booking_date: bookingData.date,
        start_time: bookingData.startTime,
        end_time: bookingData.endTime,
        status: bookingData.status,
        total_amount: bookingData.amount || 0,
      })
      .eq("id", existingMapping.booking_id);

    await supabase
      .from("podplay_bookings")
      .update({
        podplay_data: bookingData,
        last_synced_at: new Date().toISOString(),
      })
      .eq("booking_id", existingMapping.booking_id);
  } else {
    const { data: courts } = await supabase
      .from("courts")
      .select("id")
      .eq("facility_id", facilityConfig.facility_id)
      .limit(1)
      .single();

    if (!courts) return;

    const { data: member } = await supabase
      .from("podplay_members")
      .select("user_id")
      .eq("podplay_member_id", bookingData.memberId)
      .eq("podplay_facility_id", facilityConfig.id)
      .maybeSingle();

    if (!member) return;

    const startTime = bookingData.startTime.substring(0, 8);
    const endTime = bookingData.endTime.substring(0, 8);
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    const { data: booking } = await supabase
      .from("bookings")
      .insert({
        court_id: courts.id,
        user_id: member.user_id,
        booking_date: bookingData.date,
        start_time: startTime,
        end_time: endTime,
        status: bookingData.status,
        total_amount: bookingData.amount || 0,
        duration_hours: durationHours,
      })
      .select()
      .single();

    if (booking) {
      await supabase.from("podplay_bookings").insert({
        booking_id: booking.id,
        podplay_booking_id: bookingData.id,
        podplay_facility_id: facilityConfig.id,
        podplay_data: bookingData,
      });
    }
  }
}

async function handleBookingCancellation(supabase: any, podplayBookingId: string) {
  const { data: mapping } = await supabase
    .from("podplay_bookings")
    .select("booking_id")
    .eq("podplay_booking_id", podplayBookingId)
    .maybeSingle();

  if (mapping) {
    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", mapping.booking_id);
  }
}

async function handleMemberWebhook(supabase: any, facilityConfig: any, memberData: any) {
  const { data: existingMapping } = await supabase
    .from("podplay_members")
    .select("user_id")
    .eq("podplay_member_id", memberData.id)
    .eq("podplay_facility_id", facilityConfig.id)
    .maybeSingle();

  if (existingMapping) {
    await supabase
      .from("profiles")
      .update({
        first_name: memberData.firstName,
        last_name: memberData.lastName,
        phone: memberData.phone,
      })
      .eq("id", existingMapping.user_id);

    await supabase
      .from("podplay_members")
      .update({
        membership_type: memberData.membershipType,
        membership_status: memberData.membershipStatus,
        membership_expires_at: memberData.membershipExpiresAt,
        podplay_data: memberData,
        last_synced_at: new Date().toISOString(),
      })
      .eq("user_id", existingMapping.user_id);
  } else if (facilityConfig.auto_create_members) {
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", memberData.email)
      .maybeSingle();

    if (existingUser) {
      await supabase.from("podplay_members").insert({
        user_id: existingUser.id,
        podplay_member_id: memberData.id,
        podplay_facility_id: facilityConfig.id,
        email: memberData.email,
        membership_type: memberData.membershipType,
        membership_status: memberData.membershipStatus,
        membership_expires_at: memberData.membershipExpiresAt,
        podplay_data: memberData,
      });

      await supabase
        .from("facility_users")
        .insert({
          facility_id: facilityConfig.facility_id,
          user_id: existingUser.id,
          role: "member",
        })
        .onConflict("facility_id,user_id")
        .ignoreDuplicates();
    } else {
      await supabase.from("pre_registered_users").insert({
        email: memberData.email,
        first_name: memberData.firstName,
        last_name: memberData.lastName,
        phone: memberData.phone,
        facility_id: facilityConfig.facility_id,
        source: "podplay_webhook",
      });
    }
  }
}

async function handleEventWebhook(supabase: any, facilityConfig: any, eventData: any) {
  const { data: existingMapping } = await supabase
    .from("podplay_events")
    .select("event_series_id")
    .eq("podplay_event_id", eventData.id)
    .eq("podplay_facility_id", facilityConfig.id)
    .maybeSingle();

  if (existingMapping) {
    await supabase
      .from("event_series")
      .update({
        name: eventData.name,
        description: eventData.description,
        start_date: eventData.startDate,
        end_date: eventData.endDate,
        registration_deadline: eventData.registrationDeadline,
        max_participants: eventData.maxParticipants,
        price: eventData.price || 0,
      })
      .eq("id", existingMapping.event_series_id);

    await supabase
      .from("podplay_events")
      .update({
        podplay_data: eventData,
        last_synced_at: new Date().toISOString(),
      })
      .eq("event_series_id", existingMapping.event_series_id);
  } else {
    const { data: eventSeries } = await supabase
      .from("event_series")
      .insert({
        facility_id: facilityConfig.facility_id,
        name: eventData.name,
        description: eventData.description,
        start_date: eventData.startDate,
        end_date: eventData.endDate,
        registration_deadline: eventData.registrationDeadline,
        max_participants: eventData.maxParticipants,
        price: eventData.price || 0,
        is_active: true,
      })
      .select()
      .single();

    if (eventSeries) {
      await supabase.from("podplay_events").insert({
        event_series_id: eventSeries.id,
        podplay_event_id: eventData.id,
        podplay_facility_id: facilityConfig.id,
        event_type: eventData.type,
        podplay_data: eventData,
      });
    }
  }
}
