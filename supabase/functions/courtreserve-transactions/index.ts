import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CourtReserveTransaction {
  TransactionId: number;
  TransactionType: string;
  TransactionDate: string;
  Subtotal: number;
  TaxTotal: number;
  Total: number;
  UnpaidAmount: number;
  PainOn?: string;
  PaymentType?: string;
  Category?: string;
  ReservationStart?: string;
  ReservationEnd?: string;
  Instructors?: string;
  OrganizationMemberId?: number;
  OrganizationFirstName?: string;
  OrganizationLastName?: string;
  OrganizationMemberEmail?: string;
  OrganizationMemberPhone?: string;
  AccountCreationDate?: string;
}

interface SyncFilters {
  transactionStartDate?: string;
  transactionEndDate?: string;
  reservationStartDate?: string;
  reservationEndDate?: string;
  transactionTypes?: string;
  showOnlyPaidTransactions?: boolean;
  showOnlyUnpaidTransactions?: boolean;
  reservationTypesIds?: string;
  eventCategoryIds?: string;
  paymentTypes?: string;
  showPartialPaidFeesOnly?: boolean;
  instructorIds?: string;
  revenueCategoryIds?: string;
  eventSessionIds?: string;
  recurringFeeIds?: string;
  eventTagIds?: string;
}

async function syncFacilityTransactions(facility: any, filters: SyncFilters, supabase: any) {
  const username = facility.settings?.courtreserve_username;
  const password = facility.settings?.courtreserve_password;

  if (!username || !password) {
    throw new Error('CourtReserve credentials not configured');
  }

  const authToken = btoa(`${username}:${password}`);

  const { data: syncLog, error: logError } = await supabase
    .from('courtreserve_transaction_sync_logs')
    .insert({
      facility_id: facility.id,
      status: 'running',
      sync_started_at: new Date().toISOString(),
      filters_used: filters,
    })
    .select()
    .maybeSingle();

  if (logError) {
    console.error('Failed to create sync log:', logError);
  }

  const logId = syncLog?.id;

  try {
    const queryParams = new URLSearchParams();
    
    if (filters.transactionStartDate) queryParams.append('transactionStartDate', filters.transactionStartDate);
    if (filters.transactionEndDate) queryParams.append('transactionEndDate', filters.transactionEndDate);
    if (filters.reservationStartDate) queryParams.append('reservationStartDate', filters.reservationStartDate);
    if (filters.reservationEndDate) queryParams.append('reservationEndDate', filters.reservationEndDate);
    if (filters.transactionTypes) queryParams.append('transactionTypes', filters.transactionTypes);
    if (filters.showOnlyPaidTransactions) queryParams.append('showOnlyPaidTransactions', 'true');
    if (filters.showOnlyUnpaidTransactions) queryParams.append('showOnlyUnpaidTransactions', 'true');
    if (filters.reservationTypesIds) queryParams.append('reservationTypesIds', filters.reservationTypesIds);
    if (filters.eventCategoryIds) queryParams.append('eventCategoryIds', filters.eventCategoryIds);
    if (filters.paymentTypes) queryParams.append('paymentTypes', filters.paymentTypes);
    if (filters.showPartialPaidFeesOnly) queryParams.append('showPartialPaidFeesOnly', 'true');
    if (filters.instructorIds) queryParams.append('instructorIds', filters.instructorIds);
    if (filters.revenueCategoryIds) queryParams.append('revenueCategoryIds', filters.revenueCategoryIds);
    if (filters.eventSessionIds) queryParams.append('eventSessionIds', filters.eventSessionIds);
    if (filters.recurringFeeIds) queryParams.append('recurringFeeIds', filters.recurringFeeIds);
    if (filters.eventTagIds) queryParams.append('eventTagIds', filters.eventTagIds);

    const courtReserveUrl = `https://api.courtreserve.com/api/v1/transactions/list?${queryParams.toString()}`;
    console.log('Calling CourtReserve API:', courtReserveUrl);

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
    console.log('CourtReserve response keys:', typeof responseData === 'object' ? Object.keys(responseData) : 'not an object');
    console.log('IsSuccessStatusCode:', responseData.IsSuccessStatusCode);

    if (responseData.ErrorMessage) {
      throw new Error(`CourtReserve API error: ${responseData.ErrorMessage}`);
    }

    if (!responseData.IsSuccessStatusCode) {
      throw new Error('CourtReserve API returned unsuccessful status');
    }

    const transactions: CourtReserveTransaction[] = Array.isArray(responseData.Data)
      ? responseData.Data
      : [];

    const transactionsData = transactions.map(transaction => {
      const customerName = transaction.OrganizationFirstName && transaction.OrganizationLastName
        ? `${transaction.OrganizationFirstName} ${transaction.OrganizationLastName}`
        : (transaction.OrganizationFirstName || transaction.OrganizationLastName || '');

      const paymentStatus = transaction.UnpaidAmount > 0
        ? (transaction.UnpaidAmount < Math.abs(transaction.Total) ? 'partial' : 'unpaid')
        : 'paid';

      return {
        facility_id: facility.id,
        courtreserve_transaction_id: transaction.TransactionId.toString(),
        transaction_date: transaction.TransactionDate,
        transaction_type: transaction.TransactionType,
        amount: Math.abs(transaction.Total),
        payment_type: transaction.PaymentType || '',
        payment_status: paymentStatus,
        customer_name: customerName,
        customer_email: transaction.OrganizationMemberEmail || '',
        customer_id: transaction.OrganizationMemberId?.toString(),
        reservation_id: null,
        reservation_start_date: transaction.ReservationStart,
        reservation_end_date: transaction.ReservationEnd,
        event_name: transaction.Category,
        event_id: null,
        instructor_name: transaction.Instructors,
        revenue_category: transaction.Category,
        description: transaction.Category,
        raw_data: transaction,
      };
    });

    const BATCH_SIZE = 100;
    let transactionsSynced = 0;

    for (let i = 0; i < transactionsData.length; i += BATCH_SIZE) {
      const batch = transactionsData.slice(i, i + BATCH_SIZE);

      const { error: upsertError, count } = await supabase
        .from('courtreserve_transactions')
        .upsert(batch, {
          onConflict: 'facility_id,courtreserve_transaction_id',
          count: 'exact'
        });

      if (upsertError) {
        console.error('Error upserting batch:', upsertError);
      } else {
        transactionsSynced += batch.length;
      }
    }

    const transactionsUpdated = 0;
    const transactionsSkipped = 0;

    if (logId) {
      await supabase
        .from('courtreserve_transaction_sync_logs')
        .update({
          status: 'success',
          sync_completed_at: new Date().toISOString(),
          transactions_synced: transactionsSynced,
          transactions_updated: transactionsUpdated,
          transactions_skipped: transactionsSkipped,
        })
        .eq('id', logId);
    }

    return {
      facility_id: facility.id,
      facility_name: facility.name,
      success: true,
      stats: {
        total_transactions: transactions.length,
        transactions_synced: transactionsSynced,
        transactions_updated: transactionsUpdated,
        transactions_skipped: transactionsSkipped,
      },
    };
  } catch (error) {
    if (logId) {
      await supabase
        .from('courtreserve_transaction_sync_logs')
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
    
    const filters: SyncFilters = {
      transactionStartDate: url.searchParams.get('transactionStartDate') || undefined,
      transactionEndDate: url.searchParams.get('transactionEndDate') || undefined,
      reservationStartDate: url.searchParams.get('reservationStartDate') || undefined,
      reservationEndDate: url.searchParams.get('reservationEndDate') || undefined,
      transactionTypes: url.searchParams.get('transactionTypes') || undefined,
      showOnlyPaidTransactions: url.searchParams.get('showOnlyPaidTransactions') === 'true',
      showOnlyUnpaidTransactions: url.searchParams.get('showOnlyUnpaidTransactions') === 'true',
      reservationTypesIds: url.searchParams.get('reservationTypesIds') || undefined,
      eventCategoryIds: url.searchParams.get('eventCategoryIds') || undefined,
      paymentTypes: url.searchParams.get('paymentTypes') || undefined,
      showPartialPaidFeesOnly: url.searchParams.get('showPartialPaidFeesOnly') === 'true',
      instructorIds: url.searchParams.get('instructorIds') || undefined,
      revenueCategoryIds: url.searchParams.get('revenueCategoryIds') || undefined,
      eventSessionIds: url.searchParams.get('eventSessionIds') || undefined,
      recurringFeeIds: url.searchParams.get('recurringFeeIds') || undefined,
      eventTagIds: url.searchParams.get('eventTagIds') || undefined,
    };

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!facilityId) {
      return new Response(
        JSON.stringify({ error: 'facility_id parameter is required' }),
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

    const result = await syncFacilityTransactions(facility, filters, supabase);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Transaction sync completed',
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