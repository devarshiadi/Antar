import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import {
  ArrowLeft,
  MapPin,
  Navigation2,
  Phone,
  MessageCircle,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';
import { locationService } from '../services/locationService';
import { useAppTheme } from '../helpers/use-app-theme';

const { width, height } = Dimensions.get('window');

// Leaflet map for active trip with route
const getTripMapHTML = (userLat, userLng, destLat, destLng, isDark) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { height: 100vh; width: 100vw; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${userLat}, ${userLng}], 13);
    
    L.tileLayer('${isDark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}', {
      maxZoom: 19
    }).addTo(map);

    // User marker (blue)
    var userMarker = L.circleMarker([${userLat}, ${userLng}], {
      color: '#4A90E2',
      fillColor: '#4A90E2',
      fillOpacity: 0.8,
      radius: 8,
      weight: 2
    }).addTo(map);

    // Destination marker (green)
    var destMarker = L.circleMarker([${destLat}, ${destLng}], {
      color: '#4CAF50',
      fillColor: '#4CAF50',
      fillOpacity: 0.8,
      radius: 8,
      weight: 2
    }).addTo(map);

    // Route line with curve
    var start = {lat: ${userLat}, lng: ${userLng}};
    var end = {lat: ${destLat}, lng: ${destLng}};
    
    var midLat = (start.lat + end.lat) / 2;
    var midLng = (start.lng + end.lng) / 2;
    var dx = end.lng - start.lng;
    var dy = end.lat - start.lat;
    var dist = Math.sqrt(dx*dx + dy*dy);
    var offset = dist * 0.15;
    var offsetLat = midLat - offset * dx / dist;
    var offsetLng = midLng + offset * dy / dist;
    
    var routeLine = L.polyline([
      [start.lat, start.lng],
      [offsetLat, offsetLng],
      [end.lat, end.lng]
    ], {
      color: '#4A90E2',
      weight: 4,
      opacity: 0.8,
      smoothFactor: 3
    }).addTo(map);

    // Fit bounds to show both markers
    map.fitBounds([[${userLat}, ${userLng}], [${destLat}, ${destLng}]], { padding: [50, 50] });

    window.updateUserLocation = function(lat, lng) {
      userMarker.setLatLng([lat, lng]);
      
      // Recalculate curved path
      var newStart = {lat: lat, lng: lng};
      var newEnd = {lat: ${destLat}, lng: ${destLng}};
      var newMidLat = (newStart.lat + newEnd.lat) / 2;
      var newMidLng = (newStart.lng + newEnd.lng) / 2;
      var newDx = newEnd.lng - newStart.lng;
      var newDy = newEnd.lat - newStart.lat;
      var newDist = Math.sqrt(newDx*newDx + newDy*newDy);
      var newOffset = newDist * 0.15;
      var newOffsetLat = newMidLat - newOffset * newDx / newDist;
      var newOffsetLng = newMidLng + newOffset * newDy / newDist;
      
      routeLine.setLatLngs([
        [newStart.lat, newStart.lng],
        [newOffsetLat, newOffsetLng],
        [newEnd.lat, newEnd.lng]
      ]);
    };
  </script>
</body>
</html>
`;

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.primary,
    },
    mapContainer: {
      height: height * 0.45,
      backgroundColor: colors.bg.secondary,
      position: 'relative',
    },
    map: {
      flex: 1,
    },
    mapLoadingContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bg.secondary,
    },
    liveIndicator: {
      position: 'absolute',
      top: 20,
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(244, 67, 54, 0.9)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    livePulse: {
      position: 'absolute',
      left: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.text.primary,
      marginRight: 6,
    },
    liveText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    backButton: {
      position: 'absolute',
      top: 20,
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoCard: {
      flex: 1,
      backgroundColor: colors.bg.primary,
    },
    statusBanner: {
      padding: 16,
      alignItems: 'center',
    },
    statusTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    statusSubtitle: {
      fontSize: 14,
      color: colors.text.primary,
      marginTop: 4,
      opacity: 0.9,
    },
    routeContainer: {
      padding: 20,
      backgroundColor: colors.bg.card,
      marginHorizontal: 20,
      marginTop: 15,
      borderRadius: 16,
    },
    routePoint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    routeDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#2196F3',
      marginTop: 2,
    },
    routeLine: {
      width: 2,
      height: 30,
      backgroundColor: colors.border.strong,
      marginLeft: 7,
      marginVertical: 5,
    },
    routeInfo: {
      marginLeft: 12,
      flex: 1,
    },
    routeLabel: {
      fontSize: 12,
      color: colors.text.secondary,
      marginBottom: 4,
    },
    routeAddress: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
    },
    driverCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.card,
      marginHorizontal: 20,
      marginTop: 15,
      padding: 16,
      borderRadius: 16,
    },
    driverAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.bg.elevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    driverInfo: {
      flex: 1,
      marginLeft: 12,
    },
    driverName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    driverVehicle: {
      fontSize: 13,
      color: colors.text.secondary,
      marginTop: 4,
    },
    driverRating: {
      marginTop: 4,
    },
    ratingText: {
      fontSize: 13,
      color: '#FFC107',
      fontWeight: '600',
    },
    driverActions: {
      flexDirection: 'row',
      gap: 10,
    },
    actionButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.bg.elevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    detailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailText: {
      fontSize: 14,
      color: colors.text.secondary,
      fontWeight: '500',
    },
    fareText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#4CAF50',
    },
    actionsContainer: {
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.button.primaryBg,
      paddingVertical: 16,
      borderRadius: 12,
      marginBottom: 12,
      gap: 10,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.button.primaryText,
    },
    completeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.button.primaryBg,
      paddingVertical: 16,
      borderRadius: 12,
      marginBottom: 12,
      gap: 10,
    },
    completeButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.button.primaryText,
    },
    sosButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.state.error,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 10,
    },
    sosText: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
  });
}

const ActiveTripScreen = ({ navigation, route }) => {
  const { colors, statusBarStyle, isDark } = useAppTheme();
  const webViewRef = useRef(null);
  const unsubscribeTrackingRef = useRef(null);
  const [tripStatus, setTripStatus] = useState('starting');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const eta = route && route.params && route.params.eta !== undefined && route.params.eta !== null ? route.params.eta : 12;
  const styles = useMemo(function () {
    return getStyles(colors);
  }, [colors]);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Pulse animation for live indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Initialize location tracking
    initLocation();

    return () => {
      if (unsubscribeTrackingRef.current) {
        unsubscribeTrackingRef.current();
        unsubscribeTrackingRef.current = null;
      }
    };
  }, []);

  const initLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);

      // Start live tracking
      const unsubscribe = await locationService.startTracking((newLocation) => {
        setCurrentLocation(newLocation);
        
        // Update map
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            window.updateUserLocation(${newLocation.latitude}, ${newLocation.longitude});
          `);
        }
      }, true);
      unsubscribeTrackingRef.current = typeof unsubscribe === 'function' ? unsubscribe : null;
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const trip = {
    id: 'A12C3B',
    driver: {
      name: 'Rajesh Kumar',
      rating: 4.8,
      phone: '+91 98765 43210',
      vehicle: 'Honda City (KA01AB1234)',
    },
    route: {
      pickup: 'MG Road Metro Station',
      destination: {
        address: 'Whitefield, Bangalore',
        lat: 12.9698,
        lng: 77.7499,
      },
    },
    fare: 120,
    distance: '12 km',
  };

  const getStatusInfo = () => {
    switch (tripStatus) {
      case 'pickup':
        return {
          title: 'Driver Coming to Pick You Up',
          subtitle: 'Arriving in 5 minutes',
          color: '#FFC107',
        };
      case 'in_progress':
        return {
          title: 'Trip in Progress',
          subtitle: `${eta} mins to destination`,
          color: '#4CAF50',
        };
      case 'arriving':
        return {
          title: 'Arriving at Destination',
          subtitle: 'Almost there!',
          color: '#2196F3',
        };
      default:
        return { title: '', subtitle: '', color: colors.bg.elevated };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />
      
      {/* Leaflet Map */}
      <View style={styles.mapContainer}>
        {currentLocation && (
          <WebView
            ref={webViewRef}
            source={{ 
              html: getTripMapHTML(
                currentLocation.latitude,
                currentLocation.longitude,
                trip.route.destination.lat,
                trip.route.destination.lng,
                isDark
              ) 
            }}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.mapLoadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
              </View>
            )}
          />
        )}

        {/* Live Indicator */}
        <View style={styles.liveIndicator}>
          <Animated.View 
            style={[
              styles.livePulse,
              { transform: [{ scale: pulseAnim }] }
            ]} 
          />
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Trip Info Card */}
      <View style={styles.infoCard}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusInfo.color }]}>
          <Text style={styles.statusTitle}>{statusInfo.title}</Text>
          <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
        </View>

        {/* Route Info */}
        <View style={styles.routeContainer}>
          <View style={styles.routePoint}>
            <View style={styles.routeDot} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeAddress}>{trip.route.pickup}</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routePoint}>
            <Navigation2 size={16} color="#4CAF50" />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>Destination</Text>
              <Text style={styles.routeAddress}>{trip.route.destination.address}</Text>
            </View>
          </View>
        </View>

        {/* Driver Info */}
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <User size={32} color={colors.text.primary} />
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{trip.driver.name}</Text>
            <Text style={styles.driverVehicle}>{trip.driver.vehicle}</Text>
            <View style={styles.driverRating}>
              <Text style={styles.ratingText}>⭐ {trip.driver.rating}</Text>
            </View>
          </View>
          <View style={styles.driverActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Phone size={22} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MessageCircle size={22} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Clock size={18} color={colors.text.secondary} />
            <Text style={styles.detailText}>{eta} mins</Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin size={18} color={colors.text.secondary} />
            <Text style={styles.detailText}>{trip.distance}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.fareText}>₹{trip.fare}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {tripStatus === 'pickup' && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => setTripStatus('in_progress')}
            >
              <CheckCircle size={22} color={colors.button.primaryText} />
              <Text style={styles.primaryButtonText}>Confirm Pickup</Text>
            </TouchableOpacity>
          )}

          {tripStatus === 'in_progress' && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => setTripStatus('arriving')}
            >
              <Navigation2 size={22} color={colors.button.primaryText} />
              <Text style={styles.primaryButtonText}>Track Location</Text>
            </TouchableOpacity>
          )}

          {tripStatus === 'arriving' && (
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={() => console.log('Complete trip')}
            >
              <CheckCircle size={22} color={colors.button.primaryText} />
              <Text style={styles.completeButtonText}>Complete Trip</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.sosButton}>
            <AlertCircle size={22} color={colors.text.primary} />
            <Text style={styles.sosText}>SOS Emergency</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ActiveTripScreen;
