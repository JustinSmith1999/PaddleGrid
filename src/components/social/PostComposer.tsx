import { useState, useEffect } from 'react';
import { X, Calendar, Trophy, MapPin, Users, Clock } from 'lucide-react';
import { createPost } from '../../lib/socialUtils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { sortCourtsByNumber } from '../../lib/courtUtils';

interface PostComposerProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PostComposer({ onClose, onSuccess }: PostComposerProps) {
  const { profile } = useAuth();
  const [postType, setPostType] = useState<'general' | 'match_invite'>('general');
  const [content, setContent] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [visibility, setVisibility] = useState<'facility' | 'friends' | 'public'>('facility');

  const [sport, setSport] = useState('pickleball');
  const [skillMin, setSkillMin] = useState<number>(2.5);
  const [skillMax, setSkillMax] = useState<number>(3.5);
  const [playDate, setPlayDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [spotsNeeded, setSpotsNeeded] = useState<number>(4);
  const [courtId, setCourtId] = useState('');

  const [facilities, setFacilities] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFacilities();
  }, []);

  useEffect(() => {
    if (facilityId) {
      loadCourts(facilityId);
    } else {
      setCourts([]);
      setCourtId('');
    }
  }, [facilityId]);

  async function loadFacilities() {
    const { data } = await supabase
      .from('facilities')
      .select('id, name')
      .order('name');

    setFacilities(data || []);
    if (data && data.length > 0) {
      setFacilityId(data[0].id);
    }
  }

  async function loadCourts(facilityId: string) {
    const { data } = await supabase
      .from('courts')
      .select('id, name')
      .eq('facility_id', facilityId)
      .eq('is_active', true);

    const sortedCourts = sortCourtsByNumber(data || []);
    setCourts(sortedCourts);
    if (sortedCourts.length > 0) {
      setCourtId(sortedCourts[0].id);
    } else {
      setCourtId('');
    }
  }

  async function handleSubmit() {
    setError('');

    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    if (postType === 'match_invite') {
      if (!playDate) {
        setError('Please select a date for the match');
        return;
      }
      if (!facilityId) {
        setError('Please select a facility');
        return;
      }
    }

    setLoading(true);

    const postData: any = {
      post_type: postType,
      content,
      visibility
    };

    if (facilityId) {
      postData.facility_id = facilityId;
    }

    if (postType === 'match_invite') {
      postData.sport = sport;
      postData.skill_min = skillMin;
      postData.skill_max = skillMax;
      postData.play_date = playDate;
      postData.play_start_time = startTime;
      postData.play_end_time = endTime;
      postData.spots_needed = spotsNeeded;
      if (courtId) {
        postData.court_id = courtId;
      }
    }

    const result = await createPost(postData);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || 'Failed to create post');
    }

    setLoading(false);
  }

  const canSubmit = postType === 'general'
    ? content.trim().length > 0
    : content.trim().length > 0 && playDate && facilityId;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-2 sm:p-4 z-50 pt-4 sm:pt-12 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl my-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-black" />
          </button>
          <h2 className="text-base sm:text-lg font-bold text-black">Create Post</h2>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>

        <div className="p-3 sm:p-4 space-y-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600">
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
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full px-0 py-2 border-0 focus:ring-0 text-lg text-black placeholder-black/60 resize-none"
                placeholder="What's happening?"
                autoFocus
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Post Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPostType('general')}
                  className={`p-3 rounded-lg border-2 font-medium transition text-sm ${
                    postType === 'general'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-black'
                  }`}
                >
                  General Post
                </button>
                <button
                  onClick={() => setPostType('match_invite')}
                  className={`p-3 rounded-lg border-2 font-medium transition text-sm ${
                    postType === 'match_invite'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-black'
                  }`}
                >
                  Match Invite
                </button>
              </div>
            </div>

            {postType === 'match_invite' && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="font-semibold text-black flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Match Details
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-black mb-1.5 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      Sport
                    </label>
                    <select
                      value={sport}
                      onChange={(e) => setSport(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    >
                      <option value="pickleball">Pickleball</option>
                      <option value="tennis">Tennis</option>
                      <option value="padel">Padel</option>
                      <option value="platform_tennis">Platform Tennis</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-black mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={playDate}
                      onChange={(e) => setPlayDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1.5">
                      Min Skill
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="7"
                      value={skillMin}
                      onChange={(e) => setSkillMin(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1.5">
                      Max Skill
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="7"
                      value={skillMax}
                      onChange={(e) => setSkillMax(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Players Needed
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="20"
                      value={spotsNeeded}
                      onChange={(e) => setSpotsNeeded(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-black mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Facility
                    </label>
                    <select
                      value={facilityId}
                      onChange={(e) => setFacilityId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    >
                      {facilities.map((facility) => (
                        <option key={facility.id} value={facility.id}>
                          {facility.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {courts.length > 0 && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-black mb-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        Court
                      </label>
                      <select
                        value={courtId}
                        onChange={(e) => setCourtId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                      >
                        <option value="">Any Court</option>
                        {courts.map((court) => (
                          <option key={court.id} value={court.id}>
                            {court.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {postType === 'general' && facilities.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-black mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Facility (optional)
                </label>
                <select
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                >
                  <option value="">None</option>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-black mb-1.5">
                Who can see this?
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
              >
                <option value="facility">Facility Members</option>
                <option value="friends">Friends Only</option>
                <option value="public">Everyone</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
