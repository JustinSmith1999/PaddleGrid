import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Gift, Star, TrendingUp, Award, History, ShoppingBag, CheckCircle } from 'lucide-react';

interface LoyaltyAccount {
  id: string;
  points_balance: number;
  lifetime_points_earned: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tier_progress: number;
  facilities: {
    name: string;
  };
}

interface LoyaltyTransaction {
  id: string;
  transaction_type: string;
  points: number;
  reason: string;
  created_at: string;
}

interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_type: string;
  available_quantity: number | null;
  is_active: boolean;
  image_url: string | null;
}

interface LoyaltyRedemption {
  id: string;
  points_spent: number;
  status: string;
  code: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  loyalty_rewards: {
    name: string;
    description: string;
  };
}

const tabs = [
  { key: 'overview', label: 'Overview', icon: TrendingUp },
  { key: 'rewards', label: 'Rewards', icon: Gift },
  { key: 'history', label: 'History', icon: History },
  { key: 'redemptions', label: 'My Rewards', icon: ShoppingBag },
] as const;

export default function LoyaltyRewards() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'history' | 'redemptions'>('overview');
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [redemptions, setRedemptions] = useState<LoyaltyRedemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLoyaltyData();
    }
  }, [user, activeTab]);

  const loadLoyaltyData = async () => {
    setLoading(true);
    try {
      await loadAccount();
      if (activeTab === 'history') {
        await loadTransactions();
      } else if (activeTab === 'rewards') {
        await loadRewards();
      } else if (activeTab === 'redemptions') {
        await loadRedemptions();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_accounts')
        .select('*, facilities (name)')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setAccount(data);
    } catch (error) {
      console.error('Error loading loyalty account:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadRewards = async () => {
    if (!account) return;

    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('facility_id', account.facilities?.name)
        .eq('is_active', true)
        .order('points_cost');

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
    }
  };

  const loadRedemptions = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_redemptions')
        .select(`
          *,
          loyalty_rewards (name, description)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRedemptions(data || []);
    } catch (error) {
      console.error('Error loading redemptions:', error);
    }
  };

  const handleRedeemReward = async (rewardId: string, pointsCost: number) => {
    if (!account || !user) return;

    if (account.points_balance < pointsCost) {
      alert('Insufficient points balance!');
      return;
    }

    if (!confirm(`Redeem this reward for ${pointsCost} points?`)) return;

    try {
      const { error } = await supabase.from('loyalty_redemptions').insert({
        account_id: account.id,
        reward_id: rewardId,
        user_id: user.id,
        points_spent: pointsCost,
        status: 'active'
      });

      if (error) throw error;

      alert('Reward redeemed successfully! Check your redemptions tab for your code.');
      loadAccount();
      setActiveTab('redemptions');
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert('Failed to redeem reward. Please try again.');
    }
  };

  const getTierColor = (tier: string) => {
    const colors = {
      bronze: 'text-orange-700 bg-orange-50 border-orange-200/60',
      silver: 'text-slate-600 bg-slate-50 border-slate-200/60',
      gold: 'text-yellow-700 bg-yellow-50 border-yellow-200/60',
      platinum: 'text-slate-600 bg-slate-100 border-slate-300/60'
    };
    return colors[tier as keyof typeof colors] || colors.bronze;
  };

  const getTierIcon = (tier: string) => {
    return <Award className="w-5 h-5" />;
  };

  const getNextTierPoints = (tier: string, lifetimePoints: number) => {
    const tiers = {
      bronze: { next: 'Silver', required: 500 },
      silver: { next: 'Gold', required: 2000 },
      gold: { next: 'Platinum', required: 5000 },
      platinum: { next: 'Max', required: 0 }
    };
    const tierInfo = tiers[tier as keyof typeof tiers];
    if (tier === 'platinum') return null;
    return {
      next: tierInfo.next,
      remaining: tierInfo.required - lifetimePoints
    };
  };

  if (loading && !account) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-700/20 border-t-green-700 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading rewards...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-5">
            <Trophy className="w-10 h-10 text-slate-300" />
          </div>
          <h2
            className="text-2xl font-bold text-slate-800 mb-2"
          >
            Join a Facility
          </h2>
          <p className="text-slate-400">Sign up with a facility to start earning loyalty points!</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 mb-6"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h2
                  className="text-xl font-bold text-slate-800"
                >
                  Loyalty Rewards
                </h2>
                <p className="text-sm text-slate-400">{account.facilities?.name}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full border ${getTierColor(account.tier)} font-semibold flex items-center gap-2 text-sm`}>
              {getTierIcon(account.tier)}
              {account.tier.toUpperCase()}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-50 to-green-50/50 rounded-2xl p-5 border border-green-100/60"
            >
              <div className="text-sm text-slate-500 mb-1 font-medium">Current Balance</div>
              <div className="text-3xl font-bold text-green-700">{account.points_balance}</div>
              <div className="text-sm text-slate-400 mt-0.5">points</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-slate-50 to-slate-50/50 rounded-2xl p-5 border border-slate-100/60"
            >
              <div className="text-sm text-slate-500 mb-1 font-medium">Lifetime Earned</div>
              <div className="text-3xl font-bold text-slate-800">{account.lifetime_points_earned}</div>
              <div className="text-sm text-slate-400 mt-0.5">total points</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-50 to-green-50/50 rounded-2xl p-5 border border-green-100/60"
            >
              <div className="text-sm text-slate-500 mb-1 font-medium">Next Tier</div>
              {getNextTierPoints(account.tier, account.lifetime_points_earned) ? (
                <>
                  <div className="text-2xl font-bold text-green-700">
                    {getNextTierPoints(account.tier, account.lifetime_points_earned)?.remaining}
                  </div>
                  <div className="text-sm text-slate-400 mt-0.5">
                    points to {getNextTierPoints(account.tier, account.lifetime_points_earned)?.next}
                  </div>
                </>
              ) : (
                <div className="text-xl font-bold text-green-700 mt-2">Max Tier!</div>
              )}
            </motion.div>
          </div>

          {/* Tier Progress Bar */}
          {getNextTierPoints(account.tier, account.lifetime_points_earned) && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                <span>{account.tier.charAt(0).toUpperCase() + account.tier.slice(1)}</span>
                <span>{getNextTierPoints(account.tier, account.lifetime_points_earned)?.next}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(account.tier_progress * 100, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-green-600 to-green-700 rounded-full"
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Tabs & Content */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6"
        >
          <div className="relative flex gap-1 mb-6 border-b border-slate-100">
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
                      layoutId="loyalty-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700 rounded-full"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <h3
                      className="text-lg font-semibold mb-4 text-slate-800"
                    >
                      How to Earn Points
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200"
                      >
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                          <Star className="w-5 h-5 text-green-700" />
                        </div>
                        <h4 className="font-semibold text-slate-800 mb-1">Book Courts</h4>
                        <p className="text-sm text-slate-400">Earn 10 points per hour of court time</p>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200"
                      >
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                          <Trophy className="w-5 h-5 text-green-700" />
                        </div>
                        <h4 className="font-semibold text-slate-800 mb-1">Welcome Bonus</h4>
                        <p className="text-sm text-slate-400">Get 50 points when you join</p>
                      </motion.div>
                    </div>
                  </div>

                  <div>
                    <h3
                      className="text-lg font-semibold mb-4 text-slate-800"
                    >
                      Tier Benefits
                    </h3>
                    <div className="space-y-3">
                      {[
                        { name: 'Bronze', range: '0 - 499 lifetime points', bg: 'bg-orange-50', border: 'border-orange-100', iconColor: 'text-orange-600', nameColor: 'text-orange-900', rangeColor: 'text-orange-700' },
                        { name: 'Silver', range: '500 - 1,999 lifetime points  +50 bonus', bg: 'bg-slate-50', border: 'border-slate-100', iconColor: 'text-slate-500', nameColor: 'text-slate-800', rangeColor: 'text-slate-600' },
                        { name: 'Gold', range: '2,000 - 4,999 lifetime points  +200 bonus', bg: 'bg-yellow-50', border: 'border-yellow-100', iconColor: 'text-yellow-600', nameColor: 'text-yellow-900', rangeColor: 'text-yellow-700' },
                        { name: 'Platinum', range: '5,000+ lifetime points  +500 bonus', bg: 'bg-slate-50', border: 'border-slate-200', iconColor: 'text-slate-600', nameColor: 'text-slate-800', rangeColor: 'text-slate-600' },
                      ].map((tier, index) => (
                        <motion.div
                          key={tier.name}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08 }}
                          className={`flex items-center gap-3 p-4 ${tier.bg} border ${tier.border} rounded-2xl hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200`}
                        >
                          <div className={`w-10 h-10 rounded-xl ${tier.bg} flex items-center justify-center`}>
                            <Award className={`w-5 h-5 ${tier.iconColor}`} />
                          </div>
                          <div className="flex-1">
                            <div className={`font-semibold ${tier.nameColor}`}>{tier.name} Tier</div>
                            <div className={`text-sm ${tier.rangeColor}`}>{tier.range}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'rewards' && (
                <div>
                  {rewards.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                        <Gift className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">No rewards available at the moment.</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {rewards.map((reward, index) => (
                        <motion.div
                          key={reward.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.06, duration: 0.35 }}
                          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-800">{reward.name}</h4>
                              <p className="text-sm text-slate-400 mt-1">{reward.description}</p>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-2xl font-bold text-green-700">{reward.points_cost}</div>
                              <div className="text-xs text-slate-400">points</div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                            {reward.available_quantity !== null && (
                              <span className="text-xs text-slate-400 font-medium">
                                {reward.available_quantity} available
                              </span>
                            )}
                            <button
                              onClick={() => handleRedeemReward(reward.id, reward.points_cost)}
                              disabled={account.points_balance < reward.points_cost}
                              className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium shadow-sm hover:shadow-md ml-auto"
                            >
                              Redeem
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  {transactions.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                        <History className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">No transaction history yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((transaction, index) => (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex justify-between items-center p-4 rounded-2xl border border-slate-200/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 bg-white"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              transaction.points > 0 ? 'bg-green-50' : 'bg-red-50'
                            }`}>
                              <TrendingUp className={`w-4 h-4 ${transaction.points > 0 ? 'text-green-700' : 'text-red-500 rotate-180'}`} />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800 text-sm">{transaction.reason}</div>
                              <div className="text-xs text-slate-400">
                                {new Date(transaction.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className={`text-lg font-bold ${transaction.points > 0 ? 'text-green-700' : 'text-red-500'}`}>
                            {transaction.points > 0 ? '+' : ''}{transaction.points}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'redemptions' && (
                <div>
                  {redemptions.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">No redemptions yet.</p>
                      <p className="text-sm text-slate-400 mt-1">Start redeeming rewards to see them here!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {redemptions.map((redemption, index) => (
                        <motion.div
                          key={redemption.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.06, duration: 0.35 }}
                          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-slate-800">{redemption.loyalty_rewards.name}</h4>
                              <p className="text-sm text-slate-400">{redemption.loyalty_rewards.description}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              redemption.status === 'active' ? 'bg-green-50 text-green-700' :
                              redemption.status === 'used' ? 'bg-slate-100 text-slate-600' :
                              'bg-red-50 text-red-600'
                            }`}>
                              {redemption.status.charAt(0).toUpperCase() + redemption.status.slice(1)}
                            </span>
                          </div>

                          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">Redemption Code</div>
                            <div className="text-lg font-mono font-bold text-slate-800 tracking-wider">{redemption.code}</div>
                          </div>

                          <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
                            <p className="flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5" />
                              {redemption.points_spent} pts
                            </p>
                            <p>Expires: {new Date(redemption.expires_at).toLocaleDateString()}</p>
                            {redemption.used_at && (
                              <p className="flex items-center gap-1.5 text-green-700">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Used {new Date(redemption.used_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
