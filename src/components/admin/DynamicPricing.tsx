import { useState, useEffect } from 'react';
import { DollarSign, Clock, Calendar, Plus, Trash2, Save, Loader2, Zap, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface PricingRule {
  id: string;
  name: string;
  type: 'peak' | 'off-peak' | 'weekend' | 'custom';
  multiplier: number; // 1.0 = base rate, 1.5 = 50% more, 0.7 = 30% off
  days: number[]; // 0=Sun, 1=Mon...
  startHour: number;
  endHour: number;
  isActive: boolean;
}

interface DynamicPricingProps {
  facilityId: string | null;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

export default function DynamicPricing({ facilityId }: DynamicPricingProps) {
  const [rules, setRules] = useState<PricingRule[]>([
    {
      id: '1',
      name: 'Peak Hours Premium',
      type: 'peak',
      multiplier: 1.5,
      days: [1, 2, 3, 4, 5],
      startHour: 17,
      endHour: 21,
      isActive: true,
    },
    {
      id: '2',
      name: 'Early Bird Discount',
      type: 'off-peak',
      multiplier: 0.7,
      days: [1, 2, 3, 4, 5],
      startHour: 6,
      endHour: 9,
      isActive: true,
    },
    {
      id: '3',
      name: 'Weekend Premium',
      type: 'weekend',
      multiplier: 1.25,
      days: [0, 6],
      startHour: 8,
      endHour: 18,
      isActive: true,
    },
    {
      id: '4',
      name: 'Weekday Midday Special',
      type: 'off-peak',
      multiplier: 0.6,
      days: [1, 2, 3, 4, 5],
      startHour: 11,
      endHour: 14,
      isActive: false,
    },
  ]);

  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [baseRate, setBaseRate] = useState(30); // default $30/hr

  useEffect(() => {
    loadBaseRate();
  }, [facilityId]);

  const loadBaseRate = async () => {
    if (!facilityId) return;
    const { data } = await supabase
      .from('courts')
      .select('hourly_rate')
      .limit(1)
      .single();
    if (data) setBaseRate(Number(data.hourly_rate) || 30);
  };

  const getRuleColor = (type: string) => {
    switch (type) {
      case 'peak': return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', gradient: 'from-red-500 to-orange-500' };
      case 'off-peak': return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', gradient: 'from-green-500 to-emerald-500' };
      case 'weekend': return { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', gradient: 'from-violet-500 to-purple-500' };
      default: return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-500 to-sky-500' };
    }
  };

  const formatMultiplier = (m: number) => {
    if (m > 1) return `+${Math.round((m - 1) * 100)}%`;
    if (m < 1) return `-${Math.round((1 - m) * 100)}%`;
    return 'Base';
  };

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}${period}`;
  };

  const getHourPrice = (day: number, hour: number) => {
    const activeRules = rules.filter(r =>
      r.isActive &&
      r.days.includes(day) &&
      hour >= r.startHour &&
      hour < r.endHour
    );
    if (activeRules.length === 0) return baseRate;
    // Apply highest multiplier
    const maxMultiplier = Math.max(...activeRules.map(r => r.multiplier));
    return baseRate * maxMultiplier;
  };

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    // In production: save to Supabase facility settings
    await new Promise(resolve => setTimeout(resolve, 800));
    setMessage({ type: 'success', text: 'Pricing rules saved' });
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  // Calculate potential revenue impact
  const estimatedWeeklyImpact = rules
    .filter(r => r.isActive)
    .reduce((total, rule) => {
      const hoursPerDay = rule.endHour - rule.startHour;
      const daysPerWeek = rule.days.length;
      const priceDiff = baseRate * (rule.multiplier - 1);
      return total + (priceDiff * hoursPerDay * daysPerWeek * 0.5); // assume 50% fill
    }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Dynamic Pricing
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Optimize revenue with time-based pricing rules
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Rules
          </button>
        </div>
      </div>

      {/* Impact Banner */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-700 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-green-100 text-xs font-medium">Estimated Weekly Revenue Impact</p>
              <p className="text-2xl font-bold text-white">
                {estimatedWeeklyImpact >= 0 ? '+' : ''}${Math.abs(estimatedWeeklyImpact).toFixed(0)}/week
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-green-100 text-xs">Base Rate</p>
            <p className="text-lg font-bold text-white">${baseRate}/hr</p>
          </div>
        </div>
      </div>

      {/* Pricing Rules */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Active Rules</h3>
          <button
            onClick={() => {
              setEditingRule({
                id: String(Date.now()),
                name: '',
                type: 'custom',
                multiplier: 1.0,
                days: [1, 2, 3, 4, 5],
                startHour: 9,
                endHour: 17,
                isActive: true,
              });
              setShowEditor(true);
            }}
            className="text-xs font-medium text-green-700 hover:text-green-800 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Rule
          </button>
        </div>

        <AnimatePresence mode="popLayout">
          {rules.map((rule, index) => {
            const color = getRuleColor(rule.type);

            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15, delay: index * 0.03 }}
                layout
                className={`bg-white rounded-xl border ${rule.isActive ? 'border-slate-100 shadow-sm' : 'border-slate-100 opacity-60'} overflow-hidden`}
              >
                <div className={`h-1 bg-gradient-to-r ${color.gradient} ${!rule.isActive ? 'opacity-30' : ''}`} />
                <div className="p-4 flex items-center gap-4">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${rule.isActive ? 'bg-green-600' : 'bg-slate-200'}`}
                  >
                    <motion.div
                      animate={{ x: rule.isActive ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-900">{rule.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                        {formatMultiplier(rule.multiplier)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {rule.days.map(d => DAYS[d]).join(', ')} · {formatHour(rule.startHour)} – {formatHour(rule.endHour)}
                    </p>
                  </div>

                  {/* Price Preview */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${rule.multiplier > 1 ? 'text-red-600' : rule.multiplier < 1 ? 'text-green-700' : 'text-slate-900'}`}>
                      ${(baseRate * rule.multiplier).toFixed(0)}/hr
                    </p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-500" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Price Calendar Preview */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Weekly Price Preview</h3>
          <p className="text-xs text-slate-400 mt-0.5">Effective rates based on active rules</p>
        </div>
        <div className="p-4 overflow-x-auto">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 min-w-[600px]">
            {/* Header */}
            <div />
            {DAYS.map(day => (
              <div key={day} className="text-center text-[10px] font-semibold text-slate-500 py-1">
                {day}
              </div>
            ))}

            {/* Hour rows */}
            {HOURS.filter((_, i) => i % 2 === 0).map(hour => (
              <>
                <div key={`label-${hour}`} className="text-[10px] text-slate-400 font-medium flex items-center justify-end pr-2">
                  {formatHour(hour)}
                </div>
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const price = getHourPrice(dayIndex, hour);
                  const ratio = price / baseRate;
                  let cellColor = 'bg-slate-100 text-slate-500';
                  if (ratio > 1.3) cellColor = 'bg-red-100 text-red-700';
                  else if (ratio > 1.1) cellColor = 'bg-amber-100 text-amber-700';
                  else if (ratio < 0.8) cellColor = 'bg-green-100 text-green-800';
                  else if (ratio < 0.95) cellColor = 'bg-green-50 text-green-700';

                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className={`text-center py-1.5 rounded-md text-[10px] font-medium ${cellColor} transition-colors`}
                    >
                      ${price.toFixed(0)}
                    </div>
                  );
                })}
              </>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-green-100" />
              <span className="text-[10px] text-slate-400">Discount</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-slate-100" />
              <span className="text-[10px] text-slate-400">Base</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-100" />
              <span className="text-[10px] text-slate-400">Slight Premium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-red-100" />
              <span className="text-[10px] text-slate-400">Peak Premium</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
