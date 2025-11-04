import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Pressable,
  Animated,
  Easing,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const CORRECT_CODE = '123456';
const CODE_LENGTH = 6;
const INITIAL_TIMER = 30;

// Reusable Blinking Cursor Component
const BlinkingCursor = () => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { 
          toValue: 0, 
          duration: 500, 
          useNativeDriver: true 
        }),
        Animated.timing(opacity, { 
          toValue: 1, 
          duration: 500, 
          useNativeDriver: true 
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.cursor, { opacity }]} />;
};

const VerificationScreen = ({ navigation }) => {
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(INITIAL_TIMER);
  const [isFocused, setIsFocused] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [resendCount, setResendCount] = useState(0);
  const [isResending, setIsResending] = useState(false);
  
  const inputRef = useRef(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);
  const successAnimation = useRef(new Animated.Value(0)).current;

  // Start or restart timer
  const startTimer = () => {
    clearInterval(intervalRef.current);
    setTimer(INITIAL_TIMER);
    intervalRef.current = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer > 1) {
          return prevTimer - 1;
        } else {
          clearInterval(intervalRef.current);
          return 0;
        }
      });
    }, 1000);
  };

  // Initial focus and timer start
  useEffect(() => {
    // Auto-focus on mount with a small delay for better UX
    const focusTimeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    
    startTimer();
    
    return () => {
      clearTimeout(focusTimeout);
      clearInterval(intervalRef.current);
    };
  }, []);

  // Verify the entered code
  const verifyCode = async (enteredCode) => {
    setVerificationStatus('verifying');
    Keyboard.dismiss();
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (enteredCode === CORRECT_CODE) {
      setVerificationStatus('success');
      clearInterval(intervalRef.current);
      triggerSuccessAnimation();
      
      // Navigate to Home screen after success
      setTimeout(() => {
        navigation.replace('Home');
      }, 1000);
    } else {
      setVerificationStatus('error');
      triggerShake();
      
      setTimeout(() => {
        setCode('');
        setVerificationStatus('idle');
        inputRef.current?.focus();
      }, 1500);
    }
  };

  // Auto-verify when code is complete
  useEffect(() => {
    if (code.length === CODE_LENGTH && verificationStatus === 'idle') {
      verifyCode(code);
    }
  }, [code]);

  // Handle resend functionality
  const handleResend = async () => {
    if (timer === 0 && !isResending) {
      setIsResending(true);
      
      // Simulate API call for resending code
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setResendCount(prev => prev + 1);
      Alert.alert(
        "Code Resent", 
        `A new verification code has been sent to your phone.\n(Attempt ${resendCount + 1})`,
        [{ text: "OK" }]
      );
      
      // Reset state
      setCode('');
      setVerificationStatus('idle');
      setIsResending(false);
      startTimer();
      
      // Refocus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Handle text input changes
  const handleTextChange = (text) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, '');
    
    // Don't allow input during verification or after success
    if (verificationStatus !== 'verifying' && verificationStatus !== 'success') {
      setCode(numericText.slice(0, CODE_LENGTH));
    }
  };

  // Handle backspace
  const handleKeyPress = ({ nativeEvent }) => {
    if (nativeEvent.key === 'Backspace' && code.length > 0) {
      setCode(code.slice(0, -1));
    }
  };
  
  // Shake animation for error
  const triggerShake = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 1,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -1,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 1,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Success animation
  const triggerSuccessAnimation = () => {
    Animated.spring(successAnimation, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const shakeInterpolation = shakeAnimation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-10, 0, 10],
  });

  const successScale = successAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  // Calculate progress for timer bar
  const progress = timer > 0 ? (INITIAL_TIMER - timer) / INITIAL_TIMER : 1;

  // Get status message
  const getStatusMessage = () => {
    switch(verificationStatus) {
      case 'verifying':
        return <Text style={styles.statusText}>Verifying code...</Text>;
      case 'success':
        return <Text style={[styles.statusText, styles.statusSuccess]}>✓ Verified Successfully!</Text>;
      case 'error':
        return <Text style={[styles.statusText, styles.statusError]}>❌ Incorrect code. Please try again.</Text>;
      default:
        return null;
    }
  };

  // Get box style based on state - FIXED: renamed local variable to avoid conflict
  const getBoxStyle = (index) => {
    const boxStyles = [styles.otpBox]; // Changed from 'styles' to 'boxStyles'
    const isCurrent = index === code.length && isFocused;
    const isFilled = index < code.length;

    if (verificationStatus === 'success') {
      boxStyles.push(styles.otpBoxSuccess);
    } else if (verificationStatus === 'error') {
      boxStyles.push(styles.otpBoxError);
    } else if (isCurrent) {
      boxStyles.push(styles.otpBoxFocused);
    } else if (isFilled) {
      boxStyles.push(styles.otpBoxFilled);
    }

    return boxStyles;
  };

  // Handle individual box press
  const handleBoxPress = () => {
    if (verificationStatus !== 'success' && verificationStatus !== 'verifying') {
      inputRef.current?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable 
        style={styles.content} 
        onPress={handleBoxPress}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Antar</Text>
          <Text style={styles.headerSubtitle}>Verify Phone Number</Text>
          <Text style={styles.instructionText}>
            Please enter the 6-digit code sent to{'\n'}
            <Text style={styles.phoneNumber}>(555) 123-4567</Text>
          </Text>
          {__DEV__ && (
            <Text style={styles.debugText}>Dev Mode: Use code {CORRECT_CODE}</Text>
          )}
        </View>

        {/* Hidden TextInput for handling keyboard input */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={code}
          onChangeText={handleTextChange}
          onKeyPress={handleKeyPress}
          maxLength={CODE_LENGTH}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={verificationStatus !== 'success' && verificationStatus !== 'verifying'}
          caretHidden={true}
        />

        {/* Visual OTP boxes */}
        <Animated.View 
          style={[
            styles.otpContainer, 
            { 
              transform: [
                { translateX: shakeInterpolation },
                { scale: verificationStatus === 'success' ? successScale : 1 }
              ] 
            }
          ]}
        >
          {Array(CODE_LENGTH).fill('').map((_, index) => {
            const digit = code[index];
            const isCurrent = index === code.length && isFocused;
            const showCursor = isCurrent && verificationStatus === 'idle';

            return (
              <TouchableOpacity
                key={index}
                style={getBoxStyle(index)}
                onPress={handleBoxPress}
                activeOpacity={0.8}
                disabled={verificationStatus === 'success' || verificationStatus === 'verifying'}
              >
                {digit ? (
                  <Text style={styles.otpText}>{digit}</Text>
                ) : showCursor ? (
                  <BlinkingCursor />
                ) : (
                  <View style={styles.dot} />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Status message */}
        <View style={styles.statusContainer}>
          {getStatusMessage()}
        </View>

        <View style={{ flex: 1 }} />

        {/* Timer and Resend section */}
        {verificationStatus !== 'success' && (
          <View style={styles.bottomSection}>
            <View style={styles.timerSection}>
              <View style={styles.progressBarContainer}>
                <Animated.View 
                  style={[
                    styles.progressBar, 
                    { width: `${progress * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.timerText}>
                {timer > 0 ? `0:${String(timer).padStart(2, '0')}` : 'Expired'}
              </Text>
            </View>
            
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                {timer > 0 ? `Wait ${timer}s to resend` : "Didn't receive code?"}
              </Text>
              <TouchableOpacity 
                onPress={handleResend} 
                disabled={timer > 0 || isResending}
                style={styles.resendButtonContainer}
              >
                <Text style={[
                  styles.resendButton, 
                  { opacity: timer > 0 || isResending ? 0.4 : 1 }
                ]}>
                  {isResending ? 'Sending...' : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {resendCount > 0 && (
              <Text style={styles.resendCountText}>
                Resend attempts: {resendCount}
              </Text>
            )}
          </View>
        )}
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212' 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 24, 
    paddingTop: height * 0.08, 
    paddingBottom: height * 0.05 
  },
  header: {
    marginBottom: height * 0.04,
  },
  headerTitle: { 
    fontSize: Math.min(width * 0.1, 40), 
    fontWeight: 'bold', 
    color: '#FFFFFF', 
    marginBottom: 8 
  },
  headerSubtitle: { 
    fontSize: Math.min(width * 0.065, 26), 
    fontWeight: '600', 
    color: '#FFFFFF', 
    marginBottom: 16 
  },
  instructionText: { 
    fontSize: Math.min(width * 0.04, 16), 
    color: '#A9A9A9', 
    lineHeight: 24 
  },
  phoneNumber: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  debugText: {
    fontSize: 12,
    color: '#FFC107',
    marginTop: 8,
    fontStyle: 'italic',
  },
  hiddenInput: { 
    position: 'absolute', 
    width: 0, 
    height: 0, 
    opacity: 0 
  },
  otpContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: height * 0.02,
    paddingHorizontal: 5,
  },
  otpBox: {
    width: Math.min((width - 78) / CODE_LENGTH, 55),
    height: 64,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2C2C2C',
    marginHorizontal: 2,
  },
  otpBoxFilled: { 
    borderColor: '#3478F6',
    backgroundColor: '#1A1A2E',
  },
  otpBoxFocused: { 
    borderColor: '#FFFFFF',
    backgroundColor: '#2A2A3E',
    elevation: 3,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  otpBoxSuccess: { 
    borderColor: '#4CAF50', 
    backgroundColor: 'rgba(76, 175, 80, 0.15)' 
  },
  otpBoxError: { 
    borderColor: '#F44336', 
    backgroundColor: 'rgba(244, 67, 54, 0.15)' 
  },
  otpText: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: '#FFFFFF' 
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#4A4A4A' 
  },
  cursor: { 
    width: 2, 
    height: 28, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 1 
  },
  statusContainer: { 
    height: 40, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 20 
  },
  statusText: { 
    fontSize: 15, 
    fontWeight: '500', 
    color: '#FFFFFF' 
  },
  statusSuccess: {
    color: '#4CAF50',
    fontSize: 16,
  },
  statusError: {
    color: '#F44336',
    fontSize: 14,
  },
  bottomSection: {
    marginBottom: 20,
  },
  timerSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  progressBarContainer: { 
    flex: 1, 
    height: 4, 
    backgroundColor: '#333333', 
    borderRadius: 2, 
    marginRight: 16,
    overflow: 'hidden',
  },
  progressBar: { 
    height: '100%', 
    backgroundColor: '#3478F6', 
    borderRadius: 2 
  },
  timerText: { 
    color: '#A9A9A9', 
    fontSize: 14, 
    fontWeight: '600',
    minWidth: 45,
  },
  resendContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendText: { 
    color: '#A9A9A9', 
    fontSize: 15,
    marginRight: 8,
  },
  resendButtonContainer: {
    padding: 4,
  },
  resendButton: { 
    color: '#3478F6', 
    fontSize: 15, 
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  resendCountText: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default VerificationScreen;