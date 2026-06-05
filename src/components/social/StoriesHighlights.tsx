import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import StoryViewer from './StoryViewer';

interface StoryPreview {
  id: string;
  ownerId: string;
  name: string;
  avatarUrl: string | null;
  hasUnread: boolean;
  type: 'user' | 'facility';
  storyCount: number;
}

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

interface StoriesHighlightsProps {
  onStoryClick?: (storyId: string, type: 'user' | 'facility') => void;
  onCreateStory?: () => void;
}

export default function StoriesHighlights({ onCreateStory }: StoriesHighlightsProps) {
  const { user } = useAuth();
  const [storyPreviews, setStoryPreviews] = useState<StoryPreview[]>([]);
  const [allStoryGroups, setAllStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState<{ id: string; type: 'user' | 'facility' } | null>(null);

  useEffect(() => {
    loadStories();
  }, [user]);

  async function loadStories() {
    try {
      const now = new Date().toISOString();
      const previews: StoryPreview[] = [];
      const groups: StoryGroup[] = [];

      let userHasOwnStories = false;
      if (user) {
        const { data: ownStories } = await supabase
          .from('stories')
          .select('id')
          .eq('user_id', user.id)
          .is('facility_id', null)
          .gt('expires_at', now);

        userHasOwnStories = (ownStories?.length || 0) > 0;

        if (userHasOwnStories) {
          const { data: ownStoriesData } = await supabase
            .from('stories')
            .select(`
              id,
              facility_id,
              user_id,
              media_url,
              media_type,
              caption,
              created_at,
              expires_at
            `)
            .eq('user_id', user.id)
            .is('facility_id', null)
            .gt('expires_at', now)
            .order('created_at', { ascending: false });

          if (ownStoriesData && ownStoriesData.length > 0) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, full_name, profile_picture_url')
              .eq('id', user.id)
              .single();

            const userStories: Story[] = ownStoriesData.map((story: any) => ({
              id: story.id,
              userId: story.user_id,
              facilityId: story.facility_id,
              mediaUrl: story.media_url,
              mediaType: story.media_type,
              caption: story.caption,
              createdAt: story.created_at,
              expiresAt: story.expires_at,
              ownerName: profile?.full_name || 'You',
              ownerAvatar: profile?.profile_picture_url || null
            }));

            previews.push({
              id: user.id,
              ownerId: user.id,
              name: 'Your Story',
              avatarUrl: profile?.profile_picture_url || null,
              hasUnread: false,
              type: 'user',
              storyCount: userStories.length
            });

            groups.push({
              ownerId: user.id,
              ownerName: profile?.full_name || 'You',
              ownerAvatar: profile?.profile_picture_url || null,
              ownerType: 'user',
              stories: userStories
            });
          }
        } else {
          previews.push({
            id: 'create',
            ownerId: 'create',
            name: 'Your Story',
            avatarUrl: null,
            hasUnread: false,
            type: 'user',
            storyCount: 0
          });
        }
      }

      const { data: facilityStories } = await supabase
        .from('stories')
        .select(`
          id,
          facility_id,
          user_id,
          media_url,
          media_type,
          caption,
          created_at,
          expires_at,
          facilities (
            id,
            name,
            logo_url
          )
        `)
        .not('facility_id', 'is', null)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      const facilityGroups = new Map<string, Story[]>();

      facilityStories?.forEach((story: any) => {
        if (!story.facilities) return;

        const facility = Array.isArray(story.facilities) ? story.facilities[0] : story.facilities;

        const storyData: Story = {
          id: story.id,
          userId: story.user_id,
          facilityId: story.facility_id,
          mediaUrl: story.media_url,
          mediaType: story.media_type,
          caption: story.caption,
          createdAt: story.created_at,
          expiresAt: story.expires_at,
          ownerName: facility.name,
          ownerAvatar: facility.logo_url
        };

        if (!facilityGroups.has(facility.id)) {
          facilityGroups.set(facility.id, []);
        }
        facilityGroups.get(facility.id)!.push(storyData);
      });

      facilityGroups.forEach((stories, facilityId) => {
        const firstStory = stories[0];

        const hasUnread = user ? !stories.every(story =>
          story.userId === user.id
        ) : true;

        previews.push({
          id: facilityId,
          ownerId: facilityId,
          name: firstStory.ownerName,
          avatarUrl: firstStory.ownerAvatar,
          hasUnread,
          type: 'facility',
          storyCount: stories.length
        });

        groups.push({
          ownerId: facilityId,
          ownerName: firstStory.ownerName,
          ownerAvatar: firstStory.ownerAvatar,
          ownerType: 'facility',
          stories
        });
      });

      if (user) {
        const { data: followingIds } = await supabase
          .from('social_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingUserIds = followingIds?.map(f => f.following_id) || [];

        if (followingUserIds.length > 0) {
          const { data: userStories } = await supabase
            .from('stories')
            .select(`
              id,
              facility_id,
              user_id,
              media_url,
              media_type,
              caption,
              created_at,
              expires_at,
              profiles (
                id,
                full_name,
                profile_picture_url
              )
            `)
            .in('user_id', followingUserIds)
            .is('facility_id', null)
            .gt('expires_at', now)
            .order('created_at', { ascending: false });

          const userGroups = new Map<string, Story[]>();

          userStories?.forEach((story: any) => {
            if (!story.profiles) return;

            const profile = Array.isArray(story.profiles) ? story.profiles[0] : story.profiles;

            const storyData: Story = {
              id: story.id,
              userId: story.user_id,
              facilityId: story.facility_id,
              mediaUrl: story.media_url,
              mediaType: story.media_type,
              caption: story.caption,
              createdAt: story.created_at,
              expiresAt: story.expires_at,
              ownerName: profile.full_name || 'Player',
              ownerAvatar: profile.profile_picture_url
            };

            if (!userGroups.has(profile.id)) {
              userGroups.set(profile.id, []);
            }
            userGroups.get(profile.id)!.push(storyData);
          });

          for (const [userId, stories] of userGroups.entries()) {
            const firstStory = stories[0];

            const { data: viewData } = await supabase
              .from('story_views')
              .select('story_id')
              .eq('viewer_id', user.id)
              .in('story_id', stories.map(s => s.id));

            const viewedStoryIds = new Set(viewData?.map(v => v.story_id) || []);
            const hasUnread = stories.some(s => !viewedStoryIds.has(s.id));

            previews.push({
              id: userId,
              ownerId: userId,
              name: firstStory.ownerName,
              avatarUrl: firstStory.ownerAvatar,
              hasUnread,
              type: 'user',
              storyCount: stories.length
            });

            groups.push({
              ownerId: userId,
              ownerName: firstStory.ownerName,
              ownerAvatar: firstStory.ownerAvatar,
              ownerType: 'user',
              stories
            });
          }
        }
      }

      setStoryPreviews(previews);
      setAllStoryGroups(groups);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleStoryClick(ownerId: string, type: 'user' | 'facility') {
    if (ownerId === 'create') {
      onCreateStory?.();
    } else if (user && ownerId === user.id) {
      setSelectedOwner({ id: ownerId, type });
    } else {
      setSelectedOwner({ id: ownerId, type });
    }
  }

  if (loading) return null;
  if (storyPreviews.length === 0) return null;

  return (
    <>
      <div className="px-4 py-3 border-b border-slate-100 bg-white sticky top-[56px] z-10">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 min-w-max">
            {storyPreviews.map((preview, index) => (
              <motion.div
                key={preview.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <button
                  onClick={() => handleStoryClick(preview.ownerId, preview.type)}
                  className="flex flex-col items-center gap-2 group flex-shrink-0"
                >
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center transition-transform group-hover:scale-[1.04] ${
                      preview.id === 'create'
                        ? 'ring-2 ring-slate-200'
                        : preview.hasUnread
                        ? 'p-[2px] bg-gradient-to-tr from-emerald-700 via-amber-500 to-rose-400'
                        : 'ring-1 ring-slate-200'
                    }`}>
                      {preview.id === 'create' ? (
                        <Plus className="w-8 h-8 text-green-700" />
                      ) : preview.avatarUrl ? (
                        <img
                          src={preview.avatarUrl}
                          alt={preview.name}
                          className="w-full h-full object-cover rounded-full bg-white"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                          {preview.type === 'facility' ? (
                            <MapPin className="w-8 h-8 text-white" />
                          ) : (
                            <Users className="w-8 h-8 text-white" />
                          )}
                        </div>
                      )}
                    </div>

                    {preview.name === 'Your Story' && preview.id !== 'create' && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-700 rounded-full border-2 border-white flex items-center justify-center">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {preview.type === 'facility' && preview.id !== 'create' && preview.name !== 'Your Story' && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-700 rounded-full border-2 border-white flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="text-center max-w-[72px]">
                    <span className="text-[11px] font-medium text-slate-600 truncate block">
                      {preview.name}
                    </span>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {selectedOwner && (
        <StoryViewer
          initialOwnerId={selectedOwner.id}
          ownerType={selectedOwner.type}
          allStoryGroups={allStoryGroups}
          onClose={() => {
            setSelectedOwner(null);
            loadStories();
          }}
        />
      )}
    </>
  );
}
