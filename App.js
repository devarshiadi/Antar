import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigatorNew from './navigation/AppNavigatorNew';
import { SessionProvider } from './helpers/session-context';
import { ThemeProvider } from './helpers/use-app-theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <SessionProvider>
          <AppNavigatorNew />
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
