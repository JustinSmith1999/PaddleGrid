import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@shared/lib/supabase';
import { responsiveFontSize, spacing, isTablet } from '../utils/responsive';
import { ErrorState } from '../components/ErrorState';
import { parseError, AppError } from '../utils/errors';
import { buttonPress } from '../utils/haptics';
import { OptimizedImage } from '../components/OptimizedImage';

interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'match_join' | 'mention' | 'booking_reminder' | 'event_update';
  data: any;
  is_read: boolean;
  created_at: string;
}

const getNotificationIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'like':
      return 'heart';
    case 'comment':
      return 'chatbubble';
    case 'follow':
      return 'person-add';
    case 'match_join':
      return 'people';
    case 'mention':
      return 'at';
    case 'booking_reminder':
      return 'calendar';
    case 'event_update':
      return 'notifications';
    default:
      return 'notifications-outline';
  }
};

const getNotificationColor = (type: string): string => {
  switch (type) {
    case 'like':
      return '#ef4444';
    case 'comment':
      return '#3b82f6';
    case 'follow':
      return '#8b5cf6';
    case 'match_join':
      return '#10b981';
    case 'mention':
      return '#f59e0b';
    case 'booking_reminder':
      return '#06b6d4';
    case 'event_update':
      return '#ec4899';
    default:
      return '#6b7280';
  }
};

const getNotificationText = (notification: Notification): { title: string; body: string } => {
  const { type, data } = notification;

  switch (type) {
    case 'like':
      return {
        title: 'New Like',
        body: `${data.userName || 'Someone'} liked your post`,
      };
    case 'comment':
      return {
        title: 'New Comment',
        body: `${data.userName || 'Someone'} commented on your post: "${data.comment || ''}"`,
      };
    case 'follow':
      return {
        title: 'New Follower',
        body: `${data.userName || 'Someone'} started following you`,
      };
    case 'match_join':
      return {
        title: 'Match Joined',
        body: `${data.userName || 'Someone'} joined your match`,
      };
    case 'mention':
      return {
        title: 'Mentioned You',
        body: `${data.userName || 'Someone'} mentioned you in a post`,
      };
    case 'booking_reminder':
      return {
        title: 'Booking Reminder',
        body: data.message || 'You have an upcoming booking',
      };
    case 'event_update':
      return {
        title: 'Event Update',
        body: data.message || 'An event has been updated',
      };
    default:
      return {
        title: 'Notification',
        body: data.message || 'You have a new notification',
      };
  }
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_notifications',
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setError(null);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .from('social_notifications')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setNotifications(data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(parseError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('social_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (updateError) throw updateError;

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      buttonPress();

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error: updateError } = await supabase
        .from('social_notifications')
        .update({ is_read: true })
        .eq('user_id', user.user.id)
        .eq('is_read', false);

      if (updateError) throw updateError;

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      );

      Alert.alert('Success', 'All notifications marked as read');
    } catch (err) {
      console.error('Error marking all as read:', err);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  }, []);

  const handleNotificationPress = useCallback((notification: Notification) => {
    buttonPress();

    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    const { type, data } = notification;

    switch (type) {
      case 'like':
      case 'comment':
      case 'mention':
        if (data.postId) {
          navigation.navigate('PostDetail', { postId: data.postId });
        }
        break;
      case 'follow':
        if (data.userId) {
          navigation.navigate('PlayerProfile', { userId: data.userId });
        }
        break;
      case 'match_join':
        if (data.postId) {
          navigation.navigate('PostDetail', { postId: data.postId });
        }
        break;
      case 'booking_reminder':
        if (data.bookingId) {
          navigation.navigate('BookingDetails', { bookingId: data.bookingId });
        } else {
          navigation.navigate('Bookings');
        }
        break;
      case 'event_update':
        if (data.eventId) {
          navigation.navigate('EventDetails', { eventId: data.eventId });
        }
        break;
      default:
        break;
    }
  }, [navigation, markAsRead]);

  const renderNotification = useCallback(({ item }: { item: Notification }) => {
    const { title, body } = getNotificationText(item);
    const icon = getNotificationIcon(item.type);
    const color = getNotificationColor(item.type);

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.is_read && styles.notificationCardUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{title}</Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {body}
          </Text>
          <Text style={styles.notificationTime}>{formatTimeAgo(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [handleNotificationPress]);

  const keyExtractor = useCallback((item: Notification) => item.id, []);

  const filteredNotifications = filterType === 'unread'
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyText}>
        {filterType === 'unread' ? 'No unread notifications' : 'No notifications'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="dark-content" />
        <ErrorState error={error} onRetry={loadNotifications} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
            onPress={() => {
              buttonPress();
              setFilterType('all');
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'unread' && styles.filterButtonActive]}
            onPress={() => {
              buttonPress();
              setFilterType('unread');
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterButtonText, filterType === 'unread' && styles.filterButtonTextActive]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
            activeOpacity={0.7}
          >
            <Text style={styles.markAllButtonText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: responsiveFontSize(16),
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#10b981',
  },
  filterButtonText: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  markAllButton: {
    alignSelf: 'flex-end',
  },
  markAllButtonText: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#10b981',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    maxWidth: isTablet() ? 700 : undefined,
    alignSelf: isTablet() ? 'center' : 'stretch',
    width: isTablet() ? '100%' : undefined,
  },
  notificationCardUnread: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  },
  notificationTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginLeft: spacing.xs,
  },
  notificationBody: {
    fontSize: responsiveFontSize(14),
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: spacing.xs / 2,
  },
  notificationTime: {
    fontSize: responsiveFontSize(12),
    color: '#9ca3af',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
  },
  emptyText: {
    fontSize: responsiveFontSize(18),
    color: '#9ca3af',
    marginTop: spacing.md,
  },
});
