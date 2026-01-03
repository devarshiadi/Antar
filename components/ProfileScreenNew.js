import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  ChevronRight,
  Phone,
  Mail,
  Car,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ArrowLeft,
} from 'lucide-react-native';
import { TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import { useAppTheme } from '../helpers/use-app-theme';

function ProfileScreenNew({ navigation }) {
  const { colors, statusBarStyle } = useAppTheme();
  const styles = useMemo(function () {
    return getStyles(colors);
  }, [colors]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationSharing, setLocationSharing] = useState(false);

  const user = {
    name: 'Devendra',
    phone: '+91 98765 43210',
    email: 'devendra@example.com',
    rating: 4.8,
    trips: 45,
  };

  const MenuItem = ({ icon: Icon, label, value, onPress, showChevron = true, rightElement }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.menuItemLeft}>
        <Icon size={20} color={colors.text.secondary} />
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      {value && <Text style={styles.menuItemValue}>{value}</Text>}
      {rightElement}
      {showChevron && onPress && (
        <ChevronRight size={18} color={colors.text.tertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')} activeOpacity={0.8}>
          <ArrowLeft size={20} color={colors.text.primary} />
          <Text style={styles.backLabel}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <User size={32} color={colors.text.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userStats}>
              {user.rating}★ • {user.trips} trips
            </Text>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon={Phone}
              label="Phone"
              value={user.phone}
              onPress={() => {}}
            />
            <MenuItem
              icon={Mail}
              label="Email"
              value={user.email}
              onPress={() => {}}
            />
            <MenuItem
              icon={Car}
              label="Vehicle Details"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon={Bell}
              label="Notifications"
              showChevron={false}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.border.default, true: colors.text.primary }}
                  thumbColor={colors.bg.elevated}
                />
              }
            />
            <MenuItem
              icon={Shield}
              label="Location Sharing"
              showChevron={false}
              rightElement={
                <Switch
                  value={locationSharing}
                  onValueChange={setLocationSharing}
                  trackColor={{ false: colors.border.default, true: colors.text.primary }}
                  thumbColor={colors.bg.elevated}
                />
              }
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon={HelpCircle}
              label="Help & Support"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <LogOut size={18} color={colors.text.secondary} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  backLabel: {
    ...TYPOGRAPHY.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  headerTitle: {
    ...TYPOGRAPHY.title,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.title,
    color: colors.text.primary,
    marginBottom: SPACING.xs,
  },
  userStats: {
    ...TYPOGRAPHY.body,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  menuGroup: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  menuItemLabel: {
    ...TYPOGRAPHY.body,
    color: colors.text.primary,
  },
  menuItemValue: {
    ...TYPOGRAPHY.body,
    color: colors.text.secondary,
    marginRight: SPACING.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.lg,
  },
  logoutText: {
    ...TYPOGRAPHY.body,
    color: colors.text.secondary,
  },
  });
}

export default ProfileScreenNew;
