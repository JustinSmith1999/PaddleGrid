import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Calendar, Clock, Users, MapPin, Trophy, MoreHorizontal, Trash2, X, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { SocialPost, toggleLike, joinMatch, leaveMatch, formatTimeAgo, deletePost, bookmarkPost, unbookmarkPost, isBookmarked } from '../../lib/socialUtils';
import { useAuth } from '../../contexts/AuthContext';

interface PostCardProps {
  post: SocialPost;
  onClick: () => void;
  onUpdate?: () => void;
  onClubClick?: (facilityId: string) => void;
  onProfileClick?: (userId: string) => void;
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
  const [isPostBookmarked, setIsPostBookmarked] = useState(false);

  useEffect(() => {
    setLikesCount(post.likes_count || 0);
    setUserLiked(post.user_liked || false);
    setCommentsCount(post.comments_count || 0);
    checkJoinStatus();
    checkBookmarkStatus();
  }, [post.id, post.likes_count, post.user_liked, post.comments_count]);

  async function checkBookmarkStatus() {
    if (!user) return;
    const bookmarked = await isBookmarked(post.id);
    setIsPostBookmarked(bookmarked);
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
        onUpdate?.();
      }
    } else {
      const result = await joinMatch(post.id);
      if (result.success) {
        setHasJoined(true);
        onUpdate?.();
      } else if (result.error) {
        alert(result.error);
      }
    }

    setLoading(false);
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
      }
    } else {
      const result = await bookmarkPost(post.id);
      if (result.success) {
        setIsPostBookmarked(true);
        onUpdate?.();
      }
    }
  }

  const isFull = post.spots_needed && post.spots_filled >= post.spots_needed;
  const spotsLeft = post.spots_needed ? post.spots_needed - post.spots_filled : 0;

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
      {expandedImage !== null && post.media_urls && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedImage(null);
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {post.media_urls.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="absolute left-4 text-white hover:text-gray-300 transition z-10"
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="absolute right-4 text-white hover:text-gray-300 transition z-10"
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}

          {post.media_urls[expandedImage].match(/\.(mp4|webm|mov)(\?|$)/i) ? (
            <video
              src={post.media_urls[expandedImage]}
              controls
              className="max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={post.media_urls[expandedImage]}
              alt={`Post media ${expandedImage + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {post.media_urls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
              {expandedImage + 1} / {post.media_urls.length}
            </div>
          )}
        </div>
      )}

    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-900 hover:bg-gradient-to-br hover:from-slate-50/50 hover:to-white dark:hover:from-slate-800/50 dark:hover:to-slate-900 transition-all duration-200 cursor-pointer px-4 py-5 lg:py-6 border-b border-slate-200/80 dark:border-slate-800/80"
    >
      <div className="flex gap-3 lg:gap-4">
        <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden shadow-lg ${
          (post.facilities?.logo_url || post.profiles?.profile_picture_url)
            ? 'bg-white'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'
        }`}>
          {(post.facilities?.logo_url || post.profiles?.profile_picture_url) ? (
            <img
              src={post.facilities?.logo_url || post.profiles.profile_picture_url}
              alt={(post.facilities?.name || post.profiles?.full_name) || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg lg:text-xl">{(post.facilities?.name || post.profiles?.full_name)?.charAt(0).toUpperCase() || 'U'}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (post.facilities?.slug) {
                    onClubClick?.(post.facilities.slug);
                  } else if (post.profiles?.id) {
                    onProfileClick?.(post.profiles.id);
                  }
                }}
                className="font-bold text-slate-900 dark:text-white hover:underline text-base lg:text-lg truncate"
              >
                {post.facilities?.name || post.profiles?.full_name || 'Unknown User'}
              </button>
              <span className="text-slate-500 dark:text-slate-400 text-base lg:text-lg flex-shrink-0">·</span>
              <span className="text-slate-500 dark:text-slate-400 text-base lg:text-lg flex-shrink-0">{formatTimeAgo(post.created_at)}</span>
            </div>
            {user && user.id === post.author_id && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition text-gray-500 hover:text-gray-700"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMenu && (
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

          {post.post_type === 'match_invite' ? (
            <div className="space-y-3">
              <p className="text-slate-900 dark:text-white text-base lg:text-lg leading-relaxed whitespace-pre-wrap">{post.content}</p>

              {post.media_urls && post.media_urls.length > 0 && (
                <div className={`grid gap-0.5 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 ${
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
                        } ${post.media_urls!.length === 1 ? 'h-80 sm:h-96' : 'aspect-square'} bg-slate-100 dark:bg-slate-800 overflow-hidden`}
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
                            className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer"
                            onClick={(e) => handleImageClick(e, idx)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="rounded-3xl border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-teal-50/30 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-teal-950/20 p-5 lg:p-7 space-y-5 shadow-lg shadow-emerald-500/10">
                <div className="flex items-center gap-2.5 text-base lg:text-xl font-black text-emerald-700 dark:text-emerald-400">
                  <Trophy className="w-5 h-5 lg:w-6 lg:h-6" />
                  {post.sport?.charAt(0).toUpperCase()}{post.sport?.slice(1)} Match
                </div>

                <div className="grid grid-cols-2 gap-3 text-base lg:text-lg text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <span className="truncate">
                      {post.play_date ? new Date(post.play_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      }) : 'TBD'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <span className="truncate">{post.play_start_time ? post.play_start_time.slice(0, 5) : 'TBD'}</span>
                  </div>

                  {post.courts && (
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      <span className="break-words">{post.courts.name}</span>
                    </div>
                  )}

                  {post.skill_min !== null && post.skill_max !== null && (
                    <div className="flex items-center gap-2 min-w-0">
                      <Trophy className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      <span className="truncate">{post.skill_min}-{post.skill_max} level</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <span className="truncate">{post.spots_filled}/{post.spots_needed} players</span>
                  </div>
                </div>

                {user && (
                  <button
                    onClick={handleJoinMatch}
                    disabled={loading || (isFull && !hasJoined)}
                    className={`w-full py-3.5 lg:py-4 px-6 rounded-2xl text-base lg:text-lg font-black transition-all duration-200 ${
                      hasJoined
                        ? 'bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-700 dark:hover:to-slate-600 shadow-md'
                        : isFull
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.02]'
                    }`}
                  >
                    {hasJoined ? 'Leave Match' : isFull ? 'Match Full' : `Join Match (${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left)`}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-900 dark:text-white text-base lg:text-lg leading-relaxed whitespace-pre-wrap">{post.content}</p>

              {post.media_urls && post.media_urls.length > 0 && (
                <div className={`grid gap-0.5 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 ${
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
                        } ${post.media_urls!.length === 1 ? 'h-80 sm:h-96' : 'aspect-square'} bg-slate-100 dark:bg-slate-800 overflow-hidden`}
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
                            className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer"
                            onClick={(e) => handleImageClick(e, idx)}
                          />
                        )}
                        {post.media_urls!.length > 4 && idx === 3 && !isVideo && (
                          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center pointer-events-none">
                            <span className="text-white text-2xl font-bold">+{post.media_urls!.length - 4}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 lg:mt-4 gap-2">
            <button
              onClick={handleLike}
              className={`flex-1 py-2.5 lg:py-3 px-2 lg:px-3 rounded-lg border-2 font-semibold text-sm lg:text-base transition-all duration-200 flex items-center justify-center gap-1 lg:gap-1.5 ${
                userLiked
                  ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700'
                  : 'bg-white border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:bg-slate-900 dark:text-emerald-400 dark:border-emerald-400 dark:hover:bg-emerald-950/30'
              }`}
            >
              <Heart className={`w-4 h-4 lg:w-5 lg:h-5 ${userLiked ? 'fill-current' : ''}`} />
              <span className="whitespace-nowrap">{likesCount}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="flex-1 py-2.5 lg:py-3 px-2 lg:px-3 rounded-lg border-2 border-emerald-600 dark:border-emerald-400 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold text-sm lg:text-base transition-all duration-200 flex items-center justify-center gap-1 lg:gap-1.5"
            >
              <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="whitespace-nowrap">{commentsCount}</span>
            </button>

            <button
              onClick={handleBookmark}
              className={`py-2.5 lg:py-3 px-2.5 lg:px-3 rounded-lg border-2 font-semibold text-sm lg:text-base transition-all duration-200 flex items-center justify-center ${
                isPostBookmarked
                  ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700'
                  : 'bg-white border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:bg-slate-900 dark:text-emerald-400 dark:border-emerald-400 dark:hover:bg-emerald-950/30'
              }`}
            >
              <Bookmark className={`w-4 h-4 lg:w-5 lg:h-5 ${isPostBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
