import { useState, useEffect } from 'react';
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
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case 'match_join':
        return <Users className="w-5 h-5 text-blue-600" />;
      default:
        return <Check className="w-5 h-5 text-gray-500" />;
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
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Notifications</h2>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 hover:bg-blue-50 rounded-full transition"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">All caught up!</h3>
              <p className="text-gray-600 text-sm">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 hover:bg-gray-50 transition text-left ${
                    !notification.is_read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-[15px] leading-normal ${
                        !notification.is_read ? 'font-medium text-gray-900' : 'text-gray-700'
                      }`}>
                        {notificationTexts[notification.id] || 'New notification'}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
