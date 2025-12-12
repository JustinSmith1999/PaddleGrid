import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CourtReserveReservation {
  Id: number;
  ReservationTypeId: number;
  ReservationTypeName: string;
  Courts: string;
  StartTime: string;
  EndTime: string;
  Players: Array<{
    FirstName: string;
    LastName: string;
    Email: string;
  }>;
}

async function syncFacility(facility: any, supabase: any) {
  const orgId = facility.settings?.courtreserve_org_id;
  const apiKey = facility.settings?.courtreserve_api_key;

  if (!orgId || !apiKey) {
    throw new Error('CourtReserve credentials not configured');
  }

  const authToken = btoa(`${orgId}:${apiKey}`);

  const { data: syncLog, error: logError } = await supabase
    .from('courtreserve_sync_logs')
    .insert({
      facility_id: facility.id,
      status: 'running',
      sync_started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (logError) {
    console.error('Failed to create sync log:', logError);
  }

  const logId = syncLog?.id;

  try {
    const today = new Date();
    const fromDate = today.toISOString();
    const toDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString();

    const courtReserveUrl = `https://api.courtreserve.com/api/v1/reservationreport/listactive?reservationsFromDate=${encodeURIComponent(fromDate)}&reservationsToDate=${encodeURIComponent(toDate)}`;

    console.log('Fetching reservations from CourtReserve API...');
    console.log('Date range:', fromDate, 'to', toDate);

    const courtReserveResponse = await fetch(courtReserveUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!courtReserveResponse.ok) {
      const errorText = await courtReserveResponse.text();
      throw new Error(`CourtReserve API error (${courtReserveResponse.status}): ${errorText}`);
    }

    const responseData = await courtReserveResponse.json();

    if (!responseData.IsSuccessStatusCode) {
      throw new Error(`CourtReserve API error: ${responseData.ErrorMessage || 'Unknown error'}`);
    }

    const reservations: CourtReserveReservation[] = responseData.Data || [];
    console.log(`Fetched ${reservations.length} reservations from CourtReserve`);

    const { data: courts } = await supabase
      .from('courts')
      .select('id, name')
      .eq('facility_id', facility.id);

    const courtNameMap = new Map(courts?.map((c: any) => [c.name.toLowerCase(), c.id]) || []);

    let blocksCreated = 0;
    let blocksSkipped = 0;

    for (const reservation of reservations) {
      const startTime = new Date(reservation.StartTime);
      const endTime = new Date(reservation.EndTime);

      const bookingDate = startTime.toISOString().split('T')[0];
      const startTimeStr = startTime.toTimeString().split(' ')[0];
      const endTimeStr = endTime.toTimeString().split(' ')[0];

      const courtNames = reservation.Courts.split(',').map(c => c.trim());

      for (const courtName of courtNames) {
        let courtId = courtNameMap.get(courtName.toLowerCase());

        if (!courtId) {
          for (const [name, id] of courtNameMap.entries()) {
            if (name.includes(courtName.toLowerCase()) ||
                courtName.toLowerCase().includes(name)) {
              courtId = id;
              break;
            }
          }
        }

        if (!courtId) {
          console.log(`Court not found: ${courtName}`);
          blocksSkipped++;
          continue;
        }

        const { data: existing } = await supabase
          .from('court_availability_blocks')
          .select('id')
          .eq('court_id', courtId)
          .eq('block_date', bookingDate)
          .eq('start_time', startTimeStr)
          .eq('end_time', endTimeStr)
          .maybeSingle();

        if (existing) {
          blocksSkipped++;
          continue;
        }

        const { error: insertError } = await supabase
          .from('court_availability_blocks')
          .insert({
            court_id: courtId,
            facility_id: facility.id,
            block_date: bookingDate,
            start_time: startTimeStr,
            end_time: endTimeStr,
            block_type: 'reservation',
            notes: reservation.ReservationTypeName || 'Court Reserved',
            player_count: reservation.Players?.length || 0,
          });

        if (insertError) {
          console.error('Error inserting block:', insertError);
          blocksSkipped++;
        } else {
          blocksCreated++;
        }
      }
    }

    if (logId) {
      await supabase
        .from('courtreserve_sync_logs')
        .update({
          status: 'success',
          sync_completed_at: new Date().toISOString(),
          blocks_created: blocksCreated,
          blocks_skipped: blocksSkipped,
          total_reservations: reservations.length,
        })
        .eq('id', logId);
    }

    return {
      facility_id: facility.id,
      facility_name: facility.name,
      success: true,
      stats: {
        total_reservations: reservations.length,
        blocks_created: blocksCreated,
        blocks_skipped: blocksSkipped,
      },
    };
  } catch (error) {
    if (logId) {
      await supabase
        .from('courtreserve_sync_logs')
        .update({
          status: 'error',
          sync_completed_at: new Date().toISOString(),
          error_message: error.message,
        })
        .eq('id', logId);
    }
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const facilityId = url.searchParams.get('facility_id');
    const syncAll = url.searchParams.get('sync_all') === 'true';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (syncAll) {
      const { data: facilities } = await supabase
        .from('facilities')
        .select('id, name, settings')
        .not('settings->courtreserve_api_key', 'is', null);

      const results = [];
      for (const facility of facilities || []) {
        try {
          const result = await syncFacility(facility, supabase);
          results.push(result);
        } catch (error) {
          results.push({
            facility_id: facility.id,
            facility_name: facility.name,
            success: false,
            error: error.message,
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Synced ${results.length} facilities`,
          results,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!facilityId) {
      return new Response(
        JSON.stringify({ error: 'facility_id parameter is required (or use sync_all=true)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('id, name, settings')
      .eq('id', facilityId)
      .maybeSingle();

    if (facilityError || !facility) {
      return new Response(
        JSON.stringify({ error: 'Facility not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await syncFacility(facility, supabase);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Schedule sync completed',
        ...result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});