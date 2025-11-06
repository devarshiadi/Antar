import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth Screens
import WelcomeScreen from '../components/WelcomeScreen';
import LoginScreen from '../components/LoginScreen';
import RegisterScreen from '../components/RegisterScreen';
import VerificationScreen from '../components/VerificationScreen';

// New Redesigned Screens
import HomeScreenNew from '../components/HomeScreenNew';
import MatchesScreenNew from '../components/MatchesScreenNew';
import NotificationsScreenNew from '../components/NotificationsScreenNew';
import ProfileScreenNew from '../components/ProfileScreenNew';
import ChatScreenNew from '../components/ChatScreenNew';
import TripHistoryScreenNew from '../components/TripHistoryScreenNew';

// Other Screens (keep existing)
import CreateTripScreen from '../components/CreateTripScreen';
import LocationPickerScreen from '../components/LocationPickerScreen';
import ActiveTripScreen from '../components/ActiveTripScreen';

const Stack = createNativeStackNavigator();

function AppNavigatorNew() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000' },
          animation: 'slide_from_right',
        }}
      >
        {/* Auth Flow */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Verification" component={VerificationScreen} />

        {/* Main App Flow - New Screens */}
        <Stack.Screen name="Home" component={HomeScreenNew} />
        <Stack.Screen name="Matches" component={MatchesScreenNew} />
        <Stack.Screen name="Notifications" component={NotificationsScreenNew} />
        <Stack.Screen name="Profile" component={ProfileScreenNew} />
        <Stack.Screen name="Chat" component={ChatScreenNew} />
        <Stack.Screen name="TripHistory" component={TripHistoryScreenNew} />

        {/* Other Screens */}
        <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
        <Stack.Screen name="LocationPicker" component={LocationPickerScreen} />
        <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigatorNew;
