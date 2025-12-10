import { useState, useEffect } from 'react';
import { Clock, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DayHours {
  open: string;
  close: string;
  is_open: boolean;
}

interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface Facility {
  id: string;
  name: string;
  settings: {
    operating_hours?: OperatingHours;
  };
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export function OperatingHours() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [hours, setHours] = useState<OperatingHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      loadFacilityHours();
    }
  }, [selectedFacility]);

  const fetchFacilities = async () => {
    const { data, error } = await supabase
      .from('facilities')
      .select('id, name, settings')
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setFacilities(data);
      if (data.length > 0) {
        setSelectedFacility(data[0].id);
      }
    }
    setLoading(false);
  };

  const loadFacilityHours = () => {
    const facility = facilities.find((f) => f.id === selectedFacility);
    if (facility?.settings?.operating_hours) {
      setHours(facility.settings.operating_hours);
    }
  };

  const handleDayToggle = (day: string) => {
    if (!hours) return;
    setHours({
      ...hours,
      [day]: {
        ...hours[day as keyof OperatingHours],
        is_open: !hours[day as keyof OperatingHours].is_open,
      },
    });
    setSuccess(false);
  };

  const handleTimeChange = (day: string, field: 'open' | 'close', value: string) => {
    if (!hours) return;
    setHours({
      ...hours,
      [day]: {
        ...hours[day as keyof OperatingHours],
        [field]: value,
      },
    });
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedFacility || !hours) return;

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const facility = facilities.find((f) => f.id === selectedFacility);
      const updatedSettings = {
        ...facility?.settings,
        operating_hours: hours,
      };

      const { error: updateError } = await supabase
        .from('facilities')
        .update({ settings: updatedSettings })
        .eq('id', selectedFacility);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save operating hours');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToAll = (sourceDay: string) => {
    if (!hours) return;
    const sourceHours = hours[sourceDay as keyof OperatingHours];
    const newHours = { ...hours };

    DAYS.forEach((day) => {
      if (day !== sourceDay) {
        newHours[day] = { ...sourceHours };
      }
    });

    setHours(newHours);
    setSuccess(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!hours) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No operating hours configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operating Hours</h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure when courts are available for booking
          </p>
        </div>
        <select
          value={selectedFacility}
          onChange={(e) => setSelectedFacility(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {facilities.map((facility) => (
            <option key={facility.id} value={facility.id}>
              {facility.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">About Operating Hours</h3>
            <p className="text-sm text-blue-800 mt-1">
              Operating hours define when courts are available for booking. Users will only be able to book
              times within these hours. Times outside operating hours will not be available.
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-green-900">Saved Successfully!</h4>
              <p className="text-sm text-green-800 mt-1">
                Operating hours have been updated and will take effect immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-900">Error</h4>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {DAYS.map((day) => {
            const dayHours = hours[day];
            return (
              <div key={day} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dayHours.is_open}
                        onChange={() => handleDayToggle(day)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-900">{DAY_LABELS[day]}</span>
                    </label>
                  </div>

                  {dayHours.is_open ? (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={dayHours.open}
                          onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={dayHours.close}
                          onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <button
                        onClick={() => handleApplyToAll(day)}
                        className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Apply to all days
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-500 italic">Closed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Operating Hours
            </>
          )}
        </button>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Summary</h4>
        <div className="text-sm text-gray-600 space-y-1">
          {DAYS.map((day) => {
            const dayHours = hours[day];
            return (
              <div key={day} className="flex justify-between">
                <span className="font-medium">{DAY_LABELS[day]}:</span>
                <span>
                  {dayHours.is_open
                    ? `${dayHours.open} - ${dayHours.close}`
                    : 'Closed'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
