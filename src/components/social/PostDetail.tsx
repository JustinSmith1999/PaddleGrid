import { useState, useEffect } from 'react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Post not found</p>
          <button
            onClick={onBack}
            className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
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
            startTime: post.bookings?.start_time.slice(0, 5) || post.play_start_time?.slice(0, 5) || '',
            endTime: post.bookings?.end_time.slice(0, 5) || post.play_end_time?.slice(0, 5) || '',
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

      <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 overflow-hidden ${
              (post.posted_as_facility === true && post.facilities?.logo_url) || (!post.posted_as_facility && post.profiles?.profile_picture_url)
                ? 'bg-white'
                : 'bg-gradient-to-br from-emerald-600 to-green-700'
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
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      if (post.posted_as_facility === true && post.facilities?.slug) {
                        onClubClick?.(post.facilities.slug);
                      } else if (post.profiles?.id) {
                        onProfileClick?.(post.profiles.id);
                      }
                    }}
                    className="font-semibold text-lg text-gray-900 hover:underline text-left"
                  >
                    {post.posted_as_facility === true && post.facilities?.name
                      ? post.facilities.name
                      : (post.profiles?.full_name || 'Unknown User')}
                  </button>
                  {post.post_type === 'match_invite' && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded">
                      Match Invite
                    </span>
                  )}
                </div>
                {user && user.id === post.author_id && (
                  <div className="relative">
                    <button
                      onClick={() => setShowPostMenu(!showPostMenu)}
                      className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500 hover:text-gray-700"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {showPostMenu && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={handleDeletePost}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Post
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 flex-wrap">
                {post.facilities && post.posted_as_facility !== true && (
                  <>
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="break-words">{post.facilities.name}</span>
                    <span className="flex-shrink-0">•</span>
                  </>
                )}
                <span className="whitespace-nowrap">{formatTimeAgo(post.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-gray-900 text-lg whitespace-pre-wrap">{post.content}</p>
          </div>

          {post.post_type === 'match_invite' && (
            <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg p-6 mb-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Trophy className="w-5 h-5 text-blue-600" />
                {post.sport?.charAt(0).toUpperCase()}{post.sport?.slice(1)} Match
                {post.bookings && (
                  <span className="ml-auto text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                    Court Booked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-gray-700 min-w-0">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="truncate text-sm sm:text-base">
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

                <div className="flex items-center gap-2 text-gray-700 min-w-0">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="truncate text-sm sm:text-base">
                    {post.bookings
                      ? `${post.bookings.start_time.slice(0, 5)} - ${post.bookings.end_time.slice(0, 5)}`
                      : `${post.play_start_time?.slice(0, 5)} - ${post.play_end_time?.slice(0, 5)}`}
                  </span>
                </div>

                {post.courts && (
                  <div className="flex items-center gap-2 text-gray-700 sm:col-span-2">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span className="break-words text-sm sm:text-base">{post.courts.name}</span>
                  </div>
                )}

                {post.skill_min !== null && post.skill_max !== null && (
                  <div className="flex items-center gap-2 text-gray-700 min-w-0">
                    <Trophy className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span className="truncate text-sm sm:text-base">Skill: {post.skill_min} - {post.skill_max}</span>
                  </div>
                )}

                {post.requires_payment && post.price_per_person && (
                  <div className="flex items-center gap-2 text-emerald-700 sm:col-span-2">
                    <span className="text-lg font-bold">${post.price_per_person.toFixed(2)} per person</span>
                  </div>
                )}
              </div>

              <div className="border-t border-blue-200 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Users className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <span className="text-base sm:text-lg font-semibold text-gray-900">
                      {post.spots_filled} / {post.spots_needed} players
                    </span>
                    {!isFull && (
                      <span className="text-sm text-green-600 whitespace-nowrap">
                        {post.spots_needed - post.spots_filled} {post.spots_needed - post.spots_filled === 1 ? 'spot' : 'spots'} left
                      </span>
                    )}
                  </div>

                  {user && (
                    <button
                      onClick={handleJoinMatch}
                      disabled={isFull && !hasJoined}
                      className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                        hasJoined
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : isFull
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {hasJoined ? "I'm Out" : isFull ? 'Full' : "I'm In!"}
                    </button>
                  )}
                </div>

                {participants.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Participants</h4>
                    <div className="flex flex-wrap gap-2">
                      {participants.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-blue-200"
                        >
                          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {p.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{p.profiles?.full_name || 'Unknown User'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 font-medium transition ${
                userLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <Heart className={`w-6 h-6 ${userLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>

            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-6 h-6" />
              <span className="font-medium">{comments.length}</span>
            </div>
          </div>

          {likedByUsers.length > 0 && (
            <div className="mt-3 text-sm text-gray-600">
              Liked by{' '}
              <button
                onClick={() => onProfileClick?.(likedByUsers[0].id)}
                className="font-semibold text-gray-900 hover:underline"
              >
                {likedByUsers[0].full_name}
              </button>
              {likedByUsers.length > 1 && (
                <>
                  {' '}and{' '}
                  {likedByUsers.length === 2 ? (
                    <button
                      onClick={() => onProfileClick?.(likedByUsers[1].id)}
                      className="font-semibold text-gray-900 hover:underline"
                    >
                      {likedByUsers[1].full_name}
                    </button>
                  ) : (
                    <span className="font-semibold text-gray-900">
                      {likesCount - 1} {likesCount - 1 === 1 ? 'other' : 'others'}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Comments</h3>

          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-green-700 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
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
                    <div className="bg-gray-50 rounded-lg p-3 relative">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <button
                            onClick={() => {
                              if (comment.profiles?.id) {
                                onProfileClick?.(comment.profiles.id);
                              }
                            }}
                            className="font-semibold text-sm text-gray-900 mb-1 hover:underline text-left"
                          >
                            {comment.profiles?.full_name || 'Unknown User'}
                          </button>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                        {user && user.id === comment.author_id && (
                          <div className="relative ml-2">
                            <button
                              onClick={() => setShowCommentMenu(showCommentMenu === comment.id ? null : comment.id)}
                              className="p-1 hover:bg-gray-200 rounded-full transition text-gray-500 hover:text-gray-700"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {showCommentMenu === comment.id && (
                              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 ml-3">
                      {formatTimeAgo(comment.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {user && (
            <div className="flex gap-2 sm:gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-700 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
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
                  className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
