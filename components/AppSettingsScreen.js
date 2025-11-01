import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
  StatusBar,
} from 'react-native';

// --- Custom Component for Toggle Row ---
const SettingsToggleRow = ({ label, isEnabled, onToggle }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch
      trackColor={{ false: '#3E3E3E', true: '#4A90E2' }} // Dark grey for false, Blue for true
      thumbColor={isEnabled ? '#FFF' : '#FFF'} // White thumb
      onValueChange={onToggle}
      value={isEnabled}
    />
  </View>
);

// --- Custom Component for Action/Link Row ---
const SettingsActionRow = ({ label, isDanger = false, isToggle = false, isEnabled = false, onAction, onToggle }) => {
  const labelStyle = [styles.rowLabel, isDanger && styles.dangerText];
  
  // Custom logic to handle the "Clear Cache" row which has a dark toggle in the image
  if (label === 'Clear Cache') {
      return (
          <TouchableOpacity style={styles.row} onPress={onAction}>
              <Text style={labelStyle}>{label}</Text>
              {/* Placeholder for the greyed-out toggle switch */}
              <Switch
                  trackColor={{ false: '#3E3E3E', true: '#3E3E3E' }} 
                  thumbColor={'#666'} 
                  value={false} 
                  disabled={true} // It's disabled and greyed out in the image
              />
          </TouchableOpacity>
      );
  }

  // Row with an action (Sign Out, which uses a toggle style in the image)
  if (isToggle) {
      return (
          <View style={styles.row}>
              <TouchableOpacity onPress={onAction}>
                  <Text style={labelStyle}>{label}</Text>
              </TouchableOpacity>
              <Switch
                  trackColor={{ false: '#3E3E3E', true: '#4A90E2' }}
                  thumbColor={isEnabled ? '#FFF' : '#FFF'}
                  onValueChange={onToggle}
                  value={isEnabled}
              />
          </View>
      );
  }

  // Standard link row
  return (
      <TouchableOpacity style={styles.row} onPress={onAction}>
          <Text style={styles.rowLabel}>{label}</Text>
      </TouchableOpacity>
  );
};


// --- Main Screen Component ---
const AppSettingsScreen = () => {
  // Initial state based on the image switches
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(true);
  const [isLocationShared, setIsLocationShared] = useState(true);
  const [isSignedOut, setIsSignedOut] = useState(false); // Sign Out is essentially an action, but visually represented with a toggle set to 'on' (logged in)

  // Placeholder action handlers for UX/Logic requirements
  const handleClearCache = () => {
    console.log("Triggering SQLite prune and tile-cache purge.");
    // Logic to clear local data would go here
  };
  
  const handleSignOut = () => {
      console.log("Clearing local session and disconnecting sockets.");
      // This is a placeholder; a real implementation would usually show a confirmation modal first.
      setIsSignedOut(true); // Visually "signing out"
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <Text style={styles.screenTitle}>Settings</Text>

        {/* 1. General Group */}
        <Text style={styles.groupHeader}>General</Text>
        <View style={styles.card}>
          <SettingsToggleRow
            label="Enable Notifications"
            isEnabled={isNotificationsEnabled}
            onToggle={setIsNotificationsEnabled}
          />
          <View style={styles.separator} />
          <SettingsToggleRow
            label="Dark Mode"
            isEnabled={isDarkModeEnabled}
            onToggle={setIsDarkModeEnabled}
          />
        </View>

        {/* 2. Privacy Group */}
        <Text style={styles.groupHeader}>Privacy</Text>
        <View style={styles.card}>
          <SettingsToggleRow
            label="Share Location Data"
            isEnabled={isLocationShared}
            onToggle={setIsLocationShared}
          />
        </View>

        {/* 3. Account Group */}
        <Text style={styles.groupHeader}>Account</Text>
        <View style={styles.card}>
          <SettingsActionRow
            label="Clear Cache"
            isDanger={true}
            onAction={handleClearCache}
          />
          <View style={styles.separator} />
          <SettingsActionRow
            label="Sign Out"
            isDanger={true}
            isToggle={true} // Using toggle style for visual fidelity
            isEnabled={!isSignedOut} // True when logged in (to be toggled off)
            onAction={handleSignOut}
            onToggle={handleSignOut} // The toggle itself should trigger the action
          />
        </View>
        
        {/* 4. Legal Group (Subtle Links) */}
        <View style={styles.legalCard}>
          <SettingsActionRow label="Terms of Service" onAction={() => console.log('Open Terms')} />
          <View style={styles.separator} />
          <SettingsActionRow label="Privacy Policy" onAction={() => console.log('Open Privacy')} />
          {/* Note: Scrolling is visible in the image, implying more content below */}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// --- Stylesheet (Deep Dark Theme) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000', // Deep black background for safe area
  },
  scrollContainer: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    backgroundColor: '#000', // Deep black background
  },
  screenTitle: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 30,
    marginLeft: 5,
  },
  groupHeader: {
    color: '#AAA',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 5,
  },
  card: {
    backgroundColor: '#1C1C1E', // Dark card background
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  legalCard: {
    backgroundColor: '#1C1C1E', // Dark card background
    borderRadius: 10,
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 50, // Added space for scrolling effect
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    minHeight: 50, // Ensure consistent height
  },
  rowLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '400',
  },
  dangerText: {
    color: '#FF3B30', // Bright red for danger actions
  },
  separator: {
    height: 1,
    backgroundColor: '#333', // Dark separator line
    // Horizontal separator spans the width of the card's inner content
    marginHorizontal: -15, // Extend separator to the card edges
  },
});

export default AppSettingsScreen;