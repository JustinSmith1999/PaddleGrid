import { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX, Users, MapPin, Trash2, MoreVertical, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Story {
  id: string;
  userId: string | null;
  facilityId: string | null;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string | null;
  createdAt: string;
  expiresAt: string;
  ownerName: string;
  ownerAvatar: string | null;
}

interface StoryGroup {
  ownerId: string;
  ownerName: string;
  ownerAvatar: string | null;
  ownerType: 'user' | 'facility';
  stories: Story[];
}

interface StoryViewerProps {
  initialOwnerId: string;
  ownerType: 'user' | 'facility';
  allStoryGroups: StoryGroup[];
  onClose: () => void;
}

export default function StoryViewer({ initialOwnerId, ownerType, allStoryGroups, onClose }: StoryViewerProps) {
  const { user } = useAuth();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storyDuration = 5000;

  useEffect(() => {
    const initialIndex = allStoryGroups.findIndex(
      group => group.ownerId === initialOwnerId && group.ownerType === ownerType
    );
    if (initialIndex >= 0) {
      setCurrentGroupIndex(initialIndex);
    }
  }, [initialOwnerId, ownerType, allStoryGroups]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGroupIndex, currentStoryIndex]);

  const currentGroup = allStoryGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  useEffect(() => {
    if (!currentStory) return;

    markStoryAsViewed(currentStory.id);
    setProgress(0);
    setIsPaused(false);

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    let duration = storyDuration;

    if (currentStory.mediaType === 'video' && videoRef.current) {
      const video = videoRef.current;
      video.muted = isMuted;

      const handleLoadedMetadata = () => {
        duration = video.duration * 1000;
        startProgress(duration);
      };

      if (video.readyState >= 1) {
        duration = video.duration * 1000;
        startProgress(duration);
      } else {
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    } else {
      startProgress(duration);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStory?.id]);

  useEffect(() => {
    if (isPaused) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (videoRef.current) {
        videoRef.current.pause();
      }
    } else if (currentStory) {
      if (currentStory.mediaType === 'video' && videoRef.current) {
        videoRef.current.play();
      }
      const duration = currentStory.mediaType === 'video' && videoRef.current
        ? videoRef.current.duration * 1000
        : storyDuration;
      startProgress(duration);
    }
  }, [isPaused]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  function startProgress(duration: number) {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + (100 / (duration / 100));
      });
    }, 100);

    progressIntervalRef.current = interval;
  }

  async function markStoryAsViewed(storyId: string) {
    if (!user) return;

    try {
      await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: user.id
        })
        .select()
        .single();

      await fetchViewerCount(storyId);
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  }

  async function fetchViewerCount(storyId: string) {
    try {
      const { count } = await supabase
        .from('story_views')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', storyId);

      setViewerCount(count || 0);
    } catch (error) {
      console.error('Error fetching viewer count:', error);
    }
  }

  function goToNext() {
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentGroupIndex < allStoryGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  }

  function goToPrevious() {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      setCurrentStoryIndex(allStoryGroups[currentGroupIndex - 1].stories.length - 1);
    }
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    if (Math.abs(deltaY) > 100 && deltaY > Math.abs(deltaX)) {
      onClose();
      return;
    }

    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
      return;
    }

    if (deltaTime < 300) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      const width = rect.width;

      if (clickX < width / 3) {
        goToPrevious();
      } else {
        goToNext();
      }
    }

    touchStartRef.current = null;
  }

  function handleMouseDown() {
    setIsPaused(true);
  }

  function handleMouseUp() {
    setIsPaused(false);
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width / 3) {
      goToPrevious();
    } else {
      goToNext();
    }
  }

  async function handleDeleteStory() {
    if (!currentStory || !user) return;
    if (currentStory.userId !== user.id) return;

    if (!confirm('Delete this story?')) return;

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', currentStory.id);

      if (error) throw error;

      if (currentGroup.stories.length === 1) {
        onClose();
      } else {
        if (currentStoryIndex < currentGroup.stories.length - 1) {
          goToNext();
        } else {
          goToPrevious();
        }
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story');
    }
  }

  if (!currentGroup || !currentStory) {
    return null;
  }

  const isOwnStory = user && currentStory.userId === user.id;

  const timeAgo = getTimeAgo(currentStory.createdAt);

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4">
      <div className="relative w-full h-full max-w-md max-h-[85vh] bg-black rounded-lg overflow-hidden">
        <div className="absolute top-0 left-0 right-0 z-40 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex gap-1 mb-4">
            {currentGroup.stories.map((_, index) => (
              <div
                key={index}
                className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
              >
                {index === currentStoryIndex && (
                  <div
                    className="h-full bg-white transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                )}
                {index < currentStoryIndex && (
                  <div className="h-full bg-white" />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                {currentGroup.ownerAvatar ? (
                  <img
                    src={currentGroup.ownerAvatar}
                    alt={currentGroup.ownerName}
                    className="w-full h-full object-cover"
                  />
                ) : currentGroup.ownerType === 'facility' ? (
                  <MapPin className="w-5 h-5 text-white" />
                ) : (
                  <Users className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-white text-sm">
                  {currentGroup.ownerName}
                </div>
                <div className="text-xs text-white/70">{timeAgo}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwnStory && viewerCount > 0 && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-black/50 rounded-full backdrop-blur-sm">
                  <Eye className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-semibold">{viewerCount}</span>
                </div>
              )}

              {currentStory.mediaType === 'video' && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
              )}

              {isOwnStory && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
                  >
                    <MoreVertical className="w-5 h-5 text-white" />
                  </button>
                  {showMenu && (
                    <div className="absolute top-12 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden min-w-[150px]">
                      <button
                        onClick={handleDeleteStory}
                        className="w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Story
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full flex items-center justify-center cursor-pointer select-none"
        >
          {currentStory.mediaType === 'image' ? (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="max-w-full max-h-full object-contain pointer-events-none"
              draggable={false}
            />
          ) : (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              autoPlay
              muted={isMuted}
              playsInline
              className="max-w-full max-h-full object-contain pointer-events-none"
            />
          )}
        </div>

        {currentStory.caption && (
          <div className="absolute bottom-0 left-0 right-0 z-40 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-sm">{currentStory.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return '1d ago';
}
