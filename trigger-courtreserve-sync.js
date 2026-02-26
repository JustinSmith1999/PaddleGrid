#!/usr/bin/env node

/**
 * Manual CourtReserve Sync Trigger
 *
 * This script manually triggers the CourtReserve sync for all configured facilities.
 * Run this script to pull the latest reservations, events, and transactions from CourtReserve.
 *
 * Usage: node trigger-courtreserve-sync.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   - VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  console.error('\nPlease add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  console.error('You can find this in your Supabase project settings under API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function triggerSync() {
  console.log('🔄 Starting CourtReserve sync...\n');

  try {
    // 1. Sync reservations and availability blocks
    console.log('📅 Syncing reservations and availability blocks...');
    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/courtreserve-sync?sync_all=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    const syncData = await syncResponse.json();

    if (!syncResponse.ok) {
      throw new Error(`Sync failed: ${syncData.error || syncResponse.statusText}`);
    }

    console.log('✅ Reservations sync completed:');
    if (syncData.results) {
      for (const result of syncData.results) {
        if (result.success) {
          console.log(`   ${result.facility_name}:`);
          console.log(`      - Reservations: ${result.stats.total_reservations}`);
          console.log(`      - Bookings created: ${result.stats.bookings_created}`);
          console.log(`      - Blocks created: ${result.stats.blocks_created}`);
          console.log(`      - Events: ${result.stats.total_events || 0}`);
        } else {
          console.log(`   ${result.facility_name}: ❌ ${result.error}`);
        }
      }
    }

    // 2. Sync events
    console.log('\n🎉 Syncing events...');
    const eventsResponse = await fetch(`${supabaseUrl}/functions/v1/courtreserve-event-sync?auto=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      console.log('✅ Events sync completed');
      if (eventsData.results) {
        for (const result of eventsData.results) {
          if (result.success) {
            console.log(`   ${result.facility_name}: ${result.events_synced} events synced`);
          }
        }
      }
    }

    // 3. Sync transactions
    console.log('\n💰 Syncing transactions...');
    const transactionsResponse = await fetch(`${supabaseUrl}/functions/v1/courtreserve-transactions?auto=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (transactionsResponse.ok) {
      const transactionsData = await transactionsResponse.json();
      console.log('✅ Transactions sync completed');
      if (transactionsData.results) {
        for (const result of transactionsData.results) {
          if (result.success) {
            console.log(`   ${result.facility_name}: ${result.transactions_synced} transactions synced`);
          }
        }
      }
    }

    console.log('\n✅ All syncs completed successfully!\n');

    // Show summary
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('id, booking_date, courtreserve_booking_id')
      .not('courtreserve_booking_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentBookings && recentBookings.length > 0) {
      console.log('📊 Recent CourtReserve bookings:');
      for (const booking of recentBookings) {
        console.log(`   - ${booking.booking_date} (ID: ${booking.courtreserve_booking_id})`);
      }
    }

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

triggerSync();
