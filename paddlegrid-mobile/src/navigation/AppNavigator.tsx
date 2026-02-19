import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import MainTabNavigator from './MainTabNavigator';
import EditProfileScreen from '../screens/EditProfileScreen';
import HelpScreen from '../screens/HelpScreen';
import TermsPrivacyScreen from '../screens/TermsPrivacyScreen';
import FacilityDetailsScreen from '../screens/FacilityDetailsScreen';
import BookingCreationScreen from '../screens/BookingCreationScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PostDetailScreen from '../screens/PostDetailScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          presentation: 'card',
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="FacilityDetails"
              component={FacilityDetailsScreen}
              options={{
                headerShown: true,
                title: 'Club Details',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="BookingCreation"
              component={BookingCreationScreen}
              options={{
                headerShown: true,
                title: 'Book a Court',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                headerShown: true,
                title: 'Notifications',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="PostDetail"
              component={PostDetailScreen}
              options={{
                headerShown: true,
                title: 'Post',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="TermsPrivacy" component={TermsPrivacyScreen} />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
