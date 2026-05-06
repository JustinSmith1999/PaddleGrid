import { useState, useEffect } from 'react';
import { Clock, MapPin, Users, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ActiveBooking {
  id: string;
  courtName: string;
  facilityName: string;
  facilityId: string;
  startTime: string;
  endTime: string;
  players: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
  }>;
  isPublic: boolean;
}

interface WhosPlayingNowProps {
  onFacilityClick?: (facilityId: string) => void;
}

export default function WhosPlayingNow({ onFacilityClick }: WhosPlayingNowProps) {
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveBookings();
    const interval = setInterval(loadActiveBookings, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadActiveBookings() {
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 8);

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          user_id,
          is_public,
          courts (
            id,
            name,
            facilities (
              id,
              name
            )
          ),
          profiles (
            id,
            full_name,
            profile_picture_url
          )
        `)
        .eq('status', 'confirmed')
        .eq('booking_date', currentDate)
        .lte('start_time', currentTime)
        .gte('end_time', currentTime)
        .limit(5);

      if (error) throw error;

      const activeBookingsData: ActiveBooking[] = [];

      for (const booking of bookings || []) {
        if (!booking.courts || !booking.profiles) continue;

        const court = Array.isArray(booking.courts) ? booking.courts[0] : booking.courts;
        const profile = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles;

        if (!court?.facilities) continue;

        const facility = Array.isArray(court.facilities) ? court.facilities[0] : court.facilities;

        const startDateTime = `${booking.booking_date}T${booking.start_time}`;
        const endDateTime = `${booking.booking_date}T${booking.end_time}`;

        activeBookingsData.push({
          id: booking.id,
          courtName: court.name,
          facilityName: facility.name,
          facilityId: facility.id,
          startTime: startDateTime,
          endTime: endDateTime,
          players: [{
            id: profile.id,
            name: profile.full_name || 'Player',
            avatarUrl: profile.profile_picture_url
          }],
          isPublic: booking.is_public || false
        });
      }

      setActiveBookings(activeBookingsData);
    } catch (error) {
      console.error('Error loading active bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatTimeRemaining(endTime: string): string {
    const now = new Date();
    const end = new Date(endTime);
    const diffMinutes = Math.floor((end.getTime() - now.getTime()) / 60000);

    if (diffMinutes < 60) {
      return `${diffMinutes}m left`;
    }
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m left`;
  }

  if (loading) return null;
  if (activeBookings.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity className="w-5 h-5 text-green-700" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Playing Now
          </h2>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {activeBookings.map((booking) => (
          <button
            key={booking.id}
            onClick={() => onFacilityClick?.(booking.facilityId)}
            className="w-full px-5 py-2.5 hover:bg-slate-50 transition-all text-left group"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-sm mb-1">
                    {booking.courtName}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{booking.facilityName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full flex-shrink-0">
                  <Clock className="w-3 h-3 text-green-700" />
                  <span className="text-[10px] font-bold text-green-700">
                    LIVE
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {booking.players.slice(0, 3).map((player) => (
                      <div
                        key={player.id}
                        className="w-7 h-7 rounded-full ring-2 ring-white shadow-sm overflow-hidden bg-green-700 flex items-center justify-center"
                      >
                        {player.avatarUrl ? (
                          <img
                            src={player.avatarUrl}
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-4 h-4 text-white" />
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {booking.players.length} {booking.players.length === 1 ? 'player' : 'players'}
                  </span>
                </div>

                <span className="text-xs font-semibold text-slate-500">
                  {formatTimeRemaining(booking.endTime)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
