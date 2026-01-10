import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Trophy, MapPin, Users, Clock, Image as ImageIcon, Video, Loader2, AlertTriangle, Building2 } from 'lucide-react';
import { createPost } from '../../lib/socialUtils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { sortCourtsByNumber } from '../../lib/courtUtils';
import { moderateContent, moderateImageFile } from '../../lib/contentModeration';

interface PostComposerProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ManagedFacility {
  id: string;
  name: string;
  logo_url?: string;
}

export default function PostComposer({ onClose, onSuccess }: PostComposerProps) {
  const { profile, user } = useAuth();
  const [postType, setPostType] = useState<'general' | 'match_invite'>('general');
  const [content, setContent] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const visibility = 'public';
  const [postAsType, setPostAsType] = useState<'personal' | 'facility'>('personal');
  const [selectedFacilityForPosting, setSelectedFacilityForPosting] = useState<string>('');
  const [managedFacilities, setManagedFacilities] = useState<ManagedFacility[]>([]);

  const [sport, setSport] = useState('pickleball');
  const [skillMin, setSkillMin] = useState<number>(2.5);
  const [skillMax, setSkillMax] = useState<number>(3.5);
  const [playDate, setPlayDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [spotsNeeded, setSpotsNeeded] = useState<number>(4);
  const [courtId, setCourtId] = useState('');
  const [selectedCourt, setSelectedCourt] = useState<any>(null);

  const [facilities, setFacilities] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [linkPreview, setLinkPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);

  useEffect(() => {
    loadFacilities();
    loadManagedFacilities();
  }, []);

  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);

    if (urls && urls.length > 0 && urls[0] !== detectedUrl) {
      setDetectedUrl(urls[0]);
      fetchLinkPreview(urls[0]);
    } else if (!urls) {
      setDetectedUrl(null);
      setLinkPreview(null);
    }
  }, [content]);

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

  function calculateDuration(start: string, end: string): number {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return (endMinutes - startMinutes) / 60;
  }

  async function loadFacilities() {
    const { data } = await supabase
      .from('facilities')
      .select('id, name')
      .order('name');

    setFacilities(data || []);
  }

  async function loadManagedFacilities() {
    if (!user) return;

    const { data } = await supabase
      .from('facility_users')
      .select('facility_id, role, facilities(id, name, logo_url)')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin']);

    const managed = (data || [])
      .map(fu => fu.facilities)
      .filter(f => f !== null) as ManagedFacility[];

    setManagedFacilities(managed);
    if (managed.length > 0) {
      setSelectedFacilityForPosting(managed[0].id);
    }
  }

  async function loadCourts(facilityId: string) {
    const { data } = await supabase
      .from('courts')
      .select('id, name, hourly_rate, facility_id')
      .eq('facility_id', facilityId)
      .eq('is_active', true);

    const sortedCourts = sortCourtsByNumber(data || []);
    setCourts(sortedCourts);
    if (sortedCourts.length > 0) {
      setCourtId(sortedCourts[0].id);
      setSelectedCourt(sortedCourts[0]);
    } else {
      setCourtId('');
      setSelectedCourt(null);
    }
  }

  async function fetchLinkPreview(url: string) {
    setLoadingPreview(true);
    setLinkPreview(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/extract-link-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.title || data.image) {
          setLinkPreview(data);
        }
      }
    } catch (error) {
      console.error('Error fetching link preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        errors.push(`${file.name}: Invalid file type. Only images and videos are allowed.`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File too large. Maximum size is 10MB.`);
        continue;
      }

      if (file.type.startsWith('image/')) {
        const moderationResult = moderateImageFile(file);
        if (!moderationResult.isClean) {
          setError(moderationResult.reason || 'Image contains inappropriate content');
          setShowBlockedModal(true);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      setError(errors[0]);
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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

    const moderationResult = moderateContent(content);
    if (!moderationResult.isClean) {
      setError(moderationResult.reason || 'Your post contains inappropriate content.');
      setShowBlockedModal(true);
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

    if (linkPreview) {
      postData.link_preview = linkPreview;
    }

    if (postAsType === 'facility' && selectedFacilityForPosting) {
      postData.posted_as_facility = true;
      postData.facility_id = selectedFacilityForPosting;
    } else if (facilityId) {
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

      if (courtId && selectedCourt?.hourly_rate && user) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          const userEmail = authUser?.email || '';

          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, phone')
            .eq('id', user.id)
            .maybeSingle();

          const userName = profile
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
            : 'Guest';

          const durationHours = calculateDuration(startTime, endTime);
          const totalAmount = selectedCourt.hourly_rate * durationHours;
          const pricePerPerson = totalAmount / spotsNeeded;

          const bookingPayload = {
            facility_id: facilityId,
            court_id: courtId,
            user_id: user.id,
            booking_date: playDate,
            start_time: startTime,
            end_time: endTime,
            duration_hours: durationHours,
            total_amount: totalAmount,
            user_email: userEmail,
            user_name: userName,
            user_phone: profile?.phone || '',
            court_name: selectedCourt.name,
          };

          const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/courtreserve-booking`;
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingPayload),
          });

          const bookingResult = await response.json();

          if (!response.ok) {
            throw new Error(bookingResult.details || bookingResult.error || 'Failed to create booking');
          }

          postData.booking_id = bookingResult.booking_id;
          postData.requires_payment = true;
          postData.price_per_person = pricePerPerson;
          postData.total_spots = spotsNeeded;

          if (bookingResult.payment_url) {
            window.open(bookingResult.payment_url, '_blank');
          }
        } catch (err: any) {
          setError(err.message || 'Failed to create booking for match');
          setLoading(false);
          return;
        }
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
    <>
      {showBlockedModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Content Blocked</h3>
                <p className="text-sm text-gray-700 mb-3">{error}</p>
                <p className="text-xs text-gray-600">
                  Our community guidelines prohibit profanity, slurs, hate speech, and explicit content.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowBlockedModal(false);
                setError('');
              }}
              className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-0 sm:p-4 z-50 overflow-hidden">
      <div className="bg-white rounded-none sm:rounded-2xl max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-4 py-3 flex items-center justify-between sm:rounded-t-2xl flex-shrink-0 z-10">
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

        <div className="p-3 sm:p-4 space-y-4 overflow-y-auto flex-1">
          {managedFacilities.length > 0 && (
            <div className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-semibold text-black mb-2">
                Post As
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setPostAsType('personal')}
                  className={`w-full p-3 rounded-lg border-2 transition flex items-center gap-3 ${
                    postAsType === 'personal'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600">
                    {profile?.profile_picture_url ? (
                      <img
                        src={profile.profile_picture_url}
                        alt={profile.full_name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">{profile?.full_name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-black text-sm">{profile?.full_name || 'Personal'}</div>
                    <div className="text-xs text-gray-500">Post as yourself</div>
                  </div>
                </button>

                {managedFacilities.map((facility) => (
                  <button
                    key={facility.id}
                    onClick={() => {
                      setPostAsType('facility');
                      setSelectedFacilityForPosting(facility.id);
                    }}
                    className={`w-full p-3 rounded-lg border-2 transition flex items-center gap-3 ${
                      postAsType === 'facility' && selectedFacilityForPosting === facility.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600">
                      {facility.logo_url ? (
                        <img
                          src={facility.logo_url}
                          alt={facility.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-4 h-4" />
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-black text-sm">{facility.name}</div>
                      <div className="text-xs text-gray-500">Post as facility</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600">
              {postAsType === 'facility' && selectedFacilityForPosting ? (
                (() => {
                  const facility = managedFacilities.find(f => f.id === selectedFacilityForPosting);
                  return facility?.logo_url ? (
                    <img
                      src={facility.logo_url}
                      alt={facility.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-5 h-5" />
                  );
                })()
              ) : profile?.profile_picture_url ? (
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

          {loadingPreview && (
            <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-3 bg-gray-50">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-sm text-gray-600">Loading preview...</span>
            </div>
          )}

          {linkPreview && !loadingPreview && (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:bg-gray-50 transition group relative">
              <button
                onClick={() => setLinkPreview(null)}
                className="absolute top-2 right-2 z-10 bg-black/70 text-white rounded-full p-1.5 hover:bg-black transition opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>

              {linkPreview.image && (
                <div className="w-full h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={linkPreview.image}
                    alt={linkPreview.title || 'Link preview'}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-4">
                {linkPreview.siteName && (
                  <div className="text-xs text-gray-500 mb-1 font-medium uppercase">
                    {linkPreview.siteName}
                  </div>
                )}
                {linkPreview.title && (
                  <div className="font-bold text-black mb-1 line-clamp-2">
                    {linkPreview.title}
                  </div>
                )}
                {linkPreview.description && (
                  <div className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {linkPreview.description}
                  </div>
                )}
                <div className="text-xs text-gray-400 truncate">
                  {linkPreview.url}
                </div>
              </div>
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

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-black mb-1.5">
                      Skill Level Range
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                        <input
                          type="number"
                          step="0.5"
                          min="1.0"
                          max="7.0"
                          value={skillMin}
                          onChange={(e) => setSkillMin(parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                        <input
                          type="number"
                          step="0.5"
                          min="1.0"
                          max="7.0"
                          value={skillMax}
                          onChange={(e) => setSkillMax(parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                      <Trophy className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <p className="text-xs text-blue-800">
                        Will show as <strong>{skillMin.toFixed(1)}-{skillMax.toFixed(1)} level</strong> to players
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-black mb-1.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Total Players for Game
                    </label>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setSpotsNeeded(2)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition ${
                          spotsNeeded === 2
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Singles (2)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpotsNeeded(4)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition ${
                          spotsNeeded === 4
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Doubles (4)
                      </button>
                      <input
                        type="number"
                        min="2"
                        max="20"
                        value={spotsNeeded}
                        onChange={(e) => setSpotsNeeded(parseInt(e.target.value))}
                        className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                      />
                    </div>
                    <p className="text-xs text-gray-600">
                      Total number of players for this game (including yourself). Others will see how many spots remain.
                    </p>
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
                        Court Selection
                        {courts.some(c => c.hourly_rate) && !courtId && (
                          <span className="ml-auto text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-semibold">
                            Select a court to enable booking
                          </span>
                        )}
                      </label>
                      <select
                        value={courtId}
                        onChange={(e) => {
                          const court = courts.find(c => c.id === e.target.value);
                          setCourtId(e.target.value);
                          setSelectedCourt(court || null);
                        }}
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black ${
                          !courtId && courts.some(c => c.hourly_rate)
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="">No Court Selected (Free Match Only)</option>
                        {courts.map((court) => (
                          <option key={court.id} value={court.id}>
                            {court.name} {court.hourly_rate ? `- $${court.hourly_rate}/hr (Real Booking)` : '(Free)'}
                          </option>
                        ))}
                      </select>
                      {!courtId && courts.some(c => c.hourly_rate) && (
                        <p className="text-xs text-amber-800 mt-1.5 flex items-start gap-1.5">
                          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span>Select a specific court to create a real booking with automatic payment collection. Otherwise, this is just a casual meetup.</span>
                        </p>
                      )}
                    </div>
                  )}

                  {courtId && selectedCourt && selectedCourt.hourly_rate && (
                    <div className="col-span-2">
                      <div className="border-2 rounded-lg p-4 border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base font-bold text-gray-900">
                                Real Court Booking
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs font-bold rounded">
                                ${((selectedCourt.hourly_rate * calculateDuration(startTime, endTime)) / spotsNeeded).toFixed(2)}/person
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">
                              This creates an actual booking at <strong>{facilities.find(f => f.id === facilityId)?.name}</strong> on <strong>{selectedCourt.name}</strong>. Payment is required to confirm your spot.
                            </p>
                            <div className="bg-white border-2 border-emerald-200 rounded-lg p-3 text-sm text-gray-700 space-y-2">
                              <div className="flex justify-between">
                                <span>Court rate:</span>
                                <span className="font-semibold">${selectedCourt.hourly_rate}/hr</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Duration:</span>
                                <span className="font-semibold">{calculateDuration(startTime, endTime)} hour{calculateDuration(startTime, endTime) !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total cost:</span>
                                <span className="font-semibold">${(selectedCourt.hourly_rate * calculateDuration(startTime, endTime)).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between border-t-2 border-emerald-200 pt-2 mt-2">
                                <span className="font-bold">Split {spotsNeeded} ways:</span>
                                <span className="font-bold text-emerald-700 text-lg">${((selectedCourt.hourly_rate * calculateDuration(startTime, endTime)) / spotsNeeded).toFixed(2)} each</span>
                              </div>
                            </div>
                            <div className="mt-3 flex items-start gap-2 text-xs text-emerald-800 bg-emerald-100 rounded-lg p-2">
                              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">Players will see the venue, court details, and payment amount before joining. Cost is automatically split among all participants.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {courtId && selectedCourt && !selectedCourt.hourly_rate && (
                    <div className="col-span-2">
                      <div className="border-2 rounded-lg p-4 border-amber-400 bg-amber-50">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 mb-1">
                              Free Match (No Booking)
                            </p>
                            <p className="text-sm text-gray-700">
                              This court doesn't have online booking available. Players can join for free, but you'll need to arrange court access separately.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
    </>
  );
}
