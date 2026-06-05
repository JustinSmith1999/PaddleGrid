import ProBadge from './ProBadge';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Heart, Users, Calendar, Clock, MapPin, Trophy, Trash2, MoreHorizontal } from 'lucide-react';
import {
  getPostById,
  getPostComments,
  addComment,
  toggleLike,
  getMatchParticipants,
  joinMatch,
  leaveMatch,
  formatTimeAgo,
  deletePost,
  deleteComment,
  getPostLikedByUsers,
  Comment
} from '../../lib/socialUtils';
import { moderateContent } from '../../lib/contentModeration';
import { useAuth } from '../../contexts/AuthContext';
import MatchPaymentModal from './MatchPaymentModal';

interface PostDetailProps {
  postId: string;
  onBack: () => void;
  onProfileClick?: (userId: string) => void;
  onClubClick?: (slug: string) => void;
}

export default function PostDetail({ postId, onBack, onProfileClick, onClubClick }: PostDetailProps) {
  const { user, profile } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [likesCount, setLikesCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showCommentMenu, setShowCommentMenu] = useState<string | null>(null);
  const [likedByUsers, setLikedByUsers] = useState<Array<{ id: string; full_name: string; profile_picture_url?: string }>>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    bookingId: string;
    pricePerPerson: number;
  } | null>(null);

  useEffect(() => {
    loadPostData();
  }, [postId]);

  function formatTime(time: string): string {
    if (!time) return 'TBD';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
  }

  async function loadPostData() {
    setLoading(true);
    const postData = await getPostById(postId);
    setPost(postData);

    if (postData) {
      setLikesCount(postData.likes_count || 0);
      setUserLiked(postData.user_liked || false);
    }

    const commentsData = await getPostComments(postId);
    setComments(commentsData);

    if (postData?.post_type === 'match_invite') {
      const participantsData = await getMatchParticipants(postId);
      setParticipants(participantsData);

      const userParticipant = participantsData.find((p: any) => p.user_id === user?.id);
      setHasJoined(!!userParticipant);
    }

    await loadLikes(postData?.likes_count || 0);

    setLoading(false);
  }

  async function loadLikes(count: number) {
    if (count > 0) {
      const likes = await getPostLikedByUsers(postId);
      setLikedByUsers(likes);
    } else {
      setLikedByUsers([]);
    }
  }

  async function handleLike() {
    if (!user) {
      alert('Please log in to like posts');
      return;
    }

    const result = await toggleLike(postId);
    if (result.success) {
      setUserLiked(result.liked);
      const newCount = result.liked ? likesCount + 1 : likesCount - 1;
      setLikesCount(newCount);
      await loadLikes(newCount);
    } else {
      alert('Failed to like post. Please try again.');
    }
  }

  async function handleSubmitComment() {
    if (!newComment.trim()) return;

    if (!user) {
      alert('Please log in to comment');
      return;
    }

    const moderationResult = moderateContent(newComment);
    if (!moderationResult.isClean) {
      alert(moderationResult.reason || 'Your comment contains inappropriate content');
      return;
    }

    setSubmitting(true);
    const result = await addComment(postId, newComment);

    if (result.success) {
      setComments([...comments, result.comment!]);
      setNewComment('');
    } else {
      alert(result.error);
    }

    setSubmitting(false);
  }

  async function handleJoinMatch() {
    if (!user) {
      alert('Please log in to join matches');
      return;
    }

    if (hasJoined) {
      const result = await leaveMatch(postId);
      if (result.success) {
        setHasJoined(false);
        loadPostData();
      }
    } else {
      const result = await joinMatch(postId);

      if (result.requiresPayment && result.bookingId && result.pricePerPerson) {
        setPaymentDetails({
          bookingId: result.bookingId,
          pricePerPerson: result.pricePerPerson
        });
        setShowPaymentModal(true);
      } else if (result.success) {
        setHasJoined(true);
        loadPostData();
      } else if (result.error) {
        alert(result.error);
      }
    }
  }

  async function handleDeletePost() {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    const result = await deletePost(postId);
    if (result.success) {
      onBack();
    } else {
      alert(result.error || 'Failed to delete post');
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    const result = await deleteComment(commentId);
    if (result.success) {
      setComments(comments.filter(c => c.id !== commentId));
    } else {
      alert(result.error || 'Failed to delete comment');
    }
    setShowCommentMenu(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400 font-medium">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">?</span>
          </div>
          <p className="text-sm text-slate-500 font-medium">Post not found</p>
          <button
            onClick={onBack}
            className="mt-4 text-green-700 hover:text-green-800 font-semibold text-sm transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isFull = post.spots_needed && post.spots_filled >= post.spots_needed;

  return (
    <>
      {showPaymentModal && paymentDetails && post && (
        <MatchPaymentModal
          postId={postId}
          bookingId={paymentDetails.bookingId}
          pricePerPerson={paymentDetails.pricePerPerson}
          matchDetails={{
            sport: post.sport || 'pickleball',
            date: post.bookings?.booking_date || post.play_date || '',
            startTime: formatTime(post.bookings?.start_time || post.play_start_time || ''),
            endTime: formatTime(post.bookings?.end_time || post.play_end_time || ''),
            courtName: post.courts?.name || 'Court'
          }}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentDetails(null);
          }}
          onSuccess={async () => {
            setShowPaymentModal(false);
            setPaymentDetails(null);
            setHasJoined(true);
            loadPostData();
          }}
        />
      )}

      <div className="min-h-screen bg-[#F8F9FC]">
        {/* Header */}
        <div className="bg-white border-b border-slate-200/60 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-slate-800">Post</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-4">
          {/* Post Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 sm:p-8"
          >
            {/* Author */}
            <div className="flex items-start gap-3.5 mb-5">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 overflow-hidden ring-2 ring-white shadow-sm ${
                (post.posted_as_facility === true && post.facilities?.logo_url) || (!post.posted_as_facility && post.profiles?.profile_picture_url)
                  ? 'bg-white'
                  : 'bg-gradient-to-br from-green-700 to-green-600'
              }`}>
                {post.posted_as_facility === true && post.facilities?.logo_url ? (
                  <img
                    src={post.facilities.logo_url}
                    alt={post.facilities?.name || 'Facility'}
                    className="w-full h-full object-cover"
                  />
                ) : post.profiles?.profile_picture_url ? (
                  <img
                    src={post.profiles.profile_picture_url}
                    alt={post.profiles?.full_name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {post.posted_as_facility === true && post.facilities?.name
                      ? post.facilities.name.charAt(0).toUpperCase()
                      : (post.profiles?.full_name?.charAt(0).toUpperCase() || 'U')}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={() => {
                        if (post.posted_as_facility === true && post.facilities?.slug) {
                          onClubClick?.(post.facilities.slug);
                        } else if (post.profiles?.id) {
                          onProfileClick?.(post.profiles.id);
                        }
                      }}
                      className="font-bold text-lg text-slate-800 hover:text-green-700 text-left transition-colors"
                    >
                      {post.posted_as_facility === true && post.facilities?.name
                        ? post.facilities.name
                        : (post.profiles?.full_name || 'Unknown User')}
                    </button>
                    {!post.posted_as_facility && <ProBadge isPro={(post.profiles as any)?.is_pro} />}
                    {post.post_type === 'match_invite' && (
                      <span className="px-2.5 py-0.5 bg-green-700/10 text-green-700 text-xs font-semibold rounded-full">
                        Match Invite
                      </span>
                    )}
                  </div>
                  {user && user.id === post.author_id && (
                    <div className="relative">
                      <button
                        onClick={() => setShowPostMenu(!showPostMenu)}
                        className="p-2 hover:bg-slate-50 rounded-xl transition-all duration-200 text-slate-400 hover:text-slate-600"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      <AnimatePresence>
                        {showPostMenu && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
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
                <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5 flex-wrap">
                  {post.facilities && post.posted_as_facility !== true && (
                    <>
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="break-words text-xs">{post.facilities.name}</span>
                      <span className="flex-shrink-0 text-slate-300">&middot;</span>
                    </>
                  )}
                  <span className="whitespace-nowrap text-xs">{formatTimeAgo(post.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="mb-5">
              <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Match Invite Section */}
            {post.post_type === 'match_invite' && (
              <div className="bg-[#F8F9FC] rounded-2xl p-5 sm:p-6 mb-5 border border-slate-200/60">
                <div className="flex items-center gap-2.5 text-lg font-bold text-slate-800 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-green-700/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-green-700" />
                  </div>
                  {post.sport?.charAt(0).toUpperCase()}{post.sport?.slice(1)} Match
                  {post.bookings && (
                    <span className="ml-auto text-[10px] px-2.5 py-1 bg-green-700/10 text-green-700 rounded-full font-bold uppercase tracking-wide">
                      Court Booked
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2.5 text-slate-600 min-w-0">
                    <Calendar className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate text-sm font-medium">
                      {post.bookings?.booking_date
                        ? new Date(post.bookings.booking_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })
                        : post.play_date
                        ? new Date(post.play_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'TBD'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-600 min-w-0">
                    <Clock className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate text-sm font-medium">
                      {post.bookings
                        ? `${formatTime(post.bookings.start_time)} - ${formatTime(post.bookings.end_time)}`
                        : `${formatTime(post.play_start_time || '')} - ${formatTime(post.play_end_time || '')}`}
                    </span>
                  </div>

                  {post.courts && (
                    <div className="flex items-center gap-2.5 text-slate-600 sm:col-span-2">
                      <MapPin className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                      <span className="break-words text-sm font-medium">{post.courts.name}</span>
                    </div>
                  )}

                  {post.skill_min !== null && post.skill_max !== null && (
                    <div className="flex items-center gap-2.5 text-slate-600 min-w-0">
                      <Trophy className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate text-sm font-medium">Skill: {post.skill_min} - {post.skill_max}</span>
                    </div>
                  )}

                  {post.requires_payment && post.price_per_person && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <span className="text-lg font-black text-green-700">${post.price_per_person.toFixed(2)} per person</span>
                    </div>
                  )}
                </div>

                {/* Players & Join */}
                <div className="border-t border-slate-200/60 pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Users className="w-5 h-5 text-slate-500 flex-shrink-0" />
                      <span className="text-base font-bold text-slate-800">
                        {post.spots_filled} / {post.spots_needed} players
                      </span>
                      {!isFull && (
                        <span className="text-xs font-semibold text-green-700 bg-green-700/10 px-2 py-0.5 rounded-full">
                          {post.spots_needed - post.spots_filled} {post.spots_needed - post.spots_filled === 1 ? 'spot' : 'spots'} left
                        </span>
                      )}
                    </div>

                    {user && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleJoinMatch}
                        disabled={isFull && !hasJoined}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                          hasJoined
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                            : isFull
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-green-700 text-white hover:bg-green-800 shadow-sm'
                        }`}
                      >
                        {hasJoined ? "I'm Out" : isFull ? 'Full' : "I'm In!"}
                      </motion.button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/60 rounded-full h-1.5 mb-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(post.spots_filled / post.spots_needed) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="bg-green-700 h-1.5 rounded-full"
                    />
                  </div>

                  {participants.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Participants</h4>
                      <div className="flex flex-wrap gap-2">
                        {participants.map((p, index) => (
                          <motion.div
                            key={p.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                            className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/60 shadow-sm"
                          >
                            <div className="w-6 h-6 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-1 ring-white overflow-hidden">
                              {p.profiles?.profile_picture_url ? (
                                <img src={p.profiles.profile_picture_url} alt={p.profiles?.full_name} className="w-full h-full object-cover" />
                              ) : (
                                p.profiles?.full_name?.charAt(0).toUpperCase() || 'U'
                              )}
                            </div>
                            <span className="text-xs font-medium text-slate-700">{p.profiles?.full_name || 'Unknown User'}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Like / Comment Actions */}
            <div className="flex items-center gap-1 pt-4 border-t border-slate-100">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                  userLiked
                    ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-rose-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${userLiked ? 'fill-current' : ''}`} />
                <span className="font-semibold">{likesCount}</span>
              </motion.button>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 text-sm font-medium">
                <Users className="w-5 h-5" />
                <span className="font-semibold">{comments.length}</span>
              </div>
            </div>

            {/* Liked By */}
            {likedByUsers.length > 0 && (
              <div className="mt-3 text-sm text-slate-500">
                Liked by{' '}
                <button
                  onClick={() => onProfileClick?.(likedByUsers[0].id)}
                  className="font-bold text-slate-800 hover:text-green-700 transition-colors"
                >
                  {likedByUsers[0].full_name}
                </button>
                {likedByUsers.length > 1 && (
                  <>
                    {' '}and{' '}
                    {likedByUsers.length === 2 ? (
                      <button
                        onClick={() => onProfileClick?.(likedByUsers[1].id)}
                        className="font-bold text-slate-800 hover:text-green-700 transition-colors"
                      >
                        {likedByUsers[1].full_name}
                      </button>
                    ) : (
                      <span className="font-bold text-slate-800">
                        {likesCount - 1} {likesCount - 1 === 1 ? 'other' : 'others'}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>

          {/* Comments Section */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
          >
            <div className="px-5 sm:px-8 pt-5 sm:pt-6 pb-3">
              <h3 className="text-base font-bold text-slate-800">Comments</h3>
            </div>

            {comments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 px-5">
                <p className="text-sm font-medium">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="px-5 sm:px-8 py-3.5 hover:bg-slate-50/50 transition-colors duration-200"
                  >
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-700 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
                        {comment.profiles?.profile_picture_url ? (
                          <img
                            src={comment.profiles.profile_picture_url}
                            alt={comment.profiles.full_name || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{comment.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  if (comment.profiles?.id) {
                                    onProfileClick?.(comment.profiles.id);
                                  }
                                }}
                                className="font-bold text-sm text-slate-800 hover:text-green-700 text-left transition-colors"
                              >
                                {comment.profiles?.full_name || 'Unknown User'}
                              </button>
                              <ProBadge isPro={(comment.profiles as any)?.is_pro} />
                              <span className="text-[11px] text-slate-400">
                                {formatTimeAgo(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-slate-600 text-sm mt-0.5 leading-relaxed">{comment.content}</p>
                          </div>
                          {user && user.id === comment.author_id && (
                            <div className="relative ml-2">
                              <button
                                onClick={() => setShowCommentMenu(showCommentMenu === comment.id ? null : comment.id)}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              <AnimatePresence>
                                {showCommentMenu === comment.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                    className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-200/60 py-1 z-10"
                                  >
                                    <button
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Delete
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Comment Input */}
            {user && (
              <div className="px-5 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/30">
                <div className="flex gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-green-700 to-green-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden ring-2 ring-white shadow-sm text-sm">
                    {profile?.profile_picture_url ? (
                      <img
                        src={profile.profile_picture_url}
                        alt={profile.full_name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{profile?.full_name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>

                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                      placeholder="Write a comment..."
                      className="flex-1 bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white outline-none transition-all duration-200"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || submitting}
                      className="bg-green-700 hover:bg-green-800 text-white rounded-xl px-4 py-2.5 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
                    >
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
