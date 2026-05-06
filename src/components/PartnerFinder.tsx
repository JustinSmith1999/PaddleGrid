import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
      open: <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">Open</span>,
      matched: <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">Matched</span>,
      expired: <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-lg">Expired</span>,
      cancelled: <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-lg">Cancelled</span>,
      pending: <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-lg">Pending</span>,
      accepted: <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">Accepted</span>,
      declined: <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-lg">Declined</span>,
    };
    return badges[status as keyof typeof badges] || null;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2
            className="text-2xl font-bold text-slate-900 flex items-center gap-2"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            <Users className="w-7 h-7 text-green-700" />
            Partner Finder
          </h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl transition-colors font-medium text-sm"
          >
            {showCreateForm ? 'Cancel' : 'Find Partner'}
          </button>
        </div>

        {showCreateForm && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreateRequest}
            className="mb-6 p-5 bg-slate-50 rounded-xl border border-slate-100"
          >
            <h3
              className="text-lg font-semibold mb-4 text-slate-900"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Create Partner Request
            </h3>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Facility
                </label>
                <select
                  value={formData.facility_id}
                  onChange={(e) => setFormData({ ...formData, facility_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:border-transparent bg-white text-slate-900"
                  required
                >
                  <option value="">Select facility</option>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Game Format
                </label>
                <select
                  value={formData.game_format}
                  onChange={(e) => setFormData({ ...formData, game_format: e.target.value as 'singles' | 'doubles' })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:border-transparent bg-white text-slate-900"
                  required
                >
                  <option value="doubles">Doubles</option>
                  <option value="singles">Singles</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:border-transparent bg-white text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Time Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={formData.preferred_start_time}
                    onChange={(e) => setFormData({ ...formData, preferred_start_time: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:border-transparent bg-white text-slate-900"
                    required
                  />
                  <span className="self-center text-slate-400">to</span>
                  <input
                    type="time"
                    value={formData.preferred_end_time}
                    onChange={(e) => setFormData({ ...formData, preferred_end_time: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:border-transparent bg-white text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Skill Level Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={formData.skill_level_min}
                    onChange={(e) => setFormData({ ...formData, skill_level_min: parseFloat(e.target.value) })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:border-transparent bg-white text-slate-900"
                    required
                  />
                  <span className="self-center text-slate-400">to</span>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={formData.skill_level_max}
                    onChange={(e) => setFormData({ ...formData, skill_level_max: parseFloat(e.target.value) })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:border-transparent bg-white text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  About You (Optional)
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell potential partners about your play style, experience, or preferences..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400"
                  rows={3}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl transition-colors font-medium"
            >
              Create Request
            </button>
          </motion.form>
        )}

        <div className="flex gap-2 mb-6 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 font-medium transition-colors text-sm ${
              activeTab === 'browse'
                ? 'text-green-700 border-b-2 border-green-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-4 h-4 inline mr-1" />
            Browse
          </button>
          <button
            onClick={() => setActiveTab('my-requests')}
            className={`px-4 py-2 font-medium transition-colors text-sm ${
              activeTab === 'my-requests'
                ? 'text-green-700 border-b-2 border-green-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1" />
            My Requests
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 font-medium transition-colors text-sm ${
              activeTab === 'matches'
                ? 'text-green-700 border-b-2 border-green-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-1" />
            Matches
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'browse' && (
              <>
                {openRequests.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No open partner requests at the moment.</p>
                    <p className="text-sm mt-1">Be the first to create one!</p>
                  </div>
                ) : (
                  openRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3
                              className="font-semibold text-slate-900"
                              style={{ fontFamily: 'Manrope, sans-serif' }}
                            >
                              {request.profiles?.full_name || request.profiles?.username || 'Anonymous'}
                            </h3>
                            {getStatusBadge(request.status)}
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">
                              {request.game_format}
                            </span>
                          </div>

                          <div className="space-y-1 text-sm text-slate-500 mb-3">
                            <p className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-green-700" />
                              {request.facilities.name}
                            </p>
                            <p className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-green-700" />
                              {new Date(request.preferred_date).toLocaleDateString()} {request.preferred_start_time.slice(0, 5)} - {request.preferred_end_time.slice(0, 5)}
                            </p>
                            <p className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-green-700" />
                              Skill Level: {request.skill_level_min} - {request.skill_level_max}
                            </p>
                          </div>

                          {request.bio && (
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                              {request.bio}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleSendMatch(request.id, request.user_id)}
                          className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl transition-colors flex items-center gap-1 font-medium text-sm"
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
                  <div className="text-center py-12 text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>You haven't created any partner requests yet.</p>
                  </div>
                ) : (
                  myRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3
                              className="font-semibold text-slate-900"
                              style={{ fontFamily: 'Manrope, sans-serif' }}
                            >
                              {request.facilities.name}
                            </h3>
                            {getStatusBadge(request.status)}
                          </div>

                          <div className="space-y-1 text-sm text-slate-500">
                            <p>Date: {new Date(request.preferred_date).toLocaleDateString()}</p>
                            <p>Time: {request.preferred_start_time.slice(0, 5)} - {request.preferred_end_time.slice(0, 5)}</p>
                            <p>Skill Range: {request.skill_level_min} - {request.skill_level_max}</p>
                            <p>Format: {request.game_format}</p>
                          </div>
                        </div>

                        {request.status === 'open' && (
                          <button
                            onClick={() => handleCancelRequest(request.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
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
                  <div className="text-center py-12 text-slate-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No matches yet.</p>
                  </div>
                ) : (
                  myMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3
                              className="font-semibold text-slate-900"
                              style={{ fontFamily: 'Manrope, sans-serif' }}
                            >
                              {match.profiles?.full_name || match.profiles?.username || 'Player'}
                            </h3>
                            {getStatusBadge(match.status)}
                            {match.match_score > 0 && (
                              <span className="text-green-700 font-bold text-sm">
                                {Math.round(match.match_score)}% match
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 text-sm text-slate-500 mb-2">
                            <p>Facility: {match.partner_requests?.facilities?.name}</p>
                            <p>Date: {new Date(match.partner_requests?.preferred_date).toLocaleDateString()}</p>
                            <p>Time: {match.partner_requests?.preferred_start_time.slice(0, 5)} - {match.partner_requests?.preferred_end_time.slice(0, 5)}</p>
                            <p className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-green-700" />
                              Skill Level: {match.profiles?.skill_level?.toFixed(1)}
                            </p>
                          </div>

                          {match.message && (
                            <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-xl">
                              "{match.message}"
                            </p>
                          )}
                        </div>

                        {match.status === 'pending' && match.requester_id !== user?.id && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRespondToMatch(match.id, true)}
                              className="px-3 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-medium transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRespondToMatch(match.id, false)}
                              className="px-3 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors"
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
          </div>
        )}
      </div>
    </div>
  );
}
