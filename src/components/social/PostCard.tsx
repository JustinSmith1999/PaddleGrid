import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Calendar, Clock, Users, MapPin, Trophy, MoreHorizontal, Trash2, X, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { SocialPost, toggleLike, joinMatch, leaveMatch, formatTimeAgo, deletePost, bookmarkPost, unbookmarkPost, getMatchParticipants } from '../../lib/socialUtils';
import { useAuth } from '../../contexts/AuthContext';

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
    } else {
      const result = await joinMatch(post.id);
      if (result.success) {
        setHasJoined(true);
        await loadParticipants();
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
      className="bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer px-6 py-2.5 lg:py-3 border-b border-slate-200/80 dark:border-slate-800/80"
    >
      <div className="flex gap-2 lg:gap-2.5">
        <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden ${
          (post.profiles?.profile_picture_url || post.facilities?.logo_url)
            ? 'bg-white'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600'
        }`}>
          {(post.profiles?.profile_picture_url || post.facilities?.logo_url) ? (
            <img
              src={post.profiles?.profile_picture_url || post.facilities?.logo_url}
              alt={(post.profiles?.full_name || post.facilities?.name) || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm lg:text-base">{(post.profiles?.full_name || post.facilities?.name)?.charAt(0).toUpperCase() || 'U'}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-0.5">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (post.profiles?.id) {
                    onProfileClick?.(post.profiles.id);
                  } else if (post.facilities?.slug) {
                    onClubClick?.(post.facilities.slug);
                  }
                }}
                className="font-bold text-slate-900 dark:text-white hover:underline text-[15px] truncate"
              >
                {post.profiles?.full_name || post.facilities?.name || 'Unknown User'}
              </button>
              <span className="text-slate-500 dark:text-slate-400 text-[15px] flex-shrink-0">·</span>
              <span className="text-slate-500 dark:text-slate-400 text-[15px] flex-shrink-0">{formatTimeAgo(post.created_at)}</span>
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
            <div className="space-y-1.5">
              <p className="text-slate-900 dark:text-white text-[15px] leading-snug whitespace-pre-wrap line-clamp-3">{post.content}</p>

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
                        } ${post.media_urls!.length === 1 ? 'h-56 sm:h-80 lg:h-96' : 'aspect-square'} bg-slate-100 dark:bg-slate-800 overflow-hidden`}
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

              {post.link_preview && (
                <a
                  href={post.link_preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="block border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  {post.link_preview.image && (
                    <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={post.link_preview.image}
                        alt={post.link_preview.title || 'Link preview'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    {post.link_preview.siteName && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium uppercase">
                        {post.link_preview.siteName}
                      </div>
                    )}
                    {post.link_preview.title && (
                      <div className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 text-sm">
                        {post.link_preview.title}
                      </div>
                    )}
                    {post.link_preview.description && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                        {post.link_preview.description}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      {post.link_preview.url}
                    </div>
                  </div>
                </a>
              )}

              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 space-y-2">
                <div className="flex items-center gap-1.5 text-[13px] font-bold text-emerald-700 dark:text-emerald-400">
                  <Trophy className="w-3.5 h-3.5" />
                  {post.sport?.charAt(0).toUpperCase()}{post.sport?.slice(1)} Match
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[13px] text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <span className="truncate">
                      {post.play_date ? new Date(post.play_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      }) : 'TBD'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <span className="truncate">{post.play_start_time ? post.play_start_time.slice(0, 5) : 'TBD'}</span>
                  </div>

                  {post.courts && (
                    <div className="flex items-center gap-1 col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      <span className="break-words line-clamp-1">{post.courts.name}</span>
                    </div>
                  )}

                  {post.skill_min !== null && post.skill_max !== null && (
                    <div className="flex items-center gap-1 min-w-0">
                      <Trophy className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      <span className="truncate">{post.skill_min}-{post.skill_max} level</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 min-w-0">
                    <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <span className="truncate">{post.spots_filled}/{post.spots_needed} players</span>
                  </div>
                </div>

                {participants.length > 0 && (
                  <div className="mt-3 sm:mt-4">
                    <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      Joined Players:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {participants.map((participant) => (
                        <button
                          key={participant.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onProfileClick?.(participant.profiles.id);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
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
                          <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                            {participant.profiles.full_name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {user && (
                  <button
                    onClick={handleJoinMatch}
                    disabled={loading || (isFull && !hasJoined)}
                    className={`w-full py-1.5 px-3 rounded-lg text-[13px] font-bold transition-colors ${
                      hasJoined
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        : isFull
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {hasJoined ? 'Leave Match' : isFull ? 'Match Full' : `Join (${spotsLeft} left)`}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-slate-900 dark:text-white text-[15px] leading-snug whitespace-pre-wrap">{post.content}</p>

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
                        } ${post.media_urls!.length === 1 ? 'h-56 sm:h-80 lg:h-96' : 'aspect-square'} bg-slate-100 dark:bg-slate-800 overflow-hidden`}
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

              {post.link_preview && (
                <a
                  href={post.link_preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="block border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  {post.link_preview.image && (
                    <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={post.link_preview.image}
                        alt={post.link_preview.title || 'Link preview'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    {post.link_preview.siteName && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium uppercase">
                        {post.link_preview.siteName}
                      </div>
                    )}
                    {post.link_preview.title && (
                      <div className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 text-sm">
                        {post.link_preview.title}
                      </div>
                    )}
                    {post.link_preview.description && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                        {post.link_preview.description}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      {post.link_preview.url}
                    </div>
                  </div>
                </a>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 mt-2 lg:mt-2.5">
            <button
              onClick={handleLike}
              className={`group flex items-center gap-1.5 transition-colors ${
                userLiked
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <Heart className={`w-[18px] h-[18px] ${userLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{likesCount}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="group flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <MessageCircle className="w-[18px] h-[18px]" />
              <span className="text-sm font-medium">{commentsCount}</span>
            </button>

            <button
              onClick={handleBookmark}
              className={`group flex items-center transition-colors ${
                isPostBookmarked
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <Bookmark className={`w-[18px] h-[18px] ${isPostBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
