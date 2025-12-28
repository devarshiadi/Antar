<<<<<<< HEAD
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
=======
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
>>>>>>> aditya mule delay zala ahe sagla
import { useAppTheme } from '../helpers/use-app-theme';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { colors, statusBarStyle } = useAppTheme();
<<<<<<< HEAD
=======
  const styles = useMemo(function () {
    return getStyles(colors);
  }, [colors]);
>>>>>>> aditya mule delay zala ahe sagla
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    navigation.navigate('Verification', { phoneNumber: phoneNumber.trim() });
  };

  return (
<<<<<<< HEAD
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />
      <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Antar</Text>
      <Text style={[styles.greetingText, { color: colors.text.secondary }]}>Welcome back! Please login.</Text>
=======
    <SafeAreaView style={[styles.container]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />
      <Text style={styles.headerTitle}>Antar</Text>
      <Text style={styles.greetingText}>Welcome back! Please login.</Text>
>>>>>>> aditya mule delay zala ahe sagla

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

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Log In</Text>
      </TouchableOpacity>

      <Text style={[styles.orConnectWith, { color: colors.text.secondary }]}>Or connect with</Text>

      <View style={styles.socialLoginContainer}>
        <TouchableOpacity style={styles.socialButton}>
<<<<<<< HEAD
          <FontAwesome name="google" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <FontAwesome name="facebook-square" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <FontAwesome name="apple" size={24} color="#000" />
=======
          <FontAwesome name="google" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <FontAwesome name="facebook-square" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <FontAwesome name="apple" size={24} color={colors.text.primary} />
>>>>>>> aditya mule delay zala ahe sagla
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

<<<<<<< HEAD
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  greetingText: {
    fontSize: 16,
    color: '#ccc',
    alignSelf: 'flex-start',
    marginBottom: 40,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
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
    color: '#ccc',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: COLORS.button.primaryBg,
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.button.primaryText,
  },
  orConnectWith: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 20,
  },
  socialLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  socialButton: {
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerPrompt: {
    flexDirection: 'row',
    marginTop: 20,
  },
  registerPromptText: {
    color: '#ccc',
    fontSize: 14,
    marginRight: 5,
  },
  registerLinkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
=======
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
>>>>>>> aditya mule delay zala ahe sagla

export default LoginScreen;