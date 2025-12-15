import React, { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Court {
  id: string;
  name: string;
  image_url: string | null;
  hourly_rate: number;
}

interface LiveCourtStatusProps {
  facilityId: string;
  onCourtClick: (courtId: string) => void;
}

interface CourtAvailability {
  courtId: string;
  isAvailable: boolean;
  nextSlots: string[];
}

export function LiveCourtStatus({ facilityId, onCourtClick }: LiveCourtStatusProps) {
  const [courts, setCourts] = useState<Court[]>([]);
  const [availability, setAvailability] = useState<Record<string, CourtAvailability>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourtsAndAvailability();
  }, [facilityId]);

  const loadCourtsAndAvailability = async () => {
    setLoading(true);

    const { data: courtsData } = await supabase
      .from('courts')
      .select('id, name, image_url, hourly_rate')
      .eq('facility_id', facilityId)
      .eq('is_active', true);

    if (!courtsData) {
      setLoading(false);
      return;
    }

    setCourts(courtsData);

    const today = new Date().toISOString().split('T')[0];
    const { data: blocksData } = await supabase
      .from('court_availability_blocks')
      .select('*')
      .eq('block_date', today);

    const blocks = blocksData || [];
    const now = new Date();
    const currentTimeNum = now.getHours() * 100 + now.getMinutes();

    const availabilityMap: Record<string, CourtAvailability> = {};

    courtsData.forEach((court) => {
      const courtBlocks = blocks.filter(b => b.court_id === court.id);
      const nextSlots: string[] = [];

      for (let hour = now.getHours(); hour < 23; hour++) {
        for (let min = 0; min < 60; min += 30) {
          const timeNum = hour * 100 + min;
          if (timeNum <= currentTimeNum) continue;

          const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          const endTimeNum = timeNum + 100;

          const isBlocked = courtBlocks.some(block => {
            const blockStart = parseInt(block.start_time.substring(0, 5).replace(':', ''));
            const blockEnd = parseInt(block.end_time.substring(0, 5).replace(':', ''));
            return (timeNum >= blockStart && timeNum < blockEnd) ||
                   (endTimeNum > blockStart && endTimeNum <= blockEnd);
          });

          if (!isBlocked && nextSlots.length < 3) {
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            nextSlots.push(`${displayHour}:${min.toString().padStart(2, '0')} ${ampm}`);
          }

          if (nextSlots.length >= 3) break;
        }
        if (nextSlots.length >= 3) break;
      }

      availabilityMap[court.id] = {
        courtId: court.id,
        isAvailable: nextSlots.length > 0,
        nextSlots
      };
    });

    setAvailability(availabilityMap);
    setLoading(false);
  };

  if (loading || courts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {courts.map((court) => {
        const courtAvail = availability[court.id];
        const isAvailable = courtAvail?.isAvailable || false;

        return (
          <button
            key={court.id}
            onClick={() => onCourtClick(court.id)}
            className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-xl transition-all text-left"
          >
            <div className="relative h-40 bg-gradient-to-br from-emerald-500 to-teal-500 overflow-hidden">
              {court.image_url ? (
                <img
                  src={court.image_url}
                  alt={court.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Activity className="w-16 h-16 text-white/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <div className="absolute top-3 right-3">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md ${
                  isAvailable
                    ? 'bg-emerald-500/90'
                    : 'bg-slate-500/90'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isAvailable ? 'bg-white animate-pulse' : 'bg-white/60'
                  }`} />
                  <span className="text-white text-xs font-semibold">
                    {isAvailable ? 'Available' : 'Booked'}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-white font-bold text-lg mb-1">{court.name}</h3>
                <p className="text-white/90 text-sm font-medium">${court.hourly_rate}/hr</p>
              </div>
            </div>

            <div className="p-4">
              {isAvailable && courtAvail.nextSlots.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Next Available
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {courtAvail.nextSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-semibold"
                      >
                        {slot}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  No availability today
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
