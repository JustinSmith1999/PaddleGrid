import { useState, useEffect } from 'react';
import { Building2, Clock, DollarSign, Bell, Shield, Mail, Save, Key, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminSettings() {
  const { user } = useAuth();
  const [facilityId, setFacilityId] = useState<string | null>(null);
  const [courtreserveOrgId, setCourtreserveOrgId] = useState('');
  const [courtreserveApiKey, setCourtreserveApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [settings, setSettings] = useState({
    clubName: 'PaddleGrid Club',
    email: 'contact@paddlegrid.com',
    phone: '(555) 123-4567',
    address: '123 Court Street, Sportsville, ST 12345',
    openTime: '06:00',
    closeTime: '22:00',
    bookingAdvanceDays: 14,
    cancellationHours: 24,
    depositPercent: 50,
    emailNotifications: true,
    smsNotifications: false,
    autoConfirm: true,
    requireDeposit: true,
  });

  useEffect(() => {
    loadFacilitySettings();
  }, [user]);

  const loadFacilitySettings = async () => {
    if (!user) return;

    try {
      const { data: facilityUser } = await supabase
        .from('facility_users')
        .select('facility_id, facilities(id, name, settings)')
        .eq('user_id', user.id)
        .in('role', ['admin', 'owner'])
        .maybeSingle();

      if (facilityUser?.facilities) {
        const facility = facilityUser.facilities as any;
        setFacilityId(facility.id);
        setCourtreserveOrgId(facility.settings?.courtreserve_org_id || '');
        setCourtreserveApiKey(facility.settings?.courtreserve_api_key || '');
      }
    } catch (error) {
      console.error('Error loading facility settings:', error);
    }
  };

  const handleSaveApiKey = async () => {
    if (!facilityId) {
      setMessage({ type: 'error', text: 'No facility found' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { data: facility } = await supabase
        .from('facilities')
        .select('settings')
        .eq('id', facilityId)
        .single();

      const updatedSettings = {
        ...(facility?.settings || {}),
        courtreserve_org_id: courtreserveOrgId,
        courtreserve_api_key: courtreserveApiKey,
      };

      const { error } = await supabase
        .from('facilities')
        .update({ settings: updatedSettings })
        .eq('id', facilityId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'CourtReserve credentials saved successfully' });
    } catch (error) {
      console.error('Error saving credentials:', error);
      setMessage({ type: 'error', text: 'Failed to save credentials' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    console.log('Settings saved:', settings);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border-2 border-stone-200">
        <div className="p-6 border-b-2 border-stone-200">
          <div className="flex items-center space-x-3">
            <Key className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-stone-800">CourtReserve Integration</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">CourtReserve API Credentials:</p>
                <p>Enter your CourtReserve Organization ID and API Key below. These credentials are securely stored and used to sync events, bookings, and transactions from CourtReserve.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Organization ID
              </label>
              <input
                type="text"
                value={courtreserveOrgId}
                onChange={(e) => setCourtreserveOrgId(e.target.value)}
                placeholder="e.g., Org_13321"
                className="w-full px-4 py-2 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={courtreserveApiKey}
                onChange={(e) => setCourtreserveApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full px-4 py-2 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border-2 border-green-200' : 'bg-red-50 text-red-800 border-2 border-red-200'}`}>
              {message.text}
            </div>
          )}

          <button
            onClick={handleSaveApiKey}
            disabled={saving || !courtreserveOrgId || !courtreserveApiKey}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Credentials'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border-2 border-stone-200">
        <div className="p-6 border-b-2 border-stone-200">
          <div className="flex items-center space-x-3">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-stone-800">Club Information</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Club Name</label>
            <input
              type="text"
              value={settings.clubName}
              onChange={(e) => setSettings({...settings, clubName: e.target.value})}
              className="w-full px-4 py-2 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({...settings, email: e.target.value})}
                className="w-full px-4 py-2 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Phone</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({...settings, phone: e.target.value})}
                className="w-full px-4 py-2 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Address</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({...settings, address: e.target.value})}
              className="w-full px-4 py-2 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border-2 border-stone-200">
        <div className="p-6 border-b-2 border-stone-200">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-stone-800">Operating Hours</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Opening Time</label>
              <input
                type="time"
                value={settings.openTime}
                onChange={(e) => setSettings({...settings, openTime: e.target.value})}
                className="w-full px-4 py-2 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Closing Time</label>
              <input
                type="time"
                value={settings.closeTime}
                onChange={(e) => setSettings({...settings, closeTime: e.target.value})}
                className="w-full px-4 py-2 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border-2 border-stone-200">
        <div className="p-6 border-b-2 border-stone-200">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-stone-800">Booking Policies</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Booking Advance Days
              <span className="text-stone-500 font-normal ml-2">(How far in advance can members book?)</span>
            </label>
            <input
              type="number"
              value={settings.bookingAdvanceDays}
              onChange={(e) => setSettings({...settings, bookingAdvanceDays: parseInt(e.target.value)})}
              className="w-full md:w-48 px-4 py-2 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Cancellation Notice (Hours)
              <span className="text-stone-500 font-normal ml-2">(Minimum hours before booking to cancel)</span>
            </label>
            <input
              type="number"
              value={settings.cancellationHours}
              onChange={(e) => setSettings({...settings, cancellationHours: parseInt(e.target.value)})}
              className="w-full md:w-48 px-4 py-2 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Deposit Percentage
              <span className="text-stone-500 font-normal ml-2">(% required upfront)</span>
            </label>
            <input
              type="number"
              value={settings.depositPercent}
              onChange={(e) => setSettings({...settings, depositPercent: parseInt(e.target.value)})}
              className="w-full md:w-48 px-4 py-2 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="requireDeposit"
              checked={settings.requireDeposit}
              onChange={(e) => setSettings({...settings, requireDeposit: e.target.checked})}
              className="w-5 h-5 text-emerald-600 border-2 border-stone-300 rounded focus:ring-2 focus:ring-emerald-500"
            />
            <label htmlFor="requireDeposit" className="text-sm font-semibold text-stone-700">
              Require deposit for all bookings
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="autoConfirm"
              checked={settings.autoConfirm}
              onChange={(e) => setSettings({...settings, autoConfirm: e.target.checked})}
              className="w-5 h-5 text-emerald-600 border-2 border-stone-300 rounded focus:ring-2 focus:ring-emerald-500"
            />
            <label htmlFor="autoConfirm" className="text-sm font-semibold text-stone-700">
              Auto-confirm bookings after payment
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border-2 border-stone-200">
        <div className="p-6 border-b-2 border-stone-200">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-stone-800">Notifications</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="emailNotifications"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
              className="w-5 h-5 text-emerald-600 border-2 border-stone-300 rounded focus:ring-2 focus:ring-emerald-500"
            />
            <label htmlFor="emailNotifications" className="text-sm font-semibold text-stone-700">
              Send email notifications for bookings and updates
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="smsNotifications"
              checked={settings.smsNotifications}
              onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})}
              className="w-5 h-5 text-emerald-600 border-2 border-stone-300 rounded focus:ring-2 focus:ring-emerald-500"
            />
            <label htmlFor="smsNotifications" className="text-sm font-semibold text-stone-700">
              Send SMS notifications (additional charges apply)
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold shadow-sm"
        >
          <Save className="w-5 h-5" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );
}
