import { useColorScheme } from 'react-native';
import { DARK_COLORS, LIGHT_COLORS } from '../constants/theme';

export function getAppTheme(colorScheme) {
  const isDark = colorScheme !== 'light';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const statusBarStyle = isDark ? 'light-content' : 'dark-content';

  const navigationTheme = {
    dark: isDark,
    colors: {
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

  return {
    colors,
    isDark,
    navigationTheme,
    statusBarStyle,
    theme,
  };
}

export function useAppTheme() {
  const colorScheme = useColorScheme();
  return getAppTheme(colorScheme);
}
