import * as Location from 'expo-location';
import { userService } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

function createLocationService() {
  let watchId = null;
  let isTracking = false;
  let updateInterval = null;
  let hasLoggedUpdateError = false;
  const listeners = new Set();

  // Request location permissions
  async function requestPermissions() {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        throw new Error('Location permission denied');
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      return {
        foreground: foregroundStatus === 'granted',
        background: backgroundStatus === 'granted',
      };
    } catch (error) {
      console.error('Permission error:', error);
      throw error;
    }
  }

  // Check if permissions are granted
  async function hasPermissions() {
    const foreground = await Location.getForegroundPermissionsAsync();
    const background = await Location.getBackgroundPermissionsAsync();
    
    return {
      foreground: foreground.granted,
      background: background.granted,
    };
  }

  // Get current location once
  async function getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        heading: location.coords.heading,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Get location error:', error);
      throw error;
    }
  }

  // Start watching location in real-time
  async function startTracking(onLocationUpdate, isActiveTrip = false) {
    const entry = {
      callback: typeof onLocationUpdate === 'function' ? onLocationUpdate : null,
      isActiveTrip: !!isActiveTrip,
    };
    if (entry.callback) {
      listeners.add(entry);
    }

    function unsubscribe() {
      listeners.delete(entry);
      if (listeners.size === 0) {
        stopTrackingInternal();
      }
    }

    if (isTracking) {
      return unsubscribe;
    }

    try {
      const permissions = await hasPermissions();
      if (!permissions.foreground) {
        await requestPermissions();
      }

      isTracking = true;
      hasLoggedUpdateError = false;

      // Watch position changes
      watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        async (location) => {
          const locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed,
            heading: location.coords.heading,
          };

          const activeForServer = Array.from(listeners).some((item) => item.isActiveTrip);

          // Callback for UI updates
          listeners.forEach((item) => {
            if (!item.callback) {
              return;
            }
            item.callback({ ...locationData, is_active_trip: item.isActiveTrip });
          });

          // Send to backend every update; if offline or server fails, log once and continue silently
          try {
            const token = await AsyncStorage.getItem('access_token');
            if (token) {
              await userService.updateLocation({ ...locationData, is_active_trip: activeForServer });
            }
          } catch (error) {
            if (!hasLoggedUpdateError) {
              console.log('Failed to update location on server. Tracking continues locally.');
              hasLoggedUpdateError = true;
            }
          }
        }
      );

      console.log('Location tracking started');
      return unsubscribe;
    } catch (error) {
      console.error('Start tracking error:', error);
      isTracking = false;
      listeners.delete(entry);
      throw error;
    }
  }

  // Stop watching location
  function stopTrackingInternal() {
    if (watchId) {
      watchId.remove();
      watchId = null;
    }
    
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }

    isTracking = false;
    console.log('Location tracking stopped');
  }

  function stopTracking() {
    listeners.clear();
    stopTrackingInternal();
  }

  // Get address from coordinates (reverse geocoding)
  async function getAddressFromCoords(latitude, longitude) {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        return {
          street: address.street || '',
          city: address.city || '',
          region: address.region || '',
          country: address.country || '',
          postalCode: address.postalCode || '',
          formatted: `${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim(),
        };
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  // Get coordinates from address (geocoding)
  async function getCoordsFromAddress(address) {
    try {
      const locations = await Location.geocodeAsync(address);

      if (locations && locations.length > 0) {
        return {
          latitude: locations[0].latitude,
          longitude: locations[0].longitude,
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // Calculate distance between two points
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  return {
    requestPermissions,
    hasPermissions,
    getCurrentLocation,
    startTracking,
    stopTracking,
    getAddressFromCoords,
    getCoordsFromAddress,
    calculateDistance,
  };
}

export const locationService = createLocationService();

export default locationService;
