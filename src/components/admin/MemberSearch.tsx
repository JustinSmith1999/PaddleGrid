import { useState, useEffect, useMemo } from 'react';
import { Search, Users, Mail, Phone, Calendar, UserPlus, Eye, Filter, X, Activity, TrendingUp, TrendingDown, Minus, ChevronDown, Loader2, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, fetchAllRows } from '../../lib/supabase';

interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  skill_level: string;
  created_at: string;
  bookingCount?: number;
  lastBooking?: string;
  engagementTrend?: 'rising' | 'declining' | 'stable';
}

type FilterRole = 'all' | 'owner' | 'admin' | 'desk' | 'coach' | 'member';
type SortBy = 'newest' | 'alphabetical' | 'most_active';

export default function MemberSearch() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [filterRole, setFilterRole] = useState<FilterRole>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const data = await fetchAllRows(() =>
      supabase.from('profiles').select('*').order('created_at', { ascending: false })
    );

    if (data.length) {
      // Enrich with booking counts
      const bookingCounts = await fetchAllRows(() =>
        supabase.from('court_availability_blocks')
          .select('notes')
          .eq('block_type', 'reservation')
          .gte('block_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      );

      const countMap: Record<string, number> = {};
      bookingCounts.forEach(b => {
        const name = b.notes || '';
        countMap[name] = (countMap[name] || 0) + 1;
      });

      const enriched = data.map(m => ({
        ...m,
        bookingCount: countMap[m.full_name] || 0,
        engagementTrend: (countMap[m.full_name] || 0) > 4 ? 'rising' as const :
          (countMap[m.full_name] || 0) > 0 ? 'stable' as const : 'declining' as const
      }));

      setMembers(enriched);
    }
    setLoading(false);
  };

  const filteredMembers = useMemo(() => {
    let result = [...members];

    // Search filter
    if (searchTerm.length >= 2) {
      const term = searchTerm.toLowerCase();
      result = result.filter(m =>
        m.full_name?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term) ||
        m.phone?.includes(term)
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      result = result.filter(m => m.role === filterRole);
    }

    // Sort
    switch (sortBy) {
      case 'alphabetical':
        result.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
        break;
      case 'most_active':
        result.sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [members, searchTerm, filterRole, sortBy]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'admin': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'desk': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'coach': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getEngagementColor = (trend?: string) => {
    switch (trend) {
      case 'rising': return { icon: <TrendingUp className="w-3 h-3" />, color: 'text-green-600', bg: 'bg-green-50', label: 'Active' };
      case 'declining': return { icon: <TrendingDown className="w-3 h-3" />, color: 'text-red-500', bg: 'bg-red-50', label: 'At Risk' };
      default: return { icon: <Minus className="w-3 h-3" />, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Stable' };
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  };

  const getAvatarGradient = (name: string) => {
    const colors = [
      'from-green-400 to-green-600',
      'from-teal-400 to-teal-600',
      'from-emerald-400 to-emerald-600',
      'from-sky-400 to-sky-600',
      'from-violet-400 to-violet-600',
      'from-amber-400 to-amber-600',
    ];
    const index = (name || '').charCodeAt(0) % colors.length;
    return colors[index];
  };

  const memberCount = filteredMembers.length;
  const activeCount = members.filter(m => m.engagementTrend === 'rising').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Members
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {members.length} total · {activeCount} active this month
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 transition-all shadow-sm hover:shadow-md">
          <UserPlus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showFilters || filterRole !== 'all'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {filterRole !== 'all' && (
              <span className="w-5 h-5 rounded-full bg-green-600 text-white text-[10px] flex items-center justify-center">1</span>
            )}
          </button>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortBy)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400"
          >
            <option value="newest">Newest First</option>
            <option value="alphabetical">A → Z</option>
            <option value="most_active">Most Active</option>
          </select>
        </div>

        {/* Filter Bar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-400">Role:</span>
                {(['all', 'owner', 'admin', 'desk', 'coach', 'member'] as FilterRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => setFilterRole(role)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                      filterRole === role
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-slate-400">
          Showing {memberCount} member{memberCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Member List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 text-green-700 animate-spin" />
          <p className="text-sm text-slate-500">Loading members...</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredMembers.map((member, index) => {
              const engagement = getEngagementColor(member.engagementTrend);

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                  layout
                  className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-green-100 transition-all cursor-pointer group"
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="px-5 py-4 flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarGradient(member.full_name)} flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0`}>
                      {getInitials(member.full_name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-slate-900 truncate">{member.full_name}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${getRoleColor(member.role)}`}>
                          {member.role || 'member'}
                        </span>
                        {member.bookingCount && member.bookingCount > 8 && (
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400 truncate">{member.email}</span>
                        {member.phone && (
                          <span className="text-xs text-slate-400 hidden md:inline">{member.phone}</span>
                        )}
                      </div>
                    </div>

                    {/* Engagement */}
                    <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{member.bookingCount || 0}</p>
                        <p className="text-[10px] text-slate-400">bookings</p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${engagement.bg}`}>
                        <span className={engagement.color}>{engagement.icon}</span>
                        <span className={`text-[10px] font-medium ${engagement.color}`}>{engagement.label}</span>
                      </div>
                    </div>

                    {/* Join Date */}
                    <div className="hidden lg:block text-right flex-shrink-0">
                      <p className="text-xs text-slate-400">
                        {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Eye className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredMembers.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No members found</p>
              {searchTerm && (
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search</p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Member Detail Modal */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Profile Header */}
              <div className="bg-gradient-to-br from-green-600 to-green-800 px-6 py-8 text-center relative">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className={`w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3 shadow-lg`}>
                  {getInitials(selectedMember.full_name)}
                </div>
                <h3 className="text-lg font-semibold text-white">{selectedMember.full_name}</h3>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/20 text-white capitalize">
                    {selectedMember.role || 'member'}
                  </span>
                  {selectedMember.skill_level && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                      {selectedMember.skill_level}
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-slate-50">
                    <p className="text-lg font-bold text-slate-900">{selectedMember.bookingCount || 0}</p>
                    <p className="text-[10px] text-slate-400">Bookings (30d)</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-slate-50">
                    <p className="text-lg font-bold text-green-700">
                      {(() => {
                        const engagement = getEngagementColor(selectedMember.engagementTrend);
                        return engagement.label;
                      })()}
                    </p>
                    <p className="text-[10px] text-slate-400">Status</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-slate-50">
                    <p className="text-lg font-bold text-slate-900">
                      {Math.floor((Date.now() - new Date(selectedMember.created_at).getTime()) / (1000 * 60 * 60 * 24))}d
                    </p>
                    <p className="text-[10px] text-slate-400">Member For</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-sm text-slate-600">{selectedMember.email}</span>
                  </div>
                  {selectedMember.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-sm text-slate-600">{selectedMember.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-sm text-slate-600">
                      Joined {new Date(selectedMember.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex gap-3">
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200"
                  >
                    Close
                  </button>
                  <button className="flex-1 py-2.5 text-sm font-medium text-white bg-green-700 hover:bg-green-800 rounded-xl transition-colors shadow-sm">
                    View Full Profile
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
