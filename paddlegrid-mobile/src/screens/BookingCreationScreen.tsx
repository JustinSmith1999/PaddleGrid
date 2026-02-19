import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCourts, getCourtAvailability, createBooking } from '@shared/api';
import type { Court } from '@shared/lib/supabase';
import { responsiveFontSize, spacing } from '../utils/responsive';
import { ErrorState } from '../components/ErrorState';
import { parseError, AppError } from '../utils/errors';
import { buttonPress } from '../utils/haptics';

interface TimeSlot {
  time: string;
  hour: number;
  available: boolean;
}

const generateTimeSlots = (start: number = 6, end: number = 22): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = start; hour < end; hour++) {
    const time = formatHour(hour);
    slots.push({ time, hour, available: true });
  }
  return slots;
};

const formatHour = (hour: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period}`;
};

export default function BookingCreationScreen({ route, navigation }: any) {
  const { facilityId } = route.params;

  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [duration, setDuration] = useState<number>(1);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(generateTimeSlots());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    loadCourts();
  }, [facilityId]);

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      loadAvailability();
    }
  }, [selectedCourt, selectedDate]);

  const loadCourts = useCallback(async () => {
    try {
      setError(null);
      const data = await getCourts(facilityId);
      setCourts(data);
      if (data.length > 0) {
        setSelectedCourt(data[0]);
      }
    } catch (err) {
      console.error('Error loading courts:', err);
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  const loadAvailability = useCallback(async () => {
    if (!selectedCourt) return;

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const bookings = await getCourtAvailability(selectedCourt.id, dateStr);

      const newTimeSlots = generateTimeSlots().map((slot) => {
        const slotStart = new Date(selectedDate);
        slotStart.setHours(slot.hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(slotStart.getHours() + 1);

        const isBooked = bookings.some((booking) => {
          const bookingStart = new Date(booking.start_time);
          const bookingEnd = new Date(booking.end_time);
          return (
            (slotStart >= bookingStart && slotStart < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (slotStart <= bookingStart && slotEnd >= bookingEnd)
          );
        });

        const isPast = slotStart < new Date();

        return {
          ...slot,
          available: !isBooked && !isPast,
        };
      });

      setTimeSlots(newTimeSlots);
    } catch (err) {
      console.error('Error loading availability:', err);
    }
  }, [selectedCourt, selectedDate]);

  const handleCreateBooking = useCallback(async () => {
    if (!selectedCourt || !selectedTimeSlot) return;

    try {
      buttonPress();
      setCreating(true);

      const startTime = new Date(selectedDate);
      startTime.setHours(selectedTimeSlot.hour, 0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + duration);

      const totalCost = (selectedCourt.hourly_rate || 0) * duration;

      const result = await createBooking({
        court_id: selectedCourt.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        total_cost: totalCost,
      });

      if (result.success) {
        Alert.alert(
          'Booking Created',
          'Your booking has been confirmed!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
                navigation.navigate('Bookings');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create booking');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      Alert.alert('Error', 'Failed to create booking');
    } finally {
      setCreating(false);
    }
  }, [selectedCourt, selectedTimeSlot, selectedDate, duration, navigation]);

  const handleDateChange = useCallback((days: number) => {
    buttonPress();
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newDate >= today) {
      setSelectedDate(newDate);
      setSelectedTimeSlot(null);
    }
  }, [selectedDate]);

  const handleTimeSlotSelect = useCallback((slot: TimeSlot) => {
    if (!slot.available) return;

    buttonPress();
    setSelectedTimeSlot(slot);
  }, []);

  const formatDate = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const diffTime = compareDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading courts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || courts.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="dark-content" />
        <ErrorState
          error={error || parseError('No courts available')}
          onRetry={loadCourts}
        />
      </SafeAreaView>
    );
  }

  const canBook = selectedCourt && selectedTimeSlot && selectedTimeSlot.available;
  const totalCost = selectedCourt ? (selectedCourt.hourly_rate || 0) * duration : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Court</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.courtsScroll}
          >
            {courts.map((court) => (
              <TouchableOpacity
                key={court.id}
                style={[
                  styles.courtCard,
                  selectedCourt?.id === court.id && styles.courtCardSelected,
                ]}
                onPress={() => {
                  buttonPress();
                  setSelectedCourt(court);
                  setSelectedTimeSlot(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.courtName,
                  selectedCourt?.id === court.id && styles.courtNameSelected,
                ]}>
                  {court.name}
                </Text>
                <Text style={[
                  styles.courtRate,
                  selectedCourt?.id === court.id && styles.courtRateSelected,
                ]}>
                  ${court.hourly_rate}/hr
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <View style={styles.dateSelector}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => handleDateChange(-1)}
              disabled={selectedDate.toDateString() === new Date().toDateString()}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={selectedDate.toDateString() === new Date().toDateString() ? '#d1d5db' : '#10b981'}
              />
            </TouchableOpacity>
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
              <Text style={styles.fullDateText}>
                {selectedDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => handleDateChange(1)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={24} color="#10b981" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeSlotsGrid}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot.time}
                style={[
                  styles.timeSlot,
                  !slot.available && styles.timeSlotDisabled,
                  selectedTimeSlot?.time === slot.time && styles.timeSlotSelected,
                ]}
                onPress={() => handleTimeSlotSelect(slot)}
                disabled={!slot.available}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.timeSlotText,
                  !slot.available && styles.timeSlotTextDisabled,
                  selectedTimeSlot?.time === slot.time && styles.timeSlotTextSelected,
                ]}>
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationSelector}>
            {[1, 1.5, 2, 2.5, 3].map((hours) => (
              <TouchableOpacity
                key={hours}
                style={[
                  styles.durationButton,
                  duration === hours && styles.durationButtonSelected,
                ]}
                onPress={() => {
                  buttonPress();
                  setDuration(hours);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.durationText,
                  duration === hours && styles.durationTextSelected,
                ]}>
                  {hours} {hours === 1 ? 'hr' : 'hrs'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {canBook && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Court:</Text>
              <Text style={styles.summaryValue}>{selectedCourt.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>{selectedTimeSlot.time}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{duration} {duration === 1 ? 'hour' : 'hours'}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${totalCost.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.bookButton, (!canBook || creating) && styles.bookButtonDisabled]}
          onPress={handleCreateBooking}
          disabled={!canBook || creating}
          activeOpacity={0.7}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.bookButtonText}>
                Confirm Booking - ${totalCost.toFixed(2)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.sm,
  },
  courtsScroll: {
    paddingRight: spacing.md,
  },
  courtCard: {
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 8,
    marginRight: spacing.sm,
    minWidth: 140,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  courtCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  courtName: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.xs / 2,
  },
  courtNameSelected: {
    color: '#065f46',
  },
  courtRate: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
  },
  courtRateSelected: {
    color: '#059669',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 8,
  },
  dateButton: {
    padding: spacing.xs,
  },
  dateDisplay: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: responsiveFontSize(20),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.xs / 2,
  },
  fullDateText: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeSlot: {
    backgroundColor: '#fff',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: '30%',
    alignItems: 'center',
  },
  timeSlotDisabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.5,
  },
  timeSlotSelected: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  timeSlotText: {
    fontSize: responsiveFontSize(14),
    fontWeight: '500',
    color: '#1f2937',
  },
  timeSlotTextDisabled: {
    color: '#9ca3af',
  },
  timeSlotTextSelected: {
    color: '#065f46',
    fontWeight: '600',
  },
  durationSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  durationButtonSelected: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  durationText: {
    fontSize: responsiveFontSize(14),
    fontWeight: '500',
    color: '#1f2937',
  },
  durationTextSelected: {
    color: '#065f46',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  summaryTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: responsiveFontSize(14),
    fontWeight: '500',
    color: '#1f2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
  },
  totalLabel: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: responsiveFontSize(18),
    fontWeight: '700',
    color: '#10b981',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
  },
  bookButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  bookButtonText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#fff',
  },
});
