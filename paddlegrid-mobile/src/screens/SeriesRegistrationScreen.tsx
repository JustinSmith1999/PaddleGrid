import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { seriesApi, Series } from '@shared/api';
import { responsiveFontSize, spacing } from '../utils/responsive';
import { useAuth } from '../contexts/AuthContext';

export default function SeriesRegistrationScreen({ route, navigation }: any) {
  const { seriesId, series } = route.params as { seriesId: string; series: Series };
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleRegister = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to register for this series.');
      return;
    }

    if (!agreed) {
      Alert.alert('Terms Required', 'Please agree to the terms and conditions.');
      return;
    }

    setLoading(true);

    try {
      if (series.entry_fee > 0) {
        Alert.alert(
          'Payment Required',
          `This series requires a $${series.entry_fee} entry fee. You will be redirected to complete payment.`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
            {
              text: 'Continue',
              onPress: async () => {
                await processPaymentAndRegister();
              },
            },
          ]
        );
      } else {
        await seriesApi.registerForSeries(seriesId, user.id);

        Alert.alert('Success!', 'You have been registered for this series.', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MySeries'),
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to register for series.');
      setLoading(false);
    }
  };

  const processPaymentAndRegister = async () => {
    try {
      const registration = await seriesApi.registerForSeries(seriesId, user!.id);

      Alert.alert('Success!', 'Payment processed and you are now registered!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('MySeries'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Series Registration</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.seriesCard}>
            <View style={styles.seriesIcon}>
              <Ionicons name="trophy" size={32} color="#f59e0b" />
            </View>
            <Text style={styles.seriesName}>{series.name}</Text>
            <Text style={styles.facilityName}>{series.facility_name}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Series Details</Text>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>
                  {formatDate(series.start_date)} - {formatDate(series.end_date)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={20} color="#6b7280" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Participants</Text>
                <Text style={styles.detailValue}>
                  {series.current_participants}/{series.max_participants} players
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="stats-chart-outline" size={20} color="#6b7280" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Skill Level</Text>
                <Text style={styles.detailValue}>{series.skill_level}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="game-controller-outline" size={20} color="#6b7280" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Format</Text>
                <Text style={styles.detailValue}>{series.format}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Registration Fee</Text>
            <View style={styles.priceCard}>
              <Text style={styles.priceAmount}>
                {series.entry_fee > 0 ? `$${series.entry_fee}` : 'FREE'}
              </Text>
              <Text style={styles.priceDescription}>
                {series.entry_fee > 0
                  ? 'One-time entry fee for the series'
                  : 'No registration fee required'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.benefitText}>
                  Access to all scheduled matches
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.benefitText}>
                  Real-time standings and rankings
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.benefitText}>
                  Match scheduling and notifications
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.benefitText}>
                  Player stats and match history
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAgreed(!agreed)}
          >
            <View
              style={[styles.checkbox, agreed && styles.checkboxChecked]}
            >
              {agreed && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              I agree to the terms and conditions and understand the refund
              policy
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.registerButton, (!agreed || loading) && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={!agreed || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>
              {series.entry_fee > 0 ? 'Proceed to Payment' : 'Complete Registration'}
            </Text>
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
  },
  content: {
    padding: spacing.md,
  },
  seriesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  seriesIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  seriesName: {
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  facilityName: {
    fontSize: responsiveFontSize(16),
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  detailText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  detailLabel: {
    fontSize: responsiveFontSize(13),
    color: '#9ca3af',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: responsiveFontSize(15),
    color: '#1f2937',
    fontWeight: '500',
  },
  priceCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  priceAmount: {
    fontSize: responsiveFontSize(36),
    fontWeight: '700',
    color: '#10b981',
    marginBottom: spacing.xs,
  },
  priceDescription: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
    textAlign: 'center',
  },
  benefitsList: {
    gap: spacing.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitText: {
    fontSize: responsiveFontSize(15),
    color: '#4b5563',
    flex: 1,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  termsText: {
    flex: 1,
    fontSize: responsiveFontSize(14),
    color: '#4b5563',
    lineHeight: 20,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  registerButton: {
    backgroundColor: '#10b981',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
  },
  registerButtonText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    color: '#fff',
  },
});
