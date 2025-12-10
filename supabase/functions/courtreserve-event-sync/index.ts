import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CourtReserveEventRegistration {
  EventId: number;
  EventName: string;
  EventCategoryId: number;
  EventCategoryName: string;
  EventDateId: number;
  StartTime: string;
  EndTime: string;
  FirstName: string;
  LastName: string;
  Email: string;
  PriceToPay: number;
  Courts: string;
}

function mapCategoryToEventType(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('clinic') || lower.includes('bootcamp') || lower.includes('academy')) return 'clinic';
  if (lower.includes('tournament')) return 'tournament';
  if (lower.includes('league')) return 'league';
  if (lower.includes('open play')) return 'open_play';
  return 'social';
}

function mapCategoryToSlug(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('open play')) return 'open-play';
  if (lower.includes('clinic') || lower.includes('bootcamp') || lower.includes('academy')) return 'clinics';
  if (lower.includes('tournament')) return 'tournaments';
  if (lower.includes('league')) return 'leagues';
  if (lower.includes('private') || lower.includes('seasonal')) return 'private';
  return 'social';
}

async function ensureEventCategories(supabase: any, facilityId: string): Promise<Map<string, string>> {
  const { data: existingCategories } = await supabase
    .from('event_categories')
    .select('id, slug')
    .eq('facility_id', facilityId);

  if (existingCategories && existingCategories.length > 0) {
    return new Map(existingCategories.map((c: any) => [c.slug, c.id]));
  }

  const defaultCategories = [
    { name: 'Open Play', slug: 'open-play', color: '#3B82F6', icon: 'users', display_order: 1 },
    { name: 'Clinics', slug: 'clinics', color: '#8B5CF6', icon: 'award', display_order: 2 },
    { name: 'Tournaments', slug: 'tournaments', color: '#EF4444', icon: 'trophy', display_order: 3 },
    { name: 'Leagues', slug: 'leagues', color: '#F59E0B', icon: 'target', display_order: 4 },
    { name: 'Social Events', slug: 'social', color: '#10B981', icon: 'heart', display_order: 5 },
    { name: 'Private Groups', slug: 'private', color: '#6366F1', icon: 'lock', display_order: 6 },
  ];

  const categoriesToInsert = defaultCategories.map(cat => ({
    ...cat,
    facility_id: facilityId,
    is_active: true,
  }));

  const { data: created } = await supabase
    .from('event_categories')
    .insert(categoriesToInsert)
    .select('id, slug');

  return new Map((created || []).map((c: any) => [c.slug, c.id]));
}

async function syncFacilityEvents(facility: any, supabase: any) {
  const orgId = facility.settings?.courtreserve_org_id;
  const apiKey = facility.settings?.courtreserve_api_key;

  if (!orgId || !apiKey) {
    throw new Error('CourtReserve credentials not configured');
  }

  const authToken = btoa(`${orgId}:${apiKey}`);

  const { data: syncLog, error: logError } = await supabase
    .from('courtreserve_event_sync_logs')
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
    const categoryMap = await ensureEventCategories(supabase, facility.id);

    const today = new Date();
    const fromDate = today.toISOString();
    const toDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString();

    const courtReserveUrl = `https://api.courtreserve.com/api/v1/eventregistrationreport/listactive?eventDateFrom=${encodeURIComponent(fromDate)}&eventDateTo=${encodeURIComponent(toDate)}`;

    console.log('Fetching events from CourtReserve API...');

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

    const registrations: CourtReserveEventRegistration[] = responseData.Data || [];
    console.log(`Fetched ${registrations.length} event registrations from CourtReserve`);

    // Group registrations by EventId and EventDateId
    const eventOccurrenceMap = new Map<string, {
      event: CourtReserveEventRegistration,
      registrationCount: number,
      totalRevenue: number
    }>();

    for (const reg of registrations) {
      const key = `${reg.EventId}-${reg.EventDateId}`;
      if (!eventOccurrenceMap.has(key)) {
        eventOccurrenceMap.set(key, {
          event: reg,
          registrationCount: 0,
          totalRevenue: 0
        });
      }
      const existing = eventOccurrenceMap.get(key)!;
      existing.registrationCount++;
      existing.totalRevenue += reg.PriceToPay || 0;
    }

    console.log(`Grouped into ${eventOccurrenceMap.size} unique event occurrences`);

    let eventsCreated = 0;
    let eventsUpdated = 0;
    let occurrencesCreated = 0;

    // Group by EventId to create/update series
    const eventSeriesMap = new Map<number, CourtReserveEventRegistration>();
    for (const reg of registrations) {
      if (!eventSeriesMap.has(reg.EventId)) {
        eventSeriesMap.set(reg.EventId, reg);
      }
    }

    for (const [eventId, sampleReg] of eventSeriesMap) {
      try {
        const eventType = mapCategoryToEventType(sampleReg.EventCategoryName);
        const categorySlug = mapCategoryToSlug(sampleReg.EventCategoryName);
        const categoryId = categoryMap.get(categorySlug) || null;

        // Check if series exists
        const { data: existingSeries } = await supabase
          .from('event_series')
          .select('id')
          .eq('courtreserve_event_id', eventId.toString())
          .maybeSingle();

        const seriesData = {
          title: sampleReg.EventName,
          description: sampleReg.EventCategoryName,
          event_type: eventType,
          skill_level_min: 0.0,
          skill_level_max: 7.0,
          price_per_session: sampleReg.PriceToPay || 0,
          max_participants_per_session: 8,
          facility_id: facility.id,
          category_id: categoryId,
          courtreserve_event_id: eventId.toString(),
          courtreserve_category: sampleReg.EventCategoryName,
          synced_from_courtreserve: true,
          is_published: true,
          is_archived: false,
        };

        let seriesId: string;

        if (existingSeries) {
          await supabase
            .from('event_series')
            .update(seriesData)
            .eq('id', existingSeries.id);
          seriesId = existingSeries.id;
          eventsUpdated++;
        } else {
          const { data: created } = await supabase
            .from('event_series')
            .insert(seriesData)
            .select('id')
            .single();
          seriesId = created.id;
          eventsCreated++;
        }

        // Create occurrences for this event
        const eventOccurrences = Array.from(eventOccurrenceMap.entries())
          .filter(([key]) => key.startsWith(`${eventId}-`));

        for (const [key, occurrenceData] of eventOccurrences) {
          const reg = occurrenceData.event;
          const startTime = new Date(reg.StartTime);
          const endTime = new Date(reg.EndTime);
          const occurrenceDate = startTime.toISOString().split('T')[0];
          const startTimeStr = startTime.toTimeString().split(' ')[0];
          const endTimeStr = endTime.toTimeString().split(' ')[0];

          // Check if occurrence exists
          const { data: existingOccurrence } = await supabase
            .from('event_series_occurrences')
            .select('id')
            .eq('series_id', seriesId)
            .eq('occurrence_date', occurrenceDate)
            .eq('start_time', startTimeStr)
            .maybeSingle();

          if (!existingOccurrence) {
            await supabase
              .from('event_series_occurrences')
              .insert({
                series_id: seriesId,
                occurrence_date: occurrenceDate,
                start_time: startTimeStr,
                end_time: endTimeStr,
                court_id: null,
                max_participants: 8,
                current_registrants: occurrenceData.registrationCount,
                status: 'scheduled',
              });
            occurrencesCreated++;
          }
        }
      } catch (error) {
        console.error(`Error syncing event ${eventId}:`, error);
      }
    }

    if (logId) {
      await supabase
        .from('courtreserve_event_sync_logs')
        .update({
          status: 'success',
          sync_completed_at: new Date().toISOString(),
          events_created: eventsCreated,
          events_updated: eventsUpdated,
          occurrences_created: occurrencesCreated,
          total_events_fetched: registrations.length,
        })
        .eq('id', logId);
    }

    return {
      facility_id: facility.id,
      facility_name: facility.name,
      success: true,
      stats: {
        total_registrations_fetched: registrations.length,
        unique_events: eventSeriesMap.size,
        events_created: eventsCreated,
        events_updated: eventsUpdated,
        occurrences_created: occurrencesCreated,
      },
    };
  } catch (error) {
    if (logId) {
      await supabase
        .from('courtreserve_event_sync_logs')
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
          const result = await syncFacilityEvents(facility, supabase);
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
          message: `Synced events for ${results.length} facilities`,
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

    const result = await syncFacilityEvents(facility, supabase);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Event sync completed',
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
