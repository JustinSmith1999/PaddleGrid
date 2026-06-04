import { useState, useEffect } from 'react';
import { Clock, Users, Bell, CheckCircle, X, Calendar, ArrowRight, Loader2, UserPlus, Zap, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface WaitlistEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courtId: string;
  courtName: string;
  requestedDate: string;
  requestedTime: string;
  status: 'waiting' | 'notified' | 'booked' | 'expired';
  createdAt: string;
  position: number;
}

interface WaitlistSlot {
  date: string;
  time: string;
  courtName: string;
  entries: WaitlistEntry[];
}

export default function WaitlistManager() {
  const [slots, setSlots] = useState<WaitlistSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  useEffect(() => {
    loadWaitlistData();
  }, []);

  const loadWaitlistData = async () => {
    try {
      // Simulated waitlist data — in production, this would come from a waitlist table
      const { data: courts } = await supabase.from('courts').select('id, name');
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .limit(20);

      if (!courts || !profiles || profiles.length === 0) {
        setLoading(false);
        return;
      }

      // Generate sample waitlist data based on real courts/members
      const now = new Date();
      const sampleSlots: WaitlistSlot[] = [];

      // Create a few popular time slots with waitlists
      const popularTimes = [
        { dayOffset: 1, hour: 18, label: '6:00 PM' },
        { dayOffset: 1, hour: 19, label: '7:00 PM' },
        { dayOffset: 2, hour: 17, label: '5:00 PM' },
        { dayOffset: 3, hour: 18, label: '6:00 PM' },
        { dayOffset: 5, hour: 9, label: '9:00 AM' },
      ];

      popularTimes.forEach((slot, slotIdx) => {
        const date = new Date(now);
        date.setDate(date.getDate() + slot.dayOffset);
        const dateStr = date.toISOString().split('T')[0];
        const court = courts[slotIdx % courts.length];

        const entryCount = Math.floor(Math.random() * 4) + 1;
        const entries: WaitlistEntry[] = [];

        for (let i = 0; i < entryCount && i < profiles.length; i++) {
          const profile = profiles[(slotIdx * 3 + i) % profiles.length];
          entries.push({
            id: `wl-${slotIdx}-${i}`,
            userId: profile.id,
            userName: profile.full_name || profile.email || 'Member',
            userEmail: profile.email || '',
            courtId: court.id,
            courtName: court.name,
            requestedDate: dateStr,
            requestedTime: slot.label,
            status: i === 0 && slotIdx < 2 ? 'notified' : 'waiting',
            createdAt: new Date(now.getTime() - (entryCount - i) * 3600000).toISOString(),
            position: i + 1,
          });
        }

        sampleSlots.push({
          date: dateStr,
          time: slot.label,
          courtName: court.name,
          entries,
        });
      });

      setSlots(sampleSlots);
    } catch (error) {
      console.error('Error loading waitlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async (entryId: string) => {
    setNotifying(entryId);
    await new Promise(resolve => setTimeout(resolve, 600));
    setSlots(prev => prev.map(slot => ({
      ...slot,
      entries: slot.entries.map(e => e.id === entryId ? { ...e, status: 'notified' as const } : e),
    })));
    setNotifying(null);
  };

  const handleRemove = (entryId: string) => {
    setSlots(prev => prev.map(slot => ({
      ...slot,
      entries: slot.entries.filter(e => e.id !== entryId),
    })).filter(slot => slot.entries.length > 0));
  };

  const totalWaiting = slots.reduce((sum, s) => sum + s.entries.filter(e => e.status === 'waiting').length, 0);
  const totalNotified = slots.reduce((sum, s) => sum + s.entries.filter(e => e.status === 'notified').length, 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
        <p className="text-sm text-slate-500">Loading waitlist...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Waitlist
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Members waiting for court availability
          </p>
        </div>
        <div className="flex bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 text-xs font-medium transition-all ${filter === 'active' ? 'bg-green-50 text-green-700' : 'text-slate-500'}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-xs font-medium transition-all ${filter === 'all' ? 'bg-green-50 text-green-700' : 'text-slate-500'}`}
          >
            All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-slate-400 font-medium">Waiting</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalWaiting}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-slate-400 font-medium">Notified</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalNotified}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-green-500" />
            <span className="text-xs text-slate-400 font-medium">Slots w/ Waitlists</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{slots.length}</p>
        </div>
      </div>

      {/* Slot Cards */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {slots.map((slot, slotIndex) => (
            <motion.div
              key={`${slot.date}-${slot.time}-${slot.courtName}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: slotIndex * 0.05 }}
              layout
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              {/* Slot Header */}
              <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(slot.date)} at {slot.time}
                    </p>
                    <p className="text-xs text-slate-400">{slot.courtName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">{slot.entries.length} waiting</span>
                </div>
              </div>

              {/* Entries */}
              <div className="divide-y divide-slate-50">
                {slot.entries.map((entry, entryIndex) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: entryIndex * 0.05 }}
                    className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Position */}
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-slate-500">#{entry.position}</span>
                    </div>

                    {/* Member */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{entry.userName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{entry.userEmail}</p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {entry.status === 'notified' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                          <Bell className="w-3 h-3" />
                          Notified
                        </span>
                      ) : entry.status === 'booked' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3" />
                          Booked
                        </span>
                      ) : (
                        <button
                          onClick={() => handleNotify(entry.id)}
                          disabled={notifying === entry.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-700 text-white text-[10px] font-medium hover:bg-green-800 transition-colors disabled:opacity-50"
                        >
                          {notifying === entry.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Bell className="w-3 h-3" />
                              Notify
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => handleRemove(entry.id)}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-slate-300 hover:text-red-500" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {slots.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">No active waitlists</p>
          <p className="text-xs text-slate-400 mt-1">Members will be added here when popular time slots fill up</p>
        </div>
      )}
    </div>
  );
}
