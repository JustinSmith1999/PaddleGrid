import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Booking {
  id: string;
  court_id: string;
  start_time: string;
  end_time: string;
  profiles: {
    id: string;
    full_name: string;
    skill_level?: number;
    profile_picture_url?: string;
  };
  courts: {
    name: string;
  };
}

interface WhosPlayingTodayProps {
  facilityId?: string;
  onProfileClick?: (userId: string) => void;
}

export default function WhosPlayingToday({ facilityId, onProfileClick }: WhosPlayingTodayProps) {
  const { profile } = useAuth();
  const [todaysBookings, setTodaysBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<'all' | 'now' | 'upcoming'>('all');

  const clubId = facilityId || (profile as any)?.facility_id;

  useEffect(() => {
    if (clubId) {
      loadTodaysBookings();
    }
  }, [clubId, selectedTime]);

  async function loadTodaysBookings() {
    if (!clubId) return;

    setLoading(true);
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      let query = supabase
        .from('bookings')
        .select('id, court_id, start_time, end_time, profiles(id, full_name, skill_level, profile_picture_url), courts(name, facility_id)')
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .eq('status', 'confirmed')
        .order('start_time', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      const facilityBookings = (data || []).filter(
        (booking: any) => booking.courts?.facility_id === clubId
      );

      if (selectedTime === 'now') {
        const now = new Date();
        const filtered = facilityBookings.filter((booking: any) => {
          const start = new Date(booking.start_time);
          const end = new Date(booking.end_time);
          return start <= now && end >= now;
        });
        setTodaysBookings(filtered);
      } else if (selectedTime === 'upcoming') {
        const now = new Date();
        const filtered = facilityBookings.filter((booking: any) => {
          const start = new Date(booking.start_time);
          return start > now;
        });
        setTodaysBookings(filtered);
      } else {
        setTodaysBookings(facilityBookings);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  const uniquePlayers = Array.from(
    new Map(
      todaysBookings.map(booking => [booking.profiles.id, booking.profiles])
    ).values()
  );

  if (!clubId) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600 font-medium mb-2">Join a club to see who's playing</p>
        <p className="text-sm text-gray-500">Connect with your local facility to view activity</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Calendar className="w-6 h-6 text-emerald-600" />
          Who's Playing Today
        </h2>

        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTime('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTime === 'all'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Day
          </button>
          <button
            onClick={() => setSelectedTime('now')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTime === 'now'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Playing Now
          </button>
          <button
            onClick={() => setSelectedTime('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTime === 'upcoming'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 h-20 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Players ({uniquePlayers.length})
            </h3>
            {uniquePlayers.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {uniquePlayers.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => onProfileClick?.(player.id)}
                    className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition-all cursor-pointer"
                  >
                    <div
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold"
                      style={
                        player.profile_picture_url
                          ? { backgroundImage: `url(${player.profile_picture_url})`, backgroundSize: 'cover' }
                          : {}
                      }
                    >
                      {!player.profile_picture_url && player.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{player.full_name}</div>
                      {player.skill_level && (
                        <div className="text-xs text-gray-600">{player.skill_level.toFixed(1)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No players scheduled</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Schedule ({todaysBookings.length} bookings)
            </h3>
            {todaysBookings.length > 0 ? (
              <div className="space-y-2">
                {todaysBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold cursor-pointer"
                        onClick={() => onProfileClick?.(booking.profiles.id)}
                        style={
                          booking.profiles.profile_picture_url
                            ? {
                                backgroundImage: `url(${booking.profiles.profile_picture_url})`,
                                backgroundSize: 'cover',
                              }
                            : {}
                        }
                      >
                        {!booking.profiles.profile_picture_url &&
                          booking.profiles.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{booking.profiles.full_name}</div>
                        <div className="text-sm text-gray-600">{booking.courts.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-700">
                        {new Date(booking.start_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(
                          (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) /
                            60000
                        )}{' '}
                        min
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No bookings for this time period</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
