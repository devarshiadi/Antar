import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Dimensions, 
  TouchableOpacity, 
  TextInput,
  Keyboard,
  Pressable,
  Animated,
  Easing,
  Alert
} from 'react-native';

const { width, height } = Dimensions.get('window');

const CORRECT_CODE = '123456';
const CODE_LENGTH = 6;
const INITIAL_TIMER = 30;

const VerificationScreen = () => {
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(INITIAL_TIMER);
  const [verificationStatus, setVerificationStatus] = useState('idle'); // 'idle', 'verifying', 'success', 'error'
  const inputRef = useRef(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);

  // Function to start the countdown timer
  const startTimer = () => {
    clearInterval(intervalRef.current); // Clear any existing timer
    intervalRef.current = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer > 1) {
          return prevTimer - 1;
        }
        clearInterval(intervalRef.current);
        return 0;
      });
    }, 1000);
  };
  
  // Start timer and focus input on component mount
  useEffect(() => {
    inputRef.current?.focus();
    startTimer();
    return () => clearInterval(intervalRef.current); // Cleanup on unmount
  }, []);

  // Function to verify the code
  const verifyCode = async (enteredCode) => {
    setVerificationStatus('verifying');
    Keyboard.dismiss();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (enteredCode === CORRECT_CODE) {
      setVerificationStatus('success');
      clearInterval(intervalRef.current); // Stop timer on success
    } else {
      setVerificationStatus('error');
      triggerShake();
      // Reset after showing error for a bit
      setTimeout(() => {
        setCode('');
        setVerificationStatus('idle');
        inputRef.current?.focus();
      }, 1500);
    }
  };

  // Trigger verification when code is fully entered
  useEffect(() => {
    if (code.length === CODE_LENGTH) {
      verifyCode(code);
    }
  }, [code]);

  // Reset timer and clear code on resend
  const handleResend = () => {
    if (timer === 0) {
      Alert.alert("Code Resent", "A new verification code has been sent to your number.");
      setCode('');
      setVerificationStatus('idle');
      setTimer(INITIAL_TIMER);
      startTimer();
      inputRef.current?.focus();
    }
  };
  
  // Handle text input, allowing only numbers
  const handleTextChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (verificationStatus !== 'verifying' && verificationStatus !== 'success') {
      setCode(numericText);
    }
  };

  // Animation for incorrect code
  const triggerShake = () => {
    shakeAnimation.setValue(0);
    Animated.timing(shakeAnimation, {
      toValue: 1,
      duration: 400,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const shakeInterpolation = shakeAnimation.interpolate({
    inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    outputRange: [0, -10, 10, -10, 10, -5, 5, -5, 5, -2, 0],
  });

  // Calculate progress for the timer bar
  const progress = (INITIAL_TIMER - timer) / INITIAL_TIMER;

  // Determine styles and text based on status
  const getStatusMessage = () => {
    switch(verificationStatus) {
      case 'verifying':
        return <Text style={styles.statusText}>Verifying...</Text>;
      case 'success':
        return <Text style={[styles.statusText, { color: '#4CAF50' }]}>✓ Verified Successfully!</Text>;
      case 'error':
        return <Text style={[styles.statusText, { color: '#F44336' }]}>Incorrect code. Please try again.</Text>;
      default:
        return null;
    }
  };

  const getBoxStyle = (index) => {
    let style = [styles.otpBox];
    if (verificationStatus === 'success') {
        style.push(styles.otpBoxSuccess);
    }
    if (verificationStatus === 'error') {
        style.push(styles.otpBoxError);
    }
    return style;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.content} onPress={() => inputRef.current?.focus()}>
        
        <View>
            <Text style={styles.headerTitle}>Antar</Text>
            <Text style={styles.headerSubtitle}>Verify Phone Number</Text>
            <Text style={styles.instructionText}>
                Please enter the 6-digit code sent to{'\n'}(555) 123-45
            </Text>
        </View>

        <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={handleTextChange}
            maxLength={CODE_LENGTH}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            editable={verificationStatus !== 'success'}
        />

        <Animated.View style={[styles.otpContainer, { transform: [{ translateX: shakeInterpolation }] }]}>
            {Array(CODE_LENGTH).fill('').map((_, index) => {
                const digit = code[index];
                return (
                    <View key={index} style={getBoxStyle(index)}>
                        {digit ? (
                            <Text style={styles.otpText}>{digit}</Text>
                        ) : (
                            <View style={styles.dot} />
                        )}
                    </View>
                );
            })}
        </Animated.View>

        <View style={styles.statusContainer}>
          {getStatusMessage()}
        </View>
        
        <View style={{flex: 1}} />

        {verificationStatus !== 'success' && (
          <View>
              <View style={styles.timerSection}>
                  <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                  </View>
                  <Text style={styles.timerText}>
                      0:{String(timer).padStart(2, '0')}
                  </Text>
              </View>

              <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>Didn't receive code? </Text>
                  <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                      <Text style={[styles.resendButton, { opacity: timer > 0 ? 0.6 : 1 }]}>
                          Resend
                      </Text>
                  </TouchableOpacity>
              </View>
          </View>
        )}
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.1,
    paddingBottom: height * 0.05,
  },
  headerTitle: {
    fontSize: Math.min(width * 0.1, 40),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: Math.min(width * 0.07, 28),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: Math.min(width * 0.04, 16),
    color: '#A9A9A9',
    lineHeight: 24,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: height * 0.05,
  },
  otpBox: {
    width: (width - 48 - 32) / 3, // 3 boxes per row with 16px gap
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  otpBoxSuccess: {
    borderColor: '#4CAF50', // Green border for success
    backgroundColor: 'rgba(76, 175, 80, 0.1)'
  },
  otpBoxError: {
    borderColor: '#F44336', // Red border for error
    backgroundColor: 'rgba(244, 67, 54, 0.1)'
  },
  otpText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DCDCDC',
  },
  statusContainer: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    marginRight: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  timerText: {
    color: '#A9A9A9',
    fontSize: 14,
    fontWeight: '500',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    color: '#A9A9A9',
    fontSize: 16,
  },
  resendButton: {
    color: '#3478F6',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VerificationScreen;