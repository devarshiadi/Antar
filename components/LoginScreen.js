import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useAppTheme } from '../helpers/use-app-theme';
import { useSession } from '../helpers/session-context';
import { authService } from '../services/api';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { colors, statusBarStyle } = useAppTheme();
  const { setSession } = useSession();
  const styles = useMemo(function () {
    return getStyles(colors);
  }, [colors]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authService.login(trimmedPhone, password);
      if (result && result.access_token && result.user) {
        await setSession({ token: result.access_token, user: result.user });
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
        return;
      }
      // If login successful but no token (e.g. requires verification), usually handled by backend returning 401 or specific code
      // But based on current auth service, login returns token. 
      // If we fall here, something is odd, but let's assume verification needed if backend says so?
      // Actually, standard login should just work or fail. 

    } catch (err) {
      console.error('Login error:', err);
      // If user is not verified, backend might return a specific error or we might handle it.
      // For now, let's display the error.
      setError(err.message || 'Login failed. Please check your credentials.');

      // OPTIONAL: If backend says "User not verified", specific handling:
      if (err.message && err.message.includes('verified')) {
        navigation.navigate('Verification', { phoneNumber: trimmedPhone });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />
      <Text style={styles.headerTitle}>Antar</Text>
      <Text style={styles.greetingText}>Welcome back! Please login.</Text>

      {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Phone Number</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg.elevated, borderColor: colors.border.default, borderWidth: 1, color: colors.text.primary }]}
          placeholder="(555) 123-45"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg.elevated, borderColor: colors.border.default, borderWidth: 1, color: colors.text.primary }]}
          placeholder="••••••••"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity style={styles.forgotPasswordButton}>
        <Text style={[styles.forgotPasswordText, { color: colors.text.secondary }]}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.loginButton, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.button.primaryText} />
        ) : (
          <Text style={styles.loginButtonText}>Log In</Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.orConnectWith, { color: colors.text.secondary }]}>Or connect with</Text>

      <View style={styles.socialLoginContainer}>
        <TouchableOpacity style={styles.socialButton}>
          <FontAwesome name="google" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <FontAwesome name="facebook-square" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <FontAwesome name="apple" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.registerPrompt}>
        <Text style={[styles.registerPromptText, { color: colors.text.secondary }]}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.registerLinkText, { color: colors.text.primary }]}>Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.primary,
      paddingHorizontal: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.text.primary,
      alignSelf: 'flex-start',
      marginBottom: 5,
    },
    greetingText: {
      fontSize: 16,
      color: colors.text.secondary,
      alignSelf: 'flex-start',
      marginBottom: 40,
    },
    inputGroup: {
      width: '100%',
      marginBottom: 20,
    },
    inputLabel: {
      color: colors.text.secondary,
      fontSize: 14,
      marginBottom: 5,
    },
    input: {
      backgroundColor: colors.bg.elevated,
      color: colors.text.primary,
      paddingVertical: 15,
      paddingHorizontal: 15,
      borderRadius: 10,
      fontSize: 16,
      width: '100%',
    },
    forgotPasswordButton: {
      alignSelf: 'flex-end',
      marginBottom: 30,
    },
    forgotPasswordText: {
      color: colors.text.secondary,
      fontSize: 14,
    },
    loginButton: {
      backgroundColor: colors.button.primaryBg,
      paddingVertical: 15,
      borderRadius: 10,
      width: '100%',
      alignItems: 'center',
      marginBottom: 30,
    },
    loginButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.button.primaryText,
    },
    orConnectWith: {
      color: colors.text.secondary,
      fontSize: 14,
      marginBottom: 20,
    },
    socialLoginContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '80%',
    },
    socialButton: {
      backgroundColor: colors.bg.card,
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    registerPrompt: {
      flexDirection: 'row',
      marginTop: 20,
    },
    registerPromptText: {
      color: colors.text.secondary,
      fontSize: 14,
      marginRight: 5,
    },
    registerLinkText: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: 'bold',
    },
  });
}

export default LoginScreen;