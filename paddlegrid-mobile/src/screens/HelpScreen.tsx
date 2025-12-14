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

export default function HelpScreen({ navigation }: any) {
  const handleContactSupport = () => {
    Linking.openURL('mailto:support@paddlegrid.com?subject=PaddleGrid Support Request');
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://paddlegrid.com/support');
  };

  const handleOpenFAQ = () => {
    Linking.openURL('https://paddlegrid.com/faq');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help</Text>

          <TouchableOpacity style={styles.helpItem} onPress={handleOpenFAQ}>
            <View style={styles.helpItemLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#10b981" />
              <View style={styles.helpItemText}>
                <Text style={styles.helpItemTitle}>FAQ</Text>
                <Text style={styles.helpItemSubtitle}>
                  Find answers to common questions
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpItem} onPress={handleOpenWebsite}>
            <View style={styles.helpItemLeft}>
              <Ionicons name="globe-outline" size={24} color="#10b981" />
              <View style={styles.helpItemText}>
                <Text style={styles.helpItemTitle}>Support Website</Text>
                <Text style={styles.helpItemSubtitle}>
                  Visit our help center
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpItem} onPress={handleContactSupport}>
            <View style={styles.helpItemLeft}>
              <Ionicons name="mail-outline" size={24} color="#10b981" />
              <View style={styles.helpItemText}>
                <Text style={styles.helpItemTitle}>Contact Support</Text>
                <Text style={styles.helpItemSubtitle}>
                  Email us at support@paddlegrid.com
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>PaddleGrid</Text>
            <Text style={styles.infoText}>
              Version 1.0.0
            </Text>
            <Text style={styles.infoText} style={{ marginTop: 12 }}>
              PaddleGrid is the all-in-one platform for pickleball facilities and
              players. Book courts, join matches, track your stats, and connect with
              the pickleball community.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tips</Text>
          <View style={styles.tipBox}>
            <Ionicons name="bulb-outline" size={20} color="#10b981" />
            <Text style={styles.tipText}>
              Swipe down on any screen to refresh the latest data
            </Text>
          </View>
          <View style={styles.tipBox}>
            <Ionicons name="bulb-outline" size={20} color="#10b981" />
            <Text style={styles.tipText}>
              Tap the flag icon on any post to report inappropriate content
            </Text>
          </View>
          <View style={styles.tipBox}>
            <Ionicons name="bulb-outline" size={20} color="#10b981" />
            <Text style={styles.tipText}>
              Enable push notifications to get booking reminders and match invites
            </Text>
          </View>
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
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  helpItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  helpItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helpItemText: {
    marginLeft: 12,
    flex: 1,
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  helpItemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#047857',
    marginLeft: 12,
    lineHeight: 20,
  },
});
