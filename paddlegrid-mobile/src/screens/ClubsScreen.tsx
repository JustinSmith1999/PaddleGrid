import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAllFacilities, FacilityWithCourts } from '@shared/api';
import { responsiveFontSize, spacing, isTablet } from '../utils/responsive';
import { ClubCardSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { parseError, AppError } from '../utils/errors';
import { buttonPress } from '../utils/haptics';

// Memoized Facility Card Component
const FacilityCard = memo(({ facility, onPress }: {
  facility: FacilityWithCourts;
  onPress: (facility: FacilityWithCourts) => void;
}) => {
  const handlePress = useCallback(() => {
    buttonPress();
    onPress(facility);
  }, [facility, onPress]);

  return (
    <TouchableOpacity
      style={styles.facilityCard}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.facilityHeader}>
        <View style={styles.facilityIcon}>
          <Ionicons name="business" size={24} color="#10b981" />
        </View>
        <View style={styles.facilityInfo}>
          <Text style={styles.facilityName}>{facility.name}</Text>
          <Text style={styles.facilityAddress}>
            {facility.city}, {facility.state}
          </Text>
        </View>
      </View>
      <View style={styles.facilityStats}>
        <View style={styles.stat}>
          <Ionicons name="grid-outline" size={20} color="#6b7280" />
          <Text style={styles.statText}>{facility.courts?.length || 0} Courts</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );
});

FacilityCard.displayName = 'FacilityCard';

export default function ClubsScreen({ navigation }: any) {
  const [facilities, setFacilities] = useState<FacilityWithCourts[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = useCallback(async () => {
    try {
      setError(null);
      const data = await getAllFacilities();
      setFacilities(data);
    } catch (err) {
      console.error('Error loading facilities:', err);
      setError(parseError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadFacilities();
  }, [loadFacilities]);

  const handleFacilityPress = useCallback((facility: FacilityWithCourts) => {
    // TODO: Navigate to facility details screen when implemented
    console.log('Facility pressed:', facility.name);
  }, []);

  const renderFacility = useCallback(({ item }: { item: FacilityWithCourts }) => (
    <FacilityCard facility={item} onPress={handleFacilityPress} />
  ), [handleFacilityPress]);

  const keyExtractor = useCallback((item: FacilityWithCourts) => item.id, []);

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="business-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyText}>No clubs found</Text>
    </View>
  ), []);

  const LoadingSkeletons = useMemo(() => (
    <>
      <ClubCardSkeleton />
      <ClubCardSkeleton />
      <ClubCardSkeleton />
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
        <ErrorState error={error} onRetry={loadFacilities} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={facilities}
        renderItem={renderFacility}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  facilityCard: {
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
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  facilityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  facilityInfo: {
    flex: 1,
  },
  facilityName: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.xs,
  },
  facilityAddress: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
  },
  facilityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
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
