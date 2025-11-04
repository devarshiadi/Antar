import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth Screens
import WelcomeScreen from '../components/WelcomeScreen';
import LoginScreen from '../components/LoginScreen';
import RegisterScreen from '../components/RegisterScreen';
import VerificationScreen from '../components/VerificationScreen';

// Main Screens
import HomeScreen from '../components/HomeScreen';
import CreateTripScreen from '../components/CreateTripScreen';
import MapScreen from '../components/MapScreen';
import LocationPickerScreen from '../components/LocationPickerScreen';
import MatchesScreen from '../components/MatchesScreen';
import ProfileScreen from '../components/ProfileScreen';
import ActiveTripScreen from '../components/ActiveTripScreen';
import TripHistoryScreen from '../components/TripHistoryScreen';
import NotificationsScreen from '../components/NotificationsScreen';
import ChatScreen from '../components/ChatScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000' },
        }}
      >
        {/* Auth Flow */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Verification" component={VerificationScreen} />

        {/* Main App Flow */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="LocationPicker" component={LocationPickerScreen} />
        <Stack.Screen name="Matches" component={MatchesScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
        <Stack.Screen name="TripHistory" component={TripHistoryScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
