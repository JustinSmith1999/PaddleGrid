import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
        return <MessageCircle className="w-5 h-5 text-green-600" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'match_join':
        return <Users className="w-5 h-5 text-purple-500" />;
      default:
        return <Check className="w-5 h-5 text-slate-400" />;
    }
  }

  function getNotificationText(notification: Notification) {
    const { type, data } = notification;
    const fromUserName = data.actor_name || 'Someone';

    if (data.message) {
      return <span className="text-sm text-slate-600">{data.message}</span>;
    }

    let actionText = '';
    switch (type) {
      case 'like':
        actionText = 'liked your post';
        break;
      case 'comment':
        actionText = 'commented on your post';
        break;
      case 'follow':
        actionText = 'started following you';
        break;
      case 'match_join':
        actionText = 'joined your match';
        break;
      default:
        return <span className="text-sm text-slate-600">New notification</span>;
    }

    return (
      <span className="text-sm text-slate-600">
        <span className="font-semibold text-slate-900">{fromUserName}</span>{' '}
        {actionText}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {notifications.some(n => !n.is_read) && (
        <div className="px-5 py-3 bg-green-50 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            {notifications.filter(n => !n.is_read).length} unread notification{notifications.filter(n => !n.is_read).length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-green-700 hover:text-green-800 font-medium px-3 py-1 hover:bg-green-100 rounded-full transition-all"
          >
            Mark all read
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600">No notifications</p>
        </div>
      ) : (
        <div>
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
            >
              <button
                onClick={() => handleNotificationClick(notification)}
                className={`w-full px-5 py-3 border-b border-slate-50 hover:bg-slate-50 transition-all text-left ${
                  !notification.is_read ? 'bg-green-50/40' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 ring-2 ring-white shadow-sm rounded-full p-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="leading-normal">
                      {getNotificationText(notification)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <div className="bg-green-600 w-2 h-2 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
