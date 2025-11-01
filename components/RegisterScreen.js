import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, SafeAreaView, Switch } from 'react-native';

const { width, height } = Dimensions.get('window');

const RegisterScreen = () => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber1, setPhoneNumber1] = useState('');
  const [phoneNumber2, setPhoneNumber2] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDriver, setIsDriver] = useState(false);
  const [licenseType, setLicenseType] = useState('');

  const handleRegister = () => {
    console.log('Registering with:', { fullName, phoneNumber1, phoneNumber2, password, confirmPassword, isDriver, licenseType });
    // Implement registration logic here
  };

  const toggleDriverSwitch = () => setIsDriver(previousState => !previousState);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>RegisterScreen</Text>
      <Text style={styles.greetingText}>Join Antar! Please create a account.</Text>

      <TouchableOpacity style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>Tap to upload avatar</Text>
      </TouchableOpacity>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#666"
          value={fullName}
          onChangeText={setFullName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
          value={phoneNumber1}
          onChangeText={setPhoneNumber1}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
          value={phoneNumber2}
          onChangeText={setPhoneNumber2}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#666"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      <View style={styles.driverSwitchContainer}>
        <Text style={styles.driverSwitchText}>Are you registering as a driver?</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isDriver ? "#f5dd4b" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleDriverSwitch}
          value={isDriver}
        />
      </View>

      {isDriver && (
        <View style={styles.driverFieldsContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>License Type</Text>
            <TextInput
              style={styles.input}
              placeholder="License Type"
              placeholderTextColor="#666"
              value={licenseType}
              onChangeText={setLicenseType}
            />
          </View>
          <TouchableOpacity style={styles.uploadVehicleButton}>
            <Text style={styles.uploadVehicleText}>Upload Vehicle Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.createAccountButton} onPress={handleRegister}>
        <Text style={styles.createAccountButtonText}>Create Account</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  greetingText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 30,
  },
  avatarPlaceholder: {
    backgroundColor: '#333',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 30,
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 15,
  },
  inputLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
    width: '100%',
  },
  driverSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  driverSwitchText: {
    color: '#fff',
    fontSize: 16,
  },
  driverFieldsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  uploadVehicleButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadVehicleText: {
    color: '#fff',
    fontSize: 16,
  },
  createAccountButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  createAccountButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default RegisterScreen;