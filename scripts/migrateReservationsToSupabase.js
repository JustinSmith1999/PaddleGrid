import { createClient } from '@supabase/supabase-js';
import { existingReservations } from '../src/lib/reservationData.ts';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Pickleball Heaven facility ID
const FACILITY_ID = 'bfb8aa81-fca9-48d9-b697-d13bba78430e';

// Mapping of court names to court IDs
const COURT_NAME_TO_ID = {
  'Championship Court #1': '73df00e9-f614-4952-bad2-68e2c459cbe0',
  'Court #10': '8233bd81-c3b1-4bbe-a3a1-781ee8f46a72',
  'Court #11': 'e954f880-bb5d-4a85-b58d-5e5a5110b1e4',
  'Court #12': '088a8b78-2cd1-42ab-8af7-c11d4acebabe',
  'Court #13': '3e1d3a6c-ac22-431d-99f2-0131356ff751',
  'Court #14': 'bdf6e7b2-673d-471e-814c-3715e5d1a14b',
  'Court #15': 'e59242d7-57a0-44f2-979d-e6074055e84d',
  'Court #16 (Championship)': 'cdce47d8-4b4e-4885-bb9c-10f0b6077d5c',
  'Court #2': 'c359066e-3322-466b-b13f-fb4b390eda5b',
  'Court #3': '0152c2a0-c5b9-4302-bd2e-ff34f3ef1de7',
  'Court #4': '8f5692a6-0137-4668-8b81-ed74d1e4f3db',
  'Court #5': '66262756-bea7-46eb-95fc-e3f32cf52776',
  'Court #6 Pickleball or Backyard Games': 'f1fcc789-a101-4bdd-a4a7-dbc5740d4f88',
  'Court #7': '2c75cfd5-9cba-4187-8517-630d2be4e88e',
  'Court #8': '2072d095-9354-4ef1-a4b7-2eb9991399a7',
  'Court #9': '3916b981-f4c5-4536-a044-31a8f0881865',
};

// Map reservation types to block types
function mapReservationType(type) {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('tournament')) return 'tournament';
  if (typeLower.includes('league')) return 'league';
  if (typeLower.includes('clinic')) return 'clinic';
  if (typeLower.includes('private')) return 'private_event';
  if (typeLower.includes('open play')) return 'other';
  return 'reservation';
}

async function migrateReservations() {
  console.log('🚀 Starting migration of reservations to Supabase...');
  console.log(`📊 Total reservations to migrate: ${existingReservations.length}`);

  const blocksToInsert = [];
  let skippedCount = 0;
  let errorCount = 0;

  // Process each reservation
  for (const reservation of existingReservations) {
    const { type, date, startTime, endTime, courts, players } = reservation;

    // Each reservation can span multiple courts
    for (const courtName of courts) {
      const courtId = COURT_NAME_TO_ID[courtName];

      if (!courtId) {
        console.warn(`⚠️  Unknown court name: "${courtName}" - skipping`);
        skippedCount++;
        continue;
      }

      blocksToInsert.push({
        facility_id: FACILITY_ID,
        court_id: courtId,
        block_date: date,
        start_time: startTime,
        end_time: endTime,
        block_type: mapReservationType(type),
        notes: type,
        player_count: players || null,
      });
    }
  }

  console.log(`\n📦 Prepared ${blocksToInsert.length} availability blocks`);

  if (skippedCount > 0) {
    console.log(`⚠️  Skipped ${skippedCount} blocks due to unknown court names`);
  }

  // Insert in batches of 100 to avoid timeout
  const BATCH_SIZE = 100;
  let insertedCount = 0;

  for (let i = 0; i < blocksToInsert.length; i += BATCH_SIZE) {
    const batch = blocksToInsert.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from('court_availability_blocks')
      .insert(batch);

    if (error) {
      console.error(`❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
      errorCount += batch.length;
    } else {
      insertedCount += batch.length;
      console.log(`✅ Inserted batch ${i / BATCH_SIZE + 1} (${insertedCount}/${blocksToInsert.length})`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Migration Complete!');
  console.log('='.repeat(60));
  console.log(`✅ Successfully inserted: ${insertedCount} blocks`);
  console.log(`⚠️  Skipped: ${skippedCount} blocks`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} blocks`);
  }
  console.log('='.repeat(60));

  // Verify the data
  const { count, error: countError } = await supabase
    .from('court_availability_blocks')
    .select('*', { count: 'exact', head: true })
    .eq('facility_id', FACILITY_ID);

  if (countError) {
    console.error('❌ Error verifying data:', countError.message);
  } else {
    console.log(`\n📊 Total blocks in database for Pickleball Heaven: ${count}`);
  }
}

// Run the migration
migrateReservations()
  .then(() => {
    console.log('\n✨ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
