import { createClient } from '@supabase/supabase-js';

// Source project (your other project)
const SOURCE_URL = 'https://fzbgwtitjutjogaqkvkp.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Ymd3dGl0anV0am9nYXFrdmtwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjg3ODY3MiwiZXhwIjoyMDUyNDU0NjcyfQ.f7yXcrQcQRn5PKfyXNsYDZgXsvd-NQ_E6GSQwBtzvME';

const sourceSupabase = createClient(SOURCE_URL, SOURCE_KEY);

async function fetchMerchData() {
  console.log('🔍 Fetching merch data from source project...\n');

  try {
    // Try to fetch from common merch table names
    const possibleTables = [
      'merch_products',
      'products',
      'merch_items',
      'merchandise',
      'merch_categories',
      'product_categories',
      'merch_inventory',
      'product_variants',
      'merch_orders'
    ];

    const foundTables = {};

    for (const tableName of possibleTables) {
      const { data, error } = await sourceSupabase
        .from(tableName)
        .select('*');

      if (!error && data && data.length > 0) {
        foundTables[tableName] = data;
        console.log(`✅ Found ${data.length} records in ${tableName}`);
      }
    }

    // Output the data as JSON
    console.log('\n📦 Merch Data:\n');
    console.log(JSON.stringify(foundTables, null, 2));

  } catch (error) {
    console.error('❌ Error during fetch:', error);
  }
}

fetchMerchData();
