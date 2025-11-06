import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { MapPin, TrendingUp, Clock, MoreHorizontal } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ELEVATION } from '../constants/theme';
import BottomSheet from './common/BottomSheet';

function HomeScreenNew({ navigation }) {
  const [userCity, setUserCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  async function requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const [place] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setUserCity(place.city || 'Your City');
      }
    } catch (error) {
      console.log('Location error:', error);
      setUserCity('Unknown');
    } finally {
      setLoading(false);
    }
  }

  const handleFindRide = () => {
    navigation.navigate('Matches', { city: userCity });
  };

  const handleOfferRide = () => {
    navigation.navigate('LocationPicker', { tripType: 'offer' });
  };

  // Sample data
  const stats = {
    trips: 12,
    rating: 4.8,
  };

  const recentActivity = [
    { id: 1, from: 'MG Road', to: 'Whitefield', time: '2h ago' },
    { id: 2, from: 'Koramangala', to: 'Electronic City', time: '5h ago' },
  ];

  const activeRequests = 2;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.text.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg.primary} />

      {/* Minimal Header - Info Only */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello 👋</Text>
          <Text style={styles.userName}>Devendra</Text>
        </View>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => setShowLocationModal(true)}
        >
          <MapPin size={16} color={COLORS.text.secondary} />
          <Text style={styles.locationText}>{userCity}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Minimal Stats - Single Line */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.trips}</Text>
            <Text style={styles.statLabel}>trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.rating}★</Text>
            <Text style={styles.statLabel}>rating</Text>
          </View>
        </View>

        {/* Recent Activity - Compact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.map((trip) => (
            <TouchableOpacity key={trip.id} style={styles.activityItem}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  {trip.from} → {trip.to}
                </Text>
                <Text style={styles.activityTime}>{trip.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Requests - Quick Access */}
        {activeRequests > 0 && (
          <TouchableOpacity
            style={styles.activeRequestsCard}
            onPress={() => navigation.navigate('Matches', { city: userCity })}
          >
            <View style={styles.activeRequestsContent}>
              <Clock size={18} color={COLORS.text.primary} />
              <Text style={styles.activeRequestsText}>
                {activeRequests} Active Request{activeRequests > 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.activeRequestsAction}>View →</Text>
          </TouchableOpacity>
        )}

        {/* Spacer for bottom actions */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action Zone - Thumb Friendly */}
      <View style={styles.bottomActions}>
        {/* Primary Action */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleFindRide}>
          <Text style={styles.primaryButtonText}>FIND A RIDE</Text>
        </TouchableOpacity>

        {/* Secondary Actions */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleOfferRide}>
            <Text style={styles.secondaryButtonText}>Offer Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowNotifications(true)}
          >
            <Text style={styles.secondaryButtonText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <MoreHorizontal size={20} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Bottom Sheet */}
      <BottomSheet
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        height="40%"
      >
        <Text style={styles.sheetTitle}>Location</Text>
        <Text style={styles.sheetText}>
          Current location: {userCity}
        </Text>
        <TouchableOpacity style={styles.sheetButton}>
          <Text style={styles.sheetButtonText}>Change Location</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Notifications Bottom Sheet */}
      <BottomSheet
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        height="60%"
      >
        <Text style={styles.sheetTitle}>Notifications</Text>
        <ScrollView>
          <View style={styles.notificationItem}>
            <Text style={styles.notificationTitle}>New Match Found</Text>
            <Text style={styles.notificationText}>Rajesh Kumar • 5 mins ago</Text>
          </View>
          <View style={styles.notificationItem}>
            <Text style={styles.notificationTitle}>Trip Confirmed</Text>
            <Text style={styles.notificationText}>Whitefield • 15 mins ago</Text>
          </View>
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  greeting: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  userName: {
    ...TYPOGRAPHY.title,
    color: COLORS.text.primary,
    marginTop: SPACING.xs,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    borderRadius: RADIUS.sm,
  },
  locationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.title,
    color: COLORS.text.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border.subtle,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.text.tertiary,
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
  activityTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
  },
  activeRequestsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: RADIUS.md,
  },
  activeRequestsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  activeRequestsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
  activeRequestsAction: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  bottomActions: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
    backgroundColor: COLORS.bg.primary,
  },
  primaryButton: {
    backgroundColor: COLORS.text.primary,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.bg.primary,
    letterSpacing: 1,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  sheetTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  sheetText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
  },
  sheetButton: {
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  sheetButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
  notificationItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  notificationTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  notificationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
});

export default HomeScreenNew;
