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
import {
  seriesApi,
  Series,
  SeriesStanding,
  SeriesMatch,
} from '@shared/api';
import { responsiveFontSize, spacing, isTablet } from '../utils/responsive';
import { useAuth } from '../contexts/AuthContext';

export default function SeriesDetailScreen({ route, navigation }: any) {
  const { seriesId } = route.params;
  const { user } = useAuth();
  const [series, setSeries] = useState<Series | null>(null);
  const [standings, setStandings] = useState<SeriesStanding[]>([]);
  const [schedule, setSchedule] = useState<SeriesMatch[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'schedule' | 'standings'>('info');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    loadSeriesData();
  }, [seriesId]);

  const loadSeriesData = async () => {
    try {
      const [seriesData, standingsData, scheduleData] = await Promise.all([
        seriesApi.getSeriesById(seriesId),
        seriesApi.getSeriesStandings(seriesId),
        seriesApi.getSeriesSchedule(seriesId),
      ]);

      setSeries(seriesData);
      setStandings(standingsData);
      setSchedule(scheduleData);

      if (user) {
        const { isRegistered: registered } = await seriesApi.isUserRegistered(
          seriesId,
          user.id
        );
        setIsRegistered(registered);
      }
    } catch (error) {
      console.error('Error loading series data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSeriesData();
  };

  const handleRegister = () => {
    navigation.navigate('SeriesRegistration', { seriesId, series });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'in_progress':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const renderInfoTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{series?.description}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#6b7280" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>
              {formatDate(series?.start_date || '')} - {formatDate(series?.end_date || '')}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={20} color="#6b7280" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Participants</Text>
            <Text style={styles.infoValue}>
              {series?.current_participants || 0}/{series?.max_participants} players
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="stats-chart-outline" size={20} color="#6b7280" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Skill Level</Text>
            <Text style={styles.infoValue}>{series?.skill_level}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="game-controller-outline" size={20} color="#6b7280" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Format</Text>
            <Text style={styles.infoValue}>{series?.format}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#6b7280" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Venue</Text>
            <Text style={styles.infoValue}>{series?.facility_name}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderScheduleTab = () => (
    <View style={styles.tabContent}>
      {schedule.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No matches scheduled yet</Text>
        </View>
      ) : (
        schedule.map((match, index) => (
          <View key={match.id} style={styles.matchCard}>
            <View style={styles.matchHeader}>
              <Text style={styles.matchTime}>{formatDate(match.scheduled_time)}</Text>
              {match.court_name && (
                <Text style={styles.courtName}>{match.court_name}</Text>
              )}
            </View>

            <View style={styles.matchPlayers}>
              <View style={styles.playerRow}>
                <Text style={styles.playerName}>{match.player1_name}</Text>
                {match.player1_score !== null && (
                  <Text
                    style={[
                      styles.playerScore,
                      match.winner_id === match.player1_id && styles.winnerScore,
                    ]}
                  >
                    {match.player1_score}
                  </Text>
                )}
              </View>

              <Text style={styles.vsText}>vs</Text>

              <View style={styles.playerRow}>
                <Text style={styles.playerName}>{match.player2_name}</Text>
                {match.player2_score !== null && (
                  <Text
                    style={[
                      styles.playerScore,
                      match.winner_id === match.player2_id && styles.winnerScore,
                    ]}
                  >
                    {match.player2_score}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.matchStatus}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(match.status) },
                ]}
              />
              <Text style={styles.statusText}>
                {match.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderStandingsTab = () => (
    <View style={styles.tabContent}>
      {standings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No standings available yet</Text>
        </View>
      ) : (
        <View>
          <View style={styles.standingsHeader}>
            <Text style={[styles.standingsHeaderText, { flex: 0.5 }]}>Rank</Text>
            <Text style={[styles.standingsHeaderText, { flex: 2 }]}>Player</Text>
            <Text style={[styles.standingsHeaderText, { flex: 0.75 }]}>W-L</Text>
            <Text style={[styles.standingsHeaderText, { flex: 0.75 }]}>Pts</Text>
          </View>

          {standings.map((standing, index) => (
            <View key={standing.user_id} style={styles.standingRow}>
              <View style={[styles.rankContainer, { flex: 0.5 }]}>
                {standing.rank <= 3 ? (
                  <Ionicons
                    name="trophy"
                    size={20}
                    color={
                      standing.rank === 1
                        ? '#f59e0b'
                        : standing.rank === 2
                        ? '#9ca3af'
                        : '#d97706'
                    }
                  />
                ) : (
                  <Text style={styles.rankText}>{standing.rank}</Text>
                )}
              </View>
              <Text style={[styles.playerNameStanding, { flex: 2 }]}>
                {standing.player_name}
              </Text>
              <Text style={[styles.recordText, { flex: 0.75 }]}>
                {standing.wins}-{standing.losses}
              </Text>
              <Text style={[styles.pointsText, { flex: 0.75 }]}>
                {standing.points}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  if (!series) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Series not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{series.name}</Text>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}
          >
            <Text
              style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}
            >
              Info
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'schedule' && styles.activeTab]}
            onPress={() => setActiveTab('schedule')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'schedule' && styles.activeTabText,
              ]}
            >
              Schedule
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'standings' && styles.activeTab]}
            onPress={() => setActiveTab('standings')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'standings' && styles.activeTabText,
              ]}
            >
              Standings
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'schedule' && renderScheduleTab()}
        {activeTab === 'standings' && renderStandingsTab()}
      </ScrollView>

      {!isRegistered && series.status === 'open' && (
        <View style={styles.registerContainer}>
          <View style={styles.registerInfo}>
            <Text style={styles.registerPrice}>
              {series.entry_fee > 0 ? `$${series.entry_fee}` : 'Free'}
            </Text>
            <Text style={styles.registerLabel}>Entry Fee</Text>
          </View>
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Register Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {isRegistered && (
        <View style={styles.registeredBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.registeredText}>You're registered!</Text>
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
  headerTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#10b981',
  },
  tabText: {
    fontSize: responsiveFontSize(15),
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#10b981',
    fontWeight: '600',
  },
  tabContent: {
    padding: spacing.md,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: responsiveFontSize(15),
    color: '#4b5563',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
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
    fontSize: responsiveFontSize(15),
    color: '#1f2937',
    fontWeight: '500',
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  matchTime: {
    fontSize: responsiveFontSize(13),
    color: '#6b7280',
    fontWeight: '500',
  },
  courtName: {
    fontSize: responsiveFontSize(13),
    color: '#10b981',
    fontWeight: '600',
  },
  matchPlayers: {
    marginVertical: spacing.sm,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  playerName: {
    fontSize: responsiveFontSize(16),
    color: '#1f2937',
    fontWeight: '500',
  },
  playerScore: {
    fontSize: responsiveFontSize(18),
    color: '#6b7280',
    fontWeight: '700',
  },
  winnerScore: {
    color: '#10b981',
  },
  vsText: {
    fontSize: responsiveFontSize(12),
    color: '#9ca3af',
    textAlign: 'center',
    marginVertical: 4,
  },
  matchStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: responsiveFontSize(12),
    color: '#6b7280',
    fontWeight: '500',
  },
  standingsHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  standingsHeaderText: {
    fontSize: responsiveFontSize(13),
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  rankContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    color: '#6b7280',
  },
  playerNameStanding: {
    fontSize: responsiveFontSize(15),
    color: '#1f2937',
    fontWeight: '500',
  },
  recordText: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
    textAlign: 'center',
  },
  pointsText: {
    fontSize: responsiveFontSize(16),
    color: '#1f2937',
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: responsiveFontSize(16),
    color: '#9ca3af',
    marginTop: spacing.md,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  registerInfo: {
    marginRight: spacing.md,
  },
  registerPrice: {
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
    color: '#10b981',
  },
  registerLabel: {
    fontSize: responsiveFontSize(12),
    color: '#6b7280',
  },
  registerButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    color: '#fff',
  },
  registeredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
    padding: spacing.md,
    gap: spacing.sm,
  },
  registeredText: {
    fontSize: responsiveFontSize(15),
    fontWeight: '600',
    color: '#10b981',
  },
});
