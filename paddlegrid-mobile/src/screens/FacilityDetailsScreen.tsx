import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Platform,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getFacilityById, getCourts, isFacilityMember, joinFacility, leaveFacility } from '@shared/api';
import { supabase } from '@shared/lib/supabase';
import type { FacilityWithCourts, Court } from '@shared/api';
import { responsiveFontSize, spacing, isTablet } from '../utils/responsive';
import { ErrorState } from '../components/ErrorState';
import { parseError, AppError } from '../utils/errors';
import { buttonPress } from '../utils/haptics';
import { OptimizedImage } from '../components/OptimizedImage';

const { width } = Dimensions.get('window');

interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: string;
}

interface OperatingHours {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    profile_picture_url?: string;
  };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function FacilityDetailsScreen({ route, navigation }: any) {
  const { facilityId } = route.params;
  const [facility, setFacility] = useState<FacilityWithCourts | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [hours, setHours] = useState<OperatingHours[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [joiningFacility, setJoiningFacility] = useState(false);

  useEffect(() => {
    loadFacilityDetails();
  }, [facilityId]);

  const loadFacilityDetails = useCallback(async () => {
    try {
      setError(null);

      const [facilityData, courtsData, memberStatus] = await Promise.all([
        getFacilityById(facilityId),
        getCourts(facilityId),
        isFacilityMember(facilityId),
      ]);

      if (!facilityData) {
        throw new Error('Facility not found');
      }

      setFacility(facilityData);
      setCourts(courtsData);
      setIsMember(memberStatus);

      const { data: amenitiesData } = await supabase
        .from('facility_amenities')
        .select('*')
        .eq('facility_id', facilityId)
        .order('display_order');

      setAmenities(amenitiesData || []);

      const { data: hoursData } = await supabase
        .from('facility_operating_hours')
        .select('*')
        .eq('facility_id', facilityId)
        .order('day_of_week');

      setHours(hoursData || []);

      const { data: reviewsData } = await supabase
        .from('facility_testimonials')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id,
          profiles:user_id (
            full_name,
            profile_picture_url
          )
        `)
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: false })
        .limit(5);

      setReviews(reviewsData || []);
    } catch (err) {
      console.error('Error loading facility details:', err);
      setError(parseError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [facilityId]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadFacilityDetails();
  }, [loadFacilityDetails]);

  const handleJoinFacility = useCallback(async () => {
    try {
      buttonPress();
      setJoiningFacility(true);

      if (isMember) {
        const result = await leaveFacility(facilityId);
        if (result.success) {
          setIsMember(false);
        }
      } else {
        const result = await joinFacility(facilityId);
        if (result.success) {
          setIsMember(true);
        }
      }
    } catch (err) {
      console.error('Error toggling membership:', err);
    } finally {
      setJoiningFacility(false);
    }
  }, [facilityId, isMember]);

  const handleGetDirections = useCallback(() => {
    if (!facility) return;

    buttonPress();
    const address = `${facility.address}, ${facility.city}, ${facility.state} ${facility.zip}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  }, [facility]);

  const handleCall = useCallback(() => {
    if (!facility?.phone) return;

    buttonPress();
    Linking.openURL(`tel:${facility.phone}`);
  }, [facility]);

  const handleEmail = useCallback(() => {
    if (!facility?.email) return;

    buttonPress();
    Linking.openURL(`mailto:${facility.email}`);
  }, [facility]);

  const handleCourtPress = useCallback((court: Court) => {
    buttonPress();
    navigation.navigate('BookingCreation', { facilityId, courtId: court.id });
  }, [navigation, facilityId]);

  const handleBookCourt = useCallback(() => {
    buttonPress();
    navigation.navigate('BookingCreation', { facilityId });
  }, [navigation, facilityId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading facility details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !facility) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="dark-content" />
        <ErrorState error={error || parseError('Facility not found')} onRetry={loadFacilityDetails} />
      </SafeAreaView>
    );
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {facility.hero_image && (
          <OptimizedImage
            source={{ uri: facility.hero_image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.facilityName}>{facility.name}</Text>
              {reviews.length > 0 && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.ratingText}>{averageRating.toFixed(1)}</Text>
                </View>
              )}
            </View>
            <Text style={styles.facilityAddress}>
              {facility.address}, {facility.city}, {facility.state} {facility.zip}
            </Text>
          </View>

          {facility.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{facility.description}</Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleBookCourt}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Book Court</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleJoinFacility}
              disabled={joiningFacility}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isMember ? 'checkmark-circle' : 'person-add'}
                size={20}
                color="#10b981"
              />
              <Text style={styles.secondaryButtonText}>
                {joiningFacility ? 'Loading...' : isMember ? 'Member' : 'Join'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleGetDirections}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate" size={20} color="#10b981" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Courts ({courts.length})</Text>
            {courts.length > 0 ? (
              courts.map((court) => (
                <TouchableOpacity
                  key={court.id}
                  style={styles.courtCard}
                  onPress={() => handleCourtPress(court)}
                  activeOpacity={0.7}
                >
                  <View style={styles.courtInfo}>
                    <Text style={styles.courtName}>{court.name}</Text>
                    <Text style={styles.courtType}>{court.surface_type}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No courts available</Text>
            )}
          </View>

          {amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {amenities.map((amenity) => (
                  <View key={amenity.id} style={styles.amenityItem}>
                    <Ionicons name={amenity.icon as any} size={24} color="#10b981" />
                    <Text style={styles.amenityText}>{amenity.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {hours.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hours</Text>
              {hours.map((hour) => (
                <View key={hour.id} style={styles.hourRow}>
                  <Text style={styles.dayText}>{DAYS[hour.day_of_week]}</Text>
                  <Text style={styles.timeText}>
                    {hour.is_closed
                      ? 'Closed'
                      : `${formatTime(hour.open_time)} - ${formatTime(hour.close_time)}`}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {reviews.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
              {reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAuthor}>
                      {review.profiles?.profile_picture_url ? (
                        <OptimizedImage
                          source={{ uri: review.profiles.profile_picture_url }}
                          style={styles.reviewAvatar}
                        />
                      ) : (
                        <View style={styles.reviewAvatarPlaceholder}>
                          <Ionicons name="person" size={20} color="#6b7280" />
                        </View>
                      )}
                      <View>
                        <Text style={styles.reviewAuthorName}>
                          {review.profiles?.full_name || 'Anonymous'}
                        </Text>
                        <View style={styles.reviewRating}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Ionicons
                              key={i}
                              name={i < review.rating ? 'star' : 'star-outline'}
                              size={14}
                              color="#fbbf24"
                            />
                          ))}
                        </View>
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>
                      {formatDate(review.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.reviewText}>{review.comment}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            {facility.phone && (
              <TouchableOpacity style={styles.contactRow} onPress={handleCall} activeOpacity={0.7}>
                <Ionicons name="call" size={20} color="#10b981" />
                <Text style={styles.contactText}>{facility.phone}</Text>
              </TouchableOpacity>
            )}
            {facility.email && (
              <TouchableOpacity style={styles.contactRow} onPress={handleEmail} activeOpacity={0.7}>
                <Ionicons name="mail" size={20} color="#10b981" />
                <Text style={styles.contactText}>{facility.email}</Text>
              </TouchableOpacity>
            )}
            {facility.website && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(facility.website!)}
                activeOpacity={0.7}
              >
                <Ionicons name="globe" size={20} color="#10b981" />
                <Text style={styles.contactText}>{facility.website}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: responsiveFontSize(16),
    color: '#6b7280',
  },
  heroImage: {
    width,
    height: 200,
    backgroundColor: '#e5e7eb',
  },
  contentContainer: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  facilityName: {
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    marginRight: spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#92400e',
    marginLeft: spacing.xs / 2,
  },
  facilityAddress: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: responsiveFontSize(14),
    color: '#4b5563',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  primaryButtonText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#10b981',
  },
  courtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  courtInfo: {
    flex: 1,
  },
  courtName: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.xs / 2,
  },
  courtType: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  amenityItem: {
    alignItems: 'center',
    width: (width - spacing.md * 2 - spacing.md * 3) / 4,
  },
  amenityText: {
    fontSize: responsiveFontSize(12),
    color: '#4b5563',
    textAlign: 'center',
    marginTop: spacing.xs / 2,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dayText: {
    fontSize: responsiveFontSize(14),
    color: '#1f2937',
    fontWeight: '500',
  },
  timeText: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAuthorName: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.xs / 2,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: responsiveFontSize(12),
    color: '#9ca3af',
  },
  reviewText: {
    fontSize: responsiveFontSize(14),
    color: '#4b5563',
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  contactText: {
    fontSize: responsiveFontSize(14),
    color: '#10b981',
  },
  emptyText: {
    fontSize: responsiveFontSize(14),
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
