import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@shared/lib/supabase';
import { toggleLike, formatTimeAgo } from '@shared/api';
import type { SocialPost, Comment } from '@shared/api';
import { responsiveFontSize, spacing, getResponsiveAvatarSize } from '../utils/responsive';
import { ErrorState } from '../components/ErrorState';
import { parseError, AppError } from '../utils/errors';
import { buttonPress, actionSuccess } from '../utils/haptics';
import { AvatarImage } from '../components/OptimizedImage';

const avatarSizes = getResponsiveAvatarSize();

export default function PostDetailScreen({ route, navigation }: any) {
  const { postId } = route.params;

  const [post, setPost] = useState<SocialPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    loadPostAndComments();

    const commentsSubscription = supabase
      .channel(`post_${postId}_comments`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      commentsSubscription.unsubscribe();
    };
  }, [postId]);

  const loadPostAndComments = useCallback(async () => {
    try {
      setError(null);

      const { data: postData, error: postError } = await supabase
        .from('social_posts')
        .select('*, profiles(*), facilities(*), courts(*)')
        .eq('id', postId)
        .single();

      if (postError) throw postError;
      setPost(postData);

      await loadComments();
    } catch (err) {
      console.error('Error loading post:', err);
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const loadComments = useCallback(async () => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('social_comments')
        .select(`
          *,
          profiles:author_id (
            id,
            full_name,
            email,
            profile_picture_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;
      setComments(commentsData || []);
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  }, [postId]);

  const handleLike = useCallback(async () => {
    if (!post) return;

    try {
      buttonPress();
      await toggleLike(post.id, 'post');
      actionSuccess();

      setPost((prev) => prev ? { ...prev } : prev);
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  }, [post]);

  const handleSubmitComment = useCallback(async () => {
    if (!commentText.trim()) return;

    try {
      buttonPress();
      setSubmitting(true);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        Alert.alert('Error', 'You must be logged in to comment');
        return;
      }

      const { error: insertError } = await supabase
        .from('social_comments')
        .insert({
          post_id: postId,
          author_id: user.user.id,
          content: commentText.trim(),
        });

      if (insertError) throw insertError;

      actionSuccess();
      setCommentText('');
      loadComments();
    } catch (err) {
      console.error('Error submitting comment:', err);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }, [commentText, postId, loadComments]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const comment = comments.find((c) => c.id === commentId);
      if (!comment || comment.author_id !== user.user.id) {
        Alert.alert('Error', 'You can only delete your own comments');
        return;
      }

      Alert.alert(
        'Delete Comment',
        'Are you sure you want to delete this comment?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              buttonPress();

              const { error: deleteError } = await supabase
                .from('social_comments')
                .delete()
                .eq('id', commentId);

              if (deleteError) {
                Alert.alert('Error', 'Failed to delete comment');
                return;
              }

              actionSuccess();
              loadComments();
            },
          },
        ]
      );
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  }, [comments, loadComments]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="dark-content" />
        <ErrorState
          error={error || parseError('Post not found')}
          onRetry={loadPostAndComments}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.authorInfo}>
                <AvatarImage
                  source={post.profiles?.profile_picture_url}
                  size={avatarSizes.medium}
                  fallbackIcon="person"
                />
                <View>
                  <Text style={styles.authorName}>
                    {post.profiles?.full_name || 'Unknown'}
                  </Text>
                  <Text style={styles.postTime}>{formatTimeAgo(post.created_at)}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            {post.post_type === 'match_invite' && (
              <View style={styles.matchDetails}>
                <View style={styles.matchBadge}>
                  <Ionicons name="trophy" size={16} color="#10b981" />
                  <Text style={styles.matchBadgeText}>Match Invitation</Text>
                </View>
                {post.facilities && (
                  <Text style={styles.matchDetailText}>
                    <Ionicons name="location" size={14} color="#6b7280" />{' '}
                    {post.facilities.name}
                  </Text>
                )}
                {post.play_date && (
                  <Text style={styles.matchDetailText}>
                    <Ionicons name="calendar" size={14} color="#6b7280" />{' '}
                    {new Date(post.play_date).toLocaleDateString()}
                  </Text>
                )}
                {post.play_start_time && (
                  <Text style={styles.matchDetailText}>
                    <Ionicons name="time" size={14} color="#6b7280" /> {post.play_start_time}
                  </Text>
                )}
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

              <View style={styles.actionButton}>
                <Ionicons name="chatbubble" size={24} color="#10b981" />
                <Text style={[styles.actionText, styles.actionTextActive]}>
                  {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.commentsSection}>
            <Text style={styles.commentsSectionTitle}>
              Comments ({comments.length})
            </Text>

            {comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyCommentsText}>
                  No comments yet. Be the first to comment!
                </Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <AvatarImage
                    source={comment.profiles?.profile_picture_url}
                    size={avatarSizes.small}
                    fallbackIcon="person"
                  />
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthor}>
                        {comment.profiles?.full_name || 'Unknown'}
                      </Text>
                      <Text style={styles.commentTime}>
                        {formatTimeAgo(comment.created_at)}
                      </Text>
                    </View>
                    <Text style={styles.commentText}>{comment.content}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteComment(comment.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#9ca3af"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
            editable={!submitting}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!commentText.trim() || submitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submitting}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: responsiveFontSize(16),
    color: '#6b7280',
    marginTop: spacing.md,
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
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorName: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#1f2937',
  },
  postTime: {
    fontSize: responsiveFontSize(12),
    color: '#9ca3af',
    marginTop: 2,
  },
  postContent: {
    fontSize: responsiveFontSize(15),
    lineHeight: 22,
    color: '#374151',
    marginBottom: spacing.sm,
  },
  matchDetails: {
    backgroundColor: '#f0fdf4',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    marginBottom: spacing.xs,
  },
  matchBadgeText: {
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
    color: '#059669',
  },
  matchDetailText: {
    fontSize: responsiveFontSize(13),
    color: '#4b5563',
    marginTop: spacing.xs / 2,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#10b981',
  },
  commentsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
  },
  commentsSectionTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.md,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyCommentsText: {
    fontSize: responsiveFontSize(14),
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  commentCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs / 2,
  },
  commentAuthor: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#1f2937',
  },
  commentTime: {
    fontSize: responsiveFontSize(12),
    color: '#9ca3af',
  },
  commentText: {
    fontSize: responsiveFontSize(14),
    color: '#4b5563',
    lineHeight: 20,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  commentInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: responsiveFontSize(15),
    color: '#1f2937',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
});
