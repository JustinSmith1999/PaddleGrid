import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Clock, DollarSign, MessageSquare, Heart, UserPlus, UserCheck, Phone, Mail, Globe, Star, TrendingUp, Award, Activity } from 'lucide-react';
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

      const timeSlots = generateTimeSlots(1);

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
      <div className="relative h-48 md:h-60 bg-white dark:bg-slate-800">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
        {facility.logo_url && (
          <img
            src={facility.logo_url}
            alt={facility.name}
            className="absolute inset-0 w-full h-full object-contain p-6"
          />
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-8 mb-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1 truncate">
                  {facility.name}
                </h1>
                <button
                  onClick={() => {
                    const address = '645 National Blvd, Medford, NY 11763';
                    const encodedAddress = encodeURIComponent(address);
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
                  }}
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{facility.city}, {facility.state}</span>
                </button>
              </div>

              {!user ? (
                <button
                  onClick={handleJoinClub}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Follow
                </button>
              ) : !isMember ? (
                <button
                  onClick={handleJoinClub}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Follow
                </button>
              ) : (
                <button
                  onClick={handleLeaveClub}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Following
                </button>
              )}
            </div>

            {facility.description && (
              <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm sm:text-base">
                {facility.description}
              </p>
            )}

            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-400 font-medium">{followerCount}</span>
              </div>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-400 font-medium">{courts.length} Courts</span>
              </div>
            </div>
          </div>
        </div>

        {(facility.phone || facility.email || facility.website) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            {facility.phone && (
              <a
                href={`tel:${facility.phone}`}
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Phone</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{facility.phone}</div>
                </div>
              </a>
            )}
            {facility.email && (
              <a
                href={`mailto:${facility.email}`}
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Email</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{facility.email}</div>
                </div>
              </a>
            )}
            {facility.website && (
              <a
                href={facility.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Website</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">Visit Site</div>
                </div>
              </a>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-28">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Our Courts ({courts.length})
              </h2>

              {nextAvailableTime && availableCourtsAtTime.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-5 mb-6 border-2 border-emerald-200 dark:border-emerald-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-800/50">
                      <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Next Available</h3>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{nextAvailableTime}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    {availableCourtsAtTime.length} {availableCourtsAtTime.length === 1 ? 'court' : 'courts'} available right now
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
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
                        className="bg-white dark:bg-slate-800 rounded-lg p-3 border-2 border-emerald-500 dark:border-emerald-600 hover:border-emerald-600 dark:hover:border-emerald-500 hover:shadow-lg transition-all text-left group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                            {court.name}
                          </h4>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                        </div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Click to book
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {courts.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
                  <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No courts available</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
                      className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                          {court.name}
                        </h3>
                        <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {court.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                Community Feed
              </h2>

              {posts.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No posts yet</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
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
                      className="mt-3 w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-300 rounded-lg font-semibold transition-colors"
                    >
                      Show More Posts ({Math.min(3, posts.length - visiblePostsCount)} more)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Event Calendar
              </h2>

              <EventCalendar facilityId={facilityId} />
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-5 border border-emerald-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Star className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Quick Stats
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/90 dark:bg-slate-700/50 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Courts</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{courts.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/90 dark:bg-slate-700/50 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Members</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{followerCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/90 dark:bg-slate-700/50 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Events</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{eventsCount}</span>
                </div>
              </div>
            </div>

            {!isMember && user && (
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl p-6 text-white shadow-lg">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    Follow This Club
                  </h3>
                  <p className="text-emerald-50 mb-4 text-sm">
                    Stay updated on events and connect with members.
                  </p>
                  <button
                    onClick={handleJoinClub}
                    className="w-full px-4 py-2.5 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 font-semibold transition-colors shadow-md"
                  >
                    Follow Now
                  </button>
                </div>
              </div>
            )}

            {!user && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 dark:from-slate-700 dark:to-slate-600 rounded-xl p-6 text-white shadow-lg">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    Sign In to Follow
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Join to access exclusive content and events.
                  </p>
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
