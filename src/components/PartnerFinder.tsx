import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, Search, Clock, Star, CheckCircle, X, MessageCircle, Calendar } from 'lucide-react';

interface PartnerRequest {
  id: string;
  user_id: string;
  facility_id: string;
  preferred_date: string;
  preferred_start_time: string;
  preferred_end_time: string;
  skill_level_min: number;
  skill_level_max: number;
  game_format: 'singles' | 'doubles';
  status: 'open' | 'matched' | 'expired' | 'cancelled';
  bio: string | null;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    skill_level: number;
    rating: number;
  };
  facilities: {
    id: string;
    name: string;
  };
}

interface PartnerMatch {
  id: string;
  request_id: string;
  requester_id: string;
  partner_id: string;
  match_score: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message: string | null;
  created_at: string;
  partner_requests: {
    preferred_date: string;
    preferred_start_time: string;
    preferred_end_time: string;
    facilities: {
      name: string;
    };
  };
  profiles: {
    username: string;
    full_name: string;
    skill_level: number;
  };
}

const tabs = [
  { key: 'browse', label: 'Browse', icon: Search },
  { key: 'my-requests', label: 'My Requests', icon: Users },
  { key: 'matches', label: 'Matches', icon: CheckCircle },
] as const;

export default function PartnerFinder() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'browse' | 'my-requests' | 'matches'>('browse');
  const [openRequests, setOpenRequests] = useState<PartnerRequest[]>([]);
  const [myRequests, setMyRequests] = useState<PartnerRequest[]>([]);
  const [myMatches, setMyMatches] = useState<PartnerMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    facility_id: '',
    preferred_date: '',
    preferred_start_time: '',
    preferred_end_time: '',
    skill_level_min: 3.0,
    skill_level_max: 4.0,
    game_format: 'doubles' as 'singles' | 'doubles',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
      loadFacilities();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'browse') {
        await loadOpenRequests();
      } else if (activeTab === 'my-requests') {
        await loadMyRequests();
      } else {
        await loadMyMatches();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOpenRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_requests')
        .select(`
          *,
          profiles (id, username, full_name, skill_level, rating),
          facilities (id, name)
        `)
        .eq('status', 'open')
        .neq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpenRequests(data || []);
    } catch (error) {
      console.error('Error loading open requests:', error);
    }
  };

  const loadMyRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_requests')
        .select(`
          *,
          profiles (id, username, full_name, skill_level, rating),
          facilities (id, name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyRequests(data || []);
    } catch (error) {
      console.error('Error loading my requests:', error);
    }
  };

  const loadMyMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_matches')
        .select(`
          *,
          partner_requests (
            preferred_date,
            preferred_start_time,
            preferred_end_time,
            facilities (name)
          ),
          profiles (username, full_name, skill_level)
        `)
        .or(`requester_id.eq.${user?.id},partner_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyMatches(data || []);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const loadFacilities = async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setFacilities(data || []);
    } catch (error) {
      console.error('Error loading facilities:', error);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from('partner_requests').insert({
        user_id: user.id,
        ...formData
      });

      if (error) throw error;

      setShowCreateForm(false);
      setFormData({
        facility_id: '',
        preferred_date: '',
        preferred_start_time: '',
        preferred_end_time: '',
        skill_level_min: 3.0,
        skill_level_max: 4.0,
        game_format: 'doubles',
        bio: ''
      });
      setActiveTab('my-requests');
      loadMyRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Failed to create partner request. Please try again.');
    }
  };

  const handleSendMatch = async (requestId: string, requesterId: string) => {
    if (!user) return;

    const message = prompt('Send a message to the player (optional):');
    if (message === null) return;

    try {
      const { error } = await supabase.from('partner_matches').insert({
        request_id: requestId,
        requester_id: requesterId,
        partner_id: user.id,
        facility_id: openRequests.find(r => r.id === requestId)?.facility_id,
        message: message || null,
        status: 'pending'
      });

      if (error) throw error;
      alert('Match request sent! The player will be notified.');
      loadOpenRequests();
    } catch (error) {
      console.error('Error sending match:', error);
      alert('Failed to send match request. Please try again.');
    }
  };

  const handleRespondToMatch = async (matchId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('partner_matches')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', matchId);

      if (error) throw error;
      loadMyMatches();
    } catch (error) {
      console.error('Error responding to match:', error);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Cancel this partner request?')) return;

    try {
      const { error } = await supabase
        .from('partner_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;
      loadMyRequests();
    } catch (error) {
      console.error('Error canceling request:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      open: <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">Open</span>,
      matched: <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">Matched</span>,
      expired: <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full">Expired</span>,
      cancelled: <span className="px-2.5 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full">Cancelled</span>,
      pending: <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">Pending</span>,
      accepted: <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">Accepted</span>,
      declined: <span className="px-2.5 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full">Declined</span>,
    };
    return badges[status as keyof typeof badges] || null;
  };

  const inputClass = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-600 text-slate-900 transition-all duration-200 outline-none";

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h2
                  className="text-xl font-bold text-slate-800"
                >
                  Partner Finder
                </h2>
                <p className="text-sm text-slate-400">Find your next playing partner</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
            >
              {showCreateForm ? 'Cancel' : 'Find Partner'}
            </button>
          </div>

          {/* Create Form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleCreateRequest}
                className="mb-8 overflow-hidden"
              >
                <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                  <h3
                    className="text-lg font-semibold mb-5 text-slate-800"
                  >
                    Create Partner Request
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Facility</label>
                      <select
                        value={formData.facility_id}
                        onChange={(e) => setFormData({ ...formData, facility_id: e.target.value })}
                        className={inputClass}
                        required
                      >
                        <option value="">Select facility</option>
                        {facilities.map((facility) => (
                          <option key={facility.id} value={facility.id}>{facility.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Game Format</label>
                      <select
                        value={formData.game_format}
                        onChange={(e) => setFormData({ ...formData, game_format: e.target.value as 'singles' | 'doubles' })}
                        className={inputClass}
                        required
                      >
                        <option value="doubles">Doubles</option>
                        <option value="singles">Singles</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Preferred Date</label>
                      <input
                        type="date"
                        value={formData.preferred_date}
                        onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Time Range</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="time"
                          value={formData.preferred_start_time}
                          onChange={(e) => setFormData({ ...formData, preferred_start_time: e.target.value })}
                          className={`flex-1 ${inputClass}`}
                          required
                        />
                        <span className="text-slate-300 text-sm font-medium">to</span>
                        <input
                          type="time"
                          value={formData.preferred_end_time}
                          onChange={(e) => setFormData({ ...formData, preferred_end_time: e.target.value })}
                          className={`flex-1 ${inputClass}`}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Skill Level Range</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          step="0.5"
                          value={formData.skill_level_min}
                          onChange={(e) => setFormData({ ...formData, skill_level_min: parseFloat(e.target.value) })}
                          className={`flex-1 ${inputClass}`}
                          required
                        />
                        <span className="text-slate-300 text-sm font-medium">to</span>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          step="0.5"
                          value={formData.skill_level_max}
                          onChange={(e) => setFormData({ ...formData, skill_level_max: parseFloat(e.target.value) })}
                          className={`flex-1 ${inputClass}`}
                          required
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">About You (Optional)</label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell potential partners about your play style, experience, or preferences..."
                        className={`${inputClass} placeholder:text-slate-300`}
                        rows={3}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-4 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                  >
                    Create Request
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Tab Bar - Underline Style */}
          <div className="relative flex gap-1 mb-8 border-b border-slate-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-5 py-3 font-medium transition-colors text-sm flex items-center gap-2 ${
                    activeTab === tab.key
                      ? 'text-green-700'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="partner-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700 rounded-full"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-green-700/20 border-t-green-700 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Loading...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {activeTab === 'browse' && (
                  <>
                    {openRequests.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">No open partner requests at the moment.</p>
                        <p className="text-sm text-slate-400 mt-1">Be the first to create one!</p>
                      </div>
                    ) : (
                      openRequests.map((request, index) => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.06, duration: 0.35 }}
                          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 group"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center ring-2 ring-white shadow-sm text-green-700 font-bold text-sm">
                                  {(request.profiles?.full_name || request.profiles?.username || 'A').charAt(0).toUpperCase()}
                                </div>
                                <h3
                                  className="font-semibold text-slate-800"
                                >
                                  {request.profiles?.full_name || request.profiles?.username || 'Anonymous'}
                                </h3>
                                {getStatusBadge(request.status)}
                                <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full capitalize">
                                  {request.game_format}
                                </span>
                              </div>

                              <div className="space-y-1.5 text-sm text-slate-500 mb-3">
                                <p className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-green-700/60" />
                                  {request.facilities.name}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-green-700/60" />
                                  {new Date(request.preferred_date).toLocaleDateString()} {request.preferred_start_time.slice(0, 5)} - {request.preferred_end_time.slice(0, 5)}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-green-700/60" />
                                  Skill Level: {request.skill_level_min} - {request.skill_level_max}
                                </p>
                              </div>

                              {request.bio && (
                                <p className="text-sm text-slate-500 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                  {request.bio}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleSendMatch(request.id, request.user_id)}
                              className="px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl transition-all duration-200 flex items-center gap-1.5 font-medium text-sm shadow-sm hover:shadow-md ml-4 shrink-0"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Connect
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </>
                )}

                {activeTab === 'my-requests' && (
                  <>
                    {myRequests.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">You haven't created any partner requests yet.</p>
                      </div>
                    ) : (
                      myRequests.map((request, index) => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.06, duration: 0.35 }}
                          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2.5 mb-3">
                                <h3
                                  className="font-semibold text-slate-800"
                                >
                                  {request.facilities.name}
                                </h3>
                                {getStatusBadge(request.status)}
                              </div>

                              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-500">
                                <p className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  {new Date(request.preferred_date).toLocaleDateString()}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {request.preferred_start_time.slice(0, 5)} - {request.preferred_end_time.slice(0, 5)}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Star className="w-3.5 h-3.5 text-slate-400" />
                                  Skill: {request.skill_level_min} - {request.skill_level_max}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Users className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="capitalize">{request.game_format}</span>
                                </p>
                              </div>
                            </div>

                            {request.status === 'open' && (
                              <button
                                onClick={() => handleCancelRequest(request.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </>
                )}

                {activeTab === 'matches' && (
                  <>
                    {myMatches.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">No matches yet.</p>
                      </div>
                    ) : (
                      myMatches.map((match, index) => (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.06, duration: 0.35 }}
                          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center ring-2 ring-white shadow-sm text-green-700 font-bold text-sm">
                                  {(match.profiles?.full_name || match.profiles?.username || 'P').charAt(0).toUpperCase()}
                                </div>
                                <h3
                                  className="font-semibold text-slate-800"
                                >
                                  {match.profiles?.full_name || match.profiles?.username || 'Player'}
                                </h3>
                                {getStatusBadge(match.status)}
                                {match.match_score > 0 && (
                                  <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-bold rounded-full">
                                    {Math.round(match.match_score)}% match
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1.5 text-sm text-slate-500 mb-3">
                                <p className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  {match.partner_requests?.facilities?.name}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {new Date(match.partner_requests?.preferred_date).toLocaleDateString()} {match.partner_requests?.preferred_start_time.slice(0, 5)} - {match.partner_requests?.preferred_end_time.slice(0, 5)}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Star className="w-3.5 h-3.5 text-green-700/60" />
                                  Skill Level: {match.profiles?.skill_level?.toFixed(1)}
                                </p>
                              </div>

                              {match.message && (
                                <p className="text-sm text-slate-500 bg-slate-50/80 p-3 rounded-xl border border-slate-100 italic">
                                  "{match.message}"
                                </p>
                              )}
                            </div>

                            {match.status === 'pending' && match.requester_id !== user?.id && (
                              <div className="flex gap-2 ml-4 shrink-0">
                                <button
                                  onClick={() => handleRespondToMatch(match.id, true)}
                                  className="px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRespondToMatch(match.id, false)}
                                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-all duration-200"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}
