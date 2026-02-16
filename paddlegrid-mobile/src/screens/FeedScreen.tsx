import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getFeedPosts, toggleLike, SocialPost, formatTimeAgo } from '@shared/api';
import { responsiveFontSize, spacing, getResponsiveAvatarSize, isTablet } from '../utils/responsive';
import { PostCardSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { parseError, AppError } from '../utils/errors';
import { buttonPress, actionSuccess } from '../utils/haptics';
import { AvatarImage } from '../components/OptimizedImage';

// Memoized Post Card Component
const PostCard = memo(({ post, onLike, onReport }: {
  post: SocialPost;
  onLike: (id: string) => void;
  onReport: (id: string) => void;
}) => {
  const handleLike = useCallback(() => {
    buttonPress();
    onLike(post.id);
  }, [post.id, onLike]);

  const handleReport = useCallback(() => {
    buttonPress();
    onReport(post.id);
  }, [post.id, onReport]);

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <AvatarImage
            source={post.profiles?.profile_picture_url}
            size={avatarSizes.small}
            fallbackIcon="person"
          />
          <View>
            <Text style={styles.authorName}>{post.profiles?.full_name || 'Unknown'}</Text>
            <Text style={styles.postTime}>{formatTimeAgo(post.created_at)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleReport} activeOpacity={0.6}>
          <Ionicons name="flag-outline" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <Text style={styles.postContent}>{post.content}</Text>

      {post.post_type === 'match_invite' && (
        <View style={styles.matchBadge}>
          <Ionicons name="trophy" size={16} color="#10b981" />
          <Text style={styles.matchBadgeText}>Match Invitation</Text>
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          activeOpacity={0.6}
        >
          <Ionicons name="heart-outline" size={24} color="#6b7280" />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} activeOpacity={0.6}>
          <Ionicons name="chatbubble-outline" size={24} color="#6b7280" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

PostCard.displayName = 'PostCard';

export default function FeedScreen() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = useCallback(async () => {
    try {
      setError(null);
      const data = await getFeedPosts({ type: 'all_local', limit: 20 });
      setPosts(data);
    } catch (err) {
      console.error('Error loading feed:', err);
      setError(parseError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadFeed();
  }, [loadFeed]);

  const handleLike = useCallback(async (postId: string) => {
    if (likingPosts.has(postId)) return;

    setLikingPosts(prev => new Set(prev).add(postId));

    try {
      await toggleLike(postId);
      actionSuccess();

      // Optimistic update
      setPosts(currentPosts =>
        currentPosts.map(post =>
          post.id === postId
            ? { ...post, liked: !post.liked }
            : post
        )
      );
    } catch (err) {
      console.error('Error liking post:', err);
    } finally {
      setLikingPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  }, [likingPosts]);

  const handleReportPost = useCallback((postId: string) => {
    const reportOptions = [
      { label: 'Spam', value: 'spam' },
      { label: 'Harassment', value: 'harassment' },
      { label: 'Inappropriate Content', value: 'inappropriate' },
      { label: 'Misinformation', value: 'misinformation' },
      { label: 'Other', value: 'other' },
    ];

    const submitReport = async (reason: string) => {
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
          actionSuccess();
          Alert.alert(
            'Report Submitted',
            'Thank you for helping keep our community safe. We will review this content shortly.',
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        console.error('Error reporting post:', err);
        Alert.alert('Error', 'Failed to submit report. Please try again.');
      }
    };

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
            submitReport(reportOptions[buttonIndex].value);
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
            onPress: () => submitReport(option.value),
          })),
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  }, []);

  const renderPost = useCallback(({ item }: { item: SocialPost }) => (
    <PostCard post={item} onLike={handleLike} onReport={handleReportPost} />
  ), [handleLike, handleReportPost]);

  const keyExtractor = useCallback((item: SocialPost) => item.id, []);

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyText}>No posts yet</Text>
    </View>
  ), []);

  const LoadingSkeletons = useMemo(() => (
    <>
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
    </>
  ), []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.listContent}>
          {LoadingSkeletons}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="dark-content" />
        <ErrorState error={error} onRetry={loadFeed} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={posts}
        renderItem={renderPost}
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
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        initialNumToRender={5}
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
    gap: spacing.sm,
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
