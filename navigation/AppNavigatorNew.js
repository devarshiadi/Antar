import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
<<<<<<< HEAD
import { COLORS } from '../constants/theme';
=======
>>>>>>> aditya mule delay zala ahe sagla
import { getAppTheme } from '../helpers/use-app-theme';

// Auth Screens
import WelcomeScreen from '../components/WelcomeScreen';
import LoginScreen from '../components/LoginScreen';
import RegisterScreen from '../components/RegisterScreen';
import VerificationScreen from '../components/VerificationScreen';

// New Redesigned Screens
import HomeScreenNew from '../components/home/home-screen';
import MatchesScreenNew from '../components/matches/matches-screen';
import NotificationsScreenNew from '../components/NotificationsScreenNew';
import ProfileScreenNew from '../components/ProfileScreenNew';
import ChatScreenNew from '../components/ChatScreenNew';
import TripHistoryScreenNew from '../components/trips/trip-history-screen';
import MyRidesScreen from '../components/trips/my-rides-screen';

// Other Screens (keep existing)
import CreateTripScreen from '../components/CreateTripScreen';
import LocationPickerScreen from '../components/trips/location-picker-screen';
import ActiveTripScreen from '../components/trips/active-trip-screen';
import OfferRideScreen from '../components/trips/offer-ride-screen';

const Stack = createNativeStackNavigator();

function AppNavigatorNew() {
  const colorScheme = useColorScheme();
  const { navigationTheme, colors } = getAppTheme(colorScheme);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialUser, setInitialUser] = useState(null);

  useEffect(() => {
    async function bootstrapSession() {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const userJson = await AsyncStorage.getItem('user');
        if (token && userJson) {
          setIsAuthenticated(true);
          setInitialUser(JSON.parse(userJson));
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setBootstrapped(true);
      }
    }

    bootstrapSession();
  }, []);

  if (!bootstrapped) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg.primary, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator size="large" color={colors.text.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Home' : 'Welcome'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.primary },
          animation: 'slide_from_right',
        }}
      >
        {/* Auth Flow */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Verification" component={VerificationScreen} />

        {/* Main App Flow - New Screens */}
        <Stack.Screen
          name="Home"
          component={HomeScreenNew}
          initialParams={initialUser ? { user: initialUser } : undefined}
        />
        <Stack.Screen name="Matches" component={MatchesScreenNew} />
        <Stack.Screen name="Notifications" component={NotificationsScreenNew} />
        <Stack.Screen name="Profile" component={ProfileScreenNew} />
        <Stack.Screen name="Chat" component={ChatScreenNew} />
        <Stack.Screen name="TripHistory" component={TripHistoryScreenNew} />
        <Stack.Screen name="MyRides" component={MyRidesScreen} />

        {/* Other Screens */}
        <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
        <Stack.Screen name="LocationPicker" component={LocationPickerScreen} />
        <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
        <Stack.Screen name="OfferRide" component={OfferRideScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigatorNew;
