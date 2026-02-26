import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing sync queue...');

    // Get pending sync requests
    const { data: pendingSyncs, error: fetchError } = await supabase
      .from('sync_queue')
      .select('*, facilities(*)')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingSyncs || pendingSyncs.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No pending syncs',
          processed: 0
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log(`Found ${pendingSyncs.length} pending syncs`);

    const results = [];

    for (const syncRequest of pendingSyncs) {
      try {
        // Mark as started
        await supabase
          .from('sync_queue')
          .update({
            status: 'processing',
            started_at: new Date().toISOString(),
          })
          .eq('id', syncRequest.id);

        // Call the actual sync function
        const syncUrl = `${supabaseUrl}/functions/v1/courtreserve-sync?facility_id=${syncRequest.facility_id}`;

        console.log(`Calling sync for facility ${syncRequest.facilities.name}...`);

        const syncResponse = await fetch(syncUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });

        const syncResult = await syncResponse.json();

        if (syncResponse.ok) {
          // Mark as completed
          await supabase
            .from('sync_queue')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', syncRequest.id);

          results.push({
            facility_id: syncRequest.facility_id,
            facility_name: syncRequest.facilities.name,
            status: 'success',
            result: syncResult,
          });

          console.log(`✓ Sync completed for ${syncRequest.facilities.name}`);
        } else {
          throw new Error(syncResult.error || 'Sync failed');
        }
      } catch (error) {
        console.error(`✗ Sync failed for facility ${syncRequest.facility_id}:`, error);

        // Mark as failed
        await supabase
          .from('sync_queue')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error.message,
          })
          .eq('id', syncRequest.id);

        results.push({
          facility_id: syncRequest.facility_id,
          facility_name: syncRequest.facilities?.name || 'Unknown',
          status: 'failed',
          error: error.message,
        });
      }
    }

    // Clean up old completed/failed syncs (older than 24 hours)
    await supabase
      .from('sync_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return new Response(
      JSON.stringify({
        message: 'Sync processing completed',
        processed: results.length,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing sync queue:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
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
