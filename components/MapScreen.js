import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import {
  ArrowLeft,
  Navigation,
  MapPin,
  Locate,
  User,
} from 'lucide-react-native';
import locationService from '../services/locationService';

const { width, height } = Dimensions.get('window');

// Leaflet map HTML template
const getLeafletHTML = (lat, lng, tracking) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { height: 100vh; width: 100vw; }
    .custom-marker {
      background: radial-gradient(circle, rgba(74,144,226,0.4) 0%, rgba(74,144,226,0.1) 70%);
      border: 3px solid #4A90E2;
      border-radius: 50%;
      width: 24px;
      height: 24px;
    }
    .custom-marker::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 12px;
      height: 12px;
      background: #4A90E2;
      border-radius: 50%;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // Initialize map
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([${lat}, ${lng}], 15);

    // Dark theme tile layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    // Current location marker
    var currentMarker = L.circleMarker([${lat}, ${lng}], {
      color: '#4A90E2',
      fillColor: '#4A90E2',
      fillOpacity: 0.7,
      radius: 10,
      weight: 3
    }).addTo(map);

    // Accuracy circle
    var accuracyCircle = L.circle([${lat}, ${lng}], {
      color: '#4A90E2',
      fillColor: '#4A90E2',
      fillOpacity: 0.1,
      radius: 50,
      weight: 1
    }).addTo(map);

    // Listen for location updates from React Native
    window.updateLocation = function(lat, lng, accuracy) {
      currentMarker.setLatLng([lat, lng]);
      accuracyCircle.setLatLng([lat, lng]);
      if (accuracy) {
        accuracyCircle.setRadius(accuracy);
      }
      if (${tracking}) {
        map.panTo([lat, lng]);
      }
    };

    // Center map function
    window.centerMap = function(lat, lng) {
      map.setView([lat, lng], 15, { animate: true });
    };

    // Add marker function
    window.addMarker = function(lat, lng, title) {
      L.marker([lat, lng]).addTo(map).bindPopup(title);
    };
  </script>
</body>
</html>
`;

const MapScreen = ({ navigation, route }) => {
  const webViewRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    initializeLocation();
    return () => {
      if (tracking) {
        locationService.stopTracking();
      }
    };
  }, []);

  const initializeLocation = async () => {
    try {
      const permissions = await locationService.hasPermissions();
      
      if (!permissions.foreground) {
        const granted = await requestLocationPermission();
        if (!granted) return;
      }

      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      setLoading(false);
    } catch (error) {
      console.error('Location init error:', error);
      Alert.alert('Error', 'Failed to get your location');
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const result = await locationService.requestPermissions();
      return result.foreground;
    } catch (error) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location services to use this feature'
      );
      return false;
    }
  };

  const startLiveTracking = () => {
    if (tracking) {
      locationService.stopTracking();
      setTracking(false);
    } else {
      locationService.startTracking((location) => {
        setCurrentLocation(location);
        
        // Update map marker
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            window.updateLocation(${location.latitude}, ${location.longitude}, ${location.accuracy || 50});
          `);
        }
      }, false);
      
      setTracking(true);
    }
  };

  const centerOnCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          window.centerMap(${location.latitude}, ${location.longitude});
        `);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get your location');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Map</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Leaflet Map */}
      {currentLocation && (
        <WebView
          ref={webViewRef}
          source={{ html: getLeafletHTML(currentLocation.latitude, currentLocation.longitude, tracking) }}
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

      {/* Controls */}
      <View style={styles.controls}>
        {/* Location Info Card */}
        {currentLocation && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MapPin size={18} color="#fff" />
              <Text style={styles.infoText}>
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
            {currentLocation.speed && (
              <View style={styles.infoRow}>
                <Navigation size={18} color="#fff" />
                <Text style={styles.infoText}>
                  {(currentLocation.speed * 3.6).toFixed(1)} km/h
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, tracking && styles.actionButtonActive]}
            onPress={startLiveTracking}
          >
            <Navigation size={24} color={tracking ? '#000' : '#fff'} />
            <Text style={[styles.actionButtonText, tracking && styles.actionButtonTextActive]}>
              {tracking ? 'Stop' : 'Track'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={centerOnCurrentLocation}
          >
            <Locate size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Center</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#000',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  map: {
    flex: 1,
  },
  mapLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 12,
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
  },
  actionButtonActive: {
    backgroundColor: '#fff',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonTextActive: {
    color: '#000',
  },
});

export default MapScreen;
