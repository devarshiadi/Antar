import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
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
} from 'lucide-react-native';

const STORAGE_KEY = '@offer_ride_user_data';

const OfferRideScreen = ({ navigation, route }) => {
  const [vehicleType, setVehicleType] = useState('car');
  const [seatCount, setSeatCount] = useState(2);
  const [sourceLocation, setSourceLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [userName, setUserName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

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

  const loadUserData = async () => {
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
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUserData = async () => {
    try {
      const dataToSave = {
        userName,
        phoneNumber,
        vehicleNumber,
        vehicleType,
        seatCount,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const handleVehicleChange = (type) => {
    setVehicleType(type);
    if (type === 'bike') {
      setSeatCount(1);
    } else if (seatCount === 1) {
      setSeatCount(2);
    }
  };

  const handleSourceSelect = () => {
    navigation.navigate('LocationPicker', {
      tripType: 'offer',
      locationType: 'source',
      returnScreen: 'OfferRide',
    });
  };

  const handleDestinationSelect = () => {
    navigation.navigate('LocationPicker', {
      tripType: 'offer',
      locationType: 'destination',
      returnScreen: 'OfferRide',
    });
  };

  const handleConfirm = async () => {
    if (!userName.trim()) {
      Alert.alert('Missing Information', 'Please enter your name.', [{ text: 'OK' }]);
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      Alert.alert('Missing Information', 'Please enter a valid phone number (at least 10 digits).', [{ text: 'OK' }]);
      return;
    }
    if (!vehicleNumber.trim()) {
      Alert.alert('Missing Information', 'Please enter your vehicle number.', [{ text: 'OK' }]);
      return;
    }
    if (!sourceLocation || !destinationLocation) {
      Alert.alert('Missing Information', 'Please select both pickup and destination locations.', [{ text: 'OK' }]);
      return;
    }

    await saveUserData();

    navigation.navigate('Matches', {
      tripType: 'offer',
      vehicleType,
      seatCount,
      source: sourceLocation,
      destination: destinationLocation,
      userInfo: {
        name: userName,
        phone: phoneNumber,
        vehicleNumber,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offer a Ride</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Information</Text>
          
          <View style={styles.inputContainer}>
            <User size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#666"
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#666"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <View style={styles.inputContainer}>
            <Hash size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Vehicle Number (e.g., DL01AB1234)"
              placeholderTextColor="#666"
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
                color={vehicleType === 'car' ? '#000' : '#fff'}
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
                color={vehicleType === 'bike' ? '#000' : '#fff'}
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
              <Users size={20} color="#4CAF50" />
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
            <Navigation size={20} color="#4CAF50" />
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
                {destinationLocation ? destinationLocation.address : 'Select destination'}
              </Text>
            </View>
            <MapPin size={20} color="#F44336" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Offering a ride helps reduce traffic and pollution while sharing travel costs
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          activeOpacity={0.9}
        >
          <Text style={styles.confirmButtonText}>Confirm & Publish Ride</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    color: '#fff',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  vehicleOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleOption: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  vehicleOptionActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000',
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
  },
  vehicleTextActive: {
    color: '#000',
  },
  seatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  seatInfoText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  seatOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  seatButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  seatButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  seatButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  seatButtonTextActive: {
    color: '#fff',
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#4CAF50',
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
    color: '#888',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  locationDivider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginLeft: 24,
    marginVertical: 12,
  },
  infoBox: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  infoText: {
    fontSize: 14,
    color: '#4CAF50',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  confirmButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default OfferRideScreen;
