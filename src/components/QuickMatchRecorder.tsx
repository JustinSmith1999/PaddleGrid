import { useState, useEffect } from 'react';
import { X, Trophy, TrendingUp, Clock, MapPin, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createActivity } from '../lib/activityUtils';
import { supabase } from '../lib/supabase';
import { sortCourtsByNumber } from '../lib/courtUtils';

interface QuickMatchRecorderProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickMatchRecorder({ onClose, onSuccess }: QuickMatchRecorderProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    activity_type: 'match' as 'match' | 'practice' | 'drill' | 'tournament',
    match_type: 'doubles' as 'singles' | 'doubles' | 'mixed_doubles' | undefined,
    facility_id: '',
    court_id: '',
    activity_date: new Date().toISOString().split('T')[0],
    start_time: '',
    duration_minutes: 60,
    score_us: 11,
    score_them: 0,
    is_win: true,
    rating_before: 0,
    rating_after: 0,
    effort_level: 5,
    description: '',
    privacy: 'public' as 'public' | 'followers' | 'private'
  });

  useEffect(() => {
    loadFacilities();
  }, []);

  useEffect(() => {
    if (formData.facility_id) {
      loadCourts(formData.facility_id);
    }
  }, [formData.facility_id]);

  useEffect(() => {
    if (formData.score_us !== undefined && formData.score_them !== undefined) {
      setFormData(prev => ({
        ...prev,
        is_win: prev.score_us > prev.score_them
      }));
    }
  }, [formData.score_us, formData.score_them]);

  async function loadFacilities() {
    const { data } = await supabase
      .from('facilities')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (data) setFacilities(data);
  }

  async function loadCourts(facilityId: string) {
    const { data } = await supabase
      .from('courts')
      .select('id, name')
      .eq('facility_id', facilityId);

    if (data) setCourts(sortCourtsByNumber(data));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const activityData = {
        ...formData,
        rating_change: formData.rating_after - formData.rating_before
      };

      const result = await createActivity(activityData);

      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        alert('Error creating activity: ' + result.error);
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error creating activity');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Log a Match</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Type
              </label>
              <select
                value={formData.activity_type}
                onChange={(e) => setFormData({...formData, activity_type: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="match">Match</option>
                <option value="practice">Practice</option>
                <option value="drill">Drill</option>
                <option value="tournament">Tournament</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Match Type
              </label>
              <select
                value={formData.match_type}
                onChange={(e) => setFormData({...formData, match_type: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="singles">Singles</option>
                <option value="doubles">Doubles</option>
                <option value="mixed_doubles">Mixed Doubles</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Facility
              </label>
              <select
                value={formData.facility_id}
                onChange={(e) => setFormData({...formData, facility_id: e.target.value, court_id: ''})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select facility...</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Court
              </label>
              <select
                value={formData.court_id}
                onChange={(e) => setFormData({...formData, court_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!formData.facility_id}
              >
                <option value="">Select court...</option>
                {courts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.activity_date}
                onChange={(e) => setFormData({...formData, activity_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Trophy className="w-4 h-4 inline mr-1" />
              Score
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">Us</label>
                <input
                  type="number"
                  value={formData.score_us}
                  onChange={(e) => setFormData({...formData, score_us: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
              <div className="text-2xl font-bold text-gray-400 pt-5">-</div>
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">Them</label>
                <input
                  type="number"
                  value={formData.score_them}
                  onChange={(e) => setFormData({...formData, score_them: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
            {formData.is_win && (
              <p className="text-sm text-green-600 mt-2 font-medium">Victory!</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Rating Before
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.rating_before}
                onChange={(e) => setFormData({...formData, rating_before: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="8"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating After
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.rating_after}
                onChange={(e) => setFormData({...formData, rating_after: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="8"
              />
            </div>
          </div>

          {formData.rating_after > formData.rating_before && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800">
                Rating gain: +{(formData.rating_after - formData.rating_before).toFixed(2)}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effort Level (1-10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.effort_level}
              onChange={(e) => setFormData({...formData, effort_level: parseInt(e.target.value)})}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>Easy</span>
              <span className="font-medium text-blue-600">{formData.effort_level}</span>
              <span>Max Effort</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Share details about your match..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Privacy
            </label>
            <select
              value={formData.privacy}
              onChange={(e) => setFormData({...formData, privacy: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="public">Public - Everyone can see</option>
              <option value="followers">Followers - Only followers can see</option>
              <option value="private">Private - Only you can see</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Logging Match...' : 'Log Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}