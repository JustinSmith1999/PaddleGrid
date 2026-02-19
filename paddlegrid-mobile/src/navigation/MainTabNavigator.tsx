import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { supabase } from '@shared/lib/supabase';

import FeedScreen from '../screens/FeedScreen';
import ClubsScreen from '../screens/ClubsScreen';
import BookingsScreen from '../screens/BookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <View style={notifStyles.badge}>
      <Text style={notifStyles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

export default function MainTabNavigator() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();

    const subscription = supabase
      .channel('notifications_badge')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_notifications',
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUnreadCount = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { count } = await supabase
        .from('social_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Feed') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Clubs') {
            iconName = focused ? 'tennisball' : 'tennisball-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={26} color={color} />;
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? -4 : 4,
          ...Platform.select({
            ios: {
              fontFamily: 'System',
            },
          }),
        },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 65,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#fff',
          borderTopWidth: 0,
          elevation: 0,
          ...Platform.select({
            ios: {
              position: 'absolute',
              borderTopColor: 'transparent',
            },
            android: {
              borderTopColor: '#e5e7eb',
              borderTopWidth: 1,
            },
          }),
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={100}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
              }}
            />
          ) : null,
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowColor: 'transparent',
          borderBottomWidth: 0,
        },
        headerTintColor: '#1f2937',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 34,
          color: '#1f2937',
          ...Platform.select({
            ios: {
              fontFamily: 'System',
            },
          }),
        },
        headerTitleAlign: 'left',
        headerLeftContainerStyle: {
          paddingLeft: 16,
        },
        headerRightContainerStyle: {
          paddingRight: 16,
        },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={({ navigation }) => ({
          title: 'Home',
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={notifStyles.iconButton}
            >
              <Ionicons name="notifications-outline" size={24} color="#1f2937" />
              <NotificationBadge count={unreadCount} />
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen
        name="Clubs"
        component={ClubsScreen}
        options={{
          title: 'Clubs',
          headerLargeTitle: true,
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          title: 'Bookings',
          headerLargeTitle: true,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerLargeTitle: true,
        }}
      />
    </Tab.Navigator>
  );
}

const notifStyles = StyleSheet.create({
  iconButton: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
