import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tournamentsApi, Tournament, BracketMatch } from '@shared/api';
import { responsiveFontSize, spacing } from '../utils/responsive';

export default function TournamentBracketScreen({ route, navigation }: any) {
  const { tournamentId } = route.params;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTournamentData();
  }, [tournamentId]);

  const loadTournamentData = async () => {
    try {
      const [tournamentData, matchesData] = await Promise.all([
        tournamentsApi.getTournamentById(tournamentId),
        tournamentsApi.getBracketMatches(tournamentId),
      ]);

      setTournament(tournamentData);
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading tournament data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTournamentData();
  };

  const getRoundName = (round: number) => {
    const totalRounds = Math.max(...matches.map((m) => m.round));
    const remainingRounds = totalRounds - round;

    if (remainingRounds === 0) return 'Final';
    if (remainingRounds === 1) return 'Semi-Finals';
    if (remainingRounds === 2) return 'Quarter-Finals';
    return `Round ${round}`;
  };

  const getMatchesByRound = (round: number) => {
    return matches.filter((m) => m.round === round);
  };

  const renderMatch = (match: BracketMatch) => {
    const player1Won = match.winner_id === match.player1_id;
    const player2Won = match.winner_id === match.player2_id;
    const isCompleted = match.status === 'completed';
    const isInProgress = match.status === 'in_progress';

    return (
      <TouchableOpacity
        key={match.id}
        style={styles.matchCard}
        onPress={() => {
          if (isInProgress) {
            navigation.navigate('LiveScore', { matchId: match.id });
          }
        }}
      >
        {isInProgress && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        <View
          style={[
            styles.playerRow,
            player1Won && styles.winnerRow,
            !match.player1_id && styles.emptyPlayerRow,
          ]}
        >
          <Text
            style={[
              styles.playerName,
              player1Won && styles.winnerName,
              !match.player1_id && styles.emptyPlayerText,
            ]}
            numberOfLines={1}
          >
            {match.player1_name || 'TBD'}
          </Text>
          {match.player1_score !== null && match.player1_score !== undefined && (
            <Text style={[styles.score, player1Won && styles.winnerScore]}>
              {match.player1_score}
            </Text>
          )}
        </View>

        <View style={styles.divider} />

        <View
          style={[
            styles.playerRow,
            player2Won && styles.winnerRow,
            !match.player2_id && styles.emptyPlayerRow,
          ]}
        >
          <Text
            style={[
              styles.playerName,
              player2Won && styles.winnerName,
              !match.player2_id && styles.emptyPlayerText,
            ]}
            numberOfLines={1}
          >
            {match.player2_name || 'TBD'}
          </Text>
          {match.player2_score !== null && match.player2_score !== undefined && (
            <Text style={[styles.score, player2Won && styles.winnerScore]}>
              {match.player2_score}
            </Text>
          )}
        </View>

        {match.scheduled_time && !isCompleted && (
          <Text style={styles.matchTime}>
            {new Date(match.scheduled_time).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderRound = (round: number) => {
    const roundMatches = getMatchesByRound(round);
    if (roundMatches.length === 0) return null;

    return (
      <View key={round} style={styles.roundColumn}>
        <Text style={styles.roundTitle}>{getRoundName(round)}</Text>
        <View style={styles.matchesContainer}>
          {roundMatches.map((match) => renderMatch(match))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  if (!tournament) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Tournament not found</Text>
      </SafeAreaView>
    );
  }

  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{tournament.name}</Text>
          <Text style={styles.headerSubtitle}>Tournament Bracket</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bracketContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {rounds.map((round) => renderRound(round))}
      </ScrollView>

      {matches.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="git-network-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No bracket available yet</Text>
          <Text style={styles.emptySubtext}>
            The bracket will be generated once registration closes
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

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
  errorText: {
    fontSize: responsiveFontSize(16),
    color: '#ef4444',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
    marginTop: 2,
  },
  bracketContainer: {
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.lg,
  },
  roundColumn: {
    minWidth: 250,
  },
  roundTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: spacing.md,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  matchesContainer: {
    gap: spacing.lg,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  liveIndicator: {
    position: 'absolute',
    top: -8,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    fontSize: responsiveFontSize(10),
    fontWeight: '700',
    color: '#fff',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  winnerRow: {
    backgroundColor: '#d1fae5',
    borderRadius: 6,
  },
  emptyPlayerRow: {
    opacity: 0.5,
  },
  playerName: {
    fontSize: responsiveFontSize(15),
    color: '#4b5563',
    flex: 1,
    fontWeight: '500',
  },
  winnerName: {
    color: '#047857',
    fontWeight: '700',
  },
  emptyPlayerText: {
    fontStyle: 'italic',
    color: '#9ca3af',
  },
  score: {
    fontSize: responsiveFontSize(18),
    fontWeight: '700',
    color: '#6b7280',
    marginLeft: spacing.sm,
  },
  winnerScore: {
    color: '#047857',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: spacing.sm,
  },
  matchTime: {
    fontSize: responsiveFontSize(12),
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: responsiveFontSize(18),
    color: '#9ca3af',
    marginTop: spacing.md,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: responsiveFontSize(14),
    color: '#d1d5db',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
