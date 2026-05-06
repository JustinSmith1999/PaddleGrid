import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Users, Mail, Bell, Zap, Clock, Calendar, ArrowRight, Loader2, CheckCircle, X, UserMinus, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface ChurnRiskMember {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  riskLevel: 'critical' | 'high' | 'moderate';
  riskScore: number; // 0-100 (higher = more likely to churn)
  daysSinceLastBooking: number;
  previousFrequency: number; // bookings per month avg
  currentFrequency: number;
  dropPercentage: number;
  suggestedAction: string;
  actionType: 'email' | 'offer' | 'call' | 'push';
}

export default function ChurnAlerts() {
  const [members, setMembers] = useState<ChurnRiskMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionsTaken, setActionsTaken] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    analyzeChurnRisk();
  }, []);

  const analyzeChurnRisk = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email, created_at');

      if (!profiles) { setLoading(false); return; }

      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Get all bookings in last 90 days
      const { data: bookings } = await supabase
        .from('court_availability_blocks')
        .select('block_date, booked_by')
        .eq('block_type', 'reservation')
        .gte('block_date', ninetyDaysAgo.toISOString().split('T')[0]);

      // Calculate booking patterns per user
      const userPatterns: Record<string, { recent: number; mid: number; old: number; lastDate: string }> = {};

      bookings?.forEach(b => {
        if (!b.booked_by) return;
        if (!userPatterns[b.booked_by]) userPatterns[b.booked_by] = { recent: 0, mid: 0, old: 0, lastDate: '' };

        const bookDate = new Date(b.block_date);
        if (bookDate >= thirtyDaysAgo) userPatterns[b.booked_by].recent++;
        else if (bookDate >= sixtyDaysAgo) userPatterns[b.booked_by].mid++;
        else userPatterns[b.booked_by].old++;

        if (b.block_date > userPatterns[b.booked_by].lastDate) {
          userPatterns[b.booked_by].lastDate = b.block_date;
        }
      });

      // Identify at-risk members
      const atRisk: ChurnRiskMember[] = [];

      profiles.forEach(p => {
        const pattern = userPatterns[p.id];
        if (!pattern) return; // Never booked — not churn, just never activated

        const previousAvg = (pattern.mid + pattern.old) / 2; // avg per 30 days for months 2-3
        const currentFreq = pattern.recent;

        // Only flag if they were previously active
        if (previousAvg < 1) return;

        const dropPct = previousAvg > 0 ? Math.round(((previousAvg - currentFreq) / previousAvg) * 100) : 0;
        const daysSinceLast = pattern.lastDate
          ? Math.floor((now.getTime() - new Date(pattern.lastDate).getTime()) / (1000 * 60 * 60 * 24))
          : 90;

        // Risk scoring
        let riskScore = 0;
        riskScore += Math.min(40, dropPct * 0.4); // Activity drop (max 40)
        riskScore += Math.min(35, daysSinceLast * 1.2); // Days since last (max 35)
        riskScore += previousAvg >= 4 ? 15 : previousAvg >= 2 ? 10 : 5; // High-value members matter more
        if (currentFreq === 0) riskScore += 10; // Complete stop bonus

        riskScore = Math.min(100, Math.round(riskScore));

        // Only include if risk is notable
        if (riskScore < 30) return;

        let riskLevel: ChurnRiskMember['riskLevel'] = 'moderate';
        if (riskScore >= 75) riskLevel = 'critical';
        else if (riskScore >= 50) riskLevel = 'high';

        // Generate suggested action
        let suggestedAction = '';
        let actionType: ChurnRiskMember['actionType'] = 'email';

        if (riskLevel === 'critical') {
          suggestedAction = 'Send personalized win-back offer (20% off next booking)';
          actionType = 'offer';
        } else if (riskLevel === 'high' && daysSinceLast > 21) {
          suggestedAction = 'Push notification: "We miss you! Your courts are waiting"';
          actionType = 'push';
        } else if (riskLevel === 'high') {
          suggestedAction = 'Email re-engagement with upcoming events';
          actionType = 'email';
        } else {
          suggestedAction = 'Add to next "Welcome Back" campaign audience';
          actionType = 'email';
        }

        atRisk.push({
          id: p.id,
          name: p.full_name || p.email || 'Unknown',
          email: p.email || '',
          avatar_url: p.avatar_url,
          riskLevel,
          riskScore,
          daysSinceLastBooking: daysSinceLast,
          previousFrequency: Math.round(previousAvg * 10) / 10,
          currentFrequency: currentFreq,
          dropPercentage: Math.max(0, dropPct),
          suggestedAction,
          actionType,
        });
      });

      atRisk.sort((a, b) => b.riskScore - a.riskScore);
      setMembers(atRisk);
    } catch (error) {
      console.error('Error analyzing churn risk:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (memberId: string) => {
    setSending(memberId);
    // In production: trigger actual campaign/notification
    await new Promise(resolve => setTimeout(resolve, 800));
    setActionsTaken(prev => new Set([...prev, memberId]));
    setSending(null);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', bar: 'bg-red-500' };
      case 'high': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', bar: 'bg-orange-500' };
      default: return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500' };
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'offer': return <Zap className="w-3.5 h-3.5" />;
      case 'push': return <Bell className="w-3.5 h-3.5" />;
      case 'call': return <Users className="w-3.5 h-3.5" />;
      default: return <Mail className="w-3.5 h-3.5" />;
    }
  };

  const criticalCount = members.filter(m => m.riskLevel === 'critical').length;
  const highCount = members.filter(m => m.riskLevel === 'high').length;
  const moderateCount = members.filter(m => m.riskLevel === 'moderate').length;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
        <p className="text-sm text-slate-500">Analyzing member activity patterns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Churn Alerts
          </h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white">AI</span>
        </div>
        <p className="text-slate-500 text-sm mt-0.5">
          Members showing declining engagement patterns with re-activation suggestions
        </p>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <UserMinus className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Total At Risk</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{members.length}</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-600 font-medium">Critical</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{criticalCount}</p>
        </div>
        <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-orange-600 font-medium">High Risk</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{highCount}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-amber-600 font-medium">Moderate</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{moderateCount}</p>
        </div>
      </div>

      {/* Alert Tip */}
      {criticalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">
              {criticalCount} member{criticalCount > 1 ? 's' : ''} at critical churn risk
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              These members were previously active but have significantly reduced activity. Consider immediate outreach.
            </p>
          </div>
        </motion.div>
      )}

      {/* Member List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {members.map((member, index) => {
            const colors = getRiskColor(member.riskLevel);
            const isActioned = actionsTaken.has(member.id);
            const isSending = sending === member.id;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: index * 0.03 }}
                layout
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isActioned ? 'border-green-200 opacity-60' : 'border-slate-100 hover:shadow-md'
                }`}
              >
                <div className={`h-1 ${colors.bar}`} />
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">{member.name}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                          {member.riskLevel.toUpperCase()}
                        </span>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Last active {member.daysSinceLastBooking}d ago
                        </span>
                        <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          {member.dropPercentage}% drop
                        </span>
                        <span className="text-xs text-slate-400">
                          {member.previousFrequency}/mo → {member.currentFrequency}/mo
                        </span>
                      </div>

                      {/* Suggested Action */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">{getActionIcon(member.actionType)}</span>
                            <span className="text-xs text-slate-600">{member.suggestedAction}</span>
                          </div>
                        </div>

                        {isActioned ? (
                          <div className="flex items-center gap-1.5 text-green-600 px-3">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Sent</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAction(member.id)}
                            disabled={isSending}
                            className="px-4 py-2 text-xs font-medium text-white bg-green-700 hover:bg-green-800 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isSending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5" />
                                Execute
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Risk Score */}
                    <div className="flex-shrink-0 text-center">
                      <div className="relative w-12 h-12">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth="3.5"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={member.riskScore >= 75 ? '#dc2626' : member.riskScore >= 50 ? '#ea580c' : '#d97706'}
                            strokeWidth="3.5"
                            strokeDasharray={`${member.riskScore}, 100`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-700">{member.riskScore}</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">Risk</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {members.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">No churn risk detected!</p>
          <p className="text-xs text-slate-400 mt-1">All active members are maintaining healthy engagement</p>
        </div>
      )}
    </div>
  );
}
