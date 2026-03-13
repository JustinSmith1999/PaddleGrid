import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: facilities, error: facilitiesError } = await supabase
      .from("podplay_facilities")
      .select("*")
      .eq("sync_enabled", true);

    if (facilitiesError) {
      throw facilitiesError;
    }

    const results = [];

    for (const facility of facilities || []) {
      const now = new Date();
      const lastSync = facility.last_sync_at ? new Date(facility.last_sync_at) : null;
      const intervalMinutes = facility.sync_interval_minutes || 15;

      if (
        !lastSync ||
        now.getTime() - lastSync.getTime() > intervalMinutes * 60 * 1000
      ) {
        console.log(`Syncing facility ${facility.facility_id}...`);

        const syncResult = {
          facilityId: facility.facility_id,
          bookings: { success: false, error: null },
          members: { success: false, error: null },
          events: { success: false, error: null },
        };

        if (facility.sync_bookings) {
          try {
            await syncBookings(supabase, facility);
            syncResult.bookings.success = true;
          } catch (error) {
            syncResult.bookings.error = error.message;
            console.error(`Booking sync failed for ${facility.facility_id}:`, error);
          }
        }

        if (facility.sync_members) {
          try {
            await syncMembers(supabase, facility);
            syncResult.members.success = true;
          } catch (error) {
            syncResult.members.error = error.message;
            console.error(`Member sync failed for ${facility.facility_id}:`, error);
          }
        }

        if (facility.sync_events) {
          try {
            await syncEvents(supabase, facility);
            syncResult.events.success = true;
          } catch (error) {
            syncResult.events.error = error.message;
            console.error(`Event sync failed for ${facility.facility_id}:`, error);
          }
        }

        await supabase
          .from("podplay_facilities")
          .update({ last_sync_at: now.toISOString() })
          .eq("id", facility.id);

        results.push(syncResult);
      } else {
        console.log(`Skipping facility ${facility.facility_id} - synced recently`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sync completed",
        results,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("PodPlay auto-sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function syncBookings(supabase: any, facility: any) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const headers = {
    Authorization: `Bearer ${facility.api_key_encrypted}`,
    "Content-Type": "application/json",
    "X-Facility-ID": facility.podplay_facility_id,
  };

  const params = new URLSearchParams({
    start_date: startDate.toISOString().split("T")[0],
    end_date: endDate.toISOString().split("T")[0],
  });

  const response = await fetch(
    `${facility.api_endpoint}/facilities/${facility.podplay_facility_id}/bookings?${params}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`PodPlay API error: ${response.status}`);
  }

  const data = await response.json();
  const bookings = Array.isArray(data) ? data : data.bookings || [];

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const booking of bookings) {
    try {
      const { data: existingMapping } = await supabase
        .from("podplay_bookings")
        .select("booking_id")
        .eq("podplay_booking_id", booking.id)
        .eq("podplay_facility_id", facility.id)
        .maybeSingle();

      if (existingMapping) {
        await supabase
          .from("bookings")
          .update({
            booking_date: booking.date,
            start_time: booking.startTime.substring(0, 8),
            end_time: booking.endTime.substring(0, 8),
            status: booking.status,
            total_amount: booking.amount || 0,
          })
          .eq("id", existingMapping.booking_id);

        await supabase
          .from("podplay_bookings")
          .update({
            podplay_data: booking,
            last_synced_at: new Date().toISOString(),
          })
          .eq("booking_id", existingMapping.booking_id);

        updated++;
      } else {
        const { data: courts } = await supabase
          .from("courts")
          .select("id")
          .eq("facility_id", facility.facility_id)
          .limit(1)
          .single();

        if (!courts) continue;

        const { data: member } = await supabase
          .from("podplay_members")
          .select("user_id")
          .eq("podplay_member_id", booking.memberId)
          .eq("podplay_facility_id", facility.id)
          .maybeSingle();

        if (!member) continue;

        const startTime = booking.startTime.substring(0, 8);
        const endTime = booking.endTime.substring(0, 8);
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        const { data: newBooking } = await supabase
          .from("bookings")
          .insert({
            court_id: courts.id,
            user_id: member.user_id,
            booking_date: booking.date,
            start_time: startTime,
            end_time: endTime,
            status: booking.status,
            total_amount: booking.amount || 0,
            duration_hours: durationHours,
          })
          .select()
          .single();

        if (newBooking) {
          await supabase.from("podplay_bookings").insert({
            booking_id: newBooking.id,
            podplay_booking_id: booking.id,
            podplay_facility_id: facility.id,
            podplay_data: booking,
          });

          created++;
        }
      }
    } catch (error) {
      failed++;
      console.error(`Failed to sync booking ${booking.id}:`, error);
    }
  }

  await supabase.from("podplay_sync_logs").insert({
    podplay_facility_id: facility.id,
    sync_type: "bookings",
    status: failed > 0 ? "partial" : "success",
    direction: "pull",
    records_processed: bookings.length,
    records_created: created,
    records_updated: updated,
    records_failed: failed,
    completed_at: new Date().toISOString(),
  });

  console.log(
    `Bookings sync completed: ${created} created, ${updated} updated, ${failed} failed`
  );
}

async function syncMembers(supabase: any, facility: any) {
  const headers = {
    Authorization: `Bearer ${facility.api_key_encrypted}`,
    "Content-Type": "application/json",
    "X-Facility-ID": facility.podplay_facility_id,
  };

  const response = await fetch(
    `${facility.api_endpoint}/facilities/${facility.podplay_facility_id}/members`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`PodPlay API error: ${response.status}`);
  }

  const data = await response.json();
  const members = Array.isArray(data) ? data : data.members || [];

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const member of members) {
    try {
      const { data: existingMapping } = await supabase
        .from("podplay_members")
        .select("user_id")
        .eq("podplay_member_id", member.id)
        .eq("podplay_facility_id", facility.id)
        .maybeSingle();

      if (existingMapping) {
        await supabase
          .from("profiles")
          .update({
            first_name: member.firstName,
            last_name: member.lastName,
            phone: member.phone,
          })
          .eq("id", existingMapping.user_id);

        await supabase
          .from("podplay_members")
          .update({
            membership_type: member.membershipType,
            membership_status: member.membershipStatus,
            membership_expires_at: member.membershipExpiresAt,
            podplay_data: member,
            last_synced_at: new Date().toISOString(),
          })
          .eq("user_id", existingMapping.user_id);

        updated++;
      } else if (facility.auto_create_members) {
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", member.email)
          .maybeSingle();

        if (existingUser) {
          await supabase.from("podplay_members").insert({
            user_id: existingUser.id,
            podplay_member_id: member.id,
            podplay_facility_id: facility.id,
            email: member.email,
            membership_type: member.membershipType,
            membership_status: member.membershipStatus,
            membership_expires_at: member.membershipExpiresAt,
            podplay_data: member,
          });

          await supabase
            .from("facility_users")
            .insert({
              facility_id: facility.facility_id,
              user_id: existingUser.id,
              role: "member",
            })
            .onConflict("facility_id,user_id")
            .ignoreDuplicates();

          created++;
        }
      }
    } catch (error) {
      failed++;
      console.error(`Failed to sync member ${member.id}:`, error);
    }
  }

  await supabase.from("podplay_sync_logs").insert({
    podplay_facility_id: facility.id,
    sync_type: "members",
    status: failed > 0 ? "partial" : "success",
    direction: "pull",
    records_processed: members.length,
    records_created: created,
    records_updated: updated,
    records_failed: failed,
    completed_at: new Date().toISOString(),
  });

  console.log(
    `Members sync completed: ${created} created, ${updated} updated, ${failed} failed`
  );
}

async function syncEvents(supabase: any, facility: any) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);

  const headers = {
    Authorization: `Bearer ${facility.api_key_encrypted}`,
    "Content-Type": "application/json",
    "X-Facility-ID": facility.podplay_facility_id,
  };

  const params = new URLSearchParams({
    start_date: startDate.toISOString().split("T")[0],
    end_date: endDate.toISOString().split("T")[0],
  });

  const response = await fetch(
    `${facility.api_endpoint}/facilities/${facility.podplay_facility_id}/events?${params}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`PodPlay API error: ${response.status}`);
  }

  const data = await response.json();
  const events = Array.isArray(data) ? data : data.events || [];

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const event of events) {
    try {
      const { data: existingMapping } = await supabase
        .from("podplay_events")
        .select("event_series_id")
        .eq("podplay_event_id", event.id)
        .eq("podplay_facility_id", facility.id)
        .maybeSingle();

      if (existingMapping) {
        await supabase
          .from("event_series")
          .update({
            name: event.name,
            description: event.description,
            start_date: event.startDate,
            end_date: event.endDate,
            registration_deadline: event.registrationDeadline,
            max_participants: event.maxParticipants,
            price: event.price || 0,
          })
          .eq("id", existingMapping.event_series_id);

        await supabase
          .from("podplay_events")
          .update({
            podplay_data: event,
            last_synced_at: new Date().toISOString(),
          })
          .eq("event_series_id", existingMapping.event_series_id);

        updated++;
      } else {
        const { data: eventSeries } = await supabase
          .from("event_series")
          .insert({
            facility_id: facility.facility_id,
            name: event.name,
            description: event.description,
            start_date: event.startDate,
            end_date: event.endDate,
            registration_deadline: event.registrationDeadline,
            max_participants: event.maxParticipants,
            price: event.price || 0,
            is_active: true,
          })
          .select()
          .single();

        if (eventSeries) {
          await supabase.from("podplay_events").insert({
            event_series_id: eventSeries.id,
            podplay_event_id: event.id,
            podplay_facility_id: facility.id,
            event_type: event.type,
            podplay_data: event,
          });

          created++;
        }
      }
    } catch (error) {
      failed++;
      console.error(`Failed to sync event ${event.id}:`, error);
    }
  }

  await supabase.from("podplay_sync_logs").insert({
    podplay_facility_id: facility.id,
    sync_type: "events",
    status: failed > 0 ? "partial" : "success",
    direction: "pull",
    records_processed: events.length,
    records_created: created,
    records_updated: updated,
    records_failed: failed,
    completed_at: new Date().toISOString(),
  });

  console.log(
    `Events sync completed: ${created} created, ${updated} updated, ${failed} failed`
  );
}
