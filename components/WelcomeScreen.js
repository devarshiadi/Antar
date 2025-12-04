import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    image: require('../assets/scooter1.gif'), // Placeholder for map image
    title: 'Find Your Way, Faster',
    subtitle: 'Allow location access for realme navigation.',
  },
  {
    image: require('../assets/scooter1.gif'), // Placeholder for people image
    title: 'Connect & Share Trips',
    subtitle: 'Meet other riders and plan long journeys together.',
  },
  {
    image: require('../assets/scooter1.gif'), // Original scooter image
    title: 'Unlock Endless Possibilities',
    subtitle: 'Start your journey with Antar today!',
  },
];

const WelcomeScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentScreen = onboardingData[currentIndex];
  const isLastScreen = currentIndex === onboardingData.length - 1;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Navigate to Login screen
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    // Navigate to Login screen
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Skip button - hide on last screen */}
      {!isLastScreen && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      )}
      {isLastScreen && <View style={styles.skipButtonPlaceholder} />}

      <View style={styles.topContent}>
        <Image
          source={currentScreen.image}
          style={styles.onboardingImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>{currentScreen.title}</Text>
        <Text style={styles.subtitle}>{currentScreen.subtitle}</Text>
      </View>
      
      <View style={styles.bottomContent}>
        <View style={styles.paginationDots}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot,
                currentIndex === index && styles.activeDotExpanded
              ]}
            />
          ))}
        </View>
        
        <TouchableOpacity 
          style={[styles.nextButton, isLastScreen && styles.getStartedButton]} 
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={[styles.nextButtonText, isLastScreen && styles.getStartedText]}>
            {isLastScreen ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
        
        {!isLastScreen && (
          <Text style={styles.pageIndicator}>{currentIndex + 1} of {onboardingData.length}</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginTop: 10,
  },
  skipButtonPlaceholder: {
    height: 44, // Same height as skip button to maintain layout
  },
  skipButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
  topContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -height * 0.05, // Pull content up slightly
  },
  onboardingImage: {
    width: width * 0.75,
    height: height * 0.28,
    marginBottom: height * 0.05,
  },
  title: {
    fontSize: Math.min(width * 0.075, 28),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: Math.min(width * 0.04, 16),
    color: '#aaa',
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 22,
  },
  bottomContent: {
    paddingBottom: height * 0.03,
    alignItems: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    marginBottom: height * 0.04,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
    marginHorizontal: 4,
    transition: 'all 0.3s',
  },
  activeDot: {
    backgroundColor: '#fff',
  },
  activeDotExpanded: {
    width: 24, // Expanded width for active dot
  },
  nextButton: {
    backgroundColor: '#fff',
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.2,
    borderRadius: 25,
    minWidth: width * 0.75,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  getStartedButton: {
    backgroundColor: '#4CAF50', // Green for final CTA
  },
  nextButtonText: {
    fontSize: Math.min(width * 0.042, 17),
    fontWeight: '600',
    color: '#000',
  },
  getStartedText: {
    color: '#fff',
  },
  pageIndicator: {
    color: '#666',
    fontSize: 13,
    fontWeight: '400',
  },
});

export default WelcomeScreen;