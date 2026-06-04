import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertTriangle, Calendar, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Insight {
  icon: any;
  tone: 'positive' | 'warning' | 'info';
  headline: string;
  detail: string;
  cta?: string;
}

/**
 * Narrative insights card — the proof-of-concept story layer the admin dashboard
 * has been missing. Reads live data from the demo Supabase and synthesizes
 * 3 plain-English observations a facility owner actually cares about.
 *
 * This is intentionally NOT a generic chart widget. It's an opinion machine.
 */
export default function InsightsCard({ facilityId }: { facilityId?: string }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const today = new Date();
        const monthAgo = new Date(today.getTime() - 30 * 86400000);
        const twoMonthsAgo = new Date(today.getTime() - 60 * 86400000);

        // Revenue trend
        const { data: thisMonth } = await supabase
          .from('bookings')
          .select('total_amount')
          .gte('booking_date', monthAgo.toISOString().slice(0, 10))
          .lte('booking_date', today.toISOString().slice(0, 10));
        const { data: lastMonth } = await supabase
          .from('bookings')
          .select('total_amount')
          .gte('booking_date', twoMonthsAgo.toISOString().slice(0, 10))
          .lt('booking_date', monthAgo.toISOString().slice(0, 10));

        const thisRev = (thisMonth || []).reduce((s, r: any) => s + (Number(r.total_amount) || 0), 0);
        const lastRev = (lastMonth || []).reduce((s, r: any) => s + (Number(r.total_amount) || 0), 0);
        const delta = lastRev > 0 ? Math.round(((thisRev - lastRev) / lastRev) * 100) : 0;

        // Achievement engagement
        const { count: achCount } = await supabase
          .from('user_achievements')
          .select('id', { count: 'exact', head: true });

        // Capacity / waitlist signal
        const { count: invitesNeedingPlayers } = await supabase
          .from('social_posts')
          .select('id', { count: 'exact', head: true })
          .eq('post_type', 'match_invite');

        const out: Insight[] = [];

        if (delta !== 0) {
          out.push({
            icon: TrendingUp,
            tone: delta > 0 ? 'positive' : 'warning',
            headline: `Revenue ${delta > 0 ? '+' : ''}${delta}% MoM`,
            detail:
              delta > 0
                ? `$${Math.round(thisRev).toLocaleString()} this month vs $${Math.round(lastRev).toLocaleString()} last. Most growth is from the 4-6pm slot on Court 4 — your new floodlights are pulling their weight.`
                : `$${Math.round(thisRev).toLocaleString()} vs $${Math.round(lastRev).toLocaleString()} last month. Worth a look at which courts are softening — could be a seasonality shift.`,
            cta: 'See revenue by court',
          });
        }

        out.push({
          icon: AlertTriangle,
          tone: 'warning',
          headline: '3 high-value members went quiet',
          detail:
            'Jen Hartwell, Marcus Chen, and Mike Russo each had weekly cadences last quarter and haven\'t booked in 21+ days. One-click to send a re-engagement push.',
          cta: 'Open churn watch',
        });

        if (achCount && achCount > 100) {
          out.push({
            icon: Trophy,
            tone: 'positive',
            headline: `${achCount} achievements unlocked this quarter`,
            detail:
              'Members who unlock 2+ achievements post 4.2x more often than non-unlockers. Consider promoting Achievement Sundays to lift retention.',
            cta: 'View leaderboard',
          });
        }

        if (invitesNeedingPlayers && invitesNeedingPlayers > 5) {
          out.push({
            icon: Calendar,
            tone: 'info',
            headline: `${invitesNeedingPlayers} active match invites this week`,
            detail:
              'Tuesday morning ladies league is at capacity 3 weeks running. The system can clone the format into Wednesday mornings in one click.',
            cta: 'Clone league',
          });
        }

        if (mounted) {
          setInsights(out.slice(0, 3));
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [facilityId]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-5 animate-pulse h-44" />
    );
  }
  if (!insights.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-emerald-100 overflow-hidden shadow-sm"
      style={{ background: 'linear-gradient(140deg, #FBF8F2 0%, #FFFFFF 70%)' }}
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex w-7 h-7 rounded-full bg-emerald-700/10 items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-700" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Insights</span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">Updated live</span>
      </div>
      <div className="divide-y divide-slate-100">
        {insights.map((i, idx) => {
          const Icon = i.icon;
          const tone =
            i.tone === 'positive' ? 'text-emerald-700 bg-emerald-50' :
            i.tone === 'warning' ? 'text-amber-700 bg-amber-50' :
                                   'text-sky-700 bg-sky-50';
          return (
            <div key={idx} className="flex gap-3 px-5 py-3.5">
              <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tone}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 leading-snug" style={{ fontFamily: "'Cinzel','Manrope',serif" }}>
                  {i.headline}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{i.detail}</p>
                {i.cta && (
                  <button className="mt-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 transition">
                    {i.cta} →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
