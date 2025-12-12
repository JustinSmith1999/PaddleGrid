import { useState, useEffect } from 'react';
import { Heart, MessageCircle, UserPlus, Users, Check, Loader2 } from 'lucide-react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  formatTimeAgo,
  Notification
} from '../../lib/socialUtils';

interface NotificationsInlineFeedProps {
  onPostClick: (postId: string) => void;
  onProfileClick?: (userId: string) => void;
}

export default function NotificationsInlineFeed({ onPostClick, onProfileClick }: NotificationsInlineFeedProps) {
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

    if (notification.data.post_id) {
      onPostClick(notification.data.post_id);
    } else if (notification.data.actor_id && notification.type === 'follow') {
      onProfileClick?.(notification.data.actor_id);
    }
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
        return <MessageCircle className="w-5 h-5 text-emerald-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'match_join':
        return <Users className="w-5 h-5 text-purple-500" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {notifications.some(n => !n.is_read) && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {notifications.filter(n => !n.is_read).length} unread notification{notifications.filter(n => !n.is_read).length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium px-3 py-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition"
          >
            Mark all read
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-slate-400 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">All caught up!</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">No new notifications</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:border-slate-800">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left border-b border-slate-200 dark:border-slate-800 ${
                !notification.is_read ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-[15px] leading-normal ${
                    !notification.is_read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {getNotificationText(notification)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                </div>

                {!notification.is_read && (
                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
