import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Grid3x3, Loader2 } from 'lucide-react';
import { BrowseCourts } from './BrowseCourts';
import { UserBookings } from './UserBookings';
import { useAuth } from '../contexts/AuthContext';

type TabType = 'browse' | 'mybookings';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export function PlayerDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="w-12 h-12 text-green-700 animate-spin" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <motion.div
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-10 text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2
            className="text-2xl font-bold text-slate-900 mb-3"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Please sign in
          </h2>
          <p
            className="text-slate-500 leading-relaxed"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            You need to be signed in to access the player dashboard
          </p>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'browse' as TabType,
      label: 'Recommended Clubs',
      icon: Grid3x3,
      description: 'Discover pickleball clubs in your area'
    },
    {
      id: 'mybookings' as TabType,
      label: 'My Bookings',
      icon: Calendar,
      description: 'Manage your court reservations'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <motion.div
        className="max-w-7xl mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <motion.div className="mb-8" variants={itemVariants}>
          <h1
            className="text-3xl font-bold text-slate-900 mb-1"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Player Dashboard
          </h1>
          <p
            className="text-slate-500 text-base"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Welcome back! Browse courts and manage your bookings
          </p>
        </motion.div>

        {/* Tab Bar Card */}
        <motion.div
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden mb-8"
          variants={itemVariants}
        >
          {/* Clean Underline Tab Bar */}
          <div className="px-6 border-b border-slate-100">
            <div className="flex items-center gap-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 py-4 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'text-green-700'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="dashboardTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700 rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Description */}
          <div className="p-6">
            <div>
              <h2
                className="text-xl font-bold text-slate-900 mb-1"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <p
                className="text-sm text-slate-500"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {tabs.find(t => t.id === activeTab)?.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div variants={itemVariants}>
          <AnimatePresence mode="wait">
            {activeTab === 'browse' && (
              <motion.div
                key="browse"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <BrowseCourts />
              </motion.div>
            )}

            {activeTab === 'mybookings' && (
              <motion.div
                key="mybookings"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <UserBookings />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
