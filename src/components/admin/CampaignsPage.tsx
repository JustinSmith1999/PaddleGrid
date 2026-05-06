import { useState } from 'react';
import { Mail, Plus, Send, Users, Clock, BarChart3, Zap, Target, Bell, Loader2, CheckCircle, Calendar, TrendingUp, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms';
  status: 'draft' | 'scheduled' | 'sent' | 'active';
  audience: string;
  audienceSize: number;
  scheduledFor?: string;
  sentAt?: string;
  stats?: { sent: number; opened: number; clicked: number };
}

export default function CampaignsPage() {
  const [campaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Welcome Back — Re-engagement',
      type: 'email',
      status: 'draft',
      audience: 'Inactive 30+ days',
      audienceSize: 12,
    },
    {
      id: '2',
      name: 'Weekend Open Play Promo',
      type: 'push',
      status: 'scheduled',
      audience: 'All members',
      audienceSize: 156,
      scheduledFor: '2026-05-08T09:00:00',
    },
    {
      id: '3',
      name: 'New League Registration Open',
      type: 'email',
      status: 'sent',
      audience: 'Skill level 3.5+',
      audienceSize: 89,
      sentAt: '2026-05-03T10:00:00',
      stats: { sent: 89, opened: 52, clicked: 28 },
    },
  ]);

  const [showBuilder, setShowBuilder] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'push': return <Bell className="w-4 h-4" />;
      case 'sms': return <Send className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-50 text-blue-600';
      case 'push': return 'bg-violet-50 text-violet-600';
      case 'sms': return 'bg-teal-50 text-teal-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft': return { color: 'bg-slate-100 text-slate-600', label: 'Draft' };
      case 'scheduled': return { color: 'bg-amber-50 text-amber-700', label: 'Scheduled' };
      case 'sent': return { color: 'bg-green-50 text-green-700', label: 'Sent' };
      case 'active': return { color: 'bg-blue-50 text-blue-700', label: 'Active' };
      default: return { color: 'bg-slate-100 text-slate-600', label: status };
    }
  };

  // Audience Segments
  const segments = [
    { id: 'all', label: 'All Members', count: 156, icon: <Users className="w-4 h-4" /> },
    { id: 'active', label: 'Active (7d)', count: 84, icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'at-risk', label: 'At Risk / Churning', count: 12, icon: <Target className="w-4 h-4" /> },
    { id: 'new', label: 'New Members (30d)', count: 23, icon: <Zap className="w-4 h-4" /> },
    { id: 'vip', label: 'VIP / High Activity', count: 18, icon: <CheckCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Campaigns
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">NEW</span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            Targeted messaging to drive bookings and engagement
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-medium mb-1">Total Sent</p>
          <p className="text-xl font-bold text-slate-900">{campaigns.filter(c => c.status === 'sent').length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-medium mb-1">Avg Open Rate</p>
          <p className="text-xl font-bold text-green-700">58%</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-medium mb-1">Avg Click Rate</p>
          <p className="text-xl font-bold text-slate-900">31%</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-medium mb-1">Scheduled</p>
          <p className="text-xl font-bold text-amber-600">{campaigns.filter(c => c.status === 'scheduled').length}</p>
        </div>
      </div>

      {/* Audience Segments */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Audience Segments</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {segments.map(seg => (
            <div key={seg.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-green-200 hover:bg-green-50/30 transition-all cursor-pointer group">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-slate-400 group-hover:text-green-600 transition-colors">{seg.icon}</span>
                <span className="text-lg font-bold text-slate-900">{seg.count}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">{seg.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">All Campaigns</h3>
          <span className="text-xs text-slate-400">{campaigns.length} campaigns</span>
        </div>

        <div className="divide-y divide-slate-50">
          {campaigns.map((campaign, index) => {
            const statusConfig = getStatusConfig(campaign.status);

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="px-6 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Type Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${getTypeColor(campaign.type)}`}>
                    {getTypeIcon(campaign.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-slate-900 truncate">{campaign.name}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {campaign.audience}
                      </span>
                      <span className="text-xs text-slate-400">
                        {campaign.audienceSize} recipients
                      </span>
                    </div>
                  </div>

                  {/* Stats or Schedule */}
                  <div className="flex-shrink-0 text-right">
                    {campaign.stats ? (
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-900">{Math.round((campaign.stats.opened / campaign.stats.sent) * 100)}%</p>
                          <p className="text-[9px] text-slate-400">Opened</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-green-700">{Math.round((campaign.stats.clicked / campaign.stats.sent) * 100)}%</p>
                          <p className="text-[9px] text-slate-400">Clicked</p>
                        </div>
                      </div>
                    ) : campaign.scheduledFor ? (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600">
                        <Clock className="w-3 h-3" />
                        {new Date(campaign.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Draft</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Builder Placeholder Modal */}
      <AnimatePresence>
        {showBuilder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowBuilder(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-8 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Campaign Builder</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                Select your audience segment, compose your message, and schedule delivery — all powered by Smart Analytics player insights.
              </p>

              <div className="space-y-3 text-left mb-6">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-1">1. Choose Audience</p>
                  <p className="text-sm text-slate-700">Select from AI-generated segments based on player behavior</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-1">2. Compose Message</p>
                  <p className="text-sm text-slate-700">Write your email/push with personalization variables</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-1">3. Schedule & Send</p>
                  <p className="text-sm text-slate-700">Send immediately or schedule for optimal engagement time</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBuilder(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => setShowBuilder(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-green-700 rounded-xl hover:bg-green-800 transition-colors"
                >
                  Coming Soon
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
