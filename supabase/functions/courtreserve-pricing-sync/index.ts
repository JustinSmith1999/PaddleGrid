import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CourtReserveResource {
  Id: number;
  Name: string;
  ResourceTypeId: number;
  ResourceTypeName: string;
  IsActive: boolean;
  DefaultRate?: number;
  PeakRate?: number;
  OffPeakRate?: number;
}

interface ReservationType {
  Id: number;
  Name: string;
  ResourceTypeId: number;
  Rate?: number;
  Duration?: number;
}

async function syncFacilityPricing(facility: any, supabase: any) {
  const orgId = facility.settings?.courtreserve_org_id;
  const apiKey = facility.settings?.courtreserve_api_key;

  if (!orgId || !apiKey) {
    throw new Error('CourtReserve credentials not configured');
  }

  const authToken = btoa(`${orgId}:${apiKey}`);

  console.log(`Syncing pricing for facility: ${facility.name}`);

  try {
    const resourcesUrl = 'https://api.courtreserve.com/api/v1/resources/list';

    console.log('Fetching resources from CourtReserve API...');
    const resourcesResponse = await fetch(resourcesUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resourcesResponse.ok) {
      const errorText = await resourcesResponse.text();
      throw new Error(`CourtReserve API error (${resourcesResponse.status}): ${errorText}`);
    }

    const resourcesData = await resourcesResponse.json();

    if (!resourcesData.IsSuccessStatusCode) {
      throw new Error(`CourtReserve API error: ${resourcesData.ErrorMessage || 'Unknown error'}`);
    }

    const resources: CourtReserveResource[] = resourcesData.Data || [];
    console.log(`Fetched ${resources.length} resources from CourtReserve`);

    const reservationTypesUrl = 'https://api.courtreserve.com/api/v1/reservationtypes/list';

    console.log('Fetching reservation types for pricing...');
    const reservationTypesResponse = await fetch(reservationTypesUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    let reservationTypes: ReservationType[] = [];
    if (reservationTypesResponse.ok) {
      const reservationTypesData = await reservationTypesResponse.json();
      if (reservationTypesData.IsSuccessStatusCode) {
        reservationTypes = reservationTypesData.Data || [];
        console.log(`Fetched ${reservationTypes.length} reservation types`);
      }
    }

    const { data: courts } = await supabase
      .from('courts')
      .select('id, name')
      .eq('facility_id', facility.id);

    if (!courts || courts.length === 0) {
      console.log('No courts found in database for this facility');
      return {
        facility_id: facility.id,
        facility_name: facility.name,
        success: true,
        stats: {
          total_resources: resources.length,
          courts_updated: 0,
          courts_skipped: 0,
        },
      };
    }

    const courtNameMap = new Map(courts?.map((c: any) => [c.name.toLowerCase(), c]) || []);

    let courtsUpdated = 0;
    let courtsSkipped = 0;

    for (const resource of resources) {
      if (!resource.IsActive) {
        continue;
      }

      let courtData = courtNameMap.get(resource.Name.toLowerCase());

      if (!courtData) {
        for (const [name, data] of courtNameMap.entries()) {
          if (name.includes(resource.Name.toLowerCase()) ||
              resource.Name.toLowerCase().includes(name)) {
            courtData = data;
            break;
          }
        }
      }

      if (!courtData) {
        console.log(`Court not found in database: ${resource.Name}`);
        courtsSkipped++;
        continue;
      }

      let hourlyRate = resource.DefaultRate || resource.OffPeakRate;

      if (!hourlyRate && reservationTypes.length > 0) {
        const matchingType = reservationTypes.find(
          rt => rt.ResourceTypeId === resource.ResourceTypeId && rt.Rate
        );
        if (matchingType) {
          if (matchingType.Duration && matchingType.Duration > 0) {
            hourlyRate = (matchingType.Rate / matchingType.Duration) * 60;
          } else {
            hourlyRate = matchingType.Rate;
          }
        }
      }

      if (hourlyRate && hourlyRate > 0) {
        const { error: updateError } = await supabase
          .from('courts')
          .update({
            hourly_rate: hourlyRate.toFixed(2),
            updated_at: new Date().toISOString()
          })
          .eq('id', courtData.id);

        if (updateError) {
          console.error(`Error updating court ${courtData.name}:`, updateError);
          courtsSkipped++;
        } else {
          console.log(`Updated ${courtData.name}: $${hourlyRate.toFixed(2)}/hr`);
          courtsUpdated++;
        }
      } else {
        console.log(`No pricing found for ${resource.Name}`);
        courtsSkipped++;
      }
    }

    return {
      facility_id: facility.id,
      facility_name: facility.name,
      success: true,
      stats: {
        total_resources: resources.length,
        courts_updated: courtsUpdated,
        courts_skipped: courtsSkipped,
      },
    };
  } catch (error) {
    console.error('Error syncing pricing:', error);
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
          const result = await syncFacilityPricing(facility, supabase);
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
          message: `Synced pricing for ${results.length} facilities`,
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

    const result = await syncFacilityPricing(facility, supabase);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Court pricing sync completed',
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