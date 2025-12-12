import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Trophy, MapPin, Users, Clock, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { createPost } from '../../lib/socialUtils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { sortCourtsByNumber } from '../../lib/courtUtils';

interface PostComposerProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PostComposer({ onClose, onSuccess }: PostComposerProps) {
  const { profile, user } = useAuth();
  const [postType, setPostType] = useState<'general' | 'match_invite'>('general');
  const [content, setContent] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const visibility = 'public';

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

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFacilities();
  }, []);

  useEffect(() => {
    if (postType === 'match_invite' && facilities.length > 0 && !facilityId) {
      setFacilityId(facilities[0].id);
    }
  }, [postType, facilities]);

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

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        return false;
      }
      return true;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were skipped. Only images and videos under 10MB are allowed.');
    }

    if (selectedFiles.length + validFiles.length > 4) {
      setError('Maximum 4 media files allowed per post');
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setPreviewUrls(prev => [...prev, url]);
    });
  }

  function removeFile(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function uploadMedia(file: File): Promise<string | null> {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('social-posts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('social-posts')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      return null;
    }
  }

  async function handleSubmit() {
    setError('');

    if (!content.trim() && selectedFiles.length === 0) {
      setError('Please enter some content or add media');
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

    let mediaUrls: string[] = [];

    if (selectedFiles.length > 0) {
      setUploadingMedia(true);

      const uploadPromises = selectedFiles.map(file => uploadMedia(file));
      const uploadedUrls = await Promise.all(uploadPromises);

      mediaUrls = uploadedUrls.filter((url): url is string => url !== null);

      if (mediaUrls.length !== selectedFiles.length) {
        setError('Some media files failed to upload');
        setLoading(false);
        setUploadingMedia(false);
        return;
      }

      setUploadingMedia(false);
    }

    const postData: any = {
      post_type: postType,
      content,
      visibility,
      media_urls: mediaUrls
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
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      onSuccess();
      onClose();
    } else {
      setError(result.error || 'Failed to create post');
    }

    setLoading(false);
  }

  const canSubmit = postType === 'general'
    ? content.trim().length > 0 || selectedFiles.length > 0
    : (content.trim().length > 0 || selectedFiles.length > 0) && playDate && facilityId;

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
            disabled={!canSubmit || loading || uploadingMedia}
            className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
          >
            {uploadingMedia ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Posting...
              </>
            ) : (
              'Post'
            )}
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
                className="w-full px-0 py-2 border-0 focus:ring-0 focus:outline-none text-lg text-black placeholder-black/60 resize-none"
                placeholder="What's happening?"
                autoFocus
              />
            </div>
          </div>

          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {previewUrls.map((url, index) => {
                const file = selectedFiles[index];
                const isVideo = file?.type.startsWith('video/');

                return (
                  <div key={index} className="relative group">
                    {isVideo ? (
                      <video src={url} className="w-full h-40 object-cover rounded-lg" />
                    ) : (
                      <img src={url} alt={`Preview ${index + 1}`} className="w-full h-40 object-cover rounded-lg" />
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 hover:bg-black transition opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {isVideo && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white rounded px-2 py-1 text-xs flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        Video
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />

            {selectedFiles.length < 4 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition">
                    <ImageIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">Add Photos or Videos</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedFiles.length > 0
                        ? `${selectedFiles.length}/4 files selected`
                        : 'Up to 4 files, max 10MB each'}
                    </p>
                  </div>
                </div>
              </button>
            )}

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
