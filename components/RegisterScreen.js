import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, SafeAreaView, Switch, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../helpers/use-app-theme';
import { authService } from '../services/api';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const { colors, statusBarStyle } = useAppTheme();
  const styles = useMemo(function () {
    return getStyles(colors);
  }, [colors]);
  const [fullName, setFullName] = useState('');
  const [phoneNumber1, setPhoneNumber1] = useState('');
  const [phoneNumber2, setPhoneNumber2] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDriver, setIsDriver] = useState(false);
  const [licenseType, setLicenseType] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    const trimmedPhone = phoneNumber1.trim();
    if (!trimmedPhone) {
      setError('Please enter a phone number');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.register({
        name: fullName.trim(),
        phone_number: trimmedPhone,
        password,
        // confirm_password: confirmPassword, 
        // is_driver: isDriver, // Future use
        // license_type: licenseType.trim(),
        // alternate_phone_number: phoneNumber2.trim(),
      });
      navigation.navigate('Verification', { phoneNumber: trimmedPhone });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDriverSwitch = () => setIsDriver(previousState => !previousState);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Antar</Text>
        <Text style={styles.greetingText}>Join us! Create your account.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Optional: Avatar Upload */}
        <TouchableOpacity style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>Add Photo</Text>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor={colors.text.tertiary}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="phone-pad"
              value={phoneNumber1}
              onChangeText={setPhoneNumber1}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { fontStyle: 'italic' }]}>Alternate Phone (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Backup number"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="phone-pad"
              value={phoneNumber2}
              onChangeText={setPhoneNumber2}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Confirm</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>
        </View>

        <View style={styles.driverSwitchContainer}>
          <Text style={styles.driverSwitchText}>Register as Driver?</Text>
          <Switch
            trackColor={{ false: colors.border.default, true: colors.accent.primary }}
            thumbColor={colors.bg.elevated}
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
                placeholder="e.g., Commercial"
                placeholderTextColor={colors.text.tertiary}
                value={licenseType}
                onChangeText={setLicenseType}
              />
            </View>
            <TouchableOpacity style={styles.uploadVehicleButton}>
              <Text style={styles.uploadVehicleText}>Upload Vehicle Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.createAccountButton, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.button.primaryText} />
          ) : (
            <Text style={styles.createAccountButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.primary,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 40,
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 8,
    },
    greetingText: {
      fontSize: 16,
      color: colors.text.secondary,
      marginBottom: 24,
    },
    errorText: {
      color: colors.state.error,
      marginBottom: 16,
      textAlign: 'center',
    },
    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.bg.elevated,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderStyle: 'dashed',
    },
    avatarText: {
      color: colors.text.secondary,
      fontSize: 12,
    },
    inputContainer: {
      marginBottom: 24,
    },
    inputGroup: {
      marginBottom: 16,
    },
    row: {
      flexDirection: 'row',
    },
    inputLabel: {
      color: colors.text.secondary,
      fontSize: 13,
      marginBottom: 6,
      marginLeft: 2,
    },
    input: {
      backgroundColor: colors.bg.elevated,
      color: colors.text.primary,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    driverSwitchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      backgroundColor: colors.bg.card,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    driverSwitchText: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '500',
    },
    driverFieldsContainer: {
      marginBottom: 24,
    },
    uploadVehicleButton: {
      backgroundColor: colors.bg.elevated,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.default,
      borderStyle: 'dashed',
      marginTop: 8,
    },
    uploadVehicleText: {
      color: colors.accent.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    createAccountButton: {
      backgroundColor: colors.button.primaryBg,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 24,
      shadowColor: colors.button.primaryBg,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    createAccountButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.button.primaryText,
    },
    loginPrompt: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 20,
    },
    loginPromptText: {
      color: colors.text.secondary,
      fontSize: 15,
      marginRight: 6,
    },
    loginLinkText: {
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}

export default RegisterScreen;