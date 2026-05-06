import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PatternAnalysis {
  deadSpots: { day: string; hour: number; utilization: number }[];
  peakHours: { day: string; hour: number; utilization: number }[];
  memberTrends: { growing: number; declining: number; stable: number };
  revenueOpportunity: number;
  recommendations: string[];
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { facilityId } = await req.json();

    // 1. Analyze booking patterns over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: bookings, error: bookingsError } = await supabase
      .from('court_availability_blocks')
      .select('block_date, start_time, court_id, booked_by')
      .eq('block_type', 'reservation')
      .gte('block_date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (bookingsError) throw bookingsError;

    const { data: courts } = await supabase
      .from('courts')
      .select('id, name, hourly_rate');

    const totalCourts = courts?.length || 4;
    const baseRate = courts?.[0]?.hourly_rate || 30;
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeksInPeriod = 4.3;

    // Build heatmap: day -> hour -> booking count
    const heatmap: Record<string, Record<number, number>> = {};
    DAYS.forEach(day => { heatmap[day] = {}; });

    bookings?.forEach(b => {
      const date = new Date(b.block_date + 'T00:00:00');
      const dayName = DAYS[date.getDay()];
      const hour = parseInt(b.start_time.split(':')[0]);
      heatmap[dayName][hour] = (heatmap[dayName][hour] || 0) + 1;
    });

    // 2. Find dead spots and peak hours
    const deadSpots: PatternAnalysis['deadSpots'] = [];
    const peakHours: PatternAnalysis['peakHours'] = [];

    DAYS.forEach(day => {
      for (let h = 6; h <= 21; h++) {
        const avg = (heatmap[day][h] || 0) / weeksInPeriod;
        const utilization = avg / totalCourts;

        if (utilization < 0.25) {
          deadSpots.push({ day, hour: h, utilization: Math.round(utilization * 100) });
        } else if (utilization > 0.75) {
          peakHours.push({ day, hour: h, utilization: Math.round(utilization * 100) });
        }
      }
    });

    // Sort by utilization
    deadSpots.sort((a, b) => a.utilization - b.utilization);
    peakHours.sort((a, b) => b.utilization - a.utilization);

    // 3. Member trend analysis
    const now = new Date();
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const userBookingsRecent: Record<string, number> = {};
    const userBookingsOlder: Record<string, number> = {};

    bookings?.forEach(b => {
      if (!b.booked_by) return;
      const bookDate = new Date(b.block_date);
      if (bookDate >= fifteenDaysAgo) {
        userBookingsRecent[b.booked_by] = (userBookingsRecent[b.booked_by] || 0) + 1;
      } else {
        userBookingsOlder[b.booked_by] = (userBookingsOlder[b.booked_by] || 0) + 1;
      }
    });

    const allUsers = new Set([...Object.keys(userBookingsRecent), ...Object.keys(userBookingsOlder)]);
    let growing = 0, declining = 0, stable = 0;

    allUsers.forEach(userId => {
      const recent = userBookingsRecent[userId] || 0;
      const older = userBookingsOlder[userId] || 0;
      if (recent > older + 1) growing++;
      else if (recent < older - 1) declining++;
      else stable++;
    });

    // 4. Revenue opportunity estimate
    const revenueOpportunity = deadSpots.slice(0, 10).reduce((sum, spot) => {
      // Estimate: fill 50% of the dead spot with 4 players at split rate
      return sum + (baseRate * 0.5);
    }, 0) * weeksInPeriod; // Monthly estimate

    // 5. Generate recommendations
    const recommendations: string[] = [];

    if (deadSpots.length > 5) {
      recommendations.push(`${deadSpots.length} dead spots detected — consider running open play events during these times`);
    }
    if (peakHours.length > 3) {
      recommendations.push(`Peak demand at ${peakHours.length} time slots — consider dynamic pricing (+25-50% premium)`);
    }
    if (declining > growing) {
      recommendations.push(`${declining} members showing declining activity — trigger re-engagement campaigns`);
    }
    if (deadSpots.some(s => s.hour >= 11 && s.hour <= 14)) {
      recommendations.push('Midday slots consistently empty — try "Lunch Break Drop-In" with discounted rate');
    }
    if (peakHours.some(s => s.hour >= 17 && s.hour <= 20)) {
      recommendations.push('Evening demand exceeds capacity — consider waitlist system or advance booking priority');
    }

    const analysis: PatternAnalysis = {
      deadSpots: deadSpots.slice(0, 15),
      peakHours: peakHours.slice(0, 10),
      memberTrends: { growing, declining, stable },
      revenueOpportunity: Math.round(revenueOpportunity),
      recommendations,
    };

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
