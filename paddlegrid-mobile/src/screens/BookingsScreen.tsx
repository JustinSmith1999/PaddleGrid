import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUserBookings, BookingWithDetails } from '@shared/api';
import { responsiveFontSize, spacing, isTablet } from '../utils/responsive';
import { BookingCardSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { parseError, AppError } from '../utils/errors';

// Memoized Booking Card Component
const BookingCard = memo(({ booking }: { booking: BookingWithDetails }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const statusColor = booking.status === 'confirmed' ? '#d1fae5' : '#fee2e2';
  const statusTextColor = booking.status === 'confirmed' ? '#10b981' : '#ef4444';

  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.courtName}>{booking.courts?.name}</Text>
          <Text style={styles.facilityName}>
            {booking.courts?.facilities?.name}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusTextColor }]}>
            {booking.status}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detail}>
          <Ionicons name="calendar-outline" size={20} color="#6b7280" />
          <Text style={styles.detailText}>{formatDate(booking.start_time)}</Text>
        </View>

        <View style={styles.detail}>
          <Ionicons name="time-outline" size={20} color="#6b7280" />
          <Text style={styles.detailText}>
            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
          </Text>
        </View>

        <View style={styles.detail}>
          <Ionicons name="cash-outline" size={20} color="#6b7280" />
          <Text style={styles.detailText}>${booking.total_cost.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
});

BookingCard.displayName = 'BookingCard';

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      setError(null);
      const data = await getUserBookings();
      setBookings(data);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError(parseError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings();
  }, [loadBookings]);

  const renderBooking = useCallback(({ item }: { item: BookingWithDetails }) => (
    <BookingCard booking={item} />
  ), []);

  const keyExtractor = useCallback((item: BookingWithDetails) => item.id, []);

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyText}>No bookings yet</Text>
      <Text style={styles.infoText}>
        Court bookings are for physical court time at real pickleball facilities.
        Payment is processed securely outside the app.
      </Text>
    </View>
  ), []);

  const ListHeaderComponent = useMemo(() => {
    if (bookings.length === 0) return null;

    return (
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color="#10b981" />
        <Text style={styles.infoCardText}>
          All bookings are for physical court time at real facilities.
          Payments are processed securely via our website.
        </Text>
      </View>
    );
  }, [bookings.length]);

  const LoadingSkeletons = useMemo(() => (
    <>
      <BookingCardSkeleton />
      <BookingCardSkeleton />
      <BookingCardSkeleton />
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
        <ErrorState error={error} onRetry={loadBookings} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={bookings}
        renderItem={renderBooking}
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
        ListHeaderComponent={ListHeaderComponent}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  bookingCard: {
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
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  courtName: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.xs,
  },
  facilityName: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  statusText: {
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bookingDetails: {
    gap: spacing.sm,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: responsiveFontSize(14),
    color: '#374151',
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: responsiveFontSize(18),
    color: '#9ca3af',
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: responsiveFontSize(20),
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#d1fae5',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  infoCardText: {
    flex: 1,
    fontSize: responsiveFontSize(14),
    color: '#047857',
    marginLeft: spacing.sm,
    lineHeight: responsiveFontSize(20),
  },
});
