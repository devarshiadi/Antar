import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  Alert,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Car, User, Bell, Navigation, MessageSquare, ChevronRight } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { saveGlobalRoute, loadGlobalRoute } from '../../helpers/location-storage';
import { getStoredRides } from '../../helpers/rides-storage';
import { normalizeTripFromApi } from '../../helpers/trip-history-helpers';
import { useAppTheme } from '../../helpers/use-app-theme';
<<<<<<< HEAD
import { styles } from './home-styles';
=======
import { getHomeStyles } from './home-styles';
>>>>>>> aditya mule delay zala ahe sagla

const LOCATION_PERMISSION_KEY = 'location_permission_preference';

export function HomeScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();
<<<<<<< HEAD
=======
  const styles = useMemo(function () {
    return getHomeStyles(theme);
  }, [theme]);
>>>>>>> aditya mule delay zala ahe sagla
  const currentUser = route.params?.user || null;
  const userName = currentUser?.name?.trim() || 'Traveler';
  const recentTrips = route.params?.recentTrips ?? [];
  const [permissionPreference, setPermissionPreference] = useState(null);
  const [sessionConsentGranted, setSessionConsentGranted] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [userCity, setUserCity] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sourceLocation, setSourceLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [manualEntry, setManualEntry] = useState({ type: null, value: '', loading: false });
  const [chatThreads, setChatThreads] = useState([]);
  const [messagesExpanded, setMessagesExpanded] = useState(false);
  const [recentHistory, setRecentHistory] = useState([]);
  const homeRecentTrips = useMemo(() => {
    const source = recentHistory.length > 0 ? recentHistory : recentTrips;
    if (!source || source.length === 0) {
      return [];
    }
    return source.slice(0, 3).map((trip, index) => ({
      id: trip.id ?? `recent-${index}`,
      from: trip.from ?? 'Pickup',
      to: trip.to ?? 'Drop',
      time: trip.time ?? trip.date ?? '',
      status:
        trip.status ??
        (trip.type === 'rider' ? 'Driver' : trip.type === 'passenger' ? 'Passenger' : 'Trip'),
    }));
  }, [recentHistory, recentTrips]);

  const sortedThreads = useMemo(() => {
    if (!chatThreads || chatThreads.length === 0) {
      return [];
    }
    return [...chatThreads].sort((first, second) => {
      const firstTime = first.updatedAt ? new Date(first.updatedAt).getTime() : 0;
      const secondTime = second.updatedAt ? new Date(second.updatedAt).getTime() : 0;
      return secondTime - firstTime;
    });
  }, [chatThreads]);

  const visibleThreads = useMemo(
    () => sortedThreads.filter((thread) => thread.matchId !== 'support'),
    [sortedThreads],
  );

  const currentThread = useMemo(() => {
    if (visibleThreads.length === 0) {
      return null;
    }
    return visibleThreads[0];
  }, [visibleThreads]);

  useEffect(() => {
    if (visibleThreads.length === 0 && messagesExpanded) {
      setMessagesExpanded(false);
    }
  }, [visibleThreads, messagesExpanded]);

  useEffect(() => {
    let cancelled = false;
    async function bootstrapLocationAccess() {
      let hydratedFromCache = false;
      try {
        const cachedPermission = await AsyncStorage.getItem(LOCATION_PERMISSION_KEY);
        setPermissionPreference(cachedPermission);
        if (cachedPermission === 'true') {
          setHasLocationPermission(true);
          setShowLocationPrompt(false);
          setSessionConsentGranted(true);
          await hydrateLocation();
          hydratedFromCache = true;
        } else if (cachedPermission === 'ask_every_time') {
          setHasLocationPermission(false);
          setShowLocationPrompt(!sessionConsentGranted);
        }

        const { status } = await Location.getForegroundPermissionsAsync();
        if (cancelled) {
          return;
        }

        if (status === 'granted') {
          setHasLocationPermission(true);
          if (cachedPermission === 'ask_every_time' && !sessionConsentGranted) {
            setShowLocationPrompt(true);
          } else {
            setShowLocationPrompt(false);
            await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
            setPermissionPreference('true');
            setSessionConsentGranted(true);
            if (!hydratedFromCache) {
              await hydrateLocation();
            }
          }
        } else {
          setHasLocationPermission(false);
          setShowLocationPrompt(true);
          if (cachedPermission === 'true') {
            await AsyncStorage.removeItem(LOCATION_PERMISSION_KEY);
            setPermissionPreference(null);
            setSessionConsentGranted(false);
          }
        }
      } catch (error) {
        console.log('Error checking location permission:', error);
        if (!cancelled) {
          setShowLocationPrompt(true);
        }
      }
    }
    bootstrapLocationAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!route.params?.selectedLocation || !route.params?.locationType) {
      return;
    }
    if (route.params.locationType === 'source') {
      setSourceLocation(route.params.selectedLocation);
    } else if (route.params.locationType === 'destination') {
      setDestinationLocation(route.params.selectedLocation);
    }
    navigation.setParams({ selectedLocation: undefined, locationType: undefined });
  }, [navigation, route.params?.selectedLocation, route.params?.locationType]);

  useEffect(() => {
    async function hydrateRouteFromStorage() {
      const stored = await loadGlobalRoute();
      if (!stored) {
        return;
      }
      if (stored.source && !sourceLocation) {
        setSourceLocation(stored.source);
      }
      if (stored.destination && !destinationLocation) {
        setDestinationLocation(stored.destination);
      }
    }
    hydrateRouteFromStorage();
  }, []);

  useEffect(() => {
    saveGlobalRoute(sourceLocation, destinationLocation);
  }, [sourceLocation, destinationLocation]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      async function hydrateThreads() {
        try {
          const stored = await AsyncStorage.getItem('chat_threads');
          if (!mounted) {
            return;
          }
          setChatThreads(stored ? JSON.parse(stored) : []);
        } catch (error) {
          console.log('Failed to load chat threads', error);
        }
      }
      hydrateThreads();
      return () => {
        mounted = false;
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      async function hydrateRecentTrips() {
        try {
          const stored = await getStoredRides();
          const base = Array.isArray(stored) ? stored : [];
          const mapped = base.map((item, index) => normalizeTripFromApi(item, index));
          if (!mounted) {
            return;
          }
          setRecentHistory(mapped);
        } catch (error) {
          if (!mounted) {
            return;
          }
          setRecentHistory([]);
        }
      }
      hydrateRecentTrips();
      return () => {
        mounted = false;
      };
    }, []),
  );

  function formatRelativeTime(timestamp) {
    if (!timestamp) {
      return '';
    }
    const now = new Date();
    const then = new Date(timestamp);
    const diffMinutes = Math.floor((now - then) / (1000 * 60));
    if (diffMinutes < 1) {
      return 'Just now';
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  async function ensureServicesEnabled() {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          'Turn on Location Services',
          'Please enable device location services to fetch your current spot.',
        );
      }
      return enabled;
    } catch (error) {
      console.log('Service check error:', error);
      return false;
    }
  }

  async function hydrateLocation() {
    try {
      const servicesEnabled = await ensureServicesEnabled();
      if (!servicesEnabled) {
        return null;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      const [place] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setUserCity(place?.city || 'Unknown city');
      return location;
    } catch (error) {
      console.log('Error fetching current location:', error);
      Alert.alert('Unable to fetch location', 'Double-check that permissions are granted and try again.');
      return null;
    }
  }

  async function requestLocationPermission(rememberChoice = true) {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasLocationPermission(granted);
      setShowLocationPrompt(!granted);
      if (granted) {
        if (rememberChoice) {
          await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
          setPermissionPreference('true');
        } else {
          await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, 'ask_every_time');
          setPermissionPreference('ask_every_time');
        }
        setSessionConsentGranted(true);
        setShowLocationPrompt(false);
        await hydrateLocation();
      } else {
        await AsyncStorage.removeItem(LOCATION_PERMISSION_KEY);
        setPermissionPreference(null);
        setSessionConsentGranted(false);
      }
      return granted;
    } catch (error) {
      console.log('Error requesting location permission:', error);
      return false;
    }
  }

  async function ensureLocationReady() {
    if (!hasLocationPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        return false;
      }
    }
    const servicesEnabled = await ensureServicesEnabled();
    if (!servicesEnabled) {
      return false;
    }
    if (!userLocation) {
      const location = await hydrateLocation();
      if (!location) {
        return false;
      }
    }
    return true;
  }

  async function handleRefresh() {
    setRefreshing(true);
    if (hasLocationPermission) {
      await hydrateLocation();
    }
    setRefreshing(false);
  }

  function handleOfferRide() {
    navigation.navigate('OfferRide', {
      source: sourceLocation,
      destination: destinationLocation,
      currentUser,
    });
  }

  function handleSourceSelect() {
    navigation.navigate('LocationPicker', {
      tripType: 'find',
      locationType: 'source',
      returnScreen: 'Home',
    });
  }

  function handleDestinationSelect() {
    navigation.navigate('LocationPicker', {
      tripType: 'find',
      locationType: 'destination',
      returnScreen: 'Home',
    });
  }

  function handleOpenThread(thread) {
    navigation.navigate('Chat', {
      matchId: thread.matchId,
      contact: thread.contact,
    });
  }

  function handleFindRide() {
    if (!sourceLocation || !destinationLocation) {
      Alert.alert('Route required', 'Please select both pickup and destination to find matching rides.');
      return;
    }

    navigation.navigate('Matches', {
      tripType: 'find',
      city: null,
      userLocation: null,
      source: sourceLocation,
      destination: destinationLocation,
      viewerRole: 'seeker',
      currentUser,
    });
  }

  async function handleAllowLocation() {
    const granted = await requestLocationPermission(true);
    if (!granted) {
      setShowLocationPrompt(true);
    }
  }

  async function handleAskEveryTimePermission() {
    const granted = await requestLocationPermission(false);
    if (!granted) {
      setShowLocationPrompt(true);
    }
  }

  function handleDenyLocation() {
    setShowLocationPrompt(false);
    setSessionConsentGranted(false);
  }

  function openManualMode(type, currentAddress) {
    setManualEntry({ type, value: currentAddress || '', loading: false });
  }

  function closeManualMode() {
    setManualEntry({ type: null, value: '', loading: false });
  }

  function handleManualChange(text) {
    setManualEntry((prev) => ({ ...prev, value: text }));
  }

  async function handleManualSubmit() {
    const value = manualEntry.value.trim();
    if (value.length < 3) {
      Alert.alert('Location too short', 'Please type at least 3 characters for the address.');
      return;
    }
    setManualEntry((prev) => ({ ...prev, loading: true }));
    try {
      const results = await Location.geocodeAsync(value);
      if (!results || results.length === 0) {
        Alert.alert('Location not found', 'Try adding a nearby landmark or city name.');
        setManualEntry((prev) => ({ ...prev, loading: false }));
        return;
      }
      const { latitude, longitude } = results[0];
      const locationData = { latitude, longitude, address: value };
      if (manualEntry.type === 'source') {
        setSourceLocation(locationData);
      } else {
        setDestinationLocation(locationData);
      }
      closeManualMode();
    } catch (error) {
      console.log('Manual geocode error:', error);
      Alert.alert('Location error', 'Unable to find this place. Check your connection and try again.');
      setManualEntry((prev) => ({ ...prev, loading: false }));
    }
  }

  function handleViewAllTrips() {
    navigation.navigate('TripHistory');
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <View style={[styles.header, { paddingHorizontal: Math.min(24, width * 0.06) }]}>
        <View>
          <Text style={[styles.userName, { color: theme.textPrimary }]}>{userName}</Text>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            {userCity ? `In ${userCity}` : 'Ready for your next ride?'}
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications', { user: currentUser })}
            accessibilityRole="button"
            accessibilityLabel="View notifications"
          >
            <Bell size={24} color={theme.textPrimary} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.chatIconButton, messagesExpanded && styles.chatIconActive]}
            onPress={() => setMessagesExpanded(true)}
            accessibilityRole="button"
            accessibilityLabel="Open your chats"
          >
            <MessageSquare size={24} color={theme.textPrimary} />
            {visibleThreads.length > 0 && <View style={[styles.chatIndicator, { backgroundColor: theme.highlight }]} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
            <User size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingHorizontal: Math.min(24, width * 0.06),
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.textPrimary} />
        }
      >
        <LocationSelector
          theme={theme}
<<<<<<< HEAD
=======
          styles={styles}
>>>>>>> aditya mule delay zala ahe sagla
          sourceLocation={sourceLocation}
          destinationLocation={destinationLocation}
          onSelectSource={handleSourceSelect}
          onSelectDestination={handleDestinationSelect}
          manualEntry={manualEntry}
          onManualToggle={(type, current) => openManualMode(type, current)}
          onManualChange={handleManualChange}
          onManualSubmit={handleManualSubmit}
          onManualCancel={closeManualMode}
        />
<<<<<<< HEAD
        <QuickActionsSection theme={theme} onOfferRide={handleOfferRide} onFindRide={handleFindRide} />
        <RecentTripsSection theme={theme} trips={homeRecentTrips} onViewAll={handleViewAllTrips} />
      </ScrollView>
      <LocationPermissionOverlay
        theme={theme}
=======
        <QuickActionsSection theme={theme} styles={styles} onOfferRide={handleOfferRide} onFindRide={handleFindRide} />
        <RecentTripsSection theme={theme} styles={styles} trips={homeRecentTrips} onViewAll={handleViewAllTrips} />
      </ScrollView>
      <LocationPermissionOverlay
        theme={theme}
        styles={styles}
>>>>>>> aditya mule delay zala ahe sagla
        visible={showLocationPrompt}
        onAllow={handleAllowLocation}
        onAskEveryTime={handleAskEveryTimePermission}
        onDismiss={handleDenyLocation}
      />
      <MessagesOverlay
        theme={theme}
<<<<<<< HEAD
=======
        styles={styles}
>>>>>>> aditya mule delay zala ahe sagla
        visible={messagesExpanded}
        threads={visibleThreads}
        currentThread={currentThread}
        formatTime={formatRelativeTime}
        onClose={() => setMessagesExpanded(false)}
        onOpenThread={handleOpenThread}
      />
    </SafeAreaView>
  );
}

function LocationSelector({
  theme,
<<<<<<< HEAD
=======
  styles,
>>>>>>> aditya mule delay zala ahe sagla
  sourceLocation,
  destinationLocation,
  onSelectSource,
  onSelectDestination,
  manualEntry,
  onManualToggle,
  onManualChange,
  onManualSubmit,
  onManualCancel,
}) {
  function handleManualPress(action) {
    return (event) => {
      event.stopPropagation();
      action();
    };
  }

  return (
    <View style={[styles.locationSelector, { backgroundColor: theme.card }]}>
      <Text style={[styles.locationSelectorTitle, { color: theme.textPrimary }]}>Where are you going?</Text>
      <TouchableOpacity style={styles.locationInput} onPress={onSelectSource} activeOpacity={0.85}>
        <View style={[styles.locationDot, styles.locationDotSource]} />
        <View style={styles.locationInputContent}>
          <Text style={[styles.locationLabel, { color: theme.textSecondary }]}>Pickup Location</Text>
          {manualEntry.type === 'source' ? (
            <View style={styles.manualField}>
              <TextInput
                style={[styles.manualInlineInput, { color: theme.textPrimary }]}
                placeholder="Type pickup location"
                placeholderTextColor={theme.textSecondary}
                value={manualEntry.value}
                onChangeText={onManualChange}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={onManualSubmit}
              />
            </View>
          ) : (
            <Text style={[styles.locationValue, { color: theme.textPrimary }]}>
              {sourceLocation ? sourceLocation.address : 'Drop a pin or select'}
            </Text>
          )}
        </View>
        <View style={styles.locationActions}>
          {manualEntry.type !== 'source' && (
            <TouchableOpacity
              style={styles.locationManualChip}
              onPress={handleManualPress(() => onManualToggle('source', sourceLocation?.address))}
              activeOpacity={0.8}
            >
              <Text style={styles.locationManualChipText}>Manual</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.locationIconButton}
            onPress={handleManualPress(() => {
              if (manualEntry.type === 'source') {
                onManualCancel();
              }
              onSelectSource();
            })}
            activeOpacity={0.8}
          >
            <Navigation size={20} color={theme.accent} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      <View style={[styles.locationDivider, { backgroundColor: theme.divider }]} />
      <TouchableOpacity style={styles.locationInput} onPress={onSelectDestination} activeOpacity={0.85}>
        <View style={[styles.locationDot, styles.locationDotDestination]} />
        <View style={styles.locationInputContent}>
          <Text style={[styles.locationLabel, { color: theme.textSecondary }]}>Destination</Text>
          {manualEntry.type === 'destination' ? (
            <View style={styles.manualField}>
              <TextInput
                style={[styles.manualInlineInput, { color: theme.textPrimary }]}
                placeholder="Type destination"
                placeholderTextColor={theme.textSecondary}
                value={manualEntry.value}
                onChangeText={onManualChange}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={onManualSubmit}
              />
            </View>
          ) : (
            <Text style={[styles.locationValue, { color: theme.textPrimary }]}>
              {destinationLocation ? destinationLocation.address : 'Drop a pin or select'}
            </Text>
          )}
        </View>
        <View style={styles.locationActions}>
          {manualEntry.type !== 'destination' && (
            <TouchableOpacity
              style={styles.locationManualChip}
              onPress={handleManualPress(() => onManualToggle('destination', destinationLocation?.address))}
              activeOpacity={0.8}
            >
              <Text style={styles.locationManualChipText}>Manual</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.locationIconButton}
            onPress={handleManualPress(() => {
              if (manualEntry.type === 'destination') {
                onManualCancel();
              }
              onSelectDestination();
            })}
            activeOpacity={0.8}
          >
            <MapPin size={20} color={theme.critical} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

<<<<<<< HEAD
function MessagesOverlay({ theme, visible, threads, currentThread, formatTime, onClose, onOpenThread }) {
=======
function MessagesOverlay({ theme, styles, visible, threads, currentThread, formatTime, onClose, onOpenThread }) {
>>>>>>> aditya mule delay zala ahe sagla
  if (!visible) {
    return null;
  }
  return (
    <View style={styles.messagesOverlayScrim}>
      <TouchableOpacity style={styles.messagesOverlayBackdrop} onPress={onClose} activeOpacity={1} />
      <View style={[styles.messagesOverlayCard, { backgroundColor: theme.card }]}>
        <View style={styles.messagesOverlayHandle} />
        <View style={styles.messagesOverlayHeader}>
          <Text style={[styles.messagesOverlayTitle, { color: theme.textPrimary }]}>Chats</Text>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close chat list"
            activeOpacity={0.8}
          >
            <Text style={[styles.viewAllText, { color: theme.accent }]}>Close</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.messagesOverlayList}>
          {threads.length === 0 ? (
            <View style={styles.emptyOverlayState}>
              <Text style={[styles.emptyOverlayTitle, { color: theme.textPrimary }]}>No chats yet</Text>
              <Text style={[styles.emptyOverlayText, { color: theme.textSecondary }]}>
                Start a ride conversation and it will appear here.
              </Text>
            </View>
          ) : (
            threads.map((thread) => (
              <TouchableOpacity
                key={thread.matchId}
                style={styles.messageListItem}
                activeOpacity={0.85}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Open chat with ${thread.contact?.name || 'ride partner'}`}
                onPress={() => {
                  onOpenThread(thread);
                  onClose();
                }}
              >
                <View style={styles.messageListInfo}>
                  <View style={styles.messageListHeader}>
                    <Text style={[styles.messageListName, { color: theme.textPrimary }]}>
                      {thread.contact?.name || 'Partner'}
                    </Text>
                    <Text style={[styles.messageListMeta, { color: theme.textSecondary }]}>
                      {formatTime(thread.updatedAt)}
                    </Text>
                  </View>
                  <Text style={[styles.messageListRoute, { color: theme.textSecondary }]} numberOfLines={1}>
                    {thread.contact?.route || 'Ride partner'}
                  </Text>
                  <View style={styles.messageListPreviewRow}>
                    {currentThread && currentThread.matchId === thread.matchId && (
                      <View style={[styles.overlayLivePill, { backgroundColor: theme.highlight }]}>
                        <Text style={styles.overlayLiveText}>LIVE</Text>
                      </View>
                    )}
                    <Text style={[styles.messageListPreview, { color: theme.textPrimary }]} numberOfLines={1}>
                      {thread.lastMessage || 'Say hi'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

<<<<<<< HEAD
function QuickActionsSection({ theme, onOfferRide, onFindRide }) {
=======
function QuickActionsSection({ theme, styles, onOfferRide, onFindRide }) {
>>>>>>> aditya mule delay zala ahe sagla
  return (
    <View style={styles.quickActions}>
      <TouchableOpacity
        style={[
          styles.actionCard,
          styles.primaryAction,
          { backgroundColor: theme.surface, borderColor: theme.divider, borderWidth: 1 },
        ]}
        onPress={onOfferRide}
        activeOpacity={0.85}
      >
        <Car size={32} color={theme.surfaceText} />
        <Text style={[styles.actionTitle, { color: theme.surfaceText }]}>Offer a Ride</Text>
        <Text style={[styles.actionSubtitle, { color: theme.textSecondary }]}>Share your route</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionCard, styles.secondaryAction, { backgroundColor: theme.card }]}
        onPress={onFindRide}
        activeOpacity={0.85}
      >
        <MapPin size={32} color={theme.textPrimary} />
        <Text style={[styles.actionTitle, { color: theme.textPrimary }]}>Find a Ride</Text>
        <Text style={[styles.actionSubtitle, { color: theme.textSecondary }]}>Join nearby trips</Text>
      </TouchableOpacity>
    </View>
  );
}

<<<<<<< HEAD
function DashboardInsights({ theme, cards, onSelect }) {
=======
function DashboardInsights({ theme, styles, cards, onSelect }) {
>>>>>>> aditya mule delay zala ahe sagla
  if (!cards || cards.length === 0) {
    return null;
  }
  return (
    <View style={styles.insightsWrapper}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Today</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.insightsRow}>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[styles.insightCard, { backgroundColor: theme.card }]}
            activeOpacity={0.85}
            onPress={() => onSelect(card)}
          >
            <Text style={[styles.insightTitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {card.title}
            </Text>
            <Text style={[styles.insightValue, { color: theme.textPrimary }]}>{card.value}</Text>
            <Text style={[styles.insightCaption, { color: theme.textSecondary }]} numberOfLines={1}>
              {card.caption}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

<<<<<<< HEAD
function RecentTripsSection({ theme, trips, onViewAll }) {
=======
function RecentTripsSection({ theme, styles, trips, onViewAll }) {
>>>>>>> aditya mule delay zala ahe sagla
  return (
    <View style={styles.recentSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent Trips</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={[styles.viewAllText, { color: theme.accent }]}>View All</Text>
        </TouchableOpacity>
      </View>
      {trips.length === 0 ? (
        <View style={[styles.emptyStateCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            No trips yet. Plan one to see it here.
          </Text>
        </View>
      ) : (
        trips.map((trip) => (
          <TouchableOpacity key={trip.id} style={[styles.tripCard, { backgroundColor: theme.card }]} activeOpacity={0.85}>
            <View style={[styles.tripIcon, { backgroundColor: theme.secondaryCard }]}>
              <MapPin size={20} color={theme.textPrimary} />
            </View>
            <View style={styles.tripInfo}>
              <Text style={[styles.tripRoute, { color: theme.textPrimary }]}>
                {trip.from} → {trip.to}
              </Text>
              <Text style={[styles.tripTime, { color: theme.textSecondary }]}>{trip.time}</Text>
            </View>
            <View style={[styles.tripStatus, { backgroundColor: theme.accent }]}>
              <Text style={styles.tripStatusText}>{trip.status}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

<<<<<<< HEAD
function LocationPermissionOverlay({ theme, visible, onAllow, onAskEveryTime, onDismiss }) {
=======
function LocationPermissionOverlay({ theme, styles, visible, onAllow, onAskEveryTime, onDismiss }) {
>>>>>>> aditya mule delay zala ahe sagla
  if (!visible) {
    return null;
  }
  return (
    <View style={styles.overlay}>
      <View style={[styles.permissionSheet, { backgroundColor: theme.card }]}>
        <View style={[styles.permissionHandle, { backgroundColor: theme.divider }]} />
        <Text style={[styles.permissionSheetTitle, { color: theme.textPrimary }]}>Location access</Text>
        <View style={styles.permissionButtonGroup}>
          <TouchableOpacity
            style={[styles.permissionPill, styles.permissionPillPrimary, { backgroundColor: theme.accent }]}
            onPress={onAllow}
            activeOpacity={0.9}
          >
            <Text style={styles.permissionPillPrimaryText}>Always allow</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.permissionPill,
              styles.permissionPillSecondary,
              { borderColor: theme.divider },
            ]}
            onPress={onAskEveryTime}
            activeOpacity={0.9}
          >
            <Text style={[styles.permissionPillSecondaryText, { color: theme.textPrimary }]}>Ask every time</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.permissionGhostButton} onPress={onDismiss} activeOpacity={0.8}>
          <Text style={[styles.permissionGhostText, { color: theme.textSecondary }]}>Not now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

<<<<<<< HEAD
function ManualLocationOverlay({ theme, visible, value, error, loading, type, onChangeText, onSubmit, onDismiss }) {
=======
function ManualLocationOverlay({ theme, styles, visible, value, error, loading, type, onChangeText, onSubmit, onDismiss }) {
>>>>>>> aditya mule delay zala ahe sagla
  if (!visible) {
    return null;
  }
  return (
    <View style={styles.overlay}>
      <View style={[styles.manualModal, { backgroundColor: theme.card }]}>
        <Text style={[styles.manualTitle, { color: theme.textPrimary }]}>
          Enter {type === 'source' ? 'pickup' : 'destination'} location
        </Text>
        <TextInput
          style={[styles.manualInput, { borderColor: theme.divider, color: theme.textPrimary }]}
          placeholder="Type an address or landmark"
          placeholderTextColor={theme.textSecondary}
          value={value}
          onChangeText={onChangeText}
          autoFocus
        />
        {!!error && <Text style={styles.manualError}>{error}</Text>}
        <View style={styles.manualActions}>
          <TouchableOpacity style={[styles.popupButton, styles.cancelButton]} onPress={onDismiss} activeOpacity={0.85}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.popupButton, styles.allowButton]}
            onPress={onSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.allowButtonText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default HomeScreen;
