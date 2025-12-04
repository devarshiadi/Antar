import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import locationService from '../../services/locationService';

function getDualPickerMapHTML(lat, lng) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { height: 100vh; width: 100vw; }
    .legend { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.85); color: #fff; padding: 8px 12px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); }
    .legend-row { display:flex; align-items:center; gap:8px; margin: 3px 0; }
    .dot { width: 12px; height: 12px; border-radius: 6px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    .dot-blue { background:#4A90E2; }
    .dot-green { background:#4CAF50; }
    .dot-red { background:#F44336; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="legend">
    <div class="legend-row"><span class="dot dot-blue"></span> You</div>
    <div class="legend-row"><span class="dot dot-green"></span> Pickup</div>
    <div class="legend-row"><span class="dot dot-red"></span> Destination</div>
  </div>
  <script>
    var map = L.map('map').setView([${lat}, ${lng}], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    var currentMarker = L.circleMarker([${lat}, ${lng}], {
      color: '#4A90E2',
      fillColor: '#4A90E2',
      fillOpacity: 0.7,
      radius: 8,
      weight: 2
    }).addTo(map).bindPopup('Your location');

    var pickupMarker = null;
    var pickupIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDBDOS4zNzI1OCAwIDQgNS4zNzI1OCA0IDEyQzQgMjEgMTYgMzYgMTYgMzZDMTYgMzYgMjggMjEgMjggMTJDMjggNS4zNzI1OCAyMi42Mjc0IDAgMTYgMFpNMTYgMTZDMTMuNzkwOSAxNiAxMiAxNC4yMDkxIDEyIDEyQzEyIDkuNzkwODYgMTMuNzkwOSA4IDE2IDhDMTguMjA5MSA4IDIwIDkuNzkwODYgMjAgMTJDMjAgMTQuMjA5MSAxOC4yMDkxIDE2IDE2IDE2WiIgZmlsbD0iIzRDQUY1MCIvPgo8L3N2Zz4K',
      iconSize: [32, 48],
      iconAnchor: [16, 48],
      popupAnchor: [0, -48]
    });

    var destMarker = null;
    var destIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDBDOS4zNzI1OCAwIDQgNS4zNzI1OCA0IDEyQzQgMjEgMTYgMzYgMTYgMzZDMTYgMzYgMjggMjEgMjggMTJDMjggNS4zNzI1OCAyMi42Mjc0IDAgMTYgMFpNMTYgMTZDMTMuNzkwOSAxNiAxMiAxNC4yMDkxIDEyIDEyQzEyIDkuNzkwODYgMTMuNzkwOSA4IDE2IDhDMTguMjA5MSA4IDIwIDkuNzkwODYgMjAgMTJDMjAgMTQuMjA5MSAxOC4yMDkxIDE2IDE2IDE2WiIgZmlsbD0iI0Y0NDMzNiIvPgo8L3N2Zz4K',
      iconSize: [32, 48],
      iconAnchor: [16, 48],
      popupAnchor: [0, -48]
    });

    var routeLine = null;

    function drawRoute() {
      if (!(pickupMarker && destMarker)) return;
      if (routeLine) { map.removeLayer(routeLine); }
      var start = pickupMarker.getLatLng();
      var end = destMarker.getLatLng();
      var midLat = (start.lat + end.lat) / 2;
      var midLng = (start.lng + end.lng) / 2;
      var dx = end.lng - start.lng;
      var dy = end.lat - start.lat;
      var dist = Math.sqrt(dx*dx + dy*dy);
      var offset = dist * 0.15;
      var offsetLat = midLat - offset * dx / dist;
      var offsetLng = midLng + offset * dy / dist;
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
      map.fitBounds([pickupMarker.getLatLng(), destMarker.getLatLng()], {padding: [50, 50]});
    }

    window.setPickup = function(lat, lng) {
      if (pickupMarker) { map.removeLayer(pickupMarker); }
      pickupMarker = L.marker([lat, lng], {icon: pickupIcon}).addTo(map).bindPopup('Pickup Location');
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pickup_selected', latitude: lat, longitude: lng }));
      drawRoute();
    }

    window.setDestination = function(lat, lng) {
      if (destMarker) { map.removeLayer(destMarker); }
      destMarker = L.marker([lat, lng], {icon: destIcon}).addTo(map).bindPopup('Destination');
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'destination_selected', latitude: lat, longitude: lng }));
      drawRoute();
    };

    window.clearMarkers = function() {
      if (pickupMarker) { map.removeLayer(pickupMarker); }
      if (destMarker) { map.removeLayer(destMarker); }
      if (routeLine) { map.removeLayer(routeLine); }
      pickupMarker = null; destMarker = null; routeLine = null;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'reset' }));
    };

    window.updateUser = function(lat, lng) {
      if (currentMarker) { map.removeLayer(currentMarker); }
      currentMarker = L.circleMarker([lat, lng], {
        color: '#4A90E2', fillColor: '#4A90E2', fillOpacity: 0.7, radius: 8, weight: 2
      }).addTo(map);
    };

    map.on('click', function(e) {
      if (!pickupMarker) {
        pickupMarker = L.marker([e.latlng.lat, e.latlng.lng], {icon: pickupIcon})
          .addTo(map)
          .bindPopup('Pickup Location')
          .openPopup();
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'pickup_selected',
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        }));
      } else if (!destMarker) {
        destMarker = L.marker([e.latlng.lat, e.latlng.lng], {icon: destIcon})
          .addTo(map)
          .bindPopup('Destination')
          .openPopup();
        
        drawRoute();
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'destination_selected',
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        }));
      } else {
        window.clearMarkers();
      }
    });

    window.centerOnUser = function() {
      map.setView([${lat}, ${lng}], 13, { animate: true });
    };
  </script>
</body>
</html>
`;
}

export function LocationPickerScreen({ navigation, route }) {
  const webViewRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destLocation, setDestLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickupAddress, setPickupAddress] = useState('');
  const [destAddress, setDestAddress] = useState('');

  const { tripType = 'offer', locationType, onLocationSelected, returnScreen } = route.params || {};

  useEffect(() => {
    initializeLocation();
    let stop = false;
    locationService
      .startTracking((loc) => {
        if (webViewRef.current) {
          const js = `window.updateUser(${loc.latitude}, ${loc.longitude});`;
          webViewRef.current.injectJavaScript(js);
        }
      })
      .catch(() => {});
    return () => {
      if (!stop) {
        locationService.stopTracking();
        stop = true;
      }
    };
  }, []);

  async function initializeLocation() {
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
  }

  function handleWebViewMessage(event) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'pickup_selected') {
        const loc = { latitude: data.latitude, longitude: data.longitude };
        setPickupLocation(loc);
        locationService.getAddressFromCoords(loc.latitude, loc.longitude).then((addr) => {
          setPickupAddress(addr?.formatted || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
        });
      } else if (data.type === 'destination_selected') {
        const loc = { latitude: data.latitude, longitude: data.longitude };
        setDestLocation(loc);
        locationService.getAddressFromCoords(loc.latitude, loc.longitude).then((addr) => {
          setDestAddress(addr?.formatted || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
        });
      } else if (data.type === 'reset') {
        setPickupLocation(null);
        setDestLocation(null);
        setPickupAddress('');
        setDestAddress('');
      }
    } catch (error) {
      console.error('WebView message error:', error);
    }
  }

  async function handleConfirmLocation() {
    if (locationType) {
      const selectedLocation = pickupLocation || destLocation;
      const selectedAddress = pickupAddress || destAddress;
      
      if (!selectedLocation) {
        Alert.alert('Error', `Please select ${locationType === 'source' ? 'pickup' : 'destination'} location`);
        return;
      }

      const addressObj = await locationService.getAddressFromCoords(
        selectedLocation.latitude,
        selectedLocation.longitude
      );

      const locationData = {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address:
          selectedAddress ||
          addressObj?.formatted ||
          `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`,
      };

      if (onLocationSelected) {
        onLocationSelected(locationData);
        navigation.goBack();
      } else if (returnScreen) {
        navigation.navigate(returnScreen, {
          selectedLocation: locationData,
          locationType: locationType,
        });
      } else {
        navigation.goBack();
      }
      return;
    }

    if (!pickupLocation || !destLocation) {
      Alert.alert('Error', 'Please select both pickup and destination locations');
      return;
    }

    const pickupAddressObj = await locationService.getAddressFromCoords(
      pickupLocation.latitude,
      pickupLocation.longitude
    );
    
    const destAddressObj = await locationService.getAddressFromCoords(
      destLocation.latitude,
      destLocation.longitude
    );

    const locationsData = {
      pickup: {
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
        address:
          pickupAddress ||
          pickupAddressObj?.formatted ||
          `${pickupLocation.latitude.toFixed(4)}, ${pickupLocation.longitude.toFixed(4)}`,
      },
      destination: {
        latitude: destLocation.latitude,
        longitude: destLocation.longitude,
        address:
          destAddress ||
          destAddressObj?.formatted ||
          `${destLocation.latitude.toFixed(4)}, ${destLocation.longitude.toFixed(4)}`,
      },
    };

    navigation.navigate('Matches', {
      tripType,
      locations: locationsData,
    });
  }

  function centerOnCurrentLocation() {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript('window.centerOnUser();');
    }
  }

  function setCurrentAsNextPoint() {
    if (!currentLocation || !webViewRef.current) return;
    const { latitude, longitude } = currentLocation;
    const fn = !pickupLocation ? 'setPickup' : !destLocation ? 'setDestination' : 'clearMarkers';
    const js = `window.${fn}(${latitude}, ${longitude});`;
    webViewRef.current.injectJavaScript(js);
  }

  function clearAllPoints() {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript('window.clearMarkers();');
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

      <View style={styles.instructionCard}>
        <Text style={styles.instructionText}>
          {locationType === 'source'
            ? '📍 Tap to set pickup location'
            : locationType === 'destination'
            ? '🎯 Tap to set destination'
            : !pickupLocation
            ? '📍 Tap to set pickup location'
            : !destLocation
            ? '🎯 Tap to set destination'
            : '✅ Both locations set. Tap again to reset'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.locateButton}
        onPress={centerOnCurrentLocation}
        activeOpacity={0.8}
      >
        <Locate size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.controls}>
        {pickupLocation && (
          <View style={styles.locationCard}>
            <View style={[styles.locationMarker, { backgroundColor: '#4CAF50' }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationCoords} numberOfLines={2}>
                {pickupAddress ||
                  `${pickupLocation.latitude.toFixed(6)}, ${pickupLocation.longitude.toFixed(6)}`}
              </Text>
            </View>
          </View>
        )}

        {destLocation && (
          <View style={styles.locationCard}>
            <View style={[styles.locationMarker, { backgroundColor: '#F44336' }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Destination</Text>
              <Text style={styles.locationCoords} numberOfLines={2}>
                {destAddress ||
                  `${destLocation.latitude.toFixed(6)}, ${destLocation.longitude.toFixed(6)}`}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={setCurrentAsNextPoint}
            activeOpacity={0.7}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.secondaryText}>
              {!pickupLocation ? 'Use Current' : !destLocation ? 'Use Current' : 'Reset'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={clearAllPoints}
            activeOpacity={0.7}
          >
            <Navigation size={18} color="#fff" />
            <Text style={styles.secondaryText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            (locationType ? !pickupLocation : !pickupLocation || !destLocation) &&
              styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmLocation}
          disabled={locationType ? !pickupLocation : !pickupLocation || !destLocation}
          activeOpacity={0.9}
        >
          <Check
            size={24}
            color={
              locationType ? !pickupLocation : !pickupLocation || !destLocation ? '#666' : '#000'
            }
          />
          <Text
            style={[
              styles.confirmButtonText,
              (locationType ? !pickupLocation : !pickupLocation || !destLocation) && { color: '#666' },
            ]}
          >
            {locationType ? 'Confirm Location' : 'Confirm Locations'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  locationMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    color: '#888',
    fontSize: 11,
    marginBottom: 2,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  locationCoords: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  locateButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    position: 'absolute',
    bottom: 200,
    right: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  secondaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    minHeight: 56,
    marginTop: 8,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#333',
    shadowOpacity: 0,
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
});

export default LocationPickerScreen;
