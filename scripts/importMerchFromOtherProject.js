import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Source project (your other project)
const SOURCE_URL = 'https://fzbgwtitjutjogaqkvkp.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Ymd3dGl0anV0am9nYXFrdmtwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjg3ODY3MiwiZXhwIjoyMDUyNDU0NjcyfQ.f7yXcrQcQRn5PKfyXNsYDZgXsvd-NQ_E6GSQwBtzvME';

// Destination project (current project)
const DEST_URL = process.env.VITE_SUPABASE_URL;
const DEST_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sourceSupabase = createClient(SOURCE_URL, SOURCE_KEY);
const destSupabase = createClient(DEST_URL, DEST_KEY);

async function importMerch() {
  console.log('🔍 Fetching merch data from source project...\n');

  try {
    // First, let's see what tables exist in the source
    const { data: tables, error: tablesError } = await sourceSupabase
      .rpc('exec_sql', {
        query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%merch%' OR table_name LIKE '%product%'`
      });

    if (tablesError) {
      console.log('⚠️  Could not query table structure, trying direct table queries...\n');
    }

    // Try to fetch from common merch table names
    const possibleTables = [
      'merch_products',
      'products',
      'merch_items',
      'merchandise',
      'merch_categories',
      'product_categories',
      'merch_inventory',
      'product_variants'
    ];

    let foundData = false;

    for (const tableName of possibleTables) {
      console.log(`Checking table: ${tableName}...`);

      const { data, error } = await sourceSupabase
        .from(tableName)
        .select('*');

      if (!error && data && data.length > 0) {
        console.log(`✅ Found ${data.length} records in ${tableName}`);
        console.log('Sample record:', JSON.stringify(data[0], null, 2));
        foundData = true;

        // Now import to destination
        console.log(`\n📥 Importing ${data.length} records to destination...`);

        const { error: insertError } = await destSupabase
          .from(tableName)
          .upsert(data, { onConflict: 'id' });

        if (insertError) {
          console.error(`❌ Error importing to ${tableName}:`, insertError);
        } else {
          console.log(`✅ Successfully imported ${data.length} records to ${tableName}\n`);
        }
      } else if (error && !error.message.includes('does not exist')) {
        console.log(`⚠️  Error querying ${tableName}:`, error.message);
      }
    }

    if (!foundData) {
      console.log('\n❌ No merch data found in source project.');
      console.log('Available tables might have different names.');
      console.log('\nLet me try to list all tables...\n');

      // Try to get all table names
      const { data: allTables, error: allTablesError } = await sourceSupabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (!allTablesError && allTables) {
        console.log('Available tables in source project:');
        allTables.forEach(t => console.log(`  - ${t.table_name}`));
      }
    }

  } catch (error) {
    console.error('❌ Error during import:', error);
  }
}

importMerch();
