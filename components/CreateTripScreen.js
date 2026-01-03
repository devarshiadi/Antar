import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Search,
} from 'lucide-react-native';
import { useAppTheme } from '../helpers/use-app-theme';
import { useSession } from '../helpers/session-context';
import { tripService } from '../services/api';

const { width, height } = Dimensions.get('window');

function CreateTripScreen({ navigation, route }) {
  const { colors, statusBarStyle } = useAppTheme();
  const { user: sessionUser } = useSession();
  const styles = useMemo(function () {
    return getStyles(colors);
  }, [colors]);
  const { tripType = 'offer' } = route.params || {};
  const [sourceLocation, setSourceLocation] = useState(null);
  const [destLocation, setDestLocation] = useState(null);
  const [seats, setSeats] = useState('1');
  const [price, setPrice] = useState('');

  // Auto-set date and time
  function getDefaultDateTime() {
    const now = new Date();
    // Add 10 minutes
    now.setMinutes(now.getMinutes() + 10);
    
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;
    
    return { date, time };
  }

  const { date: defaultDate, time: defaultTime } = getDefaultDateTime();
  const [departureDate, setDepartureDate] = useState(defaultDate);
  const [departureTime, setDepartureTime] = useState(defaultTime);

  useEffect(() => {
    const locations = route.params?.locations;
    if (!locations || !locations.pickup || !locations.destination) {
      return;
    }
    setSourceLocation(locations.pickup);
    setDestLocation(locations.destination);
    navigation.setParams({ locations: undefined });
  }, [navigation, route.params?.locations]);

  function openLocationPicker() {
    navigation.navigate('LocationPicker', {
      tripType,
      returnScreen: 'CreateTrip',
    });
  }

  async function handleCreateTrip() {
    if (!sourceLocation || !destLocation) {
      alert('Please select both pickup and destination locations');
      return;
    }

    const trimmedPrice = String(price || '').trim();
    const parsedPrice = parseFloat(trimmedPrice);
    if (!trimmedPrice || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Please enter a valid price');
      return;
    }

    const parsedSeats = parseInt(String(seats || '1'), 10);
    const seatsAvailable = Number.isNaN(parsedSeats) ? 1 : parsedSeats;

    try {
      const createdTrip = await tripService.createTrip({
        trip_type: tripType === 'request' ? 'request' : 'offer',
        origin_latitude: sourceLocation.latitude,
        origin_longitude: sourceLocation.longitude,
        origin_address: sourceLocation.address,
        destination_latitude: destLocation.latitude,
        destination_longitude: destLocation.longitude,
        destination_address: destLocation.address,
        departure_date: departureDate,
        departure_time: departureTime,
        seats_available: tripType === 'offer' ? seatsAvailable : null,
        price: parsedPrice,
      });

      navigation.navigate('Matches', {
        tripType: tripType === 'request' ? 'find' : 'offer',
        viewerRole: tripType === 'request' ? 'seeker' : 'offerer',
        tripId: createdTrip?.id,
        source: sourceLocation,
        destination: destLocation,
        currentUser: route.params?.currentUser || sessionUser || null,
      });
    } catch (error) {
      alert(typeof error === 'string' ? error : 'Failed to create trip. Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Trip</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Type Indicator */}
        <View style={styles.tripTypeIndicator}>
          <Text style={styles.tripTypeIndicatorText}>
            {tripType === 'offer' ? '🚗 Offering a Ride' : '🙋 Finding a Ride'}
          </Text>
        </View>

        {/* Location Selection */}
        <TouchableOpacity 
          style={styles.mapPickerCard}
          onPress={openLocationPicker}
        >
          <View style={styles.mapPickerHeader}>
            <MapPin size={24} color="#4CAF50" />
            <Text style={styles.mapPickerTitle}>Select Pickup & Destination</Text>
          </View>
          
          {!sourceLocation && !destLocation ? (
            <Text style={styles.mapPickerSubtitle}>Tap to pin both locations on map</Text>
          ) : (
            <View style={styles.selectedLocations}>
              {sourceLocation && (
                <View style={styles.selectedLocationRow}>
                  <View style={[styles.locationDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.selectedLocationText} numberOfLines={1}>
                    {sourceLocation.address}
                  </Text>
                </View>
              )}
              {destLocation && (
                <View style={styles.selectedLocationRow}>
                  <View style={[styles.locationDot, { backgroundColor: '#F44336' }]} />
                  <Text style={styles.selectedLocationText} numberOfLines={1}>
                    {destLocation.address}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          <View style={styles.mapPickerFooter}>
            <Search size={16} color={colors.text.secondary} />
            <Text style={styles.mapPickerFooterText}>Open Map</Text>
          </View>
        </TouchableOpacity>

        {/* Date & Time */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.inputLabel}>Date</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color={colors.text.secondary} />
              <Text style={styles.autoFilledText}>{departureDate}</Text>
            </View>
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Time</Text>
            <View style={styles.inputContainer}>
              <Clock size={20} color={colors.text.secondary} />
              <Text style={styles.autoFilledText}>{departureTime}</Text>
            </View>
          </View>
        </View>

        {/* Seats & Price (only for offer) */}
        {tripType === 'offer' && (
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.inputLabel}>Available Seats</Text>
              <View style={styles.inputContainer}>
                <Users size={20} color={colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  value={seats}
                  onChangeText={setSeats}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Price per Seat</Text>
              <View style={styles.inputContainer}>
                <DollarSign size={20} color={colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  placeholder="₹ 100"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
            </View>
          </View>
        )}

        {/* Price (for request) */}
        {tripType === 'request' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Max Price Willing to Pay</Text>
            <View style={styles.inputContainer}>
              <DollarSign size={20} color={colors.text.secondary} />
              <TextInput
                style={styles.input}
                placeholder="₹ 100"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {tripType === 'offer' ? '🚗 Offering a Ride' : '🙋 Requesting a Ride'}
          </Text>
          <Text style={styles.infoText}>
            {tripType === 'offer' 
              ? 'Share your route with passengers going the same way. Save costs and reduce carbon footprint!'
              : 'Find drivers going your way. Get matched instantly with riders on the same route!'}
          </Text>
        </View>

        {/* Create Button */}
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateTrip}
        >
          <Text style={styles.createButtonText}>
            {tripType === 'offer' ? 'Offer Ride' : 'Find Matches'}
          </Text>
        </TouchableOpacity>

        {/* Spacer */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.primary,
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
      color: colors.text.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    tripTypeIndicator: {
      backgroundColor: colors.bg.card,
      borderRadius: 12,
      padding: 16,
      marginTop: 10,
      marginBottom: 20,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.accent.primary,
    },
    tripTypeIndicatorText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 8,
      fontWeight: '500',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.card,
      borderRadius: 12,
      paddingHorizontal: 15,
      paddingVertical: 12,
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    mapPickerCard: {
      backgroundColor: colors.bg.card,
      borderRadius: 12,
      padding: 18,
      marginBottom: 20,
      borderWidth: 2,
      borderColor: colors.border.strong,
    },
    mapPickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    mapPickerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginLeft: 12,
    },
    mapPickerSubtitle: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 12,
    },
    selectedLocations: {
      marginBottom: 12,
    },
    selectedLocationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    locationDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    selectedLocationText: {
      fontSize: 14,
      color: colors.text.primary,
      flex: 1,
    },
    mapPickerFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border.default,
    },
    mapPickerFooterText: {
      fontSize: 14,
      color: colors.accent.primary,
      marginLeft: 8,
      fontWeight: '600',
    },
    autoFilledText: {
      flex: 1,
      fontSize: 16,
      color: colors.accent.primary,
      fontWeight: '500',
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.text.primary,
    },
    row: {
      flexDirection: 'row',
    },
    infoCard: {
      backgroundColor: colors.bg.card,
      padding: 20,
      borderRadius: 12,
      marginTop: 10,
      marginBottom: 25,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent.primary,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.text.secondary,
      lineHeight: 20,
    },
    createButton: {
      backgroundColor: colors.button.primaryBg,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    createButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
  });
}

export default CreateTripScreen;
