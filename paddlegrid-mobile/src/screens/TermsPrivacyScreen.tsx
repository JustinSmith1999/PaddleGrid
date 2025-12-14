import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TermsPrivacyScreen({ navigation }: any) {
  const handleOpenTerms = () => {
    Linking.openURL('https://paddlegrid.com/terms');
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('https://paddlegrid.com/privacy');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Privacy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.linkItem} onPress={handleOpenPrivacy}>
          <View style={styles.linkItemLeft}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#10b981" />
            <View style={styles.linkItemText}>
              <Text style={styles.linkItemTitle}>Privacy Policy</Text>
              <Text style={styles.linkItemSubtitle}>
                How we protect and use your data
              </Text>
            </View>
          </View>
          <Ionicons name="open-outline" size={20} color="#d1d5db" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkItem} onPress={handleOpenTerms}>
          <View style={styles.linkItemLeft}>
            <Ionicons name="document-text-outline" size={24} color="#10b981" />
            <View style={styles.linkItemText}>
              <Text style={styles.linkItemTitle}>Terms of Service</Text>
              <Text style={styles.linkItemSubtitle}>
                Rules and guidelines for using PaddleGrid
              </Text>
            </View>
          </View>
          <Ionicons name="open-outline" size={20} color="#d1d5db" />
        </TouchableOpacity>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Privacy Summary</Text>
          <Text style={styles.summaryText}>
            At PaddleGrid, we take your privacy seriously. We only collect information
            necessary to provide and improve our services. Your personal information is
            never sold to third parties.
          </Text>

          <View style={styles.bulletPoint}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.bulletText}>
              We collect only essential information for account creation and bookings
            </Text>
          </View>

          <View style={styles.bulletPoint}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.bulletText}>
              Your payment information is securely processed by Stripe
            </Text>
          </View>

          <View style={styles.bulletPoint}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.bulletText}>
              You can request deletion of your data at any time
            </Text>
          </View>

          <View style={styles.bulletPoint}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.bulletText}>
              We use industry-standard encryption to protect your information
            </Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>User-Generated Content</Text>
          <Text style={styles.summaryText}>
            PaddleGrid includes user-generated content in the form of social posts,
            comments, and reviews. We have community guidelines and content moderation
            in place to keep our platform safe and welcoming.
          </Text>

          <View style={styles.bulletPoint}>
            <Ionicons name="flag-outline" size={20} color="#f59e0b" />
            <Text style={styles.bulletText}>
              Report inappropriate content using the flag icon
            </Text>
          </View>

          <View style={styles.bulletPoint}>
            <Ionicons name="shield-outline" size={20} color="#f59e0b" />
            <Text style={styles.bulletText}>
              Content with multiple reports is automatically hidden for review
            </Text>
          </View>

          <View style={styles.bulletPoint}>
            <Ionicons name="people-outline" size={20} color="#f59e0b" />
            <Text style={styles.bulletText}>
              Be respectful and follow community guidelines
            </Text>
          </View>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions?</Text>
          <Text style={styles.contactText}>
            If you have questions about our privacy practices or terms of service,
            please contact us at privacy@paddlegrid.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  linkItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkItemText: {
    marginLeft: 12,
    flex: 1,
  },
  linkItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  linkItemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  summarySection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
