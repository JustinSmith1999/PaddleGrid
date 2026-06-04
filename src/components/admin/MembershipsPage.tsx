import { useState, useEffect } from 'react';
import { CreditCard, Plus, Users, DollarSign, Calendar, Edit, Trash2, Loader2, CheckCircle, Star, Crown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'annual' | 'one-time';
  features: string[];
  memberCount: number;
  color: string;
  icon: 'star' | 'crown' | 'zap';
  isActive: boolean;
}

export default function MembershipsPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([
    {
      id: '1',
      name: 'Basic',
      price: 49,
      interval: 'monthly',
      features: ['Court booking access', 'Up to 4 bookings/week', 'Event notifications'],
      memberCount: 0,
      color: 'green',
      icon: 'star',
      isActive: true,
    },
    {
      id: '2',
      name: 'Premium',
      price: 99,
      interval: 'monthly',
      features: ['Unlimited bookings', 'Priority scheduling', 'Guest passes (2/month)', 'League access'],
      memberCount: 0,
      color: 'violet',
      icon: 'crown',
      isActive: true,
    },
    {
      id: '3',
      name: 'VIP',
      price: 199,
      interval: 'monthly',
      features: ['Everything in Premium', 'Personal locker', 'Pro shop discounts', 'Private lessons (1/month)', 'Tournament entry'],
      memberCount: 0,
      color: 'amber',
      icon: 'zap',
      isActive: true,
    },
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const getIconComponent = (icon: string) => {
    switch (icon) {
      case 'crown': return <Crown className="w-5 h-5" />;
      case 'zap': return <Zap className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'violet': return { bg: 'bg-violet-50', text: 'text-violet-600', gradient: 'from-violet-500 to-purple-600', border: 'border-violet-200' };
      case 'amber': return { bg: 'bg-amber-50', text: 'text-amber-600', gradient: 'from-amber-500 to-orange-600', border: 'border-amber-200' };
      default: return { bg: 'bg-green-50', text: 'text-green-600', gradient: 'from-green-600 to-green-800', border: 'border-green-200' };
    }
  };

  const totalRevenue = plans.reduce((sum, p) => sum + (p.price * p.memberCount), 0);
  const totalMembers = plans.reduce((sum, p) => sum + p.memberCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Memberships
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage plans, pricing, and member subscriptions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase">Monthly Revenue</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase">Active Subscribers</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalMembers}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-sky-600" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase">Active Plans</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{plans.filter(p => p.isActive).length}</p>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan, index) => {
          const colors = getColorClasses(plan.color);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              {/* Gradient Header */}
              <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />

              <div className="p-6">
                {/* Icon + Name */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text}`}>
                      {getIconComponent(plan.icon)}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-400 capitalize">{plan.interval}</p>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                    <span className="text-sm text-slate-400">/{plan.interval === 'annual' ? 'year' : 'mo'}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2.5 mb-5">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <CheckCircle className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">{plan.memberCount} members</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 text-center">
        <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-700 mb-1">Stripe Integration Coming Soon</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Connect Stripe to enable automatic billing, member self-service portal, and payment tracking for all membership plans.
        </p>
      </div>
    </div>
  );
}
