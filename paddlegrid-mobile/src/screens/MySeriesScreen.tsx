import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { seriesApi } from '@shared/api';
import { responsiveFontSize, spacing, isTablet } from '../utils/responsive';
import { useAuth } from '../contexts/AuthContext';

interface UserSeries {
  id: string;
  series_id: string;
  registered_at: string;
  payment_status: string;
  event_series: {
    id: string;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
    facility_id: string;
  };
}

export default function MySeriesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [series, setSeries] = useState<UserSeries[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserSeries();
    }
  }, [user]);

  const loadUserSeries = async () => {
    if (!user) return;

    try {
      const data = await seriesApi.getUserSeries(user.id);
      setSeries(data);
    } catch (error) {
      console.error('Error loading user series:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserSeries();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#10b981';
      case 'in_progress':
        return '#3b82f6';
      case 'completed':
        return '#6b7280';
      default:
        return '#f59e0b';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date();
  };

  const isActive = (status: string, startDate: string, endDate: string) => {
    const now = new Date();
    return (
      status === 'in_progress' ||
      (new Date(startDate) <= now && new Date(endDate) >= now)
    );
  };

  const renderSeriesCard = ({ item }: { item: UserSeries }) => {
    const active = isActive(
      item.event_series.status,
      item.event_series.start_date,
      item.event_series.end_date
    );
    const upcoming = isUpcoming(item.event_series.start_date);

    return (
      <TouchableOpacity
        style={styles.seriesCard}
        onPress={() =>
          navigation.navigate('SeriesDetail', { seriesId: item.event_series.id })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.seriesIcon}>
            <Ionicons
              name={active ? 'trophy' : 'trophy-outline'}
              size={24}
              color={active ? '#f59e0b' : '#6b7280'}
            />
          </View>
          <View style={styles.seriesInfo}>
            <Text style={styles.seriesName}>{item.event_series.name}</Text>
            <Text style={styles.dateRange}>
              {formatDate(item.event_series.start_date)} -{' '}
              {formatDate(item.event_series.end_date)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${getStatusColor(item.event_series.status)}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.event_series.status) },
              ]}
            >
              {getStatusLabel(item.event_series.status)}
            </Text>
          </View>
        </View>

        {item.event_series.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.event_series.description}
          </Text>
        )}

        <View style={styles.cardFooter}>
          {active && (
            <View style={styles.activeIndicator}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active Now</Text>
            </View>
          )}
          {upcoming && (
            <View style={styles.upcomingIndicator}>
              <Ionicons name="time-outline" size={16} color="#f59e0b" />
              <Text style={styles.upcomingText}>Starts Soon</Text>
            </View>
          )}
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#10b981" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['bottom']}>
        <Ionicons name="person-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyText}>Please log in to view your series</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['bottom']}>
        <Text style={styles.loadingText}>Loading your series...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Series</Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('SeriesBrowser')}
        >
          <Ionicons name="search" size={20} color="#10b981" />
          <Text style={styles.browseButtonText}>Browse</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={series}
        renderItem={renderSeriesCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No series yet</Text>
            <Text style={styles.emptySubtext}>
              Join a series to compete and track your progress
            </Text>
            <TouchableOpacity
              style={styles.browseSeriesButton}
              onPress={() => navigation.navigate('SeriesBrowser')}
            >
              <Text style={styles.browseSeriesButtonText}>Browse Series</Text>
            </TouchableOpacity>
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
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: responsiveFontSize(16),
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
    color: '#1f2937',
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#d1fae5',
    borderRadius: 20,
  },
  browseButtonText: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#10b981',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  seriesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: isTablet() ? 700 : undefined,
    alignSelf: isTablet() ? 'center' : 'stretch',
    width: isTablet() ? '100%' : undefined,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  seriesIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  seriesInfo: {
    flex: 1,
  },
  seriesName: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  dateRange: {
    fontSize: responsiveFontSize(13),
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: responsiveFontSize(11),
    fontWeight: '600',
  },
  description: {
    fontSize: responsiveFontSize(14),
    color: '#4b5563',
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  activeText: {
    fontSize: responsiveFontSize(13),
    fontWeight: '600',
    color: '#10b981',
  },
  upcomingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  upcomingText: {
    fontSize: responsiveFontSize(13),
    fontWeight: '600',
    color: '#f59e0b',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#10b981',
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
    paddingHorizontal: spacing.xl,
  },
  browseSeriesButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  browseSeriesButtonText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    color: '#fff',
  },
});
