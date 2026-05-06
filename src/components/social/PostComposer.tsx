import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Trophy, MapPin, Users, Clock, Image as ImageIcon, Video, Loader2, AlertTriangle, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

      console.log('Match invite data:', { courtId, selectedCourt, hourly_rate: selectedCourt?.hourly_rate });

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
          const hourlyRate = parseFloat(selectedCourt.hourly_rate);
          const totalAmount = hourlyRate * durationHours;
          const pricePerPerson = totalAmount / spotsNeeded;

          console.log('Payment calculation:', { durationHours, hourlyRate, totalAmount, pricePerPerson, spotsNeeded });

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

    console.log('Final post data being sent:', postData);
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
      <AnimatePresence>
        {showBlockedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>Content Blocked</h3>
                  <p className="text-sm text-slate-700 mb-3">{error}</p>
                  <p className="text-xs text-slate-500">
                    Our community guidelines prohibit profanity, slurs, hate speech, and explicit content.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBlockedModal(false);
                  setError('');
                }}
                className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition"
              >
                Got It
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 z-50 overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0 z-10">
            <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>Create Post</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Post As selector */}
            {managedFacilities.length > 0 && (
              <div className="border-b border-slate-100 pb-4">
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Post As
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setPostAsType('personal')}
                    className={`w-full p-3 rounded-xl border-2 transition flex items-center gap-3 ${
                      postAsType === 'personal'
                        ? 'border-green-600 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden bg-gradient-to-br from-green-600 to-green-700">
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
                      <div className="font-semibold text-slate-900 text-sm">{profile?.full_name || 'Personal'}</div>
                      <div className="text-xs text-slate-400">Post as yourself</div>
                    </div>
                  </button>

                  {managedFacilities.map((facility) => (
                    <button
                      key={facility.id}
                      onClick={() => {
                        setPostAsType('facility');
                        setSelectedFacilityForPosting(facility.id);
                      }}
                      className={`w-full p-3 rounded-xl border-2 transition flex items-center gap-3 ${
                        postAsType === 'facility' && selectedFacilityForPosting === facility.id
                          ? 'border-green-600 bg-green-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden bg-gradient-to-br from-green-600 to-green-700">
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
                        <div className="font-semibold text-slate-900 text-sm">{facility.name}</div>
                        <div className="text-xs text-slate-400">Post as facility</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Avatar + Textarea */}
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden bg-gradient-to-br from-green-600 to-green-700">
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
                  className="w-full border-0 focus:ring-0 focus:outline-none text-base text-slate-800 placeholder:text-slate-400 resize-none p-5"
                  placeholder="What's happening?"
                  autoFocus
                />
              </div>
            </div>

            {/* Media previews */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {previewUrls.map((url, index) => {
                  const file = selectedFiles[index];
                  const isVideo = file?.type.startsWith('video/');

                  return (
                    <div key={index} className="relative group">
                      {isVideo ? (
                        <video src={url} className="w-full h-40 object-cover rounded-xl border border-slate-100 shadow-sm" />
                      ) : (
                        <img src={url} alt={`Preview ${index + 1}`} className="w-full h-40 object-cover rounded-xl border border-slate-100 shadow-sm" />
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

            {/* Link preview loading */}
            {loadingPreview && (
              <div className="border border-slate-200 rounded-xl p-4 flex items-center gap-3 bg-slate-50">
                <Loader2 className="w-5 h-5 text-green-700 animate-spin" />
                <span className="text-sm text-slate-500">Loading preview...</span>
              </div>
            )}

            {/* Link preview card */}
            {linkPreview && !loadingPreview && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:bg-slate-50 transition group relative">
                <button
                  onClick={() => setLinkPreview(null)}
                  className="absolute top-2 right-2 z-10 bg-black/70 text-white rounded-full p-1.5 hover:bg-black transition opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>

                {linkPreview.image && (
                  <div className="w-full h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={linkPreview.image}
                      alt={linkPreview.title || 'Link preview'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-4">
                  {linkPreview.siteName && (
                    <div className="text-xs text-slate-400 mb-1 font-medium uppercase">
                      {linkPreview.siteName}
                    </div>
                  )}
                  {linkPreview.title && (
                    <div className="font-bold text-slate-900 mb-1 line-clamp-2">
                      {linkPreview.title}
                    </div>
                  )}
                  {linkPreview.description && (
                    <div className="text-sm text-slate-500 line-clamp-2 mb-2">
                      {linkPreview.description}
                    </div>
                  )}
                  <div className="text-xs text-slate-400 truncate">
                    {linkPreview.url}
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                multiple
                className="hidden"
              />

              {/* Media upload area */}
              {selectedFiles.length < 4 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-green-300 hover:bg-green-50/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-green-50 rounded-full group-hover:bg-green-100 transition">
                      <ImageIcon className="w-6 h-6 text-green-700" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-700">Add Photos or Videos</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {selectedFiles.length > 0
                          ? `${selectedFiles.length}/4 files selected`
                          : 'Up to 4 files, max 10MB each'}
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Post type segmented control */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Post Type
                </label>
                <div className="bg-slate-50 rounded-xl p-1 grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setPostType('general')}
                    className={`py-2.5 px-3 rounded-lg font-medium transition text-sm ${
                      postType === 'general'
                        ? 'bg-white text-green-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    General Post
                  </button>
                  <button
                    onClick={() => setPostType('match_invite')}
                    className={`py-2.5 px-3 rounded-lg font-medium transition text-sm ${
                      postType === 'match_invite'
                        ? 'bg-white text-green-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Match Invite
                  </button>
                </div>
              </div>

              {/* Match invite form */}
              {postType === 'match_invite' && (
                <div className="space-y-4 p-4 bg-green-50/50 rounded-xl border border-green-100">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    <Trophy className="w-4 h-4 text-green-700" />
                    Match Details
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-green-700" />
                        Sport
                      </label>
                      <select
                        value={sport}
                        onChange={(e) => setSport(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      >
                        <option value="pickleball">Pickleball</option>
                        <option value="tennis">Tennis</option>
                        <option value="padel">Padel</option>
                        <option value="platform_tennis">Platform Tennis</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-green-700" />
                        Date
                      </label>
                      <input
                        type="date"
                        value={playDate}
                        onChange={(e) => setPlayDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-green-700" />
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-green-700" />
                        End Time
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Skill Level Range
                      </label>
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Minimum</label>
                          <input
                            type="number"
                            step="0.5"
                            min="1.0"
                            max="7.0"
                            value={skillMin}
                            onChange={(e) => setSkillMin(parseFloat(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Maximum</label>
                          <input
                            type="number"
                            step="0.5"
                            min="1.0"
                            max="7.0"
                            value={skillMax}
                            onChange={(e) => setSkillMax(parseFloat(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl">
                        <Trophy className="w-4 h-4 text-green-700 flex-shrink-0" />
                        <p className="text-xs text-green-800">
                          Will show as <strong>{skillMin.toFixed(1)}-{skillMax.toFixed(1)} level</strong> to players
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-green-700" />
                        Total Players for Game
                      </label>
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setSpotsNeeded(2)}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-sm font-medium transition ${
                            spotsNeeded === 2
                              ? 'bg-green-700 text-white'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Singles (2)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSpotsNeeded(4)}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-sm font-medium transition ${
                            spotsNeeded === 4
                              ? 'bg-green-700 text-white'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
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
                          className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                      </div>
                      <p className="text-xs text-slate-400">
                        Total number of players for this game (including yourself). Others will see how many spots remain.
                      </p>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-green-700" />
                        Facility
                      </label>
                      <select
                        value={facilityId}
                        onChange={(e) => setFacilityId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
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
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-green-700" />
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
                          className={`w-full px-3 py-2 border-2 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 ${
                            !courtId && courts.some(c => c.hourly_rate)
                              ? 'border-amber-300 bg-amber-50'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          {courts.length === 0 && <option value="">No courts available</option>}
                          {courts.map((court) => (
                            <option key={court.id} value={court.id}>
                              {court.name} {court.hourly_rate ? `- $${court.hourly_rate}/hr (Real Booking)` : '(Free Match Only)'}
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

                    {/* Real court booking card */}
                    {courtId && selectedCourt && selectedCourt.hourly_rate && (
                      <div className="col-span-2">
                        <div className="border-2 rounded-xl p-4 border-green-500 bg-gradient-to-br from-green-50 to-green-50/50">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base font-bold text-slate-900">
                                  Real Court Booking
                                </span>
                                <span className="px-2 py-0.5 bg-green-700 text-white text-xs font-bold rounded-lg">
                                  ${((selectedCourt.hourly_rate * calculateDuration(startTime, endTime)) / spotsNeeded).toFixed(2)}/person
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 mb-3">
                                This creates an actual booking at <strong>{facilities.find(f => f.id === facilityId)?.name}</strong> on <strong>{selectedCourt.name}</strong>. Payment is required to confirm your spot.
                              </p>
                              <div className="bg-white border-2 border-green-200 rounded-xl p-3 text-sm text-slate-600 space-y-2">
                                <div className="flex justify-between">
                                  <span>Court rate:</span>
                                  <span className="font-semibold text-slate-800">${selectedCourt.hourly_rate}/hr</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Duration:</span>
                                  <span className="font-semibold text-slate-800">{calculateDuration(startTime, endTime)} hour{calculateDuration(startTime, endTime) !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total cost:</span>
                                  <span className="font-semibold text-slate-800">${(selectedCourt.hourly_rate * calculateDuration(startTime, endTime)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t-2 border-green-200 pt-2 mt-2">
                                  <span className="font-bold text-slate-900">Split {spotsNeeded} ways:</span>
                                  <span className="font-bold text-green-700 text-lg">${((selectedCourt.hourly_rate * calculateDuration(startTime, endTime)) / spotsNeeded).toFixed(2)} each</span>
                                </div>
                              </div>
                              <div className="mt-3 flex items-start gap-2 text-xs text-green-800 bg-green-100 rounded-xl p-2">
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

                    {/* Free match card */}
                    {courtId && selectedCourt && !selectedCourt.hourly_rate && (
                      <div className="col-span-2">
                        <div className="border-2 rounded-xl p-4 border-amber-400 bg-amber-50">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900 mb-1">
                                Free Match (No Booking)
                              </p>
                              <p className="text-sm text-slate-600">
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

              {/* Error message */}
              {error && !showBlockedModal && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>
              )}
            </div>
          </div>

          {/* Footer with submit button */}
          <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-4 rounded-b-2xl flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading || uploadingMedia}
              className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold px-6 py-2.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-sm"
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
        </motion.div>
      </motion.div>
    </>
  );
}
