import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tournamentsApi, LiveScore } from '@shared/api';
import { responsiveFontSize, spacing } from '../utils/responsive';

export default function LiveScoreScreen({ route, navigation }: any) {
  const { matchId } = route.params;
  const [liveScore, setLiveScore] = useState<LiveScore | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const unsubscribe = tournamentsApi.subscribeToLiveScores(
      matchId,
      (score) => {
        setLiveScore(score);
        animatePulse();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [matchId]);

  const animatePulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (!liveScore) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Match</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Connecting to live match...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = liveScore.status === 'completed';
  const player1Leading = liveScore.player1_score > liveScore.player2_score;
  const player2Leading = liveScore.player2_score > liveScore.player1_score;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {!isCompleted && (
            <View style={styles.liveIndicator}>
              <Animated.View
                style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]}
              />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          {isCompleted && (
            <View style={styles.completedIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.completedText}>FINAL</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.scoreContainer}>
            <View
              style={[
                styles.playerSection,
                player1Leading && !isCompleted && styles.leadingPlayer,
              ]}
            >
              <View style={styles.playerAvatar}>
                <Ionicons name="person" size={48} color="#10b981" />
              </View>
              <Text style={styles.playerName} numberOfLines={1}>
                Player 1
              </Text>
              <Animated.View
                style={[
                  styles.scoreBox,
                  player1Leading && !isCompleted && styles.leadingScoreBox,
                ]}
              >
                <Text
                  style={[
                    styles.score,
                    player1Leading && !isCompleted && styles.leadingScore,
                  ]}
                >
                  {liveScore.player1_score}
                </Text>
              </Animated.View>
            </View>

            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
              <Text style={styles.gameText}>Game {liveScore.current_game}</Text>
            </View>

            <View
              style={[
                styles.playerSection,
                player2Leading && !isCompleted && styles.leadingPlayer,
              ]}
            >
              <View style={styles.playerAvatar}>
                <Ionicons name="person" size={48} color="#3b82f6" />
              </View>
              <Text style={styles.playerName} numberOfLines={1}>
                Player 2
              </Text>
              <Animated.View
                style={[
                  styles.scoreBox,
                  player2Leading && !isCompleted && styles.leadingScoreBox,
                ]}
              >
                <Text
                  style={[
                    styles.score,
                    player2Leading && !isCompleted && styles.leadingScore,
                  ]}
                >
                  {liveScore.player2_score}
                </Text>
              </Animated.View>
            </View>
          </View>

          {isCompleted && (
            <View style={styles.resultBanner}>
              <Ionicons name="trophy" size={24} color="#f59e0b" />
              <Text style={styles.resultText}>
                {player1Leading ? 'Player 1' : 'Player 2'} wins!
              </Text>
            </View>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Match Information</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color="#6b7280" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={styles.infoValue}>
                    {isCompleted ? 'Completed' : 'In Progress'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoRow}>
                <Ionicons name="flame-outline" size={20} color="#6b7280" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Current Game</Text>
                  <Text style={styles.infoValue}>Game {liveScore.current_game}</Text>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoRow}>
                <Ionicons name="analytics-outline" size={20} color="#6b7280" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Score Difference</Text>
                  <Text style={styles.infoValue}>
                    {Math.abs(liveScore.player1_score - liveScore.player2_score)}{' '}
                    points
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {!isCompleted && (
            <View style={styles.updateNotice}>
              <Ionicons name="sync-outline" size={20} color="#10b981" />
              <Text style={styles.updateText}>
                Scores update automatically in real-time
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: responsiveFontSize(16),
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: '#111827',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: {
    fontSize: responsiveFontSize(13),
    fontWeight: '700',
    color: '#fff',
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: spacing.xs,
  },
  completedText: {
    fontSize: responsiveFontSize(13),
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    padding: spacing.lg,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  playerSection: {
    flex: 1,
    alignItems: 'center',
  },
  leadingPlayer: {
    transform: [{ scale: 1.05 }],
  },
  playerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4b5563',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  playerName: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#fff',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  scoreBox: {
    backgroundColor: '#1f2937',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  leadingScoreBox: {
    backgroundColor: '#10b981',
  },
  score: {
    fontSize: responsiveFontSize(36),
    fontWeight: '700',
    color: '#fff',
  },
  leadingScore: {
    color: '#fff',
  },
  vsContainer: {
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  vsText: {
    fontSize: responsiveFontSize(20),
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: spacing.xs,
  },
  gameText: {
    fontSize: responsiveFontSize(12),
    color: '#6b7280',
    fontWeight: '600',
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  resultText: {
    fontSize: responsiveFontSize(18),
    fontWeight: '700',
    color: '#92400e',
  },
  infoSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoTextContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  infoLabel: {
    fontSize: responsiveFontSize(13),
    color: '#9ca3af',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: responsiveFontSize(16),
    color: '#fff',
    fontWeight: '600',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#4b5563',
    marginVertical: spacing.xs,
  },
  updateNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#065f46',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  updateText: {
    fontSize: responsiveFontSize(14),
    color: '#d1fae5',
    fontWeight: '500',
  },
});
