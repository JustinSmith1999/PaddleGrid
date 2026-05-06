import { Clock, DollarSign, Activity, MapPin } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative"
    >
      {isAvailableNow && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-green-600"></div>
      )}

      <div className={`p-5 border-b border-slate-100 ${
        isAvailableNow
          ? 'bg-green-50/50'
          : 'bg-slate-50/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isAvailableNow
                ? 'bg-green-700 shadow-sm'
                : 'bg-slate-300'
            } transition-all duration-300`}>
              <Clock className={`w-5 h-5 ${isAvailableNow ? 'text-white' : 'text-slate-600'}`} />
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${
                isAvailableNow ? 'text-green-700' : 'text-slate-500'
              }`}>
                Next Available
              </p>
              <p className={`text-xl font-bold ${
                isAvailableNow ? 'text-green-800' : 'text-slate-900'
              }`}>
                {nextAvailable || 'Check Schedule'}
              </p>
            </div>
          </div>
          <div>
            {isAvailableNow ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                Available
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                Booked
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-green-700 transition-colors duration-300">
          {court.name}
        </h3>
        {court.location && (
          <p className="text-sm font-medium text-slate-500 mb-5">
            {court.location}
          </p>
        )}

        <div className="space-y-3 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <DollarSign className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <span className="text-3xl font-bold text-green-700">
                  ${court.hourly_rate}
                </span>
                <span className="text-slate-500 text-sm font-medium ml-1">/hour</span>
              </div>
            </div>

            <button
              onClick={() => onBook(court)}
              className="bg-green-700 hover:bg-green-800 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
            >
              Book Now
            </button>
          </div>

          {currentUserId && (
            <button
              onClick={handleCheckIn}
              disabled={isCheckingIn}
              className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-4 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 hover:shadow-sm"
            >
              <MapPin className="w-4 h-4" />
              {isCheckingIn ? 'Checking In...' : "I'm Playing Here"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
