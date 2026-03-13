import { Clock, DollarSign, Activity, MapPin } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface Court {
  id: string;
  name: string;
  description: string | null;
  hourly_rate: number;
  image_url: string | null;
  is_active: boolean;
  location?: string;
  facility_id?: string;
  facilities?: {
    name: string;
    slug: string;
  };
}

interface AvailabilityBlock {
  start_time: string;
  end_time: string;
}

interface CourtCardProps {
  court: Court;
  onBook: (court: Court) => void;
  availabilityBlocks: AvailabilityBlock[];
  currentUserId?: string;
}

function formatTime(time24: string): string {
  const [hour, minute] = time24.split(':').map(Number);
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

function findNextAvailable(blocks: AvailabilityBlock[]): string | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const sortedBlocks = blocks
    .map(block => {
      const [startH, startM] = block.start_time.split(':').map(Number);
      const [endH, endM] = block.end_time.split(':').map(Number);
      return {
        startMinutes: startH * 60 + startM,
        endMinutes: endH * 60 + endM,
        endTime: block.end_time
      };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);

  if (sortedBlocks.length === 0) {
    return null;
  }

  let lastEnd = 0;

  for (const block of sortedBlocks) {
    if (currentMinutes < block.startMinutes && currentMinutes >= lastEnd) {
      return 'Now';
    }

    if (currentMinutes >= block.startMinutes && currentMinutes < block.endMinutes) {
      return formatTime(block.endTime);
    }

    lastEnd = Math.max(lastEnd, block.endMinutes);
  }

  if (currentMinutes >= lastEnd) {
    return 'Now';
  }

  return null;
}

export function CourtCard({ court, onBook, availabilityBlocks, currentUserId }: CourtCardProps) {
  const nextAvailable = findNextAvailable(availabilityBlocks);
  const isAvailableNow = nextAvailable === 'Now';
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  async function handleCheckIn() {
    if (!currentUserId) {
      alert('Please log in to check in');
      return;
    }

    setIsCheckingIn(true);

    try {
      const facilityName = court.facilities?.name || 'this facility';
      const content = `Playing at ${court.name}!`;

      const { error } = await supabase
        .from('social_posts')
        .insert({
          author_id: currentUserId,
          content: content,
          post_type: 'general',
          court_id: court.id,
          facility_id: court.facility_id,
          posted_as_facility: false
        });

      if (error) throw error;

      alert('Checked in successfully!');
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Failed to check in. Please try again.');
    } finally {
      setIsCheckingIn(false);
    }
  }

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:scale-[1.02] relative">
      {isAvailableNow && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
      )}

      <div className={`p-5 border-b border-slate-200 dark:border-slate-700 ${
        isAvailableNow
          ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-emerald-900/20'
          : 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isAvailableNow
                ? 'bg-emerald-500 dark:bg-emerald-600 shadow-lg shadow-emerald-500/50'
                : 'bg-slate-300 dark:bg-slate-600'
            } transition-all duration-300`}>
              <Clock className={`w-5 h-5 ${isAvailableNow ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} />
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${
                isAvailableNow ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
              }`}>
                Next Available
              </p>
              <p className={`text-xl font-bold ${
                isAvailableNow ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-900 dark:text-white'
              }`}>
                {nextAvailable || 'Check Schedule'}
              </p>
            </div>
          </div>
          <Activity className={`w-10 h-10 ${
            isAvailableNow
              ? 'text-emerald-500 dark:text-emerald-400 animate-pulse'
              : 'text-slate-300 dark:text-slate-600'
          } transition-all duration-300`} />
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
          {court.name}
        </h3>
        {court.location && (
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-5">
            {court.location}
          </p>
        )}

        <div className="space-y-3 pt-5 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  ${court.hourly_rate}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium ml-1">/hour</span>
              </div>
            </div>

            <button
              onClick={() => onBook(court)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-105 shadow-lg"
            >
              Book Now
            </button>
          </div>

          {currentUserId && (
            <button
              onClick={handleCheckIn}
              disabled={isCheckingIn}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 dark:from-slate-700 dark:to-slate-600 dark:hover:from-slate-600 dark:hover:to-slate-500 text-slate-700 dark:text-slate-200 font-semibold px-4 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 hover:shadow-md"
            >
              <MapPin className="w-4 h-4" />
              {isCheckingIn ? 'Checking In...' : "I'm Playing Here"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
