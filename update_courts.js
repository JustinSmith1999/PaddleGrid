import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCourts() {
  try {
    console.log('Deleting existing courts...');
    
    // Delete all existing courts
    const { error: deleteError } = await supabase
      .from('courts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (deleteError) {
      console.error('Error deleting courts:', deleteError);
      return;
    }
    
    console.log('Creating 12 new courts...');
    
    // Create 12 new courts
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
    
    const { error: insertError } = await supabase
      .from('courts')
      .insert(courts);
    
    if (insertError) {
      console.error('Error creating courts:', insertError);
      return;
    }
    
    console.log('Successfully created 12 courts: Court 1 through Court 12');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateCourts();