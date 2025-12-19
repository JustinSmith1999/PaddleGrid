import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getFeedPosts, toggleLike, SocialPost, formatTimeAgo } from '@shared/api';
import { responsiveFontSize, spacing, getResponsiveAvatarSize, isTablet } from '../utils/responsive';

export default function FeedScreen() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const data = await getFeedPosts({ type: 'all_local', limit: 20 });
      setPosts(data);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const handleLike = async (postId: string) => {
    try {
      await toggleLike(postId);
      loadFeed();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleReportPost = (postId: string) => {
    const reportOptions = [
      { label: 'Spam', value: 'spam' },
      { label: 'Harassment', value: 'harassment' },
      { label: 'Inappropriate Content', value: 'inappropriate' },
      { label: 'Misinformation', value: 'misinformation' },
      { label: 'Other', value: 'other' },
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...reportOptions.map(o => o.label), 'Cancel'],
          cancelButtonIndex: reportOptions.length,
          title: 'Report Post',
          message: 'Why are you reporting this post?',
        },
        (buttonIndex) => {
          if (buttonIndex < reportOptions.length) {
            submitReport(postId, reportOptions[buttonIndex].value);
          }
        }
      );
    } else {
      Alert.alert(
        'Report Post',
        'Why are you reporting this post?',
        [
          ...reportOptions.map(option => ({
            text: option.label,
            onPress: () => submitReport(postId, option.value),
          })),
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const submitReport = async (postId: string, reason: string) => {
    try {
      const { supabase } = await import('@shared/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'You must be logged in to report content');
        return;
      }

      const { error } = await supabase.from('content_reports').insert({
        reporter_id: user.id,
        post_id: postId,
        reason: reason,
        status: 'pending',
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Already Reported', 'You have already reported this post.');
        } else {
          throw error;
        }
      } else {
        Alert.alert(
          'Report Submitted',
          'Thank you for helping keep our community safe. We will review this content shortly.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error reporting post:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const renderPost = ({ item }: { item: SocialPost }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          {item.profiles?.profile_picture_url ? (
            <Image
              source={{ uri: item.profiles.profile_picture_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          )}
          <View>
            <Text style={styles.authorName}>{item.profiles?.full_name || 'Unknown'}</Text>
            <Text style={styles.postTime}>{formatTimeAgo(item.created_at)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleReportPost(item.id)}>
          <Ionicons name="flag-outline" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <Text style={styles.postContent}>{item.content}</Text>

      {item.post_type === 'match_invite' && (
        <View style={styles.matchBadge}>
          <Ionicons name="trophy" size={16} color="#10b981" />
          <Text style={styles.matchBadgeText}>Match Invitation</Text>
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons name="heart-outline" size={24} color="#6b7280" />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={24} color="#6b7280" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['bottom']}>
        <Text style={styles.loadingText}>Loading feed...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const avatarSizes = getResponsiveAvatarSize();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: responsiveFontSize(16),
    color: '#6b7280',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    maxWidth: isTablet() ? 700 : undefined,
    alignSelf: isTablet() ? 'center' : 'stretch',
    width: isTablet() ? '100%' : undefined,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: avatarSizes.small,
    height: avatarSizes.small,
    borderRadius: avatarSizes.small / 2,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#1f2937',
  },
  postTime: {
    fontSize: responsiveFontSize(14),
    color: '#9ca3af',
  },
  postContent: {
    fontSize: responsiveFontSize(16),
    color: '#374151',
    lineHeight: responsiveFontSize(24),
    marginBottom: spacing.sm,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  matchBadgeText: {
    fontSize: responsiveFontSize(14),
    color: '#10b981',
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  actionText: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
    marginLeft: spacing.xs,
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
