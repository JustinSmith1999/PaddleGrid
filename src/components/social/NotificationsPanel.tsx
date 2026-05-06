import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, UserPlus, Users, Check } from 'lucide-react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  formatTimeAgo,
  Notification
} from '../../lib/socialUtils';
import { supabase } from '../../lib/supabase';

interface NotificationsPanelProps {
  onClose: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export default function NotificationsPanel({ onClose, onNotificationClick }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const data = await getNotifications(50);
    setNotifications(data);
    setLoading(false);
  }

  async function handleNotificationClick(notification: Notification) {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    }

    onNotificationClick?.(notification);
    onClose();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'like':
        return (
          <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center">
            <Heart className="w-4 h-4 text-rose-500 fill-current" />
          </div>
        );
      case 'comment':
        return (
          <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-green-700" />
          </div>
        );
      case 'follow':
        return (
          <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-green-700" />
          </div>
        );
      case 'match_join':
        return (
          <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-green-700" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
            <Check className="w-4 h-4 text-slate-400" />
          </div>
        );
    }
  }

  function getNotificationText(notification: Notification): string {
    const { type, data } = notification;

    if (data.message) {
      return data.message;
    }

    const fromUserName = data.actor_name || 'Someone';

    switch (type) {
      case 'like':
        return `${fromUserName} liked your post`;
      case 'comment':
        return `${fromUserName} commented on your post`;
      case 'follow':
        return `${fromUserName} started following you`;
      case 'match_join':
        return `${fromUserName} joined your match`;
      default:
        return 'New notification';
    }
  }

  const [notificationTexts, setNotificationTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    const texts: Record<string, string> = {};
    for (const notification of notifications) {
      texts[notification.id] = getNotificationText(notification);
    }
    setNotificationTexts(texts);
  }, [notifications]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed top-0 right-0 bottom-0 bg-[#F8F9FC] w-full max-w-md shadow-[0_0_40px_rgba(0,0,0,0.08)] z-50 flex flex-col"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-slate-200/60 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Notifications
          </h2>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-green-700 text-xs font-semibold hover:text-green-800 px-3 py-1.5 hover:bg-green-50 rounded-full transition-all duration-200"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-3 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-400 font-medium">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-green-700" />
              </div>
              <p className="text-sm font-semibold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>All caught up</p>
              <p className="text-xs text-slate-400 mt-1">No new notifications</p>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {notifications.map((notification, index) => (
                <motion.button
                  key={notification.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  whileHover={{ x: 2 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all duration-200 text-left flex items-start gap-3 ${
                    !notification.is_read
                      ? 'bg-white border border-green-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                      : 'hover:bg-white/80'
                  }`}
                >
                  <div className="flex-shrink-0 ring-2 ring-white shadow-sm rounded-full">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {(() => {
                        const text = notificationTexts[notification.id] || 'New notification';
                        const actorName = notification.data?.actor_name;
                        if (actorName && text.startsWith(actorName)) {
                          return (
                            <>
                              <span className="font-bold text-slate-800">{actorName}</span>
                              {text.slice(actorName.length)}
                            </>
                          );
                        }
                        return text;
                      })()}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <div className="bg-green-700 w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
