import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─────────────────────────────────────────────────────────
// CourtReserve ↔ PaddleGrid Bi-Directional Sync
//
// Handles:
// 1. CR → PG: Pull reservations, events, members, transactions
// 2. PG → CR: Push new PaddleGrid bookings to CourtReserve
// 3. Conflict resolution: CR is source-of-truth for now
// 4. Member sync: Keep pre_registered_users in sync
// ─────────────────────────────────────────────────────────

interface FacilityConfig {
  id: string;
  name: string;
  settings: {
    courtreserve_org_id?: string;
    courtreserve_api_key?: string;
    courtreserve_username?: string;
    courtreserve_password?: string;
    courtreserve_api_url?: string;
  };
}

interface SyncResult {
  direction: 'cr_to_pg' | 'pg_to_cr';
  type: string;
  synced: number;
  skipped: number;
  errors: number;
  details?: string;
}

function getAuthHeader(config: FacilityConfig): string {
  const orgId = config.settings.courtreserve_username || config.settings.courtreserve_org_id || '';
  const apiKey = config.settings.courtreserve_api_key || config.settings.courtreserve_password || '';
  return `Basic ${btoa(`${orgId}:${apiKey}`)}`;
}

function getApiUrl(): string {
  return 'https://api.courtreserve.com/api/v1';
}

async function crApiFetch(endpoint: string, config: FacilityConfig, params: Record<string, string> = {}) {
  const url = new URL(`${getApiUrl()}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(config),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`CourtReserve API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.IsSuccessStatusCode === false) {
    throw new Error(`CourtReserve: ${data.ErrorMessage || 'Unknown error'}`);
  }

  return data.Data || [];
}

// ═══════════════════════════════════════════════════════════
// CR → PG: Pull Reservations as Availability Blocks
// ═══════════════════════════════════════════════════════════
async function syncReservationsToPG(
  supabase: any,
  config: FacilityConfig,
  courtMap: Map<string, string>,
  daysBack: number = 1,
  daysForward: number = 14
): Promise<SyncResult> {
  const result: SyncResult = { direction: 'cr_to_pg', type: 'reservations', synced: 0, skipped: 0, errors: 0 };

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysBack);
  const toDate = new Date();
  toDate.setDate(toDate.getDate() + Math.min(daysForward, 6)); // CR limits to 7 days

  try {
    const reservations = await crApiFetch('reservationreport/listactive', config, {
      reservationsFromDate: fromDate.toISOString().split('T')[0],
      reservationsToDate: toDate.toISOString().split('T')[0],
    });

    console.log(`  Fetched ${reservations.length} reservations from CourtReserve`);

    const blocks: any[] = [];
    const seenIds = new Set<string>();

    for (const res of reservations) {
      const crId = String(res.Id);
      if (seenIds.has(crId)) continue;
      seenIds.add(crId);

      const startTime = res.StartTime;
      const endTime = res.EndTime;
      if (!startTime || !endTime) { result.skipped++; continue; }

      const startDt = new Date(startTime);
      const players = res.Players || [];
      const playerName = players.length > 0
        ? `${players[0].FirstName || ''} ${players[0].LastName || ''}`.trim()
        : '';
      const resType = res.ReservationTypeName || '';

      const courtNames = (res.Courts || '').split(',').map((c: string) => c.trim()).filter(Boolean);

      for (const cn of courtNames) {
        const courtId = findCourtId(cn, courtMap);
        if (!courtId) { result.skipped++; continue; }

        blocks.push({
          facility_id: config.id,
          court_id: courtId,
          block_date: startDt.toISOString().split('T')[0],
          start_time: startDt.toTimeString().split(' ')[0],
          end_time: new Date(endTime).toTimeString().split(' ')[0],
          block_type: 'reservation',
          notes: `[CR#${crId}] ${resType} - ${playerName}`,
          player_count: players.length,
        });
      }

      // Also try to create a booking if we can find the user
      for (const player of players) {
        if (!player.Email) continue;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', player.Email.toLowerCase())
          .maybeSingle();

        if (profile) {
          const duration = (new Date(endTime).getTime() - startDt.getTime()) / (1000 * 60 * 60);
          const courtId = courtNames.length > 0 ? findCourtId(courtNames[0], courtMap) : null;
          if (!courtId) continue;

          const { error } = await supabase
            .from('bookings')
            .upsert({
              facility_id: config.id,
              court_id: courtId,
              user_id: profile.id,
              booking_date: startDt.toISOString().split('T')[0],
              start_time: startDt.toTimeString().split(' ')[0],
              end_time: new Date(endTime).toTimeString().split(' ')[0],
              duration_hours: Math.round(duration * 100) / 100,
              total_amount: player.PriceToPay || 0,
              status: 'confirmed',
              payment_status: (player.PaidAmount && player.PaidAmount > 0) ? 'paid' : 'pending',
              courtreserve_booking_id: crId,
              notes: `[CourtReserve] ${resType}`,
            }, { onConflict: 'courtreserve_booking_id' });

          if (!error) result.synced++;
        }
      }
    }

    // Bulk insert availability blocks
    if (blocks.length > 0) {
      for (let i = 0; i < blocks.length; i += 50) {
        const chunk = blocks.slice(i, i + 50);
        const { error } = await supabase
          .from('court_availability_blocks')
          .upsert(chunk, { ignoreDuplicates: true });

        if (!error) {
          result.synced += chunk.length;
        } else {
          result.errors += chunk.length;
        }
      }
    }
  } catch (error) {
    console.error('  Reservation sync error:', error);
    result.errors++;
    result.details = error.message;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════
// CR → PG: Pull Events
// ═══════════════════════════════════════════════════════════
async function syncEventsToPG(
  supabase: any,
  config: FacilityConfig,
  courtMap: Map<string, string>
): Promise<SyncResult> {
  const result: SyncResult = { direction: 'cr_to_pg', type: 'events', synced: 0, skipped: 0, errors: 0 };

  const fromDate = new Date();
  const toDate = new Date();
  toDate.setDate(toDate.getDate() + 7);

  try {
    const registrations = await crApiFetch('eventregistrationreport/listactive', config, {
      eventDateFrom: fromDate.toISOString().split('T')[0],
      eventDateTo: toDate.toISOString().split('T')[0],
    });

    console.log(`  Fetched ${registrations.length} event registrations from CourtReserve`);

    // Group by event
    const eventGroups = new Map<number, any>();
    for (const reg of registrations) {
      const eid = reg.EventId;
      if (!eventGroups.has(eid)) {
        eventGroups.set(eid, {
          name: reg.EventName,
          category: reg.EventCategoryName || '',
          registrants: 0,
          price: reg.PriceToPay || 0,
        });
      }
      eventGroups.get(eid)!.registrants++;
    }

    for (const [eid, edata] of eventGroups) {
      const eventType = mapEventCategory(edata.category);

      const { error } = await supabase
        .from('event_series')
        .upsert({
          facility_id: config.id,
          title: edata.name,
          description: `Category: ${edata.category}. ${edata.registrants} registrants.`,
          event_type: eventType,
          courtreserve_event_id: String(eid),
          synced_from_courtreserve: true,
          max_participants: Math.max(edata.registrants + 4, 8),
          price_per_session: Math.round(edata.price * 100) / 100,
        }, { onConflict: 'courtreserve_event_id,facility_id' });

      if (!error) result.synced++;
      else result.skipped++;
    }
  } catch (error) {
    console.error('  Event sync error:', error);
    result.errors++;
    result.details = error.message;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════
// CR → PG: Pull Transactions
// ═══════════════════════════════════════════════════════════
async function syncTransactionsToPG(
  supabase: any,
  config: FacilityConfig
): Promise<SyncResult> {
  const result: SyncResult = { direction: 'cr_to_pg', type: 'transactions', synced: 0, skipped: 0, errors: 0 };

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  const toDate = new Date();

  try {
    const transactions = await crApiFetch('transactions/list', config, {
      transactionStartDate: fromDate.toISOString().split('T')[0],
      transactionEndDate: toDate.toISOString().split('T')[0],
    });

    console.log(`  Fetched ${transactions.length} transactions from CourtReserve`);

    const records = transactions.map((t: any) => {
      const total = Math.abs(parseFloat(t.Total || '0'));
      const unpaid = parseFloat(t.UnpaidAmount || '0');
      const paymentStatus = unpaid === 0 && total !== 0 ? 'paid' : (unpaid > 0 && unpaid < total ? 'partial' : 'unpaid');

      return {
        facility_id: config.id,
        courtreserve_transaction_id: String(t.TransactionId),
        transaction_date: t.TransactionDate,
        transaction_type: t.TransactionType || 'Unknown',
        amount: total,
        payment_type: t.PaymentType || '',
        payment_status: paymentStatus,
        customer_name: `${t.OrganizationFirstName || ''} ${t.OrganizationLastName || ''}`.trim(),
        customer_email: t.OrganizationMemberEmail || '',
        customer_id: t.OrganizationMemberId ? String(t.OrganizationMemberId) : '',
        reservation_id: '',
        event_name: '',
        instructor_name: t.Instructors || '',
        revenue_category: t.Category || '',
        raw_data: t,
      };
    });

    // Upsert in batches
    for (let i = 0; i < records.length; i += 100) {
      const chunk = records.slice(i, i + 100);
      const { error } = await supabase
        .from('courtreserve_transactions')
        .upsert(chunk, { onConflict: 'facility_id,courtreserve_transaction_id' });

      if (!error) {
        result.synced += chunk.length;
      } else {
        result.errors += chunk.length;
        console.error('  Transaction upsert error:', error.message);
      }
    }
  } catch (error) {
    console.error('  Transaction sync error:', error);
    result.errors++;
    result.details = error.message;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════
// CR → PG: Sync Members
// ═══════════════════════════════════════════════════════════
async function syncMembersToPG(
  supabase: any,
  config: FacilityConfig
): Promise<SyncResult> {
  const result: SyncResult = { direction: 'cr_to_pg', type: 'members', synced: 0, skipped: 0, errors: 0 };

  // Get unique members from recent reservations
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 1);
  const toDate = new Date();
  toDate.setDate(toDate.getDate() + 6);

  try {
    const reservations = await crApiFetch('reservationreport/listactive', config, {
      reservationsFromDate: fromDate.toISOString().split('T')[0],
      reservationsToDate: toDate.toISOString().split('T')[0],
    });

    const members = new Map<string, any>();
    for (const res of reservations) {
      for (const p of (res.Players || [])) {
        const email = (p.Email || '').toLowerCase().trim();
        if (email && !email.includes('noemail') && !members.has(email)) {
          members.set(email, {
            first_name: p.FirstName || 'Unknown',
            last_name: p.LastName || 'Unknown',
            email,
            phone: p.Phone || '',
            facility_id: config.id,
            membership_type: 'Member',
            membership_status: 'Active',
            courtreserve_member_id: p.OrganizationMemberId,
            claimed: false,
          });
        }
      }
    }

    console.log(`  Found ${members.size} unique members in recent reservations`);

    const batch = Array.from(members.values());
    for (let i = 0; i < batch.length; i += 50) {
      const chunk = batch.slice(i, i + 50);
      const { error } = await supabase
        .from('pre_registered_users')
        .upsert(chunk, { onConflict: 'email,facility_id', ignoreDuplicates: true });

      if (!error) {
        result.synced += chunk.length;
      } else {
        result.skipped += chunk.length;
      }
    }
  } catch (error) {
    console.error('  Member sync error:', error);
    result.errors++;
    result.details = error.message;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════
// PG → CR: Push new PaddleGrid bookings to CourtReserve
// ═══════════════════════════════════════════════════════════
async function syncBookingsToCR(
  supabase: any,
  config: FacilityConfig,
  courtMap: Map<string, string>
): Promise<SyncResult> {
  const result: SyncResult = { direction: 'pg_to_cr', type: 'bookings', synced: 0, skipped: 0, errors: 0 };

  // Find PaddleGrid bookings that haven't been synced to CourtReserve
  const { data: unsyncedBookings, error } = await supabase
    .from('bookings')
    .select('*, profiles!bookings_user_id_fkey(email, full_name, phone), courts!bookings_court_id_fkey(name)')
    .eq('facility_id', config.id)
    .is('courtreserve_booking_id', null)
    .eq('status', 'confirmed')
    .gte('booking_date', new Date().toISOString().split('T')[0]);

  if (error) {
    console.error('  Error fetching unsynced bookings:', error);
    result.errors++;
    return result;
  }

  if (!unsyncedBookings || unsyncedBookings.length === 0) {
    console.log('  No unsynced bookings to push to CourtReserve');
    return result;
  }

  console.log(`  Found ${unsyncedBookings.length} unsynced bookings to push to CourtReserve`);

  const apiUrl = config.settings.courtreserve_api_url || 'https://app.courtreserve.com';
  const username = config.settings.courtreserve_username || '';
  const password = config.settings.courtreserve_password || '';

  // Authenticate with CourtReserve session API
  let authToken: string | null = null;
  try {
    const loginResp = await fetch(`${apiUrl}/Online/API/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (loginResp.ok) {
      const loginData = await loginResp.json();
      authToken = loginData.token || loginData.access_token || loginData.session_id;
    }
  } catch (e) {
    console.error('  CourtReserve login failed:', e);
  }

  if (!authToken) {
    console.log('  Cannot authenticate with CourtReserve for push sync - skipping PG→CR');
    result.skipped = unsyncedBookings.length;
    result.details = 'CourtReserve authentication failed for push sync';
    return result;
  }

  for (const booking of unsyncedBookings) {
    try {
      const courtName = booking.courts?.name || '';
      const profile = booking.profiles || {};

      const crPayload = {
        CourtID: courtName,
        StartTime: `${booking.booking_date}T${booking.start_time}`,
        EndTime: `${booking.booking_date}T${booking.end_time}`,
        CustomerName: profile.full_name || '',
        CustomerEmail: profile.email || '',
        CustomerPhone: profile.phone || '',
        Amount: booking.total_amount || 0,
        Notes: `Booked via PaddleGrid - ${booking.notes || ''}`,
      };

      const crResp = await fetch(`${apiUrl}/Online/API/Reservations/Create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(crPayload),
      });

      if (crResp.ok) {
        const crResult = await crResp.json();
        const crBookingId = crResult.BookingID || crResult.ReservationID || crResult.Id;

        if (crBookingId) {
          await supabase
            .from('bookings')
            .update({ courtreserve_booking_id: String(crBookingId) })
            .eq('id', booking.id);

          result.synced++;
        } else {
          result.skipped++;
        }
      } else {
        result.errors++;
      }
    } catch (e) {
      console.error(`  Error pushing booking ${booking.id}:`, e);
      result.errors++;
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function findCourtId(courtName: string, courtMap: Map<string, string>): string | null {
  const cn = courtName.trim();
  if (courtMap.has(cn)) return courtMap.get(cn)!;

  // Fuzzy match
  for (const [key, id] of courtMap) {
    if (key.toLowerCase().includes(cn.toLowerCase()) || cn.toLowerCase().includes(key.toLowerCase())) {
      return id;
    }
  }
  return null;
}

function mapEventCategory(category: string): string {
  const cl = category.toLowerCase();
  if (['clinic', 'bootcamp', 'academy', 'drill'].some(k => cl.includes(k))) return 'clinic';
  if (cl.includes('tournament')) return 'tournament';
  if (cl.includes('league') || cl.includes('ladder')) return 'league';
  if (cl.includes('open play') || cl.includes('social')) return 'open_play';
  return 'social';
}

// ═══════════════════════════════════════════════════════════
// Main Handler
// ═══════════════════════════════════════════════════════════
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const url = new URL(req.url);
    const facilityId = url.searchParams.get('facility_id');
    const syncType = url.searchParams.get('type') || 'all'; // all, reservations, events, transactions, members, push
    const syncAll = url.searchParams.get('sync_all') === 'true';

    // Get facilities to sync
    let facilities: FacilityConfig[] = [];

    if (facilityId) {
      const { data } = await supabase
        .from('facilities')
        .select('id, name, settings')
        .eq('id', facilityId)
        .single();
      if (data) facilities = [data];
    } else if (syncAll) {
      const { data } = await supabase
        .from('facilities')
        .select('id, name, settings')
        .eq('is_active', true)
        .not('settings->courtreserve_org_id', 'is', null);
      if (data) facilities = data;
    } else {
      return new Response(
        JSON.stringify({ error: 'Provide facility_id or sync_all=true' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting bi-directional sync for ${facilities.length} facility(ies)`);

    const allResults: { facility: string; results: SyncResult[] }[] = [];

    for (const facility of facilities) {
      if (!facility.settings?.courtreserve_org_id && !facility.settings?.courtreserve_username) {
        console.log(`  Skipping ${facility.name} - no CourtReserve config`);
        continue;
      }

      console.log(`\n═══ Syncing: ${facility.name} ═══`);

      // Build court map for this facility
      const { data: courts } = await supabase
        .from('courts')
        .select('id, name')
        .eq('facility_id', facility.id);

      const courtMap = new Map<string, string>();
      for (const court of (courts || [])) {
        courtMap.set(court.name, court.id);
        // Also map common variations
        if (court.name.startsWith('Court #')) {
          const num = court.name.replace('Court #', '').trim();
          courtMap.set(`Court #${num}`, court.id);
        }
      }

      const facilityResults: SyncResult[] = [];

      // CR → PG syncs
      if (syncType === 'all' || syncType === 'reservations') {
        console.log('\n  → Syncing reservations (CR → PG)...');
        facilityResults.push(await syncReservationsToPG(supabase, facility, courtMap));
      }

      if (syncType === 'all' || syncType === 'events') {
        console.log('\n  → Syncing events (CR → PG)...');
        facilityResults.push(await syncEventsToPG(supabase, facility, courtMap));
      }

      if (syncType === 'all' || syncType === 'transactions') {
        console.log('\n  → Syncing transactions (CR → PG)...');
        facilityResults.push(await syncTransactionsToPG(supabase, facility));
      }

      if (syncType === 'all' || syncType === 'members') {
        console.log('\n  → Syncing members (CR → PG)...');
        facilityResults.push(await syncMembersToPG(supabase, facility));
      }

      // PG → CR push
      if (syncType === 'all' || syncType === 'push') {
        console.log('\n  → Pushing bookings (PG → CR)...');
        facilityResults.push(await syncBookingsToCR(supabase, facility, courtMap));
      }

      // Log sync results
      const totalSynced = facilityResults.reduce((s, r) => s + r.synced, 0);
      const totalErrors = facilityResults.reduce((s, r) => s + r.errors, 0);

      await supabase.from('courtreserve_sync_logs').insert({
        facility_id: facility.id,
        sync_type: 'bidirectional',
        status: totalErrors > 0 ? 'partial' : 'success',
        records_synced: totalSynced,
        error_count: totalErrors,
        details: JSON.stringify(facilityResults),
      });

      allResults.push({ facility: facility.name, results: facilityResults });

      console.log(`\n  ✓ ${facility.name}: ${totalSynced} synced, ${totalErrors} errors`);
    }

    return new Response(
      JSON.stringify({
        message: 'Bi-directional sync completed',
        facilities_processed: allResults.length,
        results: allResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
