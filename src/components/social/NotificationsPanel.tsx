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
        return <Heart className="w-5 h-5 text-red-500 fill-current" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-green-700" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-700" />;
      case 'match_join':
        return <Users className="w-5 h-5 text-green-700" />;
      default:
        return <Check className="w-5 h-5 text-slate-400" />;
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
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed top-0 right-0 bottom-0 bg-white w-full max-w-md shadow-2xl z-50 flex flex-col"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Notifications
          </h2>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-green-700 text-xs font-semibold hover:text-green-800 px-3 py-1 hover:bg-green-50 rounded-full transition-all"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-slate-400">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification, index) => (
                <motion.button
                  key={notification.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.25 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full px-5 py-3 hover:bg-slate-50 transition-all text-left ${
                    !notification.is_read ? 'bg-green-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 ring-2 ring-white shadow-sm rounded-full p-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-600 leading-normal">
                        {(() => {
                          const text = notificationTexts[notification.id] || 'New notification';
                          const actorName = notification.data?.actor_name;
                          if (actorName && text.startsWith(actorName)) {
                            return (
                              <>
                                <span className="font-semibold text-slate-900">{actorName}</span>
                                {text.slice(actorName.length)}
                              </>
                            );
                          }
                          return text;
                        })()}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <div className="bg-green-600 w-2 h-2 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
