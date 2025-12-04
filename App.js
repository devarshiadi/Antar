import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigatorNew from './navigation/AppNavigatorNew';

export default function App() {
  return (
    <React.StrictMode>
      <StatusBar style="light" />
      <AppNavigatorNew />
    </React.StrictMode>
  );
}
