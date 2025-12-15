import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Clock, MessageSquare, UserPlus, UserCheck, Phone, Mail, Globe, Activity, TrendingUp, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostCard from './social/PostCard';
import { CourtScheduler } from './CourtScheduler';
import { SocialPost } from '../lib/socialUtils';
import { sortCourtsByNumber } from '../lib/courtUtils';
import EventCalendar from './EventCalendar';
import { PhotoGallery } from './facility/PhotoGallery';
import { AmenitiesShowcase } from './facility/AmenitiesShowcase';
import { TestimonialsCarousel } from './facility/TestimonialsCarousel';
import { LiveCourtStatus } from './facility/LiveCourtStatus';
import { OperatingHoursTimeline } from './facility/OperatingHoursTimeline';
import { ActivityHeatmap } from './facility/ActivityHeatmap';
import { FloatingBookButton } from './facility/FloatingBookButton';
import { UpcomingEvents } from './facility/UpcomingEvents';
import { InteractiveMap } from './facility/InteractiveMap';

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
  hero_image_url: string;
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
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFacilityData();
  }, [facilityId, user]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const parallaxOffset = scrollY * 0.5;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div
        ref={heroRef}
        className="relative h-80 md:h-96 overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 animate-pulse opacity-30" />

        {facility.hero_image_url ? (
          <img
            src={facility.hero_image_url}
            alt={facility.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-75"
            style={{ transform: `translateY(${parallaxOffset}px)` }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div
            className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200')] bg-cover bg-center opacity-20"
            style={{ transform: `translateY(${parallaxOffset}px)` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-transparent to-teal-600/20 animate-pulse" />

        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-700 dark:text-slate-200 rounded-xl shadow-lg hover:shadow-xl hover:bg-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back</span>
        </button>

        <div className="absolute top-4 right-4 flex gap-3 z-10">
          <div className="backdrop-blur-md bg-white/95 dark:bg-slate-900/95 rounded-xl px-4 py-2 shadow-lg border border-white/50 animate-float">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Members</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{followerCount}</p>
              </div>
            </div>
          </div>
          <div className="backdrop-blur-md bg-white/95 dark:bg-slate-900/95 rounded-xl px-4 py-2 shadow-lg border border-white/50 animate-float" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Courts</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{courts.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-end gap-4">
            {facility.logo_url && (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-slate-800 p-3 shadow-2xl flex-shrink-0 border-4 border-white/50 backdrop-blur-sm">
                <img
                  src={facility.logo_url}
                  alt={facility.name}
                  className="w-full h-full object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </div>
            )}
            <div className="flex-1 pb-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg line-clamp-2">
                {facility.name}
              </h1>
              <button
                onClick={() => {
                  const encodedAddress = encodeURIComponent(`${facility.address}, ${facility.city}, ${facility.state}`);
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
                }}
                className="flex items-center gap-2 text-white/95 hover:text-white text-base sm:text-lg transition-colors group"
              >
                <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="font-semibold drop-shadow truncate">{facility.city}, {facility.state}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-6 mb-6 border border-slate-200 dark:border-slate-700">
          {facility.description && (
            <div className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-6 mt-4">
              {facility.description.split('\n').map((line, index) => {
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const parts = line.split(urlRegex);

                return (
                  <React.Fragment key={index}>
                    {parts.map((part, partIndex) => {
                      if (part.match(urlRegex)) {
                        return (
                          <a
                            key={partIndex}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
                          >
                            <Globe className="w-4 h-4" />
                            See Website
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        );
                      }
                      return part;
                    })}
                    {index < facility.description.split('\n').length - 1 && <br />}
                  </React.Fragment>
                );
              })}
            </div>
          )}

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

        <PhotoGallery facilityId={facilityId} />

        <AmenitiesShowcase facilityId={facilityId} />

        <TestimonialsCarousel facilityId={facilityId} />

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
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">See Website</div>
                </div>
              </a>
            )}
          </div>
        )}

        <OperatingHoursTimeline facilityId={facilityId} />

        <ActivityHeatmap facilityId={facilityId} />

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

              <LiveCourtStatus
                facilityId={facilityId}
                onCourtClick={(courtId) => {
                  if (!user) {
                    alert('Please sign in to book a court');
                    return;
                  }
                  setSelectedCourtId(courtId);
                  setShowScheduler(true);
                }}
              />

            </div>

            <UpcomingEvents
              facilityId={facilityId}
              onViewAll={() => {}}
            />

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
            <InteractiveMap
              address={facility.address}
              city={facility.city}
              state={facility.state}
              facilityName={facility.name}
            />

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

      <FloatingBookButton
        nextAvailableTime={nextAvailableTime}
        onClick={() => {
          if (!user) {
            alert('Please sign in to book a court');
            return;
          }
          if (availableCourtsAtTime.length > 0) {
            setSelectedCourtId(availableCourtsAtTime[0].id);
          }
          setShowScheduler(true);
        }}
      />

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
