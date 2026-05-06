import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
      bronze: 'text-orange-700 bg-orange-50',
      silver: 'text-slate-600 bg-slate-100',
      gold: 'text-yellow-700 bg-yellow-50',
      platinum: 'text-purple-700 bg-purple-50'
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

  if (loading) {
    return (
      <div className="text-center py-8 text-slate-400">Loading rewards...</div>
    );
  }

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2
          className="text-2xl font-bold text-slate-900 mb-2"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          Join a Facility
        </h2>
        <p className="text-slate-500">Sign up with a facility to start earning loyalty points!</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6"
      >
        <div className="flex justify-between items-start">
          <div>
            <h2
              className="text-2xl font-bold text-slate-900 mb-1"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Loyalty Rewards
            </h2>
            <p className="text-slate-500">{account.facilities?.name}</p>
          </div>
          <div className={`px-4 py-2 rounded-xl ${getTierColor(account.tier)} font-semibold flex items-center gap-2 text-sm`}>
            {getTierIcon(account.tier)}
            {account.tier.toUpperCase()}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="bg-green-50 rounded-xl p-4">
            <div className="text-sm text-slate-500 mb-1">Current Balance</div>
            <div className="text-3xl font-bold text-green-700">{account.points_balance}</div>
            <div className="text-sm text-slate-400 mt-1">points</div>
          </div>

          <div className="bg-green-50 rounded-xl p-4">
            <div className="text-sm text-slate-500 mb-1">Lifetime Earned</div>
            <div className="text-3xl font-bold text-green-700">{account.lifetime_points_earned}</div>
            <div className="text-sm text-slate-400 mt-1">total points</div>
          </div>

          <div className="bg-green-50 rounded-xl p-4">
            <div className="text-sm text-slate-500 mb-1">Next Tier</div>
            {getNextTierPoints(account.tier, account.lifetime_points_earned) ? (
              <>
                <div className="text-2xl font-bold text-green-700">
                  {getNextTierPoints(account.tier, account.lifetime_points_earned)?.remaining}
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  points to {getNextTierPoints(account.tier, account.lifetime_points_earned)?.next}
                </div>
              </>
            ) : (
              <div className="text-xl font-bold text-green-700 mt-2">Max Tier!</div>
            )}
          </div>
        </div>

        {/* Tier Progress Bar */}
        {getNextTierPoints(account.tier, account.lifetime_points_earned) && (
          <div className="mt-4">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(account.tier_progress * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-green-700 rounded-full"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Tabs & Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex gap-2 mb-6 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition-colors text-sm ${
              activeTab === 'overview'
                ? 'text-green-700 border-b-2 border-green-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2 font-medium transition-colors text-sm ${
              activeTab === 'rewards'
                ? 'text-green-700 border-b-2 border-green-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gift className="w-4 h-4 inline mr-1" />
            Rewards
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium transition-colors text-sm ${
              activeTab === 'history'
                ? 'text-green-700 border-b-2 border-green-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4 inline mr-1" />
            History
          </button>
          <button
            onClick={() => setActiveTab('redemptions')}
            className={`px-4 py-2 font-medium transition-colors text-sm ${
              activeTab === 'redemptions'
                ? 'text-green-700 border-b-2 border-green-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4 inline mr-1" />
            My Rewards
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3
                className="text-lg font-semibold mb-3 text-slate-900"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                How to Earn Points
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                >
                  <Star className="w-8 h-8 text-green-700 mb-2" />
                  <h4 className="font-semibold text-slate-900 mb-1">Book Courts</h4>
                  <p className="text-sm text-slate-500">Earn 10 points per hour of court time</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                >
                  <Trophy className="w-8 h-8 text-green-700 mb-2" />
                  <h4 className="font-semibold text-slate-900 mb-1">Welcome Bonus</h4>
                  <p className="text-sm text-slate-500">Get 50 points when you join</p>
                </motion.div>
              </div>
            </div>

            <div>
              <h3
                className="text-lg font-semibold mb-3 text-slate-900"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Tier Benefits
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                  <Award className="w-6 h-6 text-orange-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-orange-900">Bronze Tier</div>
                    <div className="text-sm text-orange-700">0 - 499 lifetime points</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <Award className="w-6 h-6 text-slate-500" />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">Silver Tier</div>
                    <div className="text-sm text-slate-600">500 - 1,999 lifetime points  +50 bonus</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                  <Award className="w-6 h-6 text-yellow-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-yellow-900">Gold Tier</div>
                    <div className="text-sm text-yellow-700">2,000 - 4,999 lifetime points  +200 bonus</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                  <Award className="w-6 h-6 text-purple-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-purple-900">Platinum Tier</div>
                    <div className="text-sm text-purple-700">5,000+ lifetime points  +500 bonus</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div>
            {rewards.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No rewards available at the moment.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {rewards.map((reward, index) => (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{reward.name}</h4>
                        <p className="text-sm text-slate-500 mt-1">{reward.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-700">{reward.points_cost}</div>
                        <div className="text-xs text-slate-400">points</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      {reward.available_quantity !== null && (
                        <span className="text-sm text-slate-400">
                          {reward.available_quantity} available
                        </span>
                      )}
                      <button
                        onClick={() => handleRedeemReward(reward.id, reward.points_cost)}
                        disabled={account.points_balance < reward.points_cost}
                        className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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
              <div className="text-center py-12 text-slate-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No transaction history yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex justify-between items-center p-3 border border-slate-100 rounded-xl"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{transaction.reason}</div>
                      <div className="text-sm text-slate-400">
                        {new Date(transaction.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${transaction.points > 0 ? 'text-green-700' : 'text-red-600'}`}>
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
              <div className="text-center py-12 text-slate-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No redemptions yet.</p>
                <p className="text-sm mt-1">Start redeeming rewards to see them here!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {redemptions.map((redemption, index) => (
                  <motion.div
                    key={redemption.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{redemption.loyalty_rewards.name}</h4>
                        <p className="text-sm text-slate-500">{redemption.loyalty_rewards.description}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        redemption.status === 'active' ? 'bg-green-50 text-green-700' :
                        redemption.status === 'used' ? 'bg-slate-100 text-slate-600' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {redemption.status}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl">
                      <div className="text-sm text-slate-500 mb-1">Redemption Code</div>
                      <div className="text-lg font-mono font-bold text-slate-900">{redemption.code}</div>
                    </div>

                    <div className="mt-3 text-sm text-slate-500">
                      <p>Points Spent: {redemption.points_spent}</p>
                      <p>Expires: {new Date(redemption.expires_at).toLocaleDateString()}</p>
                      {redemption.used_at && (
                        <p className="flex items-center gap-1 text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          Used on {new Date(redemption.used_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
