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
  MapPin,
  Check,
  Locate,
  Navigation,
} from 'lucide-react-native';
import locationService from '../services/locationService';

const { width, height } = Dimensions.get('window');

// Leaflet map with dual pin capability (source + destination)
const getDualPickerMapHTML = (lat, lng) => `
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
    var map = L.map('map').setView([${lat}, ${lng}], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    // Current location marker (blue)
    var currentMarker = L.circleMarker([${lat}, ${lng}], {
      color: '#4A90E2',
      fillColor: '#4A90E2',
      fillOpacity: 0.7,
      radius: 8,
      weight: 2
    }).addTo(map).bindPopup('Your location');

    // Pickup marker (green)
    var pickupMarker = null;
    var pickupIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDBDOS4zNzI1OCAwIDQgNS4zNzI1OCA0IDEyQzQgMjEgMTYgMzYgMTYgMzZDMTYgMzYgMjggMjEgMjggMTJDMjggNS4zNzI1OCAyMi42Mjc0IDAgMTYgMFpNMTYgMTZDMTMuNzkwOSAxNiAxMiAxNC4yMDkxIDEyIDEyQzEyIDkuNzkwODYgMTMuNzkwOSA4IDE2IDhDMTguMjA5MSA4IDIwIDkuNzkwODYgMjAgMTJDMjAgMTQuMjA5MSAxOC4yMDkxIDE2IDE2IDE2WiIgZmlsbD0iIzRDQUY1MCIvPgo8L3N2Zz4K',
      iconSize: [32, 48],
      iconAnchor: [16, 48],
      popupAnchor: [0, -48]
    });

    // Destination marker (red)
    var destMarker = null;
    var destIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDBDOS4zNzI1OCAwIDQgNS4zNzI1OCA0IDEyQzQgMjEgMTYgMzYgMTYgMzZDMTYgMzYgMjggMjEgMjggMTJDMjggNS4zNzI1OCAyMi42Mjc0IDAgMTYgMFpNMTYgMTZDMTMuNzkwOSAxNiAxMiAxNC4yMDkxIDEyIDEyQzEyIDkuNzkwODYgMTMuNzkwOSA4IDE2IDhDMTguMjA5MSA4IDIwIDkuNzkwODYgMjAgMTJDMjAgMTQuMjA5MSAxOC4yMDkxIDE2IDE2IDE2WiIgZmlsbD0iI0Y0NDMzNiIvPgo8L3N2Zz4K',
      iconSize: [32, 48],
      iconAnchor: [16, 48],
      popupAnchor: [0, -48]
    });

    // Route line
    var routeLine = null;

    // Add click event to map - first tap = pickup, second tap = destination
    map.on('click', function(e) {
      if (!pickupMarker) {
        // First tap - set pickup location
        pickupMarker = L.marker([e.latlng.lat, e.latlng.lng], {icon: pickupIcon})
          .addTo(map)
          .bindPopup('Pickup Location')
          .openPopup();
        
        // Notify React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'pickup_selected',
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        }));
      } else if (!destMarker) {
        // Second tap - set destination location
        destMarker = L.marker([e.latlng.lat, e.latlng.lng], {icon: destIcon})
          .addTo(map)
          .bindPopup('Destination')
          .openPopup();
        
        // Draw curved route line
        if (routeLine) {
          map.removeLayer(routeLine);
        }
        
        // Create a curved path with a midpoint offset
        var start = pickupMarker.getLatLng();
        var end = destMarker.getLatLng();
        
        // Calculate midpoint
        var midLat = (start.lat + end.lat) / 2;
        var midLng = (start.lng + end.lng) / 2;
        
        // Offset the midpoint perpendicular to the line
        var dx = end.lng - start.lng;
        var dy = end.lat - start.lat;
        var dist = Math.sqrt(dx*dx + dy*dy);
        var offset = dist * 0.15; // 15% offset for curve
        
        // Perpendicular offset
        var offsetLat = midLat - offset * dx / dist;
        var offsetLng = midLng + offset * dy / dist;
        
        // Create smooth curve through 3 points
        routeLine = L.polyline([
          start,
          [offsetLat, offsetLng],
          end
        ], {
          color: '#4A90E2',
          weight: 4,
          opacity: 0.8,
          smoothFactor: 3
        }).addTo(map);
        
        // Fit bounds to show both markers
        map.fitBounds([pickupMarker.getLatLng(), destMarker.getLatLng()], {padding: [50, 50]});
        
        // Notify React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'destination_selected',
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        }));
      } else {
        // Both already set - reset and start over
        map.removeLayer(pickupMarker);
        map.removeLayer(destMarker);
        if (routeLine) map.removeLayer(routeLine);
        
        pickupMarker = null;
        destMarker = null;
        routeLine = null;
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'reset'
        }));
      }
    });

    // Center on current location
    window.centerOnUser = function() {
      map.setView([${lat}, ${lng}], 13, { animate: true });
    };
  </script>
</body>
</html>
`;

const LocationPickerScreen = ({ navigation, route }) => {
  const webViewRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destLocation, setDestLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const { tripType = 'offer' } = route.params || {};

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const permissions = await locationService.hasPermissions();
      
      if (!permissions.foreground) {
        const granted = await locationService.requestPermissions();
        if (!granted.foreground) {
          Alert.alert('Permission Required', 'Location permission needed');
          navigation.goBack();
          return;
        }
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

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'pickup_selected') {
        setPickupLocation({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      } else if (data.type === 'destination_selected') {
        setDestLocation({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      } else if (data.type === 'reset') {
        setPickupLocation(null);
        setDestLocation(null);
      }
    } catch (error) {
      console.error('WebView message error:', error);
    }
  };

  const handleConfirmLocation = async () => {
    if (!pickupLocation || !destLocation) {
      Alert.alert('Error', 'Please select both pickup and destination locations');
      return;
    }

    // Get addresses from coordinates
    const pickupAddress = await locationService.getAddressFromCoords(
      pickupLocation.latitude,
      pickupLocation.longitude
    );
    
    const destAddress = await locationService.getAddressFromCoords(
      destLocation.latitude,
      destLocation.longitude
    );

    const locationsData = {
      pickup: {
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
        address: pickupAddress?.formatted || `${pickupLocation.latitude.toFixed(4)}, ${pickupLocation.longitude.toFixed(4)}`,
      },
      destination: {
        latitude: destLocation.latitude,
        longitude: destLocation.longitude,
        address: destAddress?.formatted || `${destLocation.latitude.toFixed(4)}, ${destLocation.longitude.toFixed(4)}`,
      },
    };

    // Navigate to Matches with location data
    navigation.navigate('Matches', {
      tripType,
      locations: locationsData,
    });
  };

  const centerOnCurrentLocation = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript('window.centerOnUser();');
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
        <Text style={styles.headerTitle}>
          {tripType === 'offer' ? 'Offer Ride' : 'Find Ride'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Map */}
      {currentLocation && (
        <WebView
          ref={webViewRef}
          source={{ html: getDualPickerMapHTML(currentLocation.latitude, currentLocation.longitude) }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleWebViewMessage}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.mapLoadingContainer}>
              <ActivityIndicator size="large" color="#4A90E2" />
            </View>
          )}
        />
      )}

      {/* Instruction Card */}
      <View style={styles.instructionCard}>
        <Text style={styles.instructionText}>
          {!pickupLocation ? '📍 Tap to set pickup location' : 
           !destLocation ? '🎯 Tap to set destination' : 
           '✅ Both locations set. Tap again to reset'}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Pickup Location Card */}
        {pickupLocation && (
          <View style={styles.locationCard}>
            <View style={[styles.locationMarker, { backgroundColor: '#4CAF50' }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup Location</Text>
              <Text style={styles.locationCoords}>
                {pickupLocation.latitude.toFixed(6)}, {pickupLocation.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}

        {/* Destination Location Card */}
        {destLocation && (
          <View style={styles.locationCard}>
            <View style={[styles.locationMarker, { backgroundColor: '#F44336' }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Destination</Text>
              <Text style={styles.locationCoords}>
                {destLocation.latitude.toFixed(6)}, {destLocation.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.locateButton}
            onPress={centerOnCurrentLocation}
          >
            <Locate size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, (!pickupLocation || !destLocation) && styles.confirmButtonDisabled]}
            onPress={handleConfirmLocation}
            disabled={!pickupLocation || !destLocation}
          >
            <Check size={24} color="#fff" />
            <Text style={styles.confirmButtonText}>
              Confirm {tripType === 'offer' ? 'Ride' : 'Request'}
            </Text>
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
    fontSize: 18,
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
  instructionCard: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  locationMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  locationCoords: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locateButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
  },
  confirmButtonDisabled: {
    backgroundColor: '#555',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default LocationPickerScreen;
