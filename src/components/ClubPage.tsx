import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Clock, MessageSquare, UserPlus, UserCheck, Phone, Mail, Globe, Activity, TrendingUp, ExternalLink, FileText, CheckCircle, AlertCircle, ShoppingBag, Plus, Minus, CreditCard, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostCard from './social/PostCard';
import { CourtScheduler } from './CourtScheduler';
import { SocialPost } from '../lib/socialUtils';
import { sortCourtsByNumber } from '../lib/courtUtils';
import EventCalendar from './EventCalendar';
import { loadStripe } from '../lib/stripe';
import MerchProductModal from './MerchProductModal';

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

type TabType = 'courts' | 'feed' | 'merch' | 'events';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

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
  const [hasSignedWaiver, setHasSignedWaiver] = useState(false);
  const [hasActiveWaiver, setHasActiveWaiver] = useState(false);
  const [merchProducts, setMerchProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabType>('courts');

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

      // Check if facility has an active waiver
      const { data: waiverData } = await supabase
        .from('facility_waivers')
        .select('id')
        .eq('facility_id', facilityId)
        .eq('active', true)
        .maybeSingle();

      setHasActiveWaiver(!!waiverData);

      // Check if user has signed the waiver
      if (user && waiverData) {
        const { data: signedWaiverData } = await supabase
          .from('signed_waivers')
          .select('id')
          .eq('facility_id', facilityId)
          .eq('user_id', user.id)
          .maybeSingle();

        setHasSignedWaiver(!!signedWaiverData);
      } else {
        setHasSignedWaiver(false);
      }

      // Load merch products
      const { data: merchData } = await supabase
        .from('merch_products')
        .select(`
          *,
          variants:merch_product_variants(*)
        `)
        .eq('facility_id', facilityId)
        .eq('is_active', true);

      setMerchProducts(merchData || []);
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

  const handleAddToCart = (item: { product: any; variant: any; quantity: number }) => {
    const existingItemIndex = cart.findIndex(
      cartItem => cartItem.product.id === item.product.id && cartItem.variant.id === item.variant.id
    );

    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += item.quantity;
      setCart(newCart);
    } else {
      setCart([...cart, item]);
    }

    setSelectedProductId(null);
  };

  const handleCheckout = async () => {
    if (!user) {
      alert('Please sign in to checkout');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    try {
      setCheckingOut(true);

      const stripe = await loadStripe();
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const lineItems = cart.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.product.name} - ${item.variant.size} - ${item.variant.color}`,
            images: item.product.images || [],
          },
          unit_amount: Math.round((parseFloat(item.product.base_price) + parseFloat(item.variant.price_adjustment)) * 100),
        },
        quantity: item.quantity,
      }));

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          lineItems,
          successUrl: `${window.location.origin}/club/${facilityId}?checkout=success`,
          cancelUrl: `${window.location.origin}/club/${facilityId}?checkout=cancel`,
          metadata: {
            facility_id: facilityId,
            user_id: user.id,
            type: 'merch_purchase',
          },
        },
      });

      if (error) throw error;

      if (data?.sessionId) {
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (stripeError) throw stripeError;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const removeFromCart = (productId: string, variantId: string) => {
    setCart(cart.filter(item => !(item.product.id === productId && item.variant.id === variantId)));
  };

  const updateCartQuantity = (productId: string, variantId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId, variantId);
      return;
    }

    setCart(cart.map(item =>
      item.product.id === productId && item.variant.id === variantId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.product.base_price) + parseFloat(item.variant.price_adjustment);
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'courts', label: 'Courts', icon: <Activity className="w-4 h-4" />, count: courts.length },
    { key: 'feed', label: 'Feed', icon: <MessageSquare className="w-4 h-4" />, count: posts.length },
    ...(merchProducts.length > 0 ? [{ key: 'merch' as TabType, label: 'Shop', icon: <ShoppingBag className="w-4 h-4" />, count: merchProducts.length }] : []),
    { key: 'events', label: 'Events', icon: <Calendar className="w-4 h-4" />, count: eventsCount },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Club not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero banner */}
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-green-600">
        {facility.hero_image_url ? (
          <img
            src={facility.hero_image_url}
            alt={facility.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200')] bg-cover bg-center opacity-20"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-md text-slate-700 rounded-xl shadow-sm hover:shadow-md hover:bg-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>Back</span>
        </button>
      </div>

      {/* Club header card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 mb-6"
        >
          <div className="flex items-start gap-4 mb-5">
            {facility.logo_url && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 ring-4 ring-white shadow-lg rounded-2xl bg-white p-2 sm:p-2.5 flex-shrink-0">
                <img
                  src={facility.logo_url}
                  alt={facility.name}
                  className="w-full h-full object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-1 line-clamp-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {facility.name}
              </h1>
              <button
                onClick={() => {
                  const address = '645 National Blvd, Medford, NY 11763';
                  const encodedAddress = encodeURIComponent(address);
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
                }}
                className="flex items-center gap-1.5 text-slate-500 hover:text-green-700 text-sm transition-colors group"
              >
                <MapPin className="w-3.5 h-3.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="font-medium truncate">{facility.city}, {facility.state}</span>
              </button>
            </div>

            <div className="flex-shrink-0">
              {!user || !isMember ? (
                <button
                  onClick={handleJoinClub}
                  className="bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold px-6 py-2.5 shadow-sm transition-all flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Follow
                </button>
              ) : (
                <button
                  onClick={handleLeaveClub}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold px-6 py-2.5 shadow-sm transition-all flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Following
                </button>
              )}
            </div>
          </div>

          {facility.description && (
            <div className="text-sm text-slate-600 leading-relaxed mb-5">
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
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
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

          {/* Stats row */}
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-700" />
              <span className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{followerCount}</span>
              <span className="text-xs text-slate-500 font-medium">Members</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-700" />
              <span className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{courts.length}</span>
              <span className="text-xs text-slate-500 font-medium">Courts</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-700" />
              <span className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{eventsCount}</span>
              <span className="text-xs text-slate-500 font-medium">Events</span>
            </div>
          </div>
        </motion.div>

        {/* Contact row */}
        {(facility.phone || facility.email || facility.website || hasActiveWaiver || facility.name === 'Pickleball Heaven') && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
          >
            {facility.phone && (
              <a
                href={`tel:${facility.phone}`}
                className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                  <Phone className="w-5 h-5 text-green-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Phone</div>
                  <div className="text-sm font-bold text-slate-900 truncate">{facility.phone}</div>
                </div>
              </a>
            )}
            {facility.email && (
              <a
                href={`mailto:${facility.email}`}
                className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                  <Mail className="w-5 h-5 text-green-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Email</div>
                  <div className="text-sm font-bold text-slate-900 truncate">{facility.email}</div>
                </div>
              </a>
            )}
            {facility.website && (
              <a
                href={facility.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                  <Globe className="w-5 h-5 text-green-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Website</div>
                  <div className="text-sm font-bold text-slate-900 truncate">See Website</div>
                </div>
              </a>
            )}
            {hasActiveWaiver && user && (
              <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className={`w-10 h-10 rounded-xl ${hasSignedWaiver ? 'bg-green-50' : 'bg-red-50'} flex items-center justify-center flex-shrink-0`}>
                  {hasSignedWaiver ? (
                    <CheckCircle className="w-5 h-5 text-green-700" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Waiver</div>
                  <div className={`text-sm font-bold ${hasSignedWaiver ? 'text-green-700' : 'text-red-600'} truncate`}>
                    {hasSignedWaiver ? 'Signed' : 'Required'}
                  </div>
                </div>
              </div>
            )}
            {facility.name === 'Pickleball Heaven' && (
              <a
                href="https://gotab.io/loc/pickleballheaven"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                  <Utensils className="w-5 h-5 text-green-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Food & Drinks</div>
                  <div className="text-sm font-bold text-slate-900 truncate">Order Food</div>
                </div>
              </a>
            )}
          </motion.div>
        )}

        {/* Tab navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6 p-1.5"
        >
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentTab(tab.key)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors ${
                  currentTab === tab.key
                    ? 'text-green-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {currentTab === tab.key && (
                  <motion.div
                    layoutId="clubTab"
                    className="absolute inset-0 bg-green-50 border border-green-200 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      currentTab === tab.key
                        ? 'bg-green-700 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24">
          <div className="lg:col-span-2 space-y-6">
            {/* Courts tab */}
            {currentTab === 'courts' && (
              <motion.div
                key="courts"
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
              >
                <h2 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Our Courts
                </h2>

                {nextAvailableTime && availableCourtsAtTime.length > 0 && (
                  <motion.div
                    variants={cardVariants}
                    className="bg-green-700 rounded-2xl p-5 mb-5 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white/80 text-xs uppercase tracking-wide mb-0.5">Next Available</h3>
                        <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>{nextAvailableTime}</p>
                      </div>
                    </div>
                    <p className="text-white/85 font-medium mb-3 text-sm">
                      {availableCourtsAtTime.length} {availableCourtsAtTime.length === 1 ? 'court' : 'courts'} available
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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
                          className="bg-white rounded-xl p-3 hover:shadow-md transition-all text-left group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-slate-900 text-sm truncate pr-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                              {court.name}
                            </h4>
                            <div className="w-2 h-2 rounded-full bg-green-600 group-hover:scale-125 transition-transform flex-shrink-0" />
                          </div>
                          <p className="text-xs text-green-700 font-semibold">
                            Book Now
                          </p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {courts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                    <Activity className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">No courts available</p>
                  </div>
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                  >
                    {courts.map((court) => (
                      <motion.div key={court.id} variants={cardVariants}>
                        <button
                          onClick={() => {
                            if (!user) {
                              alert('Please sign in to book a court');
                              return;
                            }
                            setSelectedCourtId(court.id);
                            setShowScheduler(true);
                          }}
                          className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all text-left group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-900 text-base truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                {court.name}
                              </h3>
                              {facility && (
                                <p className="text-xs text-slate-400 mt-1">
                                  {facility.city}, {facility.state}
                                </p>
                              )}
                            </div>
                            <Activity className="w-5 h-5 text-green-600 flex-shrink-0 group-hover:scale-110 transition-transform ml-2" />
                          </div>
                          <div className="text-xs font-semibold text-green-700 mt-2">
                            View Schedule
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Feed tab */}
            {currentTab === 'feed' && (
              <motion.div
                key="feed"
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
              >
                <h2 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Community Feed
                </h2>

                {posts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">No posts yet</p>
                  </div>
                ) : (
                  <>
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="space-y-4"
                    >
                      {posts.slice(0, visiblePostsCount).map((post) => (
                        <motion.div key={post.id} variants={cardVariants}>
                          <PostCard
                            post={post}
                            onClick={() => navigate(`/post/${post.id}`)}
                            onUpdate={loadFacilityData}
                            onProfileClick={(userId) => navigate(`/player/${userId}`)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                    {posts.length > visiblePostsCount && (
                      <button
                        onClick={() => setVisiblePostsCount(prev => prev + 3)}
                        className="mt-4 w-full px-4 py-2.5 bg-white border border-slate-100 hover:border-green-600 text-slate-700 rounded-xl font-semibold transition-all shadow-sm"
                      >
                        Show More Posts
                      </button>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* Merch tab */}
            {currentTab === 'merch' && merchProducts.length > 0 && (
              <motion.div
                key="merch"
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
              >
                <h2 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Shop Merch
                </h2>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                  {merchProducts.slice(0, 6).map((product) => (
                    <motion.div key={product.id} variants={cardVariants}>
                      <button
                        onClick={() => setSelectedProductId(product.id)}
                        className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all text-left group"
                      >
                        <div className="aspect-square bg-slate-50 flex items-center justify-center overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <ShoppingBag className="w-12 h-12 text-slate-200" />
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-sm mb-1 text-slate-900 line-clamp-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{product.name}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-green-700">${parseFloat(product.base_price).toFixed(2)}</span>
                            <span className="text-xs text-slate-400 font-medium">Click to view</span>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </motion.div>

                {merchProducts.length > 6 && (
                  <button
                    onClick={() => navigate('/merch')}
                    className="mt-4 w-full px-4 py-2.5 bg-white border border-slate-100 hover:border-green-600 text-slate-700 rounded-xl font-semibold transition-all shadow-sm"
                  >
                    View All Merch
                  </button>
                )}

                {cart.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 bg-green-700 rounded-2xl p-4 text-white shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        <span className="font-bold">Cart ({getCartItemCount()} items)</span>
                      </div>
                      <span className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        ${getCartTotal().toFixed(2)}
                      </span>
                    </div>
                    <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                      {cart.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-white/10 rounded-lg p-2">
                          <div className="flex-1 min-w-0 mr-2">
                            <div className="font-semibold truncate">{item.product.name}</div>
                            <div className="text-xs text-white/80">{item.variant.size} - {item.variant.color}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCartQuantity(item.product.id, item.variant.id, item.quantity - 1);
                              }}
                              className="p-0.5 hover:bg-white/20 rounded"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCartQuantity(item.product.id, item.variant.id, item.quantity + 1);
                              }}
                              className="p-0.5 hover:bg-white/20 rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleCheckout}
                      disabled={checkingOut}
                      className="w-full py-2.5 bg-white text-green-700 rounded-xl font-bold hover:bg-green-50 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {checkingOut ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Checkout with Stripe
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Events tab */}
            {currentTab === 'events' && (
              <motion.div
                key="events"
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
              >
                <h2 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Event Calendar
                </h2>
                <EventCalendar facilityId={facilityId} />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Upcoming Events
              </h2>
              <EventCalendar facilityId={facilityId} />
            </motion.div>

            {!isMember && user && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
              >
                <div className="text-center">
                  <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="w-7 h-7 text-green-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5" style={{ fontFamily: 'Manrope, sans-serif' }}>Follow This Club</h3>
                  <p className="text-slate-500 mb-4 text-sm">Stay updated on events and connect with members.</p>
                  <button
                    onClick={handleJoinClub}
                    className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold px-6 py-2.5 shadow-sm transition-all"
                  >
                    Follow Now
                  </button>
                </div>
              </motion.div>
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

      {selectedProductId && (
        <MerchProductModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}
