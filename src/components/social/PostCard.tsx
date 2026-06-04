import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Calendar, Clock, Users, MapPin, Trophy, MoreHorizontal, Trash2, X, ChevronLeft, ChevronRight, Bookmark, CreditCard } from 'lucide-react';
import { SocialPost, toggleLike, joinMatch, leaveMatch, formatTimeAgo, deletePost, bookmarkPost, unbookmarkPost, getMatchParticipants } from '../../lib/socialUtils';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import MatchPaymentModal from './MatchPaymentModal';
import PollPost from './PollPost';

interface PostCardProps {
  post: SocialPost;
  onClick: () => void;
  onUpdate?: () => void;
  onClubClick?: (facilityId: string) => void;
  onProfileClick?: (userId: string) => void;
}

interface Participant {
  id: string;
  user_id: string;
  profiles: {
    id: string;
    full_name: string;
    profile_picture_url?: string;
  };
}

export default function PostCard({ post, onClick, onUpdate, onClubClick, onProfileClick }: PostCardProps) {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [userLiked, setUserLiked] = useState(post.user_liked || false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [expandedImage, setExpandedImage] = useState<number | null>(null);
  const [isPostBookmarked, setIsPostBookmarked] = useState(post.user_bookmarked || false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    courtId: string;
    facilityId: string;
    courtName: string;
    facilityName: string;
    pricePerPerson: number;
    totalAmount: number;
    durationHours: number;
  } | null>(null);

  useEffect(() => {
    setLikesCount(post.likes_count || 0);
    setUserLiked(post.user_liked || false);
    setCommentsCount(post.comments_count || 0);
    setIsPostBookmarked(post.user_bookmarked || false);
    checkJoinStatus();
    if (post.post_type === 'match_invite') {
      loadParticipants();
    }
  }, [post.id]);

  useEffect(() => {
    if (likesCount < (post.likes_count || 0)) {
      setLikesCount(post.likes_count || 0);
    }
  }, [post.likes_count]);

  useEffect(() => {
    if (commentsCount < (post.comments_count || 0)) {
      setCommentsCount(post.comments_count || 0);
    }
  }, [post.comments_count]);

  useEffect(() => {
    if (post.spots_filled !== undefined) {
      loadParticipants();
    }
  }, [post.spots_filled]);

  async function loadParticipants() {
    const data = await getMatchParticipants(post.id);
    setParticipants(data);
  }

  function calculateDuration(start: string, end: string): number {
    if (!start || !end) return 1;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return (endMinutes - startMinutes) / 60;
  }

  async function checkJoinStatus() {
    if (!user || post.post_type !== 'match_invite') return;

    const { data } = await import('../../lib/supabase').then(m =>
      m.supabase
        .from('social_post_participants')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle()
    );

    setHasJoined(!!data);
  }

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation();

    if (!user) {
      alert('Please log in to like posts');
      return;
    }

    const result = await toggleLike(post.id);
    if (result.success) {
      setUserLiked(result.liked);
      setLikesCount(prev => result.liked ? prev + 1 : prev - 1);
    } else {
      console.error('Failed to toggle like:', result.error);
      alert(result.error || 'Failed to like post. Please try again.');
    }
  }

  async function handleJoinMatch(e: React.MouseEvent) {
    e.stopPropagation();

    if (!user) {
      alert('Please log in to join matches');
      return;
    }

    setLoading(true);

    if (hasJoined) {
      const result = await leaveMatch(post.id);
      if (result.success) {
        setHasJoined(false);
        await loadParticipants();
        onUpdate?.();
      }
      setLoading(false);
    } else {
      const result = await joinMatch(post.id);

      if (result.requiresPayment && result.courtData) {
        const startTime = post.bookings?.start_time || post.play_start_time || '';
        const endTime = post.bookings?.end_time || post.play_end_time || '';
        const duration = calculateDuration(startTime, endTime);

        setPaymentDetails({
          courtId: result.courtData.courtId,
          facilityId: result.courtData.facilityId,
          courtName: result.courtData.courtName,
          facilityName: result.courtData.facilityName,
          pricePerPerson: result.pricePerPerson || 0,
          totalAmount: result.courtData.totalAmount || 0,
          durationHours: duration
        });
        setShowPaymentModal(true);
        setLoading(false);
      } else if (result.success) {
        setHasJoined(true);
        await loadParticipants();
        onUpdate?.();
        setLoading(false);
      } else if (result.error) {
        alert(result.error);
        setLoading(false);
      }
    }
  }

  async function handleDeletePost(e: React.MouseEvent) {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    const result = await deletePost(post.id);
    if (result.success) {
      onUpdate?.();
    } else {
      alert(result.error || 'Failed to delete post');
    }
    setShowMenu(false);
  }

  async function handleBookmark(e: React.MouseEvent) {
    e.stopPropagation();

    if (!user) {
      alert('Please log in to bookmark posts');
      return;
    }

    if (isPostBookmarked) {
      const result = await unbookmarkPost(post.id);
      if (result.success) {
        setIsPostBookmarked(false);
        onUpdate?.();
      } else {
        console.error('Failed to unbookmark:', result.error);
        alert(result.error || 'Failed to remove bookmark');
      }
    } else {
      const result = await bookmarkPost(post.id);
      if (result.success) {
        setIsPostBookmarked(true);
        onUpdate?.();
      } else {
        console.error('Failed to bookmark:', result.error);
        alert(result.error || 'Failed to bookmark post');
      }
    }
  }

  const isFull = post.spots_needed && post.spots_filled >= post.spots_needed;
  const spotsLeft = post.spots_needed ? post.spots_needed - post.spots_filled : 0;

  function formatTime(time: string): string {
    if (!time) return 'TBD';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
  }

  function handleImageClick(e: React.MouseEvent, index: number) {
    e.stopPropagation();
    setExpandedImage(index);
  }

  function handleNextImage() {
    if (post.media_urls && expandedImage !== null) {
      setExpandedImage((expandedImage + 1) % post.media_urls.length);
    }
  }

  function handlePrevImage() {
    if (post.media_urls && expandedImage !== null) {
      setExpandedImage((expandedImage - 1 + post.media_urls.length) % post.media_urls.length);
    }
  }

  return (
    <>
      {showPaymentModal && paymentDetails && (
        <MatchPaymentModal
          postId={post.id}
          courtId={paymentDetails.courtId}
          facilityId={paymentDetails.facilityId}
          courtName={paymentDetails.courtName}
          pricePerPerson={paymentDetails.pricePerPerson}
          totalAmount={paymentDetails.totalAmount}
          durationHours={paymentDetails.durationHours}
          matchDetails={{
            sport: post.sport || 'pickleball',
            date: post.bookings?.booking_date || post.play_date || '',
            startTime: post.bookings?.start_time?.slice(0, 5) || post.play_start_time?.slice(0, 5) || '',
            endTime: post.bookings?.end_time?.slice(0, 5) || post.play_end_time?.slice(0, 5) || '',
            courtName: paymentDetails.courtName,
            facilityName: paymentDetails.facilityName
          }}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentDetails(null);
          }}
          onSuccess={async () => {
            setShowPaymentModal(false);
            setPaymentDetails(null);
            setHasJoined(true);
            await loadParticipants();
            onUpdate?.();
          }}
        />
      )}

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {expandedImage !== null && post.media_urls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setExpandedImage(null)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedImage(null);
              }}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition z-10 p-2 rounded-full hover:bg-white/10"
            >
              <X className="w-7 h-7" />
            </button>

            {post.media_urls.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute left-4 text-white/80 hover:text-white transition z-10 p-2 rounded-full hover:bg-white/10"
                >
                  <ChevronLeft className="w-9 h-9" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-4 text-white/80 hover:text-white transition z-10 p-2 rounded-full hover:bg-white/10"
                >
                  <ChevronRight className="w-9 h-9" />
                </button>
              </>
            )}

            {post.media_urls[expandedImage].match(/\.(mp4|webm|mov)(\?|$)/i) ? (
              <video
                src={post.media_urls[expandedImage]}
                controls
                className="max-w-full max-h-full rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={post.media_urls[expandedImage]}
                alt={`Post media ${expandedImage + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {post.media_urls.length > 1 && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5">
                {post.media_urls.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === expandedImage ? 'bg-white w-6' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -1 }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        className="bg-white cursor-pointer rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 mb-3 mx-3 lg:mx-0 overflow-hidden"
      >
        <div className="px-5 py-4 lg:px-6 lg:py-5">
          <div className="flex gap-3 lg:gap-3.5">
            {/* Avatar */}
            <div className={`w-10 h-10 lg:w-11 lg:h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden ring-2 ring-white shadow-sm ${
              (post.posted_as_facility === true && post.facilities?.logo_url) || (!post.posted_as_facility && post.profiles?.profile_picture_url)
                ? 'bg-white'
                : 'bg-gradient-to-br from-green-600 to-green-700'
            }`}>
              {post.posted_as_facility === true && post.facilities?.logo_url ? (
                <img
                  src={post.facilities.logo_url}
                  alt={post.facilities.name || 'Facility'}
                  className="w-full h-full object-cover"
                />
              ) : post.profiles?.profile_picture_url ? (
                <img
                  src={post.profiles.profile_picture_url}
                  alt={post.profiles.full_name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm lg:text-base">
                  {post.posted_as_facility === true && post.facilities?.name
                    ? post.facilities.name.charAt(0).toUpperCase()
                    : (post.profiles?.full_name?.charAt(0).toUpperCase() || 'U')}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Author Info */}
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (post.posted_as_facility === true && post.facilities?.slug) {
                        onClubClick?.(post.facilities.slug);
                      } else if (post.profiles?.id) {
                        onProfileClick?.(post.profiles.id);
                      }
                    }}
                    className="text-sm font-bold text-slate-800 hover:text-green-700 truncate transition-colors"
                  >
                    {post.posted_as_facility === true && post.facilities?.name
                      ? post.facilities.name
                      : (post.profiles?.full_name || 'Unknown User')}
                  </button>
                  <span className="text-slate-300 text-xs flex-shrink-0">&middot;</span>
                  <span className="text-xs text-slate-400 font-medium flex-shrink-0">{formatTimeAgo(post.created_at)}</span>
                </div>
                {user && user.id === post.author_id && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                      }}
                      className="p-1.5 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-slate-600"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-200/60 py-1.5 z-10"
                        >
                          <button
                            onClick={handleDeletePost}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Post
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Post Content */}
              {post.post_type === 'match_invite' ? (
                <div className="space-y-3">
                  <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap line-clamp-3">{post.content}</p>

                  {/* Media Grid */}
                  {post.media_urls && post.media_urls.length > 0 && (
                    <div className={`grid gap-0.5 rounded-2xl overflow-hidden border border-slate-100 ${
                      post.media_urls.length === 1 ? 'grid-cols-1' :
                      post.media_urls.length === 2 ? 'grid-cols-2' :
                      'grid-cols-2'
                    }`}>
                      {post.media_urls.slice(0, 4).map((url, idx) => {
                        const isVideo = url.match(/\.(mp4|webm|mov)(\?|$)/i);
                        return (
                          <div
                            key={idx}
                            className={`relative ${
                              post.media_urls!.length === 3 && idx === 0 ? 'col-span-2' : ''
                            } ${post.media_urls!.length === 1 ? 'h-56 sm:h-80 lg:h-96' : 'aspect-square'} bg-slate-100 overflow-hidden`}
                          >
                            {isVideo ? (
                              <video
                                src={url}
                                controls
                                className="w-full h-full object-cover"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <img
                                src={url}
                                alt={`Post media ${idx + 1}`}
                                className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                                onClick={(e) => handleImageClick(e, idx)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Link Preview */}
                  {post.link_preview && (
                    <a
                      href={post.link_preview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200"
                    >
                      {post.link_preview.image && (
                        <div className="w-full h-48 bg-slate-100 overflow-hidden">
                          <img
                            src={post.link_preview.image}
                            alt={post.link_preview.title || 'Link preview'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-3.5">
                        {post.link_preview.siteName && (
                          <div className="text-[11px] text-slate-400 mb-1 font-semibold uppercase tracking-wide">
                            {post.link_preview.siteName}
                          </div>
                        )}
                        {post.link_preview.title && (
                          <div className="font-bold text-slate-800 mb-1 line-clamp-2 text-sm">
                            {post.link_preview.title}
                          </div>
                        )}
                        {post.link_preview.description && (
                          <div className="text-xs text-slate-500 line-clamp-2 mb-2">
                            {post.link_preview.description}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 truncate">
                          {post.link_preview.url}
                        </div>
                      </div>
                    </a>
                  )}

                  {/* Match Invite Card */}
                  <div className="bg-[#F8F9FC] border border-slate-200/60 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-sm font-bold text-green-700">
                        <div className="w-8 h-8 rounded-xl bg-green-700/10 flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-green-700" />
                        </div>
                        <span>
                          {post.sport?.charAt(0).toUpperCase()}{post.sport?.slice(1)} Match
                        </span>
                      </div>
                      {post.requires_payment && post.price_per_person && (
                        <span className="text-base font-black text-green-700 bg-green-700/10 px-3 py-1 rounded-full">
                          ${post.price_per_person.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-sm text-slate-600">
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate font-medium">
                          {post.bookings?.booking_date
                            ? new Date(post.bookings.booking_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })
                            : post.play_date
                            ? new Date(post.play_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'TBD'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate font-medium">
                          {formatTime(post.bookings?.start_time || post.play_start_time || '')}
                        </span>
                      </div>

                      {(post.facilities || post.courts) && (
                        <div className="flex items-center gap-2 col-span-2 min-w-0">
                          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate font-medium">
                            {post.facilities?.name && post.courts?.name
                              ? `${post.facilities.name} - ${post.courts.name}`
                              : post.facilities?.name || post.courts?.name || 'Location TBD'}
                          </span>
                        </div>
                      )}

                      {post.skill_min !== null && post.skill_max !== null && (
                        <div className="flex items-center gap-2 min-w-0">
                          <Trophy className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate font-medium">{post.skill_min}-{post.skill_max} level</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 min-w-0">
                        <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate font-medium">
                          {post.spots_needed - post.spots_filled} {post.spots_needed - post.spots_filled === 1 ? 'spot' : 'spots'} left
                        </span>
                      </div>
                    </div>

                    {/* Spots Progress */}
                    <div className="w-full bg-slate-200/60 rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(post.spots_filled / post.spots_needed) * 100}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="bg-green-700 h-1.5 rounded-full"
                      />
                    </div>

                    {/* Participants */}
                    {participants.length > 0 && (
                      <div className="pt-1">
                        <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                          Joined Players
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {participants.map((participant, index) => (
                            <motion.button
                              key={participant.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05, duration: 0.2 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onProfileClick?.(participant.profiles.id);
                              }}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200/60 rounded-full hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 shadow-sm"
                            >
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden ring-1 ring-white">
                                {participant.profiles.profile_picture_url ? (
                                  <img
                                    src={participant.profiles.profile_picture_url}
                                    alt={participant.profiles.full_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  participant.profiles.full_name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="text-xs font-medium text-slate-600">
                                {participant.profiles.full_name}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Join Button */}
                    {user && (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleJoinMatch}
                        disabled={loading || (isFull && !hasJoined)}
                        className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          hasJoined
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                            : isFull
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-green-700 hover:bg-green-800 text-white shadow-sm'
                        }`}
                      >
                        {hasJoined
                          ? 'Leave Match'
                          : isFull
                          ? 'Match Full'
                          : post.requires_payment
                          ? `Join & Pay $${post.price_per_person?.toFixed(2)}`
                          : 'Join Match'
                        }
                      </motion.button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(post.link_preview as any)?.type === 'poll' ? (
                    <PollPost
                      postId={post.id}
                      question={(post.link_preview as any).question || post.content}
                      options={((post.link_preview as any).options || []) as string[]}
                    />
                  ) : (
                    <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">{post.content}</p>
                  )}

                  {/* Media Grid */}
                  {post.media_urls && post.media_urls.length > 0 && (
                    <div className={`grid gap-0.5 rounded-2xl overflow-hidden border border-slate-100 ${
                      post.media_urls.length === 1 ? 'grid-cols-1' :
                      post.media_urls.length === 2 ? 'grid-cols-2' :
                      'grid-cols-2'
                    }`}>
                      {post.media_urls.slice(0, 4).map((url, idx) => {
                        const isVideo = url.match(/\.(mp4|webm|mov)(\?|$)/i);
                        return (
                          <div
                            key={idx}
                            className={`relative ${
                              post.media_urls!.length === 3 && idx === 0 ? 'col-span-2' : ''
                            } ${post.media_urls!.length === 1 ? 'h-56 sm:h-80 lg:h-96' : 'aspect-square'} bg-slate-100 overflow-hidden`}
                          >
                            {isVideo ? (
                              <video
                                src={url}
                                controls
                                className="w-full h-full object-cover"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <img
                                src={url}
                                alt={`Post media ${idx + 1}`}
                                className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                                onClick={(e) => handleImageClick(e, idx)}
                              />
                            )}
                            {post.media_urls!.length > 4 && idx === 3 && !isVideo && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none rounded-lg">
                                <span className="text-white text-2xl font-bold">+{post.media_urls!.length - 4}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Link Preview */}
                  {post.link_preview && (
                    <a
                      href={post.link_preview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200"
                    >
                      {post.link_preview.image && (
                        <div className="w-full h-48 bg-slate-100 overflow-hidden">
                          <img
                            src={post.link_preview.image}
                            alt={post.link_preview.title || 'Link preview'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-3.5">
                        {post.link_preview.siteName && (
                          <div className="text-[11px] text-slate-400 mb-1 font-semibold uppercase tracking-wide">
                            {post.link_preview.siteName}
                          </div>
                        )}
                        {post.link_preview.title && (
                          <div className="font-bold text-slate-800 mb-1 line-clamp-2 text-sm">
                            {post.link_preview.title}
                          </div>
                        )}
                        {post.link_preview.description && (
                          <div className="text-xs text-slate-500 line-clamp-2 mb-2">
                            {post.link_preview.description}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 truncate">
                          {post.link_preview.url}
                        </div>
                      </div>
                    </a>
                  )}
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center gap-0.5 mt-3 lg:mt-3.5 pt-2.5 border-t border-slate-100">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={handleLike}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                    userLiked
                      ? 'bg-rose-50 text-rose-600'
                      : 'hover:bg-slate-50 text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {userLiked ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    >
                      <Heart className="w-[18px] h-[18px] fill-current" />
                    </motion.div>
                  ) : (
                    <Heart className="w-[18px] h-[18px]" />
                  )}
                  {likesCount > 0 && (
                    <span className="text-xs font-semibold">{likesCount}</span>
                  )}
                </motion.button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all duration-200"
                >
                  <MessageCircle className="w-[18px] h-[18px]" />
                  <span className="text-xs font-semibold">{commentsCount}</span>
                </button>

                <div className="flex-1" />

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleBookmark}
                  className={`group flex items-center px-2.5 py-1.5 rounded-xl transition-all duration-200 ${
                    isPostBookmarked
                      ? 'text-green-700 bg-green-50'
                      : 'hover:bg-slate-50 text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Bookmark className={`w-[18px] h-[18px] ${isPostBookmarked ? 'fill-current' : ''}`} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
