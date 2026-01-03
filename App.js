import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigatorNew from './navigation/AppNavigatorNew';
import { SessionProvider } from './helpers/session-context';

export default function App() {
  return (
    <React.StrictMode>
      <StatusBar style="light" />
      <SessionProvider>
        <AppNavigatorNew />
      </SessionProvider>
    </React.StrictMode>
  );
}
