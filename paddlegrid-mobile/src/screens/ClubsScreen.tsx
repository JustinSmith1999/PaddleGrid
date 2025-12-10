import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllFacilities, FacilityWithCourts } from '@shared/api';

export default function ClubsScreen({ navigation }: any) {
  const [facilities, setFacilities] = useState<FacilityWithCourts[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    try {
      const data = await getAllFacilities();
      setFacilities(data);
    } catch (error) {
      console.error('Error loading facilities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFacilities();
  };

  const renderFacility = ({ item }: { item: FacilityWithCourts }) => (
    <TouchableOpacity style={styles.facilityCard}>
      <View style={styles.facilityHeader}>
        <View style={styles.facilityIcon}>
          <Ionicons name="business" size={24} color="#10b981" />
        </View>
        <View style={styles.facilityInfo}>
          <Text style={styles.facilityName}>{item.name}</Text>
          <Text style={styles.facilityAddress}>
            {item.city}, {item.state}
          </Text>
        </View>
      </View>
      <View style={styles.facilityStats}>
        <View style={styles.stat}>
          <Ionicons name="grid-outline" size={20} color="#6b7280" />
          <Text style={styles.statText}>{item.courts?.length || 0} Courts</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading clubs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={facilities}
        renderItem={renderFacility}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No clubs found</Text>
          </View>
        }
      />
    </View>
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
  },
  listContent: {
    padding: 16,
  },
  facilityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  facilityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  facilityInfo: {
    flex: 1,
  },
  facilityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  facilityAddress: {
    fontSize: 14,
    color: '#6b7280',
  },
  facilityStats: {
    flexDirection: 'row',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#9ca3af',
    marginTop: 16,
  },
});
