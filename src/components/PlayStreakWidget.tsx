import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PlayStreakWidgetProps {
  userId: string;
}

export default function PlayStreakWidget({ userId }: PlayStreakWidgetProps) {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateStreak();
  }, [userId]);

  async function calculateStreak() {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('start_time, status')
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .order('start_time', { ascending: false });

      if (error) throw error;

      if (!bookings || bookings.length === 0) {
        setStreak(0);
        setLoading(false);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const uniqueDays = new Set<string>();
      bookings.forEach(booking => {
        const bookingDate = new Date(booking.start_time);
        bookingDate.setHours(0, 0, 0, 0);
        const dateStr = bookingDate.toISOString().split('T')[0];
        uniqueDays.add(dateStr);
      });

      const sortedDays = Array.from(uniqueDays).sort().reverse();

      let currentStreak = 0;
      let checkDate = new Date(today);

      for (const dayStr of sortedDays) {
        const bookingDay = new Date(dayStr);
        const diffTime = checkDate.getTime() - bookingDay.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0 || diffDays === 1) {
          currentStreak++;
          checkDate = new Date(bookingDay);
        } else if (currentStreak === 0) {
          continue;
        } else {
          break;
        }
      }

      setStreak(currentStreak);
    } catch (error) {
      console.error('Error calculating streak:', error);
      setStreak(0);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center animate-pulse">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading streak...</p>
          </div>
        </div>
      </div>
    );
  }

  if (streak === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <Flame className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">No Active Streak</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Book a court to start your streak!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{streak} Day{streak !== 1 ? 's' : ''}</p>
          <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">Play Streak</p>
        </div>
      </div>
      {streak >= 3 && (
        <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {streak >= 7 ? "You're on fire! Keep it up!" : "Great momentum! Keep playing!"}
          </p>
        </div>
      )}
    </div>
  );
}
