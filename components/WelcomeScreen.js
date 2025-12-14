import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../helpers/use-app-theme';

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

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.primary,
      paddingHorizontal: 20,
    },
    topContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -height * 0.05,
    },
    onboardingImage: {
      width: width * 0.75,
      height: height * 0.28,
      marginBottom: height * 0.05,
    },
    title: {
      fontSize: Math.min(width * 0.075, 28),
      fontWeight: 'bold',
      marginBottom: 12,
      textAlign: 'center',
      paddingHorizontal: 20,
      color: colors.text.primary,
    },
    subtitle: {
      fontSize: Math.min(width * 0.04, 16),
      textAlign: 'center',
      paddingHorizontal: 30,
      lineHeight: 22,
      color: colors.text.secondary,
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
      backgroundColor: colors.text.tertiary,
      marginHorizontal: 4,
    },
    activeDot: {
      backgroundColor: colors.text.primary,
    },
    activeDotExpanded: {
      width: 24,
    },
    nextButton: {
      backgroundColor: colors.button.primaryBg,
      paddingVertical: height * 0.018,
      paddingHorizontal: width * 0.2,
      borderRadius: 25,
      minWidth: width * 0.75,
      alignItems: 'center',
      marginBottom: 15,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    nextButtonText: {
      fontSize: Math.min(width * 0.042, 17),
      fontWeight: '600',
      color: colors.button.primaryText,
    },
    pageIndicator: {
      color: colors.text.tertiary,
      fontSize: 13,
      fontWeight: '400',
    },
  });
}

const WelcomeScreen = ({ navigation }) => {
  const { colors, statusBarStyle } = useAppTheme();
  const styles = useMemo(function () {
    return getStyles(colors);
  }, [colors]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentScreen = onboardingData[currentIndex];
  const isLastScreen = currentIndex === onboardingData.length - 1;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />
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
          style={styles.nextButton} 
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
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

export default WelcomeScreen;