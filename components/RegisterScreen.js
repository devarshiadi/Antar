<<<<<<< HEAD
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, SafeAreaView, Switch, StatusBar } from 'react-native';
import { COLORS } from '../constants/theme';
=======
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, SafeAreaView, Switch, StatusBar } from 'react-native';
>>>>>>> aditya mule delay zala ahe sagla
import { useAppTheme } from '../helpers/use-app-theme';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const { colors, statusBarStyle } = useAppTheme();
<<<<<<< HEAD
=======
  const styles = useMemo(function () {
    return getStyles(colors);
  }, [colors]);
>>>>>>> aditya mule delay zala ahe sagla
  const [fullName, setFullName] = useState('');
  const [phoneNumber1, setPhoneNumber1] = useState('');
  const [phoneNumber2, setPhoneNumber2] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDriver, setIsDriver] = useState(false);
  const [licenseType, setLicenseType] = useState('');

  const handleRegister = () => {
    console.log('Registering with:', { fullName, phoneNumber1, phoneNumber2, password, confirmPassword, isDriver, licenseType });
    // Navigate to Verification screen
    navigation.navigate('Verification', { phoneNumber: phoneNumber1.trim() });
  };

  const toggleDriverSwitch = () => setIsDriver(previousState => !previousState);

  return (
<<<<<<< HEAD
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />
      <Text style={[styles.headerTitle, { color: colors.text.primary }]}>RegisterScreen</Text>
      <Text style={[styles.greetingText, { color: colors.text.secondary }]}>Join Antar! Please create a account.</Text>
=======
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />
      <Text style={styles.headerTitle}>RegisterScreen</Text>
      <Text style={styles.greetingText}>Join Antar! Please create a account.</Text>
>>>>>>> aditya mule delay zala ahe sagla

      <TouchableOpacity style={styles.avatarPlaceholder}>
        <Text style={[styles.avatarText, { color: colors.text.primary }]}>Tap to upload avatar</Text>
      </TouchableOpacity>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Full Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg.elevated, borderColor: colors.border.default, borderWidth: 1, color: colors.text.primary }]}
          placeholder="Full Name"
          placeholderTextColor={colors.text.tertiary}
          value={fullName}
          onChangeText={setFullName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Phone Number</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg.elevated, borderColor: colors.border.default, borderWidth: 1, color: colors.text.primary }]}
          placeholder="Phone Number"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="phone-pad"
          value={phoneNumber1}
          onChangeText={setPhoneNumber1}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Phone Number</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg.elevated, borderColor: colors.border.default, borderWidth: 1, color: colors.text.primary }]}
          placeholder="Phone Number"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="phone-pad"
          value={phoneNumber2}
          onChangeText={setPhoneNumber2}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg.elevated, borderColor: colors.border.default, borderWidth: 1, color: colors.text.primary }]}
          placeholder="Password"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Confirm Password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg.elevated, borderColor: colors.border.default, borderWidth: 1, color: colors.text.primary }]}
          placeholder="Confirm Password"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      <View style={styles.driverSwitchContainer}>
        <Text style={[styles.driverSwitchText, { color: colors.text.primary }]}>Are you registering as a driver?</Text>
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
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>License Type</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg.elevated, borderColor: colors.border.default, borderWidth: 1, color: colors.text.primary }]}
              placeholder="License Type"
              placeholderTextColor={colors.text.tertiary}
              value={licenseType}
              onChangeText={setLicenseType}
            />
          </View>
          <TouchableOpacity style={styles.uploadVehicleButton}>
            <Text style={[styles.uploadVehicleText, { color: colors.text.primary }]}>Upload Vehicle Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.createAccountButton} onPress={handleRegister}>
        <Text style={styles.createAccountButtonText}>Create Account</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

<<<<<<< HEAD
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
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
    backgroundColor: COLORS.button.primaryBg,
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  createAccountButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.button.primaryText,
  },
});
=======
function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.primary,
      paddingHorizontal: 20,
      paddingTop: 40,
    },
    headerTitle: {
      fontSize: 30,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 5,
    },
    greetingText: {
      fontSize: 16,
      color: colors.text.secondary,
      marginBottom: 30,
    },
    avatarPlaceholder: {
      backgroundColor: colors.bg.elevated,
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 30,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    avatarText: {
      color: colors.text.primary,
      fontSize: 12,
      textAlign: 'center',
    },
    inputGroup: {
      width: '100%',
      marginBottom: 15,
    },
    inputLabel: {
      color: colors.text.secondary,
      fontSize: 14,
      marginBottom: 5,
    },
    input: {
      backgroundColor: colors.bg.elevated,
      color: colors.text.primary,
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 8,
      fontSize: 16,
      width: '100%',
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    driverSwitchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginBottom: 20,
    },
    driverSwitchText: {
      color: colors.text.primary,
      fontSize: 16,
    },
    driverFieldsContainer: {
      width: '100%',
      marginBottom: 20,
    },
    uploadVehicleButton: {
      backgroundColor: colors.bg.elevated,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    uploadVehicleText: {
      color: colors.text.primary,
      fontSize: 16,
    },
    createAccountButton: {
      backgroundColor: colors.button.primaryBg,
      paddingVertical: 15,
      borderRadius: 10,
      width: '100%',
      alignItems: 'center',
      marginTop: 20,
    },
    createAccountButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.button.primaryText,
    },
  });
}
>>>>>>> aditya mule delay zala ahe sagla

export default RegisterScreen;