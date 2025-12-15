import { useState, useEffect } from 'react';
import { Plus, Users, Trophy, Calendar, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Story {
  id: string;
  userId?: string;
  facilityId?: string;
  name: string;
  avatarUrl: string | null;
  hasUnread: boolean;
  timestamp: string;
  type: 'user' | 'facility';
  previewText?: string;
  color: string;
}

interface StoriesHighlightsProps {
  onStoryClick: (storyId: string, type: 'user' | 'facility') => void;
  onCreateStory?: () => void;
}

export default function StoriesHighlights({ onStoryClick, onCreateStory }: StoriesHighlightsProps) {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, [user]);

  async function loadStories() {
    try {
      const storiesData: Story[] = [];

      if (user) {
        storiesData.push({
          id: 'create',
          name: 'Your Story',
          avatarUrl: null,
          hasUnread: false,
          timestamp: new Date().toISOString(),
          type: 'user',
          previewText: 'Create',
          color: 'from-slate-400 to-slate-500'
        });
      }

      const { data: facilities } = await supabase
        .from('facilities')
        .select('id, name, logo_url, created_at')
        .order('created_at', { ascending: true })
        .limit(5);

      if (facilities) {
        const colors = [
          'from-emerald-500 to-teal-500',
          'from-blue-500 to-cyan-500',
          'from-orange-500 to-red-500',
          'from-purple-500 to-pink-500',
          'from-yellow-500 to-orange-500'
        ];

        facilities.forEach((facility, index) => {
          storiesData.push({
            id: facility.id,
            facilityId: facility.id,
            name: facility.name,
            avatarUrl: facility.logo_url,
            hasUnread: true,
            timestamp: facility.created_at,
            type: 'facility',
            previewText: 'New updates',
            color: colors[index % colors.length]
          });
        });
      }

      if (user) {
        const { data: following } = await supabase
          .from('user_follows')
          .select(`
            followed_id,
            profiles!user_follows_followed_id_fkey (
              id,
              full_name,
              profile_picture_url,
              updated_at
            )
          `)
          .eq('follower_id', user.id)
          .limit(8);

        if (following) {
          following.forEach((follow: any) => {
            if (follow.profiles) {
              storiesData.push({
                id: follow.profiles.id,
                userId: follow.profiles.id,
                name: follow.profiles.full_name || 'Player',
                avatarUrl: follow.profiles.profile_picture_url,
                hasUnread: Math.random() > 0.5,
                timestamp: follow.profiles.updated_at,
                type: 'user',
                previewText: 'Recent activity',
                color: 'from-slate-400 to-slate-500'
              });
            }
          });
        }
      }

      setStories(storiesData);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return null;
  if (stories.length === 0) return null;

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-[56px] z-10">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 py-4 min-w-max">
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => story.id === 'create' ? onCreateStory?.() : onStoryClick(story.id, story.type)}
              className="flex flex-col items-center gap-2 group flex-shrink-0"
            >
              <div className="relative">
                {story.hasUnread && story.id !== 'create' && (
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${story.color} p-[3px] animate-pulse`}>
                    <div className="w-full h-full rounded-full bg-white dark:bg-slate-900" />
                  </div>
                )}

                <div className={`relative ${story.hasUnread && story.id !== 'create' ? 'p-[3px]' : ''}`}>
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center border-2 border-white dark:border-slate-900 group-hover:scale-105 transition-transform">
                    {story.id === 'create' ? (
                      <Plus className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                    ) : story.avatarUrl ? (
                      <img
                        src={story.avatarUrl}
                        alt={story.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        {story.type === 'facility' ? (
                          <MapPin className="w-8 h-8 text-white" />
                        ) : (
                          <Users className="w-8 h-8 text-white" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {story.type === 'facility' && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              <div className="text-center max-w-[72px]">
                <span className={`text-xs font-medium truncate block ${
                  story.id === 'create'
                    ? 'text-slate-600 dark:text-slate-400'
                    : story.hasUnread
                    ? 'text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-500 dark:text-slate-500'
                }`}>
                  {story.name}
                </span>
                {story.previewText && story.id !== 'create' && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-600">
                    {story.previewText}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
