import React, { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MapPin,
  Car,
  User,
  Bell,
  Clock,
  TrendingUp,
  Menu,
  Navigation,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [showLocationPermission, setShowLocationPermission] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [userCity, setUserCity] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState('rider'); // 'rider' or 'passenger'
  const [sourceLocation, setSourceLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null)

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleOfferRide = () => {
    navigation.navigate('LocationPicker', {
      tripType: 'offer',
    });
  };

  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation(location);
          
          // Reverse geocode to get city name
          const [place] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          setUserCity(place.city || 'Unknown City');
          setShowLocationPermission(false);
        }
      } catch (error) {
        console.log('Error checking location permission:', error);
      }
    };
    
    checkLocationPermission();
  }, []);

  const handleFindRide = () => {
    if (sourceLocation && destinationLocation) {
      navigation.navigate('Matches', { 
        city: userCity,
        source: sourceLocation,
        destination: destinationLocation 
      });
    } else {
      Alert.alert(
        'Select Locations',
        'Please select both pickup and destination locations to find a ride.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSourceSelect = () => {
    navigation.navigate('LocationPicker', {
      tripType: 'find',
      locationType: 'source',
      currentLocation: sourceLocation,
      onLocationSelected: (location) => {
        setSourceLocation(location);
      }
    });
  };

  const handleDestinationSelect = () => {
    navigation.navigate('LocationPicker', {
      tripType: 'find',
      locationType: 'destination',
      currentLocation: destinationLocation,
      onLocationSelected: (location) => {
        setDestinationLocation(location);
      }
    });
  };
  
  const handleAllowLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        
        // Reverse geocode to get city name
        const [place] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setUserCity(place.city || 'Unknown City');
        setShowLocationPermission(false);
      } else {
        console.log('Location permission denied');
        setShowLocationPermission(false);
      }
    } catch (error) {
      console.log('Error requesting location permission:', error);
      setShowLocationPermission(false);
    }
  };
  
  const handleDenyLocation = () => {
    setShowLocationPermission(false);
  };

  const stats = {
    tripsCompleted: 12,
    rating: 4.8,
    savedMoney: 450,
  };

  const recentTrips = [
    { id: 1, from: 'MG Road', to: 'Koramangala', time: '2 hours ago', status: 'completed' },
    { id: 2, from: 'Whitefield', to: 'Indiranagar', time: '5 hours ago', status: 'completed' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello 👋</Text>
          <Text style={styles.userName}>Devendra</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={24} color="#fff" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <User size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* Source & Destination Selector */}
        <View style={styles.locationSelector}>
          <Text style={styles.locationSelectorTitle}>Where are you going?</Text>
          
          {/* Source Input */}
          <TouchableOpacity 
            style={styles.locationInput}
            onPress={handleSourceSelect}
            activeOpacity={0.7}
          >
            <View style={[styles.locationDot, styles.locationDotSource]} />
            <View style={styles.locationInputContent}>
              <Text style={styles.locationLabel}>Pickup Location</Text>
              <Text style={styles.locationValue}>
                {sourceLocation ? sourceLocation.address : 'Select pickup point'}
              </Text>
            </View>
            <Navigation size={20} color="#4CAF50" />
          </TouchableOpacity>

          {/* Divider Line */}
          <View style={styles.locationDivider} />

          {/* Destination Input */}
          <TouchableOpacity 
            style={styles.locationInput}
            onPress={handleDestinationSelect}
            activeOpacity={0.7}
          >
            <View style={[styles.locationDot, styles.locationDotDestination]} />
            <View style={styles.locationInputContent}>
              <Text style={styles.locationLabel}>Destination</Text>
              <Text style={styles.locationValue}>
                {destinationLocation ? destinationLocation.address : 'Select destination'}
              </Text>
            </View>
            <MapPin size={20} color="#F44336" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionCard, styles.primaryAction]}
            onPress={handleOfferRide}
          >
            <Car size={32} color="#000" />
            <Text style={styles.actionTitle}>Offer a Ride</Text>
            <Text style={styles.actionSubtitle}>Share your journey</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, styles.secondaryAction]}
            onPress={handleFindRide}
          >
            <MapPin size={32} color="#fff" />
            <Text style={[styles.actionTitle, { color: '#fff' }]}>Find a Ride</Text>
            <Text style={[styles.actionSubtitle, { color: '#ccc' }]}>Join a ride</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Clock size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{stats.tripsCompleted}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#FFC107" />
            <Text style={styles.statValue}>{stats.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Car size={24} color="#2196F3" />
            <Text style={styles.statValue}>₹{stats.savedMoney}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>


        {/* Recent Trips */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Trips</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TripHistory')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentTrips.map((trip) => (
            <TouchableOpacity key={trip.id} style={styles.tripCard}>
              <View style={styles.tripIcon}>
                <MapPin size={20} color="#fff" />
              </View>
              <View style={styles.tripInfo}>
                <Text style={styles.tripRoute}>{trip.from} → {trip.to}</Text>
                <Text style={styles.tripTime}>{trip.time}</Text>
              </View>
              <View style={styles.tripStatus}>
                <Text style={styles.tripStatusText}>{trip.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Location Permission Popup */}
      {showLocationPermission && (
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>Enable Location Services</Text>
            <Text style={styles.popupText}>
              To find the best ride matches in your area, we need access to your location.
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.popupButton, styles.cancelButton]} 
                onPress={handleDenyLocation}
              >
                <Text style={styles.cancelButtonText}>Not Now</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.popupButton, styles.allowButton]} 
                onPress={handleAllowLocation}
              >
                <Text style={styles.allowButtonText}>Allow</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Popup Styles
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popup: {
    width: '85%',
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  popupTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  popupText: {
    color: '#aaa',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  popupButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  allowButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  allowButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  greeting: {
    fontSize: 16,
    color: '#888',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#f00',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
    marginBottom: 25,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: '#fff',
  },
  secondaryAction: {
    backgroundColor: '#333',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 12,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    padding: 18,
    borderRadius: 12,
    marginBottom: 24,
  },
  mapButtonContent: {
    marginLeft: 16,
    flex: 1,
  },
  mapButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  mapButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  roleSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  roleToggle: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: '#fff',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  roleButtonTextActive: {
    color: '#000',
  },
  recentSection: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  tripIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  tripTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  tripStatus: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tripStatusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  matchesSection: {
    marginBottom: 30,
  },
  matchesCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 18,
    borderRadius: 12,
  },
  matchesContent: {
    flex: 1,
  },
  matchesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  matchesSubtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  matchesBadge: {
    backgroundColor: '#4CAF50',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchesBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Location Selector Styles
  locationSelector: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  locationSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 56, // Thumb-friendly touch target
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  locationDotSource: {
    backgroundColor: '#4CAF50',
  },
  locationDotDestination: {
    backgroundColor: '#F44336',
  },
  locationInputContent: {
    flex: 1,
    marginRight: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  locationDivider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginLeft: 24,
    marginVertical: 4,
  },
});

export default HomeScreen;
