import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tournamentsApi, LeaderboardEntry } from '@shared/api';
import { responsiveFontSize, spacing, isTablet } from '../utils/responsive';
import { useAuth } from '../contexts/AuthContext';

export default function LeaderboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'global' | 'facility'>('global');

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  const loadLeaderboard = async () => {
    try {
      const data = await tournamentsApi.getLeaderboard(50);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#f59e0b';
      case 2:
        return '#9ca3af';
      case 3:
        return '#d97706';
      default:
        return null;
    }
  };

  const renderLeaderboardItem = ({
    item,
    index,
  }: {
    item: LeaderboardEntry;
    index: number;
  }) => {
    const medalColor = getMedalColor(item.rank);
    const isCurrentUser = user?.id === item.user_id;

    return (
      <TouchableOpacity
        style={[
          styles.leaderboardItem,
          isCurrentUser && styles.currentUserItem,
        ]}
        onPress={() =>
          navigation.navigate('PublicPlayerProfile', { playerId: item.user_id })
        }
      >
        <View style={styles.rankContainer}>
          {medalColor ? (
            <Ionicons name="trophy" size={28} color={medalColor} />
          ) : (
            <Text style={styles.rankText}>{item.rank}</Text>
          )}
        </View>

        <View style={styles.playerInfo}>
          {item.avatar_url ? (
            <Image
              source={{ uri: item.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#9ca3af" />
            </View>
          )}
          <View style={styles.playerDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.playerName}>{item.player_name}</Text>
              {isCurrentUser && (
                <View style={styles.youBadge}>
                  <Text style={styles.youText}>YOU</Text>
                </View>
              )}
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>
                {item.wins}W - {item.losses}L
              </Text>
              <View style={styles.statsDivider} />
              <Text style={styles.statsText}>
                {item.win_percentage.toFixed(0)}% Win Rate
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>{item.rating}</Text>
          <Text style={styles.ratingLabel}>Rating</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Leaderboard</Text>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'global' && styles.filterActive]}
          onPress={() => setFilter('global')}
        >
          <Ionicons
            name="globe-outline"
            size={16}
            color={filter === 'global' ? '#fff' : '#6b7280'}
          />
          <Text
            style={[
              styles.filterText,
              filter === 'global' && styles.filterTextActive,
            ]}
          >
            Global
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'facility' && styles.filterActive]}
          onPress={() => setFilter('facility')}
        >
          <Ionicons
            name="business-outline"
            size={16}
            color={filter === 'facility' ? '#fff' : '#6b7280'}
          />
          <Text
            style={[
              styles.filterText,
              filter === 'facility' && styles.filterTextActive,
            ]}
          >
            My Club
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTopThree = () => {
    const topThree = leaderboard.slice(0, 3);
    if (topThree.length === 0) return null;

    return (
      <View style={styles.podiumContainer}>
        {topThree.length > 1 && topThree[1] && (
          <TouchableOpacity
            style={styles.podiumPlace}
            onPress={() =>
              navigation.navigate('PublicPlayerProfile', {
                playerId: topThree[1].user_id,
              })
            }
          >
            <View style={[styles.podiumAvatar, styles.secondPlace]}>
              {topThree[1].avatar_url ? (
                <Image
                  source={{ uri: topThree[1].avatar_url }}
                  style={styles.podiumAvatarImage}
                />
              ) : (
                <Ionicons name="person" size={32} color="#9ca3af" />
              )}
            </View>
            <View style={styles.podiumMedal}>
              <Ionicons name="trophy" size={20} color="#9ca3af" />
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {topThree[1].player_name}
            </Text>
            <Text style={styles.podiumRating}>{topThree[1].rating}</Text>
          </TouchableOpacity>
        )}

        {topThree[0] && (
          <TouchableOpacity
            style={[styles.podiumPlace, styles.firstPlaceContainer]}
            onPress={() =>
              navigation.navigate('PublicPlayerProfile', {
                playerId: topThree[0].user_id,
              })
            }
          >
            <View style={[styles.podiumAvatar, styles.firstPlace]}>
              {topThree[0].avatar_url ? (
                <Image
                  source={{ uri: topThree[0].avatar_url }}
                  style={styles.podiumAvatarImage}
                />
              ) : (
                <Ionicons name="person" size={40} color="#f59e0b" />
              )}
            </View>
            <View style={styles.podiumMedal}>
              <Ionicons name="trophy" size={24} color="#f59e0b" />
            </View>
            <Text style={[styles.podiumName, styles.firstPlaceName]} numberOfLines={1}>
              {topThree[0].player_name}
            </Text>
            <Text style={[styles.podiumRating, styles.firstPlaceRating]}>
              {topThree[0].rating}
            </Text>
          </TouchableOpacity>
        )}

        {topThree.length > 2 && topThree[2] && (
          <TouchableOpacity
            style={styles.podiumPlace}
            onPress={() =>
              navigation.navigate('PublicPlayerProfile', {
                playerId: topThree[2].user_id,
              })
            }
          >
            <View style={[styles.podiumAvatar, styles.thirdPlace]}>
              {topThree[2].avatar_url ? (
                <Image
                  source={{ uri: topThree[2].avatar_url }}
                  style={styles.podiumAvatarImage}
                />
              ) : (
                <Ionicons name="person" size={32} color="#d97706" />
              )}
            </View>
            <View style={styles.podiumMedal}>
              <Ionicons name="trophy" size={20} color="#d97706" />
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {topThree[2].player_name}
            </Text>
            <Text style={styles.podiumRating}>{topThree[2].rating}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </SafeAreaView>
    );
  }

  const remainingPlayers = leaderboard.slice(3);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {renderHeader()}
      <FlatList
        data={remainingPlayers}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.user_id}
        ListHeaderComponent={renderTopThree()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No rankings yet</Text>
            <Text style={styles.emptySubtext}>
              Play matches to appear on the leaderboard
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
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
  loadingText: {
    fontSize: responsiveFontSize(16),
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterActive: {
    backgroundColor: '#10b981',
  },
  filterText: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    padding: spacing.lg,
    backgroundColor: '#fff',
    marginBottom: spacing.md,
  },
  podiumPlace: {
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    flex: 1,
  },
  firstPlaceContainer: {
    marginTop: -spacing.lg,
  },
  podiumAvatar: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 3,
  },
  firstPlace: {
    width: 80,
    height: 80,
    borderColor: '#f59e0b',
  },
  secondPlace: {
    width: 64,
    height: 64,
    borderColor: '#9ca3af',
  },
  thirdPlace: {
    width: 64,
    height: 64,
    borderColor: '#d97706',
  },
  podiumAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  podiumMedal: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  podiumName: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#1f2937',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  firstPlaceName: {
    fontSize: responsiveFontSize(16),
  },
  podiumRating: {
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    color: '#10b981',
    marginTop: 2,
  },
  firstPlaceRating: {
    fontSize: responsiveFontSize(18),
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    maxWidth: isTablet() ? 700 : undefined,
    alignSelf: isTablet() ? 'center' : 'stretch',
    width: isTablet() ? '100%' : undefined,
  },
  currentUserItem: {
    backgroundColor: '#d1fae5',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  rankText: {
    fontSize: responsiveFontSize(20),
    fontWeight: '700',
    color: '#6b7280',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  playerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#1f2937',
    marginRight: spacing.xs,
  },
  youBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  youText: {
    fontSize: responsiveFontSize(10),
    fontWeight: '700',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: responsiveFontSize(13),
    color: '#6b7280',
  },
  statsDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#d1d5db',
    marginHorizontal: spacing.xs,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  rating: {
    fontSize: responsiveFontSize(20),
    fontWeight: '700',
    color: '#10b981',
  },
  ratingLabel: {
    fontSize: responsiveFontSize(11),
    color: '#9ca3af',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
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
