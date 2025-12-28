<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import React, { useMemo, useState, useEffect } from 'react';
>>>>>>> aditya mule delay zala ahe sagla
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Car,
  Bike,
  MapPin,
  Navigation,
  Users,
  User,
  Phone,
  Hash,
  DollarSign,
} from 'lucide-react-native';
<<<<<<< HEAD
import { COLORS } from '../../constants/theme';
=======
>>>>>>> aditya mule delay zala ahe sagla
import { addRide } from '../../helpers/rides-storage';
import { saveGlobalRoute, loadGlobalRoute } from '../../helpers/location-storage';
import { useAppTheme } from '../../helpers/use-app-theme';

const STORAGE_KEY = '@offer_ride_user_data';

export function OfferRideScreen({ navigation, route }) {
  const { colors, statusBarStyle } = useAppTheme();
<<<<<<< HEAD
=======
  const styles = useMemo(function () {
    return getStyles(colors);
  }, [colors]);
>>>>>>> aditya mule delay zala ahe sagla
  const currentUser = route.params?.currentUser || null;
  const [vehicleType, setVehicleType] = useState('car');
  const [seatCount, setSeatCount] = useState(2);
  const [sourceLocation, setSourceLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [userName, setUserName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (!route.params) {
      return;
    }
    if (route.params.source && !sourceLocation) {
      setSourceLocation(route.params.source);
    }
    if (route.params.destination && !destinationLocation) {
      setDestinationLocation(route.params.destination);
    }
  }, [route.params?.source, route.params?.destination, sourceLocation, destinationLocation]);

  useEffect(() => {
    if (route.params?.selectedLocation && route.params?.locationType) {
      if (route.params.locationType === 'source') {
        setSourceLocation(route.params.selectedLocation);
      } else if (route.params.locationType === 'destination') {
        setDestinationLocation(route.params.selectedLocation);
      }
      navigation.setParams({ selectedLocation: undefined, locationType: undefined });
    }
  }, [route.params?.selectedLocation]);

  useEffect(() => {
    if (sourceLocation || destinationLocation) {
      return;
    }
    async function hydrateRouteFromStorage() {
      const stored = await loadGlobalRoute();
      if (!stored) {
        return;
      }
      if (stored.source && !sourceLocation) {
        setSourceLocation(stored.source);
      }
      if (stored.destination && !destinationLocation) {
        setDestinationLocation(stored.destination);
      }
    }
    hydrateRouteFromStorage();
  }, [sourceLocation, destinationLocation]);

  useEffect(() => {
    saveGlobalRoute(sourceLocation, destinationLocation);
  }, [sourceLocation, destinationLocation]);

  async function loadUserData() {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const data = JSON.parse(savedData);
        setUserName(data.userName || '');
        setPhoneNumber(data.phoneNumber || '');
        setVehicleNumber(data.vehicleNumber || '');
        setVehicleType(data.vehicleType || 'car');
        if (data.vehicleType === 'bike') {
          setSeatCount(1);
        } else {
          setSeatCount(data.seatCount || 2);
        }
        if (typeof data.price === 'number' || typeof data.price === 'string') {
          setPrice(String(data.price));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveUserData() {
    try {
      const dataToSave = {
        userName,
        phoneNumber,
        vehicleNumber,
        vehicleType,
        seatCount,
        price,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  function handleVehicleChange(type) {
    setVehicleType(type);
    if (type === 'bike') {
      setSeatCount(1);
    } else if (seatCount === 1) {
      setSeatCount(2);
    }
  }

  function handleSourceSelect() {
    navigation.navigate('LocationPicker', {
      tripType: 'offer',
      locationType: 'source',
      returnScreen: 'OfferRide',
    });
  }

  function handleDestinationSelect() {
    navigation.navigate('LocationPicker', {
      tripType: 'offer',
      locationType: 'destination',
      returnScreen: 'OfferRide',
    });
  }

  async function handleConfirm() {
    if (!userName.trim()) {
      Alert.alert('Missing Information', 'Please enter your name.', [{ text: 'OK' }]);
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      Alert.alert('Missing Information', 'Please enter a valid phone number (at least 10 digits).', [
        { text: 'OK' },
      ]);
      return;
    }
    if (!vehicleNumber.trim()) {
      Alert.alert('Missing Information', 'Please enter your vehicle number.', [{ text: 'OK' }]);
      return;
    }
    const trimmedPrice = price.trim();
    const numericPrice = parseFloat(trimmedPrice);
    if (!trimmedPrice || Number.isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert('Missing Information', 'Please enter a valid price for your ride.', [{ text: 'OK' }]);
      return;
    }
    if (!sourceLocation || !destinationLocation) {
      Alert.alert('Missing Information', 'Please select both pickup and destination locations.', [
        { text: 'OK' },
      ]);
      return;
    }

    await saveUserData();

    const rideId = Date.now();
    const ride = {
      id: rideId,
      driverId: currentUser?.id ?? `driver-${rideId}`,
      driverPhone: phoneNumber,
      driverName: userName || currentUser?.name || 'Driver',
      name: userName || currentUser?.name || 'Driver',
      rating: currentUser?.rating ?? 4.8,
      from: sourceLocation.address || 'Pickup',
      to: destinationLocation.address || 'Drop',
      time: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
      price: numericPrice,
      seats: seatCount,
      vehicleType,
      vehicleNumber,
      sourceLocation,
      destinationLocation,
      status: 'available',
      isStored: true,
    };

    await addRide(ride);

    navigation.navigate('Matches', {
      tripType: 'offer',
      vehicleType,
      seatCount,
      price: numericPrice,
      source: sourceLocation,
      destination: destinationLocation,
      currentUser,
      userInfo: {
        name: userName,
        phone: phoneNumber,
        vehicleNumber,
      },
    });
  }

  function handleMyRidesPress() {
    navigation.navigate('MyRides', {
      currentUser,
    });
  }

  return (
<<<<<<< HEAD
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]} edges={['top']}>
=======
    <SafeAreaView style={styles.container} edges={['top']}>
>>>>>>> aditya mule delay zala ahe sagla
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
<<<<<<< HEAD
          <ArrowLeft size={24} color={COLORS.text.primary} />
=======
          <ArrowLeft size={24} color={colors.text.primary} />
>>>>>>> aditya mule delay zala ahe sagla
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offer a Ride</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Information</Text>

          <View style={styles.inputContainer}>
<<<<<<< HEAD
            <User size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#666"
=======
            <User size={20} color={colors.text.secondary} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={colors.text.tertiary}
>>>>>>> aditya mule delay zala ahe sagla
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
<<<<<<< HEAD
            <Phone size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#666"
=======
            <Phone size={20} color={colors.text.secondary} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={colors.text.tertiary}
>>>>>>> aditya mule delay zala ahe sagla
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <View style={styles.inputContainer}>
<<<<<<< HEAD
            <Hash size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Vehicle Number (e.g., DL01AB1234)"
              placeholderTextColor="#666"
=======
            <Hash size={20} color={colors.text.secondary} />
            <TextInput
              style={styles.input}
              placeholder="Vehicle Number (e.g., DL01AB1234)"
              placeholderTextColor={colors.text.tertiary}
>>>>>>> aditya mule delay zala ahe sagla
              value={vehicleNumber}
              onChangeText={(text) => setVehicleNumber(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={20}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Type</Text>
          <View style={styles.vehicleOptions}>
            <TouchableOpacity
              style={[
                styles.vehicleOption,
                vehicleType === 'car' && styles.vehicleOptionActive,
              ]}
              onPress={() => handleVehicleChange('car')}
              activeOpacity={0.7}
            >
              <View style={styles.radioOuter}>
                {vehicleType === 'car' && <View style={styles.radioInner} />}
              </View>
              <Car
                size={28}
<<<<<<< HEAD
                color={vehicleType === 'car' ? '#000' : '#fff'}
=======
                color={vehicleType === 'car' ? colors.button.primaryText : colors.text.primary}
>>>>>>> aditya mule delay zala ahe sagla
              />
              <Text
                style={[
                  styles.vehicleText,
                  vehicleType === 'car' && styles.vehicleTextActive,
                ]}
              >
                Car
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.vehicleOption,
                vehicleType === 'bike' && styles.vehicleOptionActive,
              ]}
              onPress={() => handleVehicleChange('bike')}
              activeOpacity={0.7}
            >
              <View style={styles.radioOuter}>
                {vehicleType === 'bike' && <View style={styles.radioInner} />}
              </View>
              <Bike
                size={28}
<<<<<<< HEAD
                color={vehicleType === 'bike' ? '#000' : '#fff'}
=======
                color={vehicleType === 'bike' ? colors.button.primaryText : colors.text.primary}
>>>>>>> aditya mule delay zala ahe sagla
              />
              <Text
                style={[
                  styles.vehicleText,
                  vehicleType === 'bike' && styles.vehicleTextActive,
                ]}
              >
                Bike
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Seats</Text>
          {vehicleType === 'bike' ? (
            <View style={styles.seatInfo}>
<<<<<<< HEAD
              <Users size={20} color={COLORS.accent.primary} />
=======
              <Users size={20} color={colors.accent.primary} />
>>>>>>> aditya mule delay zala ahe sagla
              <Text style={styles.seatInfoText}>1 seat (pillion rider)</Text>
            </View>
          ) : (
            <View style={styles.seatOptions}>
              {[1, 2, 3, 4].map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.seatButton,
                    seatCount === count && styles.seatButtonActive,
                  ]}
                  onPress={() => setSeatCount(count)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.seatButtonText,
                      seatCount === count && styles.seatButtonTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price per Seat</Text>
          <View style={styles.inputContainer}>
<<<<<<< HEAD
            <DollarSign size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="₹ 100"
              placeholderTextColor="#666"
=======
            <DollarSign size={20} color={colors.text.secondary} />
            <TextInput
              style={styles.input}
              placeholder="₹ 100"
              placeholderTextColor={colors.text.tertiary}
>>>>>>> aditya mule delay zala ahe sagla
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Route</Text>

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
<<<<<<< HEAD
            <Navigation size={20} color={COLORS.accent.primary} />
=======
            <Navigation size={20} color={colors.accent.primary} />
>>>>>>> aditya mule delay zala ahe sagla
          </TouchableOpacity>

          <View style={styles.locationDivider} />

          <TouchableOpacity
            style={styles.locationInput}
            onPress={handleDestinationSelect}
            activeOpacity={0.7}
          >
            <View style={[styles.locationDot, styles.locationDotDestination]} />
            <View style={styles.locationInputContent}>
              <Text style={styles.locationLabel}>Destination</Text>
              <Text style={styles.locationValue}>
                {destinationLocation
                  ? destinationLocation.address
                  : 'Select destination'}
              </Text>
            </View>
            <MapPin size={20} color="#F44336" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Offering a ride helps reduce traffic and pollution while sharing
            travel costs
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.9}
          >
            <Text style={styles.confirmButtonText}>Confirm & Publish Ride</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleMyRidesPress}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>Ride posts</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

<<<<<<< HEAD
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
=======
function getStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
>>>>>>> aditya mule delay zala ahe sagla
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
<<<<<<< HEAD
    backgroundColor: COLORS.bg.card,
=======
    backgroundColor: colors.bg.card,
>>>>>>> aditya mule delay zala ahe sagla
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
<<<<<<< HEAD
    color: COLORS.text.primary,
=======
    color: colors.text.primary,
>>>>>>> aditya mule delay zala ahe sagla
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
<<<<<<< HEAD
    color: '#fff',
=======
    color: colors.text.primary,
>>>>>>> aditya mule delay zala ahe sagla
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
<<<<<<< HEAD
    backgroundColor: COLORS.bg.card,
=======
    backgroundColor: colors.bg.card,
>>>>>>> aditya mule delay zala ahe sagla
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    minHeight: 56,
    borderWidth: 1,
<<<<<<< HEAD
    borderColor: COLORS.border.default,
=======
    borderColor: colors.border.default,
>>>>>>> aditya mule delay zala ahe sagla
    gap: 12,
  },
  input: {
    flex: 1,
<<<<<<< HEAD
    color: '#fff',
=======
    color: colors.text.primary,
>>>>>>> aditya mule delay zala ahe sagla
    fontSize: 15,
    fontWeight: '500',
  },
  vehicleOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleOption: {
    flex: 1,
<<<<<<< HEAD
    backgroundColor: COLORS.bg.card,
=======
    backgroundColor: colors.bg.card,
>>>>>>> aditya mule delay zala ahe sagla
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    borderWidth: 2,
<<<<<<< HEAD
    borderColor: COLORS.border.default,
  },
  vehicleOptionActive: {
    backgroundColor: COLORS.button.primaryBg,
    borderColor: COLORS.button.primaryBg,
=======
    borderColor: colors.border.default,
  },
  vehicleOptionActive: {
    backgroundColor: colors.button.primaryBg,
    borderColor: colors.button.primaryBg,
>>>>>>> aditya mule delay zala ahe sagla
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
<<<<<<< HEAD
    borderColor: '#666',
=======
    borderColor: colors.text.tertiary,
>>>>>>> aditya mule delay zala ahe sagla
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
<<<<<<< HEAD
    backgroundColor: '#000',
=======
    backgroundColor: colors.button.primaryText,
>>>>>>> aditya mule delay zala ahe sagla
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600',
<<<<<<< HEAD
    color: '#fff',
    marginTop: 12,
  },
  vehicleTextActive: {
    color: '#000',
=======
    color: colors.text.primary,
    marginTop: 12,
  },
  vehicleTextActive: {
    color: colors.button.primaryText,
>>>>>>> aditya mule delay zala ahe sagla
  },
  seatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
<<<<<<< HEAD
    backgroundColor: COLORS.bg.card,
=======
    backgroundColor: colors.bg.card,
>>>>>>> aditya mule delay zala ahe sagla
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  seatInfoText: {
    fontSize: 15,
<<<<<<< HEAD
    color: '#fff',
=======
    color: colors.text.primary,
>>>>>>> aditya mule delay zala ahe sagla
    fontWeight: '500',
  },
  seatOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  seatButton: {
    flex: 1,
<<<<<<< HEAD
    backgroundColor: COLORS.bg.card,
=======
    backgroundColor: colors.bg.card,
>>>>>>> aditya mule delay zala ahe sagla
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    borderWidth: 2,
<<<<<<< HEAD
    borderColor: COLORS.border.default,
  },
  seatButtonActive: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
=======
    borderColor: colors.border.default,
  },
  seatButtonActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
>>>>>>> aditya mule delay zala ahe sagla
  },
  seatButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
<<<<<<< HEAD
    color: '#666',
  },
  seatButtonTextActive: {
    color: '#fff',
=======
    color: colors.text.tertiary,
  },
  seatButtonTextActive: {
    color: colors.button.primaryText,
>>>>>>> aditya mule delay zala ahe sagla
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
<<<<<<< HEAD
    backgroundColor: COLORS.bg.card,
=======
    backgroundColor: colors.bg.card,
>>>>>>> aditya mule delay zala ahe sagla
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    minHeight: 64,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  locationDotSource: {
<<<<<<< HEAD
    backgroundColor: COLORS.accent.primary,
=======
    backgroundColor: colors.accent.primary,
>>>>>>> aditya mule delay zala ahe sagla
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
<<<<<<< HEAD
    color: '#888',
=======
    color: colors.text.secondary,
>>>>>>> aditya mule delay zala ahe sagla
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 15,
<<<<<<< HEAD
    color: '#fff',
=======
    color: colors.text.primary,
>>>>>>> aditya mule delay zala ahe sagla
    fontWeight: '500',
  },
  locationDivider: {
    height: 1,
<<<<<<< HEAD
    backgroundColor: COLORS.border.default,
=======
    backgroundColor: colors.border.default,
>>>>>>> aditya mule delay zala ahe sagla
    marginLeft: 24,
    marginVertical: 12,
  },
  infoBox: {
<<<<<<< HEAD
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
=======
    backgroundColor: colors.bg.elevated,
>>>>>>> aditya mule delay zala ahe sagla
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
<<<<<<< HEAD
    borderColor: 'rgba(0, 255, 255, 0.25)',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.accent.primary,
=======
    borderColor: colors.border.default,
  },
  infoText: {
    fontSize: 14,
    color: colors.accent.primary,
>>>>>>> aditya mule delay zala ahe sagla
    lineHeight: 20,
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 24,
    gap: 8,
  },
  confirmButton: {
<<<<<<< HEAD
    backgroundColor: COLORS.button.primaryBg,
=======
    backgroundColor: colors.button.primaryBg,
>>>>>>> aditya mule delay zala ahe sagla
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  confirmButtonText: {
<<<<<<< HEAD
    color: COLORS.button.primaryText,
=======
    color: colors.button.primaryText,
>>>>>>> aditya mule delay zala ahe sagla
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
<<<<<<< HEAD
    backgroundColor: COLORS.button.secondaryBg,
=======
    backgroundColor: colors.button.secondaryBg,
>>>>>>> aditya mule delay zala ahe sagla
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginBottom: 8,
    borderWidth: 1,
<<<<<<< HEAD
    borderColor: COLORS.button.secondaryBorder,
  },
  secondaryButtonText: {
    color: COLORS.button.secondaryText,
    fontSize: 15,
    fontWeight: '600',
  },
});
=======
    borderColor: colors.button.secondaryBorder,
  },
  secondaryButtonText: {
    color: colors.button.secondaryText,
    fontSize: 15,
    fontWeight: '600',
  },
  });
}
>>>>>>> aditya mule delay zala ahe sagla

export default OfferRideScreen;
