import { useState } from 'react';
import { Bell, Mail, MessageSquare, Plus, Edit, Trash2, Save, Loader2, CheckCircle, Clock, Users, Zap, Eye, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationTemplate {
  id: string;
  name: string;
  channel: 'email' | 'push' | 'sms';
  trigger: string;
  subject?: string;
  body: string;
  isActive: boolean;
  variables: string[];
  lastSent?: string;
  sentCount: number;
}

interface NotificationPreference {
  id: string;
  category: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  description: string;
}

export default function NotificationTemplates() {
  const [activeTab, setActiveTab] = useState<'templates' | 'preferences'>('templates');
  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: '1',
      name: 'Booking Confirmation',
      channel: 'email',
      trigger: 'On booking create',
      subject: 'Your court is reserved! 🏓',
      body: 'Hi {{player_name}}, your booking at {{court_name}} on {{date}} at {{time}} is confirmed. See you there!',
      isActive: true,
      variables: ['player_name', 'court_name', 'date', 'time'],
      lastSent: '2026-05-05',
      sentCount: 342,
    },
    {
      id: '2',
      name: 'Booking Reminder',
      channel: 'push',
      trigger: '1 hour before booking',
      body: '🏓 Your court time starts in 1 hour! {{court_name}} at {{time}}',
      isActive: true,
      variables: ['court_name', 'time'],
      lastSent: '2026-05-05',
      sentCount: 289,
    },
    {
      id: '3',
      name: 'Event Registration',
      channel: 'email',
      trigger: 'On event signup',
      subject: "You're in! {{event_name}}",
      body: "Hi {{player_name}}, you're registered for {{event_name}} on {{date}}. {{spots_remaining}} spots remaining.",
      isActive: true,
      variables: ['player_name', 'event_name', 'date', 'spots_remaining'],
      lastSent: '2026-05-04',
      sentCount: 67,
    },
    {
      id: '4',
      name: 'Cancellation Notice',
      channel: 'email',
      trigger: 'On booking cancel',
      subject: 'Booking cancelled',
      body: 'Hi {{player_name}}, your booking on {{date}} at {{time}} has been cancelled. A refund will be processed within 24 hours.',
      isActive: true,
      variables: ['player_name', 'date', 'time'],
      sentCount: 45,
    },
    {
      id: '5',
      name: 'Waitlist Slot Available',
      channel: 'push',
      trigger: 'On waitlist opening',
      body: '🎉 A spot opened up! {{court_name}} on {{date}} at {{time}} is now available. Book now before it fills!',
      isActive: true,
      variables: ['court_name', 'date', 'time'],
      sentCount: 23,
    },
    {
      id: '6',
      name: 'Weekly Digest',
      channel: 'email',
      trigger: 'Every Monday 8AM',
      subject: 'Your week at {{facility_name}}',
      body: 'Hi {{player_name}}, here\'s your upcoming schedule: {{upcoming_bookings}}. There are {{open_events}} events you might enjoy!',
      isActive: false,
      variables: ['player_name', 'facility_name', 'upcoming_bookings', 'open_events'],
      sentCount: 0,
    },
  ]);

  const [preferences] = useState<NotificationPreference[]>([
    { id: '1', category: 'Booking Confirmations', email: true, push: true, sms: false, description: 'Sent when a court is booked or modified' },
    { id: '2', category: 'Booking Reminders', email: false, push: true, sms: false, description: '1 hour before scheduled court time' },
    { id: '3', category: 'Event Updates', email: true, push: true, sms: false, description: 'Registration confirmations and event changes' },
    { id: '4', category: 'Cancellations & Refunds', email: true, push: false, sms: false, description: 'When bookings are cancelled or refunded' },
    { id: '5', category: 'Waitlist Alerts', email: true, push: true, sms: true, description: 'When a waitlisted slot becomes available' },
    { id: '6', category: 'Marketing & Promotions', email: true, push: false, sms: false, description: 'Campaigns, offers, and new feature announcements' },
    { id: '7', category: 'Weekly Digest', email: true, push: false, sms: false, description: 'Weekly summary of activity and upcoming events' },
    { id: '8', category: 'League & Tournament', email: true, push: true, sms: false, description: 'Match results, standings updates, and scheduling' },
  ]);

  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const getChannelConfig = (channel: string) => {
    switch (channel) {
      case 'email': return { icon: <Mail className="w-4 h-4" />, color: 'bg-blue-50 text-blue-600', label: 'Email' };
      case 'push': return { icon: <Bell className="w-4 h-4" />, color: 'bg-violet-50 text-violet-600', label: 'Push' };
      case 'sms': return { icon: <MessageSquare className="w-4 h-4" />, color: 'bg-teal-50 text-teal-600', label: 'SMS' };
      default: return { icon: <Bell className="w-4 h-4" />, color: 'bg-slate-50 text-slate-600', label: channel };
    }
  };

  const toggleTemplate = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Notifications
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Templates, triggers, and member notification preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 transition-all shadow-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-5 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'templates' ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-5 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'preferences' ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Default Preferences
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'templates' ? (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {templates.map((template, index) => {
              const channelConfig = getChannelConfig(template.channel);

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12, delay: index * 0.03 }}
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                    template.isActive ? 'border-slate-100 hover:shadow-md' : 'border-slate-100 opacity-60'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Toggle */}
                      <button
                        onClick={() => toggleTemplate(template.id)}
                        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-1 ${template.isActive ? 'bg-green-600' : 'bg-slate-200'}`}
                      >
                        <motion.div
                          animate={{ x: template.isActive ? 20 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-slate-900">{template.name}</h4>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${channelConfig.color}`}>
                            {channelConfig.icon}
                            <span className="text-[10px] font-bold">{channelConfig.label}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {template.trigger}
                          </span>
                        </div>

                        {/* Preview */}
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-2">
                          {template.subject && (
                            <p className="text-xs font-medium text-slate-700 mb-1">Subject: {template.subject}</p>
                          )}
                          <p className="text-xs text-slate-500 leading-relaxed">{template.body}</p>
                        </div>

                        {/* Variables */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {template.variables.map(v => (
                            <span key={v} className="text-[9px] font-mono bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Stats + Actions */}
                      <div className="flex-shrink-0 text-right space-y-2">
                        <p className="text-xs text-slate-400">{template.sentCount} sent</p>
                        {template.lastSent && (
                          <p className="text-[10px] text-slate-400">Last: {template.lastSent}</p>
                        )}
                        <div className="flex items-center gap-1 justify-end">
                          <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                            <Edit className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="px-6 py-3 border-b border-slate-100 grid grid-cols-[1fr_70px_70px_70px] gap-4 items-center">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Category</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase text-center">Email</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase text-center">Push</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase text-center">SMS</span>
              </div>

              <div className="divide-y divide-slate-50">
                {preferences.map((pref, index) => (
                  <motion.div
                    key={pref.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="px-6 py-4 grid grid-cols-[1fr_70px_70px_70px] gap-4 items-center hover:bg-slate-50/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{pref.category}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{pref.description}</p>
                    </div>

                    {/* Toggle cells */}
                    {(['email', 'push', 'sms'] as const).map(channel => (
                      <div key={channel} className="flex justify-center">
                        <div
                          className={`w-8 h-4 rounded-full cursor-pointer transition-colors ${
                            pref[channel] ? 'bg-green-600' : 'bg-slate-200'
                          }`}
                        >
                          <motion.div
                            animate={{ x: pref[channel] ? 16 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="w-3 h-3 bg-white rounded-full shadow-sm mt-0.5"
                          />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
