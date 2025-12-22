import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import MainTabNavigator from './MainTabNavigator';
import EditProfileScreen from '../screens/EditProfileScreen';
import HelpScreen from '../screens/HelpScreen';
import TermsPrivacyScreen from '../screens/TermsPrivacyScreen';
import SeriesBrowserScreen from '../screens/SeriesBrowserScreen';
import SeriesDetailScreen from '../screens/SeriesDetailScreen';
import SeriesRegistrationScreen from '../screens/SeriesRegistrationScreen';
import MySeriesScreen from '../screens/MySeriesScreen';
import TournamentBracketScreen from '../screens/TournamentBracketScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import LiveScoreScreen from '../screens/LiveScoreScreen';

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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="TermsPrivacy" component={TermsPrivacyScreen} />
            <Stack.Screen name="SeriesBrowser" component={SeriesBrowserScreen} />
            <Stack.Screen name="SeriesDetail" component={SeriesDetailScreen} />
            <Stack.Screen name="SeriesRegistration" component={SeriesRegistrationScreen} />
            <Stack.Screen name="MySeries" component={MySeriesScreen} />
            <Stack.Screen name="TournamentBracket" component={TournamentBracketScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="LiveScore" component={LiveScoreScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
