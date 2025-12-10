import { supabase } from './supabase';

interface AvailabilityBlock {
  id: string;
  court_id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  block_type: string;
  notes: string | null;
  player_count: number | null;
}

export async function isCourtAvailable(
  courtId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_court_availability', {
      p_court_id: courtId,
      p_date: date,
      p_start_time: startTime,
      p_end_time: endTime,
    });

    if (error) {
      console.error('Error checking court availability:', error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.error('Failed to check court availability:', err);
    return false;
  }
}

export async function getCourtBlocks(
  courtId: string,
  date: string
): Promise<AvailabilityBlock[]> {
  try {
    const { data, error } = await supabase
      .from('court_availability_blocks')
      .select('*')
      .eq('court_id', courtId)
      .eq('block_date', date)
      .order('start_time');

    if (error) {
      console.error('Error fetching court blocks:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch court blocks:', err);
    return [];
  }
}

export async function getAvailableSlots(
  courtId: string,
  date: string,
  durationHours: number = 1
): Promise<Array<{ start: string; end: string; label: string }>> {
  const slots: Array<{ start: string; end: string; label: string }> = [];

  try {
    const { data: court } = await supabase
      .from('courts')
      .select('facility_id, facilities(settings)')
      .eq('id', courtId)
      .single();

    let openHour = 6;
    let closeHour = 24;

    if (court?.facilities?.settings?.operating_hours) {
      const dayOfWeek = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayHours = court.facilities.settings.operating_hours[dayOfWeek];

      if (dayHours && dayHours.is_open) {
        const [openH] = dayHours.open.split(':').map(Number);
        let [closeH] = dayHours.close.split(':').map(Number);
        openHour = openH;
        if (closeH === 0) closeH = 24;
        closeHour = closeH;
      } else {
        return [];
      }
    }

    const blocks = await getCourtBlocks(courtId, date);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const isToday = date === today;

    const isSlotAvailable = (startTime: string, endTime: string): boolean => {
      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);

      if (isToday && start <= now) {
        return false;
      }

      for (const block of blocks) {
        const blockStart = new Date(`${date}T${block.start_time}`);
        const blockEnd = new Date(`${date}T${block.end_time}`);

        if (start < blockEnd && end > blockStart) {
          return false;
        }
      }

      return true;
    };

    for (let hour = openHour; hour < closeHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;

        const totalMinutes = hour * 60 + minute + durationHours * 60;
        const endHour = Math.floor(totalMinutes / 60);
        const endMinute = totalMinutes % 60;

        if (endHour > closeHour) continue;

        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`;

        if (isSlotAvailable(startTime, endTime)) {
          const formatTime = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            const period = h >= 12 ? 'PM' : 'AM';
            const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
            return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
          };

          slots.push({
            start: startTime,
            end: endTime,
            label: `${formatTime(startTime)} - ${formatTime(endTime)}`,
          });
        }
      }
    }

    return slots;
  } catch (err) {
    console.error('Failed to get available slots:', err);
    return [];
  }
}

export async function checkBookingConflict(
  courtId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<{ hasConflict: boolean; conflictingBlocks: AvailabilityBlock[] }> {
  try {
    const blocks = await getCourtBlocks(courtId, date);
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    const conflictingBlocks = blocks.filter((block) => {
      const blockStart = new Date(`${date}T${block.start_time}`);
      const blockEnd = new Date(`${date}T${block.end_time}`);
      return start < blockEnd && end > blockStart;
    });

    return {
      hasConflict: conflictingBlocks.length > 0,
      conflictingBlocks,
    };
  } catch (err) {
    console.error('Failed to check booking conflict:', err);
    return { hasConflict: true, conflictingBlocks: [] };
  }
}
