import * as Location from 'expo-location';
import { userService } from './api';

class LocationService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.updateInterval = null;
  }

  // Request location permissions
  async requestPermissions() {
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
  async hasPermissions() {
    const foreground = await Location.getForegroundPermissionsAsync();
    const background = await Location.getBackgroundPermissionsAsync();
    
    return {
      foreground: foreground.granted,
      background: background.granted,
    };
  }

  // Get current location once
  async getCurrentLocation() {
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
  async startTracking(onLocationUpdate, isActiveTrip = false) {
    if (this.isTracking) {
      console.log('Already tracking');
      return;
    }

    try {
      const permissions = await this.hasPermissions();
      if (!permissions.foreground) {
        await this.requestPermissions();
      }

      this.isTracking = true;

      // Watch position changes
      this.watchId = await Location.watchPositionAsync(
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
            is_active_trip: isActiveTrip,
          };

          // Callback for UI updates
          if (onLocationUpdate) {
            onLocationUpdate(locationData);
          }

          // Send to backend every update
          try {
            await userService.updateLocation(locationData);
          } catch (error) {
            console.error('Failed to update location on server:', error);
          }
        }
      );

      console.log('Location tracking started');
    } catch (error) {
      console.error('Start tracking error:', error);
      this.isTracking = false;
      throw error;
    }
  }

  // Stop watching location
  stopTracking() {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isTracking = false;
    console.log('Location tracking stopped');
  }

  // Get address from coordinates (reverse geocoding)
  async getAddressFromCoords(latitude, longitude) {
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
  async getCoordsFromAddress(address) {
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

  // Calculate distance between two points
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
}

export default new LocationService();
