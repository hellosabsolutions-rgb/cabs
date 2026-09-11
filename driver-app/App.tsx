import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';
import { SessionProvider } from './src/state/session';
import { RootNavigator } from './src/navigation/RootNavigator';

function ThemedApp() {
  const { scheme } = useAppTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SessionProvider>
          <ThemedApp />
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
