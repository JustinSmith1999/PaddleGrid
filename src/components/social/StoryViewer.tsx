import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Users, MapPin } from 'lucide-react';
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
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const storyDuration = 5000;

  useEffect(() => {
    const initialIndex = allStoryGroups.findIndex(
      group => group.ownerId === initialOwnerId && group.ownerType === ownerType
    );
    if (initialIndex >= 0) {
      setCurrentGroupIndex(initialIndex);
    }
  }, [initialOwnerId, ownerType, allStoryGroups]);

  const currentGroup = allStoryGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  useEffect(() => {
    if (!currentStory) return;

    markStoryAsViewed(currentStory.id);

    setProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + (100 / (storyDuration / 100));
      });
    }, 100);

    progressIntervalRef.current = interval;

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStory?.id]);

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
    } catch (error) {
      console.error('Error marking story as viewed:', error);
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

  if (!currentGroup || !currentStory) {
    return null;
  }

  const timeAgo = getTimeAgo(currentStory.createdAt);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {currentGroupIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute left-4 z-50 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
      )}

      {currentGroupIndex < allStoryGroups.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 z-50 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      )}

      <div className="relative w-full max-w-lg h-full max-h-[90vh] bg-slate-900 rounded-lg overflow-hidden">
        <div className="absolute top-0 left-0 right-0 z-40 p-4">
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
        </div>

        <div
          onClick={handleClick}
          className="w-full h-full flex items-center justify-center cursor-pointer"
        >
          {currentStory.mediaType === 'image' ? (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
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
