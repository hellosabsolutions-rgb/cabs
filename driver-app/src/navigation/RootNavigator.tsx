import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import { MainTabs } from './MainTabs';

import { LoginScreen } from '../screens/LoginScreen';
import { StartDutyScreen } from '../screens/StartDutyScreen';
import { EndDutyScreen } from '../screens/EndDutyScreen';
import { AddFuelScreen } from '../screens/AddFuelScreen';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { AdvanceRequestScreen } from '../screens/AdvanceRequestScreen';
import { DigitalIdScreen } from '../screens/DigitalIdScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { BookingDetailScreen } from '../screens/BookingDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors, scheme, t } = useAppTheme();
  const { authReady, signedIn } = useSession();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.bg,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  if (!authReady) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: scheme === 'dark' ? '#121212' : '#FFFFFF' },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerShadowVisible: true,
          headerTitleAlign: 'center',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {signedIn ? (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BookingDetail"
              component={BookingDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="StartDuty" component={StartDutyScreen} options={{ title: t('nav.startDuty') }} />
            <Stack.Screen name="EndDuty" component={EndDutyScreen} options={{ title: t('nav.endDuty') }} />
            <Stack.Screen name="AddFuel" component={AddFuelScreen} options={{ title: t('nav.addFuel') }} />
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: t('nav.addExpense') }} />
            <Stack.Screen name="AdvanceRequest" component={AdvanceRequestScreen} options={{ title: t('nav.advanceRequest') }} />
            <Stack.Screen name="DigitalId" component={DigitalIdScreen} options={{ title: t('nav.digitalId') }} />
            <Stack.Screen name="Documents" component={DocumentsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('nav.settings') }} />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
