import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Clock, MessageSquare, UserPlus, UserCheck, Phone, Mail, Globe, Activity, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostCard from './social/PostCard';
import { CourtScheduler } from './CourtScheduler';
import { SocialPost } from '../lib/socialUtils';
import { sortCourtsByNumber } from '../lib/courtUtils';
import EventCalendar from './EventCalendar';

interface ClubPageProps {
  facilityId: string;
  onBack: () => void;
}

interface Facility {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  logo_url: string;
  phone: string;
  email: string;
  website: string;
}

interface Court {
  id: string;
  name: string;
  description: string;
  hourly_rate: number;
  is_active: boolean;
}


export default function ClubPage({ facilityId, onBack }: ClubPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [courts, setCourts] = useState<Court[]>([]);
  const [eventsCount, setEventsCount] = useState(0);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [visiblePostsCount, setVisiblePostsCount] = useState(3);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [nextAvailableTime, setNextAvailableTime] = useState<string | null>(null);
  const [availableCourtsAtTime, setAvailableCourtsAtTime] = useState<Court[]>([]);

  useEffect(() => {
    loadFacilityData();
  }, [facilityId, user]);

  const loadFacilityData = async () => {
    try {
      setLoading(true);

      const { data: facilityData, error: facilityError } = await supabase
        .from('facilities')
        .select('*')
        .eq('id', facilityId)
        .single();

      if (facilityError) throw facilityError;
      setFacility(facilityData);

      if (user) {
        const { data: memberData } = await supabase
          .from('facility_users')
          .select('id')
          .eq('facility_id', facilityId)
          .eq('user_id', user.id)
          .maybeSingle();

        setIsMember(!!memberData);
      }

      const { count } = await supabase
        .from('facility_users')
        .select('*', { count: 'exact', head: true })
        .eq('facility_id', facilityId);

      setFollowerCount(count || 0);

      const { data: courtsData } = await supabase
        .from('courts')
        .select('id, name, description, hourly_rate, is_active')
        .eq('facility_id', facilityId)
        .eq('is_active', true);

      setCourts(sortCourtsByNumber(courtsData || []));

      const { count: eventsCount } = await supabase
        .from('event_series_occurrences')
        .select('*, event_series!inner(facility_id)', { count: 'exact', head: true })
        .eq('event_series.facility_id', facilityId)
        .eq('status', 'scheduled')
        .gte('occurrence_date', new Date().toISOString().split('T')[0]);

      setEventsCount(eventsCount || 0);

      const { data: postsData } = await supabase
        .from('social_posts')
        .select('*, profiles(*), facilities(*), courts(*)')
        .eq('facility_id', facilityId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(20);

      setPosts(postsData || []);

      if (courtsData && courtsData.length > 0) {
        await findNextAvailableSlot(courtsData);
      }
    } catch (error) {
      console.error('Error loading facility data:', error);
    } finally {
      setLoading(false);
    }
  };

  const findNextAvailableSlot = async (courtsList: Court[]) => {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      const { data: facilityData } = await supabase
        .from('facilities')
        .select('settings')
        .eq('id', facilityId)
        .single();

      let operatingHours = { open: 6, close: 24 };
      if (facilityData?.settings?.operating_hours) {
        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const dayHours = facilityData.settings.operating_hours[dayOfWeek];

        if (dayHours && dayHours.is_open) {
          const [openH] = dayHours.open.split(':').map(Number);
          let [closeH] = dayHours.close.split(':').map(Number);
          if (closeH === 0) closeH = 24;
          operatingHours = { open: openH, close: closeH };
        }
      }

      const { data: blocksData } = await supabase
        .from('court_availability_blocks')
        .select('*')
        .eq('block_date', dateStr);

      const blocks = blocksData || [];
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeNum = currentHour * 100 + currentMinute;

      const generateTimeSlots = (granularity: number) => {
        const slots = [];
        const totalHours = operatingHours.close - operatingHours.open;
        const totalSlots = Math.floor(totalHours / granularity);

        for (let i = 0; i < totalSlots; i++) {
          const totalMinutes = (operatingHours.open * 60) + (i * granularity * 60);
          const hour = Math.floor(totalMinutes / 60);
          const minute = totalMinutes % 60;
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const timeNum = hour * 100 + minute;

          if (timeNum > currentTimeNum) {
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            slots.push({
              time,
              timeNum,
              display: `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`,
              duration: granularity
            });
          }
        }

        return slots;
      };

      const timeSlots = generateTimeSlots(0.25);

      const isSlotAvailable = (courtId: string, time: string, slotDuration: number) => {
        const timeNum = parseInt(time.replace(':', ''));
        const endTimeNum = timeNum + (slotDuration * 100);

        for (const block of blocks) {
          if (block.court_id !== courtId) continue;

          const blockStart = parseInt(block.start_time.substring(0, 5).replace(':', ''));
          const blockEnd = parseInt(block.end_time.substring(0, 5).replace(':', ''));

          if ((timeNum >= blockStart && timeNum < blockEnd) ||
              (endTimeNum > blockStart && endTimeNum <= blockEnd) ||
              (timeNum <= blockStart && endTimeNum >= blockEnd)) {
            return false;
          }
        }

        return true;
      };

      for (const slot of timeSlots) {
        const availableCourts = courtsList.filter(court =>
          isSlotAvailable(court.id, slot.time, slot.duration)
        );

        if (availableCourts.length > 0) {
          setNextAvailableTime(slot.display);
          setAvailableCourtsAtTime(availableCourts);
          return;
        }
      }

      setNextAvailableTime(null);
      setAvailableCourtsAtTime([]);
    } catch (error) {
      console.error('Error finding next available slot:', error);
    }
  };

  const handleJoinClub = async () => {
    if (!user) {
      alert('Please sign in to follow this club');
      return;
    }

    try {
      const { error } = await supabase.from('facility_users').insert({
        facility_id: facilityId,
        user_id: user.id,
        role: 'member',
      });

      if (error) throw error;

      setIsMember(true);
      setFollowerCount(prev => prev + 1);
    } catch (error) {
      console.error('Error following club:', error);
      alert('Failed to follow club. Please try again.');
    }
  };

  const handleLeaveClub = async () => {
    if (!user) return;

    if (!confirm('Are you sure you want to unfollow this club?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('facility_users')
        .delete()
        .eq('facility_id', facilityId)
        .eq('user_id', user.id);

      if (error) throw error;

      setIsMember(false);
      setFollowerCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error unfollowing club:', error);
      alert('Failed to unfollow club. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">Club not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="relative h-64 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-700 dark:text-slate-200 rounded-xl shadow-lg hover:shadow-xl hover:bg-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back</span>
        </button>

        <div className="absolute bottom-6 left-0 right-0 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-end gap-4">
            {facility.logo_url && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-slate-800 p-2 sm:p-2.5 shadow-2xl flex-shrink-0 border-4 border-white/50">
                <img
                  src={facility.logo_url}
                  alt={facility.name}
                  className="w-full h-full object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </div>
            )}
            <div className="flex-1 pb-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-1.5 drop-shadow-lg line-clamp-2">
                {facility.name}
              </h1>
              <button
                onClick={() => {
                  const address = '645 National Blvd, Medford, NY 11763';
                  const encodedAddress = encodeURIComponent(address);
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
                }}
                className="flex items-center gap-1.5 sm:gap-2 text-white/90 hover:text-white text-sm sm:text-base transition-colors group"
              >
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="font-medium drop-shadow truncate">{facility.city}, {facility.state}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-6 mb-6 border border-slate-200 dark:border-slate-700">
          {facility.description && (
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-8 mt-4">
              {facility.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center shadow-sm">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Members</span>
              </div>
              <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{followerCount}</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center shadow-sm">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Courts</span>
              </div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{courts.length}</div>
            </div>
          </div>

          {!user ? (
            <button
              onClick={handleJoinClub}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Follow Club
            </button>
          ) : !isMember ? (
            <button
              onClick={handleJoinClub}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Follow Club
            </button>
          ) : (
            <button
              onClick={handleLeaveClub}
              className="w-full px-6 py-3.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-5 h-5" />
              Following
            </button>
          )}
        </div>

        {(facility.phone || facility.email || facility.website) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {facility.phone && (
              <a
                href={`tel:${facility.phone}`}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 group"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Phone</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{facility.phone}</div>
                </div>
              </a>
            )}
            {facility.email && (
              <a
                href={`mailto:${facility.email}`}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 group"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{facility.email}</div>
                </div>
              </a>
            )}
            {facility.website && (
              <a
                href={facility.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl hover:bg-orange-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 group"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Website</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">Visit Site</div>
                </div>
              </a>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Our Courts</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{courts.length} courts available</p>
                </div>
              </div>

              {nextAvailableTime && availableCourtsAtTime.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 mb-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white/90 text-xs uppercase tracking-wide mb-1">Next Available</h3>
                      <p className="text-3xl font-bold text-white drop-shadow-lg">{nextAvailableTime}</p>
                    </div>
                  </div>
                  <p className="text-white/90 font-medium mb-4 text-base">
                    {availableCourtsAtTime.length} {availableCourtsAtTime.length === 1 ? 'court' : 'courts'} available
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableCourtsAtTime.map((court) => (
                      <button
                        key={court.id}
                        onClick={() => {
                          if (!user) {
                            alert('Please sign in to book a court');
                            return;
                          }
                          setSelectedCourtId(court.id);
                          setShowScheduler(true);
                        }}
                        className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border-2 border-white/50 hover:border-white hover:shadow-lg transition-all text-left group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate pr-2">
                            {court.name}
                          </h4>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform shadow-md flex-shrink-0" />
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          Book Now
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {courts.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-700">
                  <Activity className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-lg">No courts available</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {courts.map((court) => (
                    <button
                      key={court.id}
                      onClick={() => {
                        if (!user) {
                          alert('Please sign in to book a court');
                          return;
                        }
                        setSelectedCourtId(court.id);
                        setShowScheduler(true);
                      }}
                      className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base truncate pr-2">
                          {court.name}
                        </h3>
                        <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                        {court.description}
                      </p>
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        View Schedule
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Community Feed</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{posts.length} posts</p>
                </div>
              </div>

              {posts.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
                  <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No posts yet</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {posts.slice(0, visiblePostsCount).map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onClick={() => navigate(`/post/${post.id}`)}
                        onUpdate={loadFacilityData}
                        onProfileClick={(userId) => navigate(`/player/${userId}`)}
                      />
                    ))}
                  </div>
                  {posts.length > visiblePostsCount && (
                    <button
                      onClick={() => setVisiblePostsCount(prev => prev + 3)}
                      className="mt-4 w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all"
                    >
                      Show More Posts
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Event Calendar</h2>
              </div>
              <EventCalendar facilityId={facilityId} />
            </div>

            {!isMember && user && (
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl p-6 text-white shadow-lg">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Follow This Club</h3>
                  <p className="text-emerald-50 mb-4 text-sm">Stay updated on events and connect with members.</p>
                  <button
                    onClick={handleJoinClub}
                    className="w-full px-4 py-2.5 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 font-semibold transition-colors shadow-md"
                  >
                    Follow Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showScheduler && user && (
        <CourtScheduler
          onClose={() => {
            setShowScheduler(false);
            setSelectedCourtId(null);
          }}
          onSuccess={() => {
            setShowScheduler(false);
            setSelectedCourtId(null);
            loadFacilityData();
          }}
          userId={user.id}
          initialCourtId={selectedCourtId}
        />
      )}
    </div>
  );
}
