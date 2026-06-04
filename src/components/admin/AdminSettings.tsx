import { useState, useEffect } from 'react';
import { Building2, Clock, DollarSign, Bell, Shield, Mail, Save, Key, AlertCircle, CheckCircle, Globe, Palette, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type SettingsTab = 'general' | 'notifications' | 'integrations' | 'booking' | 'branding';

export default function AdminSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [facilityId, setFacilityId] = useState<string | null>(null);
  const [courtreserveOrgId, setCourtreserveOrgId] = useState('');
  const [courtreserveApiKey, setCourtreserveApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [settings, setSettings] = useState({
    clubName: '',
    email: '',
    phone: '',
    address: '',
    openTime: '06:00',
    closeTime: '22:00',
    bookingAdvanceDays: 14,
    cancellationHours: 24,
    depositPercent: 50,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    autoConfirm: true,
    requireDeposit: true,
    allowWaitlist: true,
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
        setSettings(prev => ({ ...prev, clubName: facility.name || '' }));
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
      setMessage({ type: 'success', text: 'Credentials saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save credentials' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (facilityId) {
        await supabase.from('facilities').update({ name: settings.clubName }).eq('id', facilityId);
      }
      setMessage({ type: 'success', text: 'Settings saved' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Building2 className="w-4 h-4" /> },
    { id: 'booking', label: 'Booking Rules', icon: <Clock className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <Key className="w-4 h-4" /> },
    { id: 'branding', label: 'Branding', icon: <Palette className="w-4 h-4" /> },
  ];

  const InputField = ({ label, value, onChange, type = 'text', placeholder = '' }: {
    label: string; value: string | number; onChange: (val: any) => void; type?: string; placeholder?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
      />
    </div>
  );

  const Toggle = ({ label, description, enabled, onChange }: {
    label: string; description?: string; enabled: boolean; onChange: (val: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-green-600' : 'bg-slate-200'}`}
      >
        <motion.div
          animate={{ x: enabled ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your facility configuration</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 flex-shrink-0 hidden lg:block">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMessage(null); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-green-50 text-green-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-green-600' : 'text-slate-400'}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Tabs */}
        <div className="lg:hidden w-full">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto mb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMessage(null); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">Facility Information</h3>
                    <p className="text-xs text-slate-400">Basic details about your club</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Club Name" value={settings.clubName} onChange={v => setSettings({ ...settings, clubName: v })} placeholder="Pickleball Heaven" />
                    <InputField label="Email" value={settings.email} onChange={v => setSettings({ ...settings, email: v })} type="email" placeholder="info@yourclub.com" />
                    <InputField label="Phone" value={settings.phone} onChange={v => setSettings({ ...settings, phone: v })} placeholder="(555) 123-4567" />
                    <InputField label="Address" value={settings.address} onChange={v => setSettings({ ...settings, address: v })} placeholder="123 Court St" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Opening Time" value={settings.openTime} onChange={v => setSettings({ ...settings, openTime: v })} type="time" />
                    <InputField label="Closing Time" value={settings.closeTime} onChange={v => setSettings({ ...settings, closeTime: v })} type="time" />
                  </div>
                  <button onClick={handleSaveGeneral} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 transition-colors disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              )}

              {/* Booking Rules Tab */}
              {activeTab === 'booking' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">Booking Rules</h3>
                    <p className="text-xs text-slate-400">Configure how members book courts</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Advance Booking (days)" value={settings.bookingAdvanceDays} onChange={v => setSettings({ ...settings, bookingAdvanceDays: v })} type="number" />
                    <InputField label="Cancellation Window (hours)" value={settings.cancellationHours} onChange={v => setSettings({ ...settings, cancellationHours: v })} type="number" />
                    <InputField label="Deposit (%)" value={settings.depositPercent} onChange={v => setSettings({ ...settings, depositPercent: v })} type="number" />
                  </div>
                  <div className="border-t border-slate-100 pt-4 space-y-1">
                    <Toggle label="Auto-confirm bookings" description="Automatically confirm when payment received" enabled={settings.autoConfirm} onChange={v => setSettings({ ...settings, autoConfirm: v })} />
                    <Toggle label="Require deposit" description="Require partial payment to hold slot" enabled={settings.requireDeposit} onChange={v => setSettings({ ...settings, requireDeposit: v })} />
                    <Toggle label="Enable waitlist" description="Allow members to join waitlist for full slots" enabled={settings.allowWaitlist} onChange={v => setSettings({ ...settings, allowWaitlist: v })} />
                  </div>
                  <button onClick={handleSaveGeneral} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 transition-colors disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Rules
                  </button>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">Notification Preferences</h3>
                    <p className="text-xs text-slate-400">Control what notifications are sent</p>
                  </div>
                  <div className="space-y-1">
                    <Toggle label="Email notifications" description="Booking confirmations, reminders, and updates" enabled={settings.emailNotifications} onChange={v => setSettings({ ...settings, emailNotifications: v })} />
                    <Toggle label="Push notifications" description="Mobile push for immediate alerts" enabled={settings.pushNotifications} onChange={v => setSettings({ ...settings, pushNotifications: v })} />
                    <Toggle label="SMS notifications" description="Text messages for critical updates" enabled={settings.smsNotifications} onChange={v => setSettings({ ...settings, smsNotifications: v })} />
                  </div>
                  <button onClick={handleSaveGeneral} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 transition-colors disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Preferences
                  </button>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === 'integrations' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">CourtReserve Integration</h3>
                    <p className="text-xs text-slate-400">Connect to sync events, bookings, and members</p>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Enter your CourtReserve credentials to enable automatic syncing of events, transactions, and member data.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Organization ID" value={courtreserveOrgId} onChange={setCourtreserveOrgId} placeholder="e.g., Org_13321" />
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">API Key</label>
                      <input
                        type="password"
                        value={courtreserveApiKey}
                        onChange={e => setCourtreserveApiKey(e.target.value)}
                        placeholder="Enter your API key"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveApiKey}
                    disabled={saving || !courtreserveOrgId || !courtreserveApiKey}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Credentials
                  </button>
                </div>
              )}

              {/* Branding Tab */}
              {activeTab === 'branding' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">Branding</h3>
                    <p className="text-xs text-slate-400">Customize the look of your club portal</p>
                  </div>

                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
                    <Palette className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-medium">Logo & branding customization</p>
                    <p className="text-xs text-slate-400 mt-1">Upload your club logo and set brand colors</p>
                    <button className="mt-4 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                      Upload Logo
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Status Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
