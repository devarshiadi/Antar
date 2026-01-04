import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { DARK_COLORS, LIGHT_COLORS } from '../constants/theme';

const ThemeContext = createContext({
  themeMode: 'system', // 'light', 'dark', 'system'
  setThemeMode: () => { },
  isDark: false, // Computed based on mode + system
  colors: LIGHT_COLORS,
  statusBarStyle: 'dark-content',
  navigationTheme: NavigationDefaultTheme,
  theme: {}, // Combined semantic theme object
});

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system');
  const [isReady, setIsReady] = useState(false);

  // Load persisted theme preference on mount
  useEffect(() => {
    AsyncStorage.getItem('theme_mode').then((stored) => {
      if (stored) setThemeMode(stored);
      setIsReady(true);
    });
  }, []);

  const setThemeModeWrapper = async (mode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem('theme_mode', mode);
  };

  // Determine actual theme based on mode + system
  const isDark = themeMode === 'system'
    ? systemColorScheme !== 'light' // Default to dark if not explicitly light, or follow system
    : themeMode === 'dark';

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const statusBarStyle = isDark ? 'light-content' : 'dark-content';

  const baseNavigationTheme = isDark ? NavigationDarkTheme : NavigationDefaultTheme;
  const navigationTheme = {
    ...baseNavigationTheme,
    dark: isDark,
    colors: {
      ...baseNavigationTheme.colors,
      primary: colors.accent.primary,
      background: colors.bg.primary,
      card: colors.bg.secondary,
      text: colors.text.primary,
      border: colors.border.default,
      notification: colors.accent.primary,
    },
  };

  const theme = {
    background: colors.bg.primary,
    card: colors.bg.card,
    secondaryCard: colors.bg.elevated,
    textPrimary: colors.text.primary,
    textSecondary: colors.text.secondary,
    divider: colors.border.default,
    accent: colors.accent.primary,
    critical: colors.state.error,
    highlight: colors.accent.primary,
    surface: colors.bg.secondary,
    surfaceText: colors.text.primary,
    statusBar: statusBarStyle,
  };

  const value = useMemo(() => ({
    themeMode,
    setThemeMode: setThemeModeWrapper,
    isDark,
    colors,
    statusBarStyle,
    navigationTheme,
    theme,
  }), [themeMode, isDark, colors, statusBarStyle, navigationTheme]);

  // Optionally could render a splash if !isReady, but default 'system' prevents flash of wrong theme usually
  // if we process it fast enough. But async storage is async.
  // Ideally waiting for isReady avoids "flash".
  // For now return children always, it might blink base on system default first.
  if (!isReady) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Helper for usage in Context
export function useAppTheme() {
  return useContext(ThemeContext);
}
