import React from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';
import { SessionProvider } from './src/state/session';
import { SheetMotionProvider } from './src/context/SheetMotionContext';
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
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <ThemeProvider>
            <SessionProvider>
              <SheetMotionProvider>
                <ThemedApp />
              </SheetMotionProvider>
            </SessionProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
