import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCourts() {
  try {
    console.log('🏓 Starting court update process...');
    
    // First, let's see what courts currently exist
    const { data: existingCourts, error: fetchError } = await supabase
      .from('courts')
      .select('id, name')
      .order('name');
    
    if (fetchError) {
      console.error('Error fetching existing courts:', fetchError);
      return;
    }
    
    console.log('Current courts in database:');
    existingCourts?.forEach(court => console.log(`  - ${court.name}`));
    
    console.log('\n🗑️  Deleting all existing courts...');
    
    // Delete all existing courts
    const { error: deleteError } = await supabase
      .from('courts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (deleteError) {
      console.error('Error deleting courts:', deleteError);
      return;
    }
    
    console.log('✅ All existing courts deleted');
    
    console.log('\n🏗️  Creating 12 new courts (Court 1 through Court 12)...');
    
    // Create 12 new courts with simple names
    const courts = [];
    for (let i = 1; i <= 12; i++) {
      courts.push({
        name: `Court ${i}`,
        description: 'Professional pickleball court with premium surface and lighting',
        hourly_rate: 35.00,
        is_active: true,
        image_url: 'https://images.pexels.com/photos/8007404/pexels-photo-8007404.jpeg?auto=compress&cs=tinysrgb&w=800'
      });
    }
    
    const { data: newCourts, error: insertError } = await supabase
      .from('courts')
      .insert(courts)
      .select();
    
    if (insertError) {
      console.error('Error creating courts:', insertError);
      return;
    }
    
    console.log('✅ Successfully created 12 courts:');
    newCourts?.forEach(court => console.log(`  - ${court.name} ($${court.hourly_rate}/hour)`));
    
    console.log('\n🎉 Court update completed successfully!');
    console.log('Your database now has exactly 12 courts named "Court 1" through "Court 12"');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

updateCourts();