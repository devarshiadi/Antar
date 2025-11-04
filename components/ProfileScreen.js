import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  User,
  Star,
  MapPin,
  Phone,
  Mail,
  Car,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  HelpCircle,
  Navigation,
} from 'lucide-react-native';
import locationService from '../services/locationService';
import { userService } from '../services/api';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const [locationSharing, setLocationSharing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [trackingActive, setTrackingActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  const user = {
    name: 'Devendra',
    phone: '+91 98765 43210',
    email: 'devendra@example.com',
    rating: 4.8,
    tripsCompleted: 45,
    isDriver: true,
    vehicle: {
      type: 'Sedan',
      model: 'Honda City',
      licensePlate: 'KA01AB1234',
    },
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingActive) {
        locationService.stopTracking();
      }
    };
  }, [trackingActive]);

  const handleLocationToggle = async (value) => {
    if (value) {
      // Enable location sharing
      try {
        const permissions = await locationService.hasPermissions();
        if (!permissions.foreground) {
          const granted = await locationService.requestPermissions();
          if (!granted.foreground) {
            Alert.alert(
              'Permission Denied',
              'Location permission is required to enable live tracking'
            );
            return;
          }
        }

        // Start tracking
        await locationService.startTracking((location) => {
          setCurrentLocation(location);
        }, false);

        setTrackingActive(true);
        setLocationSharing(true);

        // Update backend
        await userService.updateProfile({ location_sharing_enabled: true });

        Alert.alert('Success', 'Live location tracking enabled');
      } catch (error) {
        console.error('Location toggle error:', error);
        Alert.alert('Error', 'Failed to enable location tracking');
      }
    } else {
      // Disable location sharing
      locationService.stopTracking();
      setTrackingActive(false);
      setLocationSharing(false);

      // Update backend
      try {
        await userService.updateProfile({ location_sharing_enabled: false });
      } catch (error) {
        console.error('Profile update error:', error);
      }

      Alert.alert('Success', 'Live location tracking disabled');
    }
  };

  const MenuItem = ({ icon: Icon, title, subtitle, onPress, showChevron = true }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Icon size={22} color="#fff" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {showChevron && <ChevronRight size={20} color="#888" />}
    </TouchableOpacity>
  );

  const ToggleMenuItem = ({ icon: Icon, title, value, onToggle }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuIcon}>
        <Icon size={22} color="#fff" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <Switch
        trackColor={{ false: "#767577", true: "#81b0ff" }}
        thumbColor={value ? "#f5dd4b" : "#f4f3f4"}
        ios_backgroundColor="#3e3e3e"
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => console.log('Settings')}>
          <Settings size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <User size={48} color="#fff" />
          </View>
          <Text style={styles.profileName}>{user.name}</Text>
          
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Star size={20} color="#FFC107" fill="#FFC107" />
              <Text style={styles.statValue}>{user.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MapPin size={20} color="#4CAF50" />
              <Text style={styles.statValue}>{user.tripsCompleted}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
          </View>
        </View>

        {/* Contact Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <MenuItem
            icon={Phone}
            title="Phone Number"
            subtitle={user.phone}
            onPress={() => console.log('Edit phone')}
          />
          <MenuItem
            icon={Mail}
            title="Email"
            subtitle={user.email}
            onPress={() => console.log('Edit email')}
          />
        </View>

        {/* Driver Info (if driver) */}
        {user.isDriver && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            
            <MenuItem
              icon={Car}
              title="Vehicle"
              subtitle={`${user.vehicle.model} (${user.vehicle.licensePlate})`}
              onPress={() => console.log('Edit vehicle')}
            />
          </View>
        )}

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <ToggleMenuItem
            icon={Navigation}
            title="Live Location Tracking"
            value={locationSharing}
            onToggle={handleLocationToggle}
          />
          {trackingActive && currentLocation && (
            <View style={styles.locationInfo}>
              <MapPin size={16} color="#4CAF50" />
              <Text style={styles.locationText}>
                Lat: {currentLocation.latitude.toFixed(6)}, Lon: {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}
          <ToggleMenuItem
            icon={Bell}
            title="Push Notifications"
            value={notifications}
            onToggle={setNotifications}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <MenuItem
            icon={Shield}
            title="Safety & Privacy"
            onPress={() => console.log('Safety')}
          />
          <MenuItem
            icon={HelpCircle}
            title="Help & Support"
            onPress={() => console.log('Help')}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <LogOut size={22} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#333',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 3,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: -10,
    marginBottom: 10,
  },
  locationText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 8,
    fontFamily: 'monospace',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default ProfileScreen;
