import { useState, useEffect } from 'react';
import { Plus, Activity as ActivityIcon, TrendingUp, Users, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getActivityFeed, Activity, getUserStreaks, getUserPersonalRecords } from '../lib/activityUtils';
import ActivityCard from './ActivityCard';
import QuickMatchRecorder from './QuickMatchRecorder';
import StreaksWidget from './StreaksWidget';
import PersonalRecordsWidget from './PersonalRecordsWidget';

interface ActivityFeedProps {
  userId?: string;
  facilityId?: string;
  showFilters?: boolean;
}

export default function ActivityFeed({ userId, facilityId, showFilters = true }: ActivityFeedProps) {
  const { user, profile } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecorder, setShowRecorder] = useState(false);
  const [filter, setFilter] = useState<'all' | 'following' | 'mine'>('all');
  const [streaks, setStreaks] = useState<any[]>([]);
  const [personalRecords, setPersonalRecords] = useState<any[]>([]);

  useEffect(() => {
    loadFeed();
    if (user?.id) {
      loadStreaks();
      loadPersonalRecords();
    }
  }, [userId, facilityId, filter, user]);

  async function loadFeed() {
    setLoading(true);
    try {
      const data = await getActivityFeed({
        userId: filter === 'mine' ? user?.id : userId,
        facilityId,
        followingOnly: filter === 'following',
        limit: 20
      });
      setActivities(data);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStreaks() {
    if (user?.id) {
      const data = await getUserStreaks(user.id);
      setStreaks(data);
    }
  }

  async function loadPersonalRecords() {
    if (user?.id) {
      const data = await getUserPersonalRecords(user.id);
      setPersonalRecords(data);
    }
  }

  const handleActivityUpdate = () => {
    loadFeed();
    loadStreaks();
    loadPersonalRecords();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <ActivityIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Track Your Pickleball Journey
          </h3>
          <p className="text-gray-600 mb-6">
            Log matches, track your progress, compete on leaderboards, and connect with the pickleball community.
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
            Sign In to Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <ActivityIcon className="w-7 h-7 text-blue-600" />
                  Activity Feed
                </h1>
                <button
                  onClick={() => setShowRecorder(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Log Match
                </button>
              </div>

              {showFilters && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('following')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === 'following'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Following
                  </button>
                  <button
                    onClick={() => setFilter('mine')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === 'mine'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    My Activities
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : activities.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <ActivityIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No activities yet
                </h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'mine'
                    ? "Start logging your matches to track your progress!"
                    : "No recent activities in this feed. Check back later!"}
                </p>
                {filter === 'mine' && (
                  <button
                    onClick={() => setShowRecorder(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Log Your First Match
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onUpdate={handleActivityUpdate}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <StreaksWidget streaks={streaks} />
            <PersonalRecordsWidget records={personalRecords} />

            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-6 h-6" />
                <h3 className="text-lg font-bold">Strava for Pickleball</h3>
              </div>
              <p className="text-sm text-blue-100 mb-4">
                Track every match, compete on leaderboards, set personal records, and celebrate your progress with the community.
              </p>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-2xl font-bold">{activities.length}</div>
                  <div className="text-xs text-blue-100">Total Activities</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-2xl font-bold">{personalRecords.length}</div>
                  <div className="text-xs text-blue-100">Personal Records</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRecorder && (
        <QuickMatchRecorder
          onClose={() => setShowRecorder(false)}
          onSuccess={handleActivityUpdate}
        />
      )}
    </div>
  );
}
