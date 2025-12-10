import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { validateSeriesForm, validateOccurrenceDates } from '../../lib/seriesValidation';
import { generateOccurrenceDates, checkCourtAvailability } from '../../lib/seriesUtils';
import { ArrowLeft, ArrowRight, Save, Calendar, Clock, Users, DollarSign, Settings, CheckCircle, Lock, ExternalLink } from 'lucide-react';
import { sortCourtsByNumber } from '../../lib/courtUtils';

interface Court {
  id: string;
  name: string;
}

interface SeriesEditorProps {
  seriesId?: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function SeriesEditor({ seriesId, onSave, onCancel }: SeriesEditorProps) {
  const [step, setStep] = useState(1);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSyncedFromCourtReserve, setIsSyncedFromCourtReserve] = useState(false);
  const [courtReserveEventId, setCourtReserveEventId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'open_play',
    skillLevelMin: 2.5,
    skillLevelMax: 3.5,
    pricePerSession: 10.00,
    seriesDiscountPercentage: 0,
    maxParticipantsPerSession: 8,
    courtIds: [] as string[],
    defaultStartTime: '09:00',
    defaultEndTime: '10:30',
    allowPartialRegistration: true,
    enableWaitlist: true,
    waitlistLimit: 10,
    registrationDeadlineHours: 2,
    isPublished: false
  });

  const [scheduleData, setScheduleData] = useState({
    startDate: '',
    endDate: '',
    selectedDays: [] as number[],
    occurrences: [] as Date[]
  });

  useEffect(() => {
    loadCourts();
    if (seriesId) {
      loadSeries();
    }
  }, [seriesId]);

  async function loadCourts() {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('id, name');

      if (error) throw error;
      setCourts(sortCourtsByNumber(data || []));
    } catch (error) {
      console.error('Error loading courts:', error);
    }
  }

  async function loadSeries() {
    if (!seriesId) return;

    try {
      const { data, error } = await supabase
        .from('event_series')
        .select('*')
        .eq('id', seriesId)
        .single();

      if (error) throw error;

      setIsSyncedFromCourtReserve(data.synced_from_courtreserve || false);
      setCourtReserveEventId(data.courtreserve_event_id || null);

      setFormData({
        title: data.title,
        description: data.description || '',
        eventType: data.event_type,
        skillLevelMin: parseFloat(data.skill_level_min),
        skillLevelMax: parseFloat(data.skill_level_max),
        pricePerSession: parseFloat(data.price_per_session),
        seriesDiscountPercentage: data.series_discount_percentage || 0,
        maxParticipantsPerSession: data.max_participants_per_session,
        courtIds: data.court_ids || [],
        defaultStartTime: data.default_start_time || '09:00',
        defaultEndTime: data.default_end_time || '10:30',
        allowPartialRegistration: data.allow_partial_registration,
        enableWaitlist: data.enable_waitlist,
        waitlistLimit: data.waitlist_limit || 10,
        registrationDeadlineHours: data.registration_deadline_hours || 2,
        isPublished: data.is_published
      });
    } catch (error) {
      console.error('Error loading series:', error);
    }
  }

  function handleInputChange(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors([]);
  }

  function handleScheduleChange(field: string, value: any) {
    setScheduleData(prev => ({ ...prev, [field]: value }));
  }

  function toggleDay(day: number) {
    setScheduleData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day].sort()
    }));
  }

  function generateOccurrences() {
    if (!scheduleData.startDate || !scheduleData.endDate || scheduleData.selectedDays.length === 0) {
      setErrors(['Please select start date, end date, and at least one day of the week']);
      return;
    }

    const start = new Date(scheduleData.startDate);
    const end = new Date(scheduleData.endDate);

    if (start > end) {
      setErrors(['End date must be after start date']);
      return;
    }

    const occurrences = generateOccurrenceDates(start, end, scheduleData.selectedDays);

    const validation = validateOccurrenceDates(occurrences);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setScheduleData(prev => ({ ...prev, occurrences }));
    setErrors([]);
  }

  async function handleSave() {
    const validation = validateSeriesForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (scheduleData.occurrences.length === 0 && !seriesId) {
      setErrors(['Please generate at least one occurrence']);
      return;
    }

    setLoading(true);
    try {
      const seriesData = {
        title: formData.title,
        description: formData.description,
        event_type: formData.eventType,
        skill_level_min: formData.skillLevelMin,
        skill_level_max: formData.skillLevelMax,
        price_per_session: formData.pricePerSession,
        series_discount_percentage: formData.seriesDiscountPercentage,
        max_participants_per_session: formData.maxParticipantsPerSession,
        court_ids: formData.courtIds,
        default_start_time: formData.defaultStartTime,
        default_end_time: formData.defaultEndTime,
        allow_partial_registration: formData.allowPartialRegistration,
        enable_waitlist: formData.enableWaitlist,
        waitlist_limit: formData.waitlistLimit,
        registration_deadline_hours: formData.registrationDeadlineHours,
        is_published: formData.isPublished
      };

      let finalSeriesId = seriesId;

      if (seriesId) {
        const { error } = await supabase
          .from('event_series')
          .update(seriesData)
          .eq('id', seriesId);

        if (error) throw error;
      } else {
        const { data: newSeries, error } = await supabase
          .from('event_series')
          .insert([{
            ...seriesData,
            created_by: (await supabase.auth.getUser()).data.user?.id
          }])
          .select()
          .single();

        if (error) throw error;
        finalSeriesId = newSeries.id;
      }

      if (scheduleData.occurrences.length > 0 && finalSeriesId) {
        const occurrencesData = scheduleData.occurrences.map(date => ({
          series_id: finalSeriesId,
          occurrence_date: date.toISOString().split('T')[0],
          start_time: formData.defaultStartTime,
          end_time: formData.defaultEndTime,
          court_id: formData.courtIds[0],
          max_participants: formData.maxParticipantsPerSession,
          status: 'scheduled'
        }));

        const { error: occError } = await supabase
          .from('event_series_occurrences')
          .insert(occurrencesData);

        if (occError) throw occError;
      }

      onSave();
    } catch (error) {
      console.error('Error saving series:', error);
      setErrors(['Failed to save series. Please try again.']);
    } finally {
      setLoading(false);
    }
  }

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  if (isSyncedFromCourtReserve && seriesId) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Series Details</h2>
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Synced from CourtReserve
                </h3>
                <p className="text-blue-800 mb-4">
                  This event was automatically imported from CourtReserve and cannot be edited directly in PaddleGrid.
                  Any changes must be made in CourtReserve, then synced again to update this event.
                </p>
                {courtReserveEventId && (
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <ExternalLink className="w-4 h-4" />
                    <span>CourtReserve Event ID: <code className="bg-blue-100 px-2 py-1 rounded">{courtReserveEventId}</code></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Title</p>
                  <p className="font-medium">{formData.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Event Type</p>
                  <p className="font-medium capitalize">{formData.eventType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Skill Level Range</p>
                  <p className="font-medium">{formData.skillLevelMin} - {formData.skillLevelMax}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price Per Session</p>
                  <p className="font-medium">${formData.pricePerSession.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Max Participants</p>
                  <p className="font-medium">{formData.maxParticipantsPerSession} players</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium">{formData.isPublished ? 'Published' : 'Draft'}</p>
                </div>
              </div>
              {formData.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-800">{formData.description}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Series List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              {seriesId ? 'Edit Series' : 'Create New Series'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-600 text-center">
              Step {step} of {totalSteps}
            </div>
          </div>
        </div>

        <div className="p-6">
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <p className="text-sm text-gray-600">Set up the fundamentals of your series</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Series Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Intermediate Open Play"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the series, who it's for, what to expect..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  value={formData.eventType}
                  onChange={(e) => handleInputChange('eventType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="open_play">Open Play</option>
                  <option value="clinic">Clinic</option>
                  <option value="tournament">Tournament</option>
                  <option value="league">League</option>
                  <option value="social">Social Event</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Skill Level
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="7"
                    value={formData.skillLevelMin}
                    onChange={(e) => handleInputChange('skillLevelMin', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Skill Level
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="7"
                    value={formData.skillLevelMax}
                    onChange={(e) => handleInputChange('skillLevelMax', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Schedule</h3>
                  <p className="text-sm text-gray-600">Define when your series will run</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={scheduleData.startDate}
                    onChange={(e) => handleScheduleChange('startDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={scheduleData.endDate}
                    onChange={(e) => handleScheduleChange('endDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Days of Week
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(index)}
                      className={`py-3 rounded-lg font-medium transition ${
                        scheduleData.selectedDays.includes(index)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.defaultStartTime}
                    onChange={(e) => handleInputChange('defaultStartTime', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.defaultEndTime}
                    onChange={(e) => handleInputChange('defaultEndTime', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={generateOccurrences}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Generate Occurrences
              </button>

              {scheduleData.occurrences.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">
                      {scheduleData.occurrences.length} occurrences generated
                    </span>
                  </div>
                  <div className="text-sm text-green-700">
                    First: {scheduleData.occurrences[0].toLocaleDateString()} |
                    Last: {scheduleData.occurrences[scheduleData.occurrences.length - 1].toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Courts & Capacity</h3>
                  <p className="text-sm text-gray-600">Assign courts and set participant limits</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Courts
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {courts.map(court => (
                    <label key={court.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.courtIds.includes(court.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange('courtIds', [...formData.courtIds, court.id]);
                          } else {
                            handleInputChange('courtIds', formData.courtIds.filter(id => id !== court.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span>{court.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Participants Per Session
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxParticipantsPerSession}
                  onChange={(e) => handleInputChange('maxParticipantsPerSession', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Pricing & Settings</h3>
                  <p className="text-sm text-gray-600">Configure pricing and registration options</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Session
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerSession}
                    onChange={(e) => handleInputChange('pricePerSession', parseFloat(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Series Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.seriesDiscountPercentage}
                  onChange={(e) => handleInputChange('seriesDiscountPercentage', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional discount for full series registration"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Deadline (hours before session)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.registrationDeadlineHours}
                  onChange={(e) => handleInputChange('registrationDeadlineHours', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.allowPartialRegistration}
                    onChange={(e) => handleInputChange('allowPartialRegistration', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Allow partial registration (users can register for individual sessions)</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.enableWaitlist}
                    onChange={(e) => handleInputChange('enableWaitlist', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Enable waitlist when sessions are full</span>
                </label>
              </div>

              {formData.enableWaitlist && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waitlist Limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.waitlistLimit}
                    onChange={(e) => handleInputChange('waitlistLimit', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Settings className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Review & Publish</h3>
                  <p className="text-sm text-gray-600">Review your series and publish when ready</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{formData.title}</h4>
                  <p className="text-sm text-gray-600">{formData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">{formData.eventType.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Skill Level:</span>
                    <span className="ml-2 font-medium">{formData.skillLevelMin} - {formData.skillLevelMax}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Price:</span>
                    <span className="ml-2 font-medium">${formData.pricePerSession}/session</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Capacity:</span>
                    <span className="ml-2 font-medium">{formData.maxParticipantsPerSession} per session</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Time:</span>
                    <span className="ml-2 font-medium">{formData.defaultStartTime} - {formData.defaultEndTime}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Occurrences:</span>
                    <span className="ml-2 font-medium">{scheduleData.occurrences.length} sessions</span>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Publish series</div>
                  <div className="text-sm text-gray-600">Make this series visible and available for registration</div>
                </div>
              </label>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Series'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
