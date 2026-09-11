import React from 'react';
import { Platform } from 'react-native';
import {
  createNativeBottomTabNavigator,
  type NativeBottomTabIcon,
  type NativeBottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs/unstable';
import type { ParamListBase } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeProvider';

const Tab = createNativeBottomTabNavigator();

export type NativeTabGlyph = {
  ios: string;
  iosFocused?: string;
  android: NativeBottomTabIcon;
};

export type NativeTabItem<ParamList extends ParamListBase> = {
  name: Extract<keyof ParamList, string>;
  title: string;
  component: React.ComponentType<any>;
  icon: NativeTabGlyph;
  badge?: string | number;
};

export function nativeTabBarIcon(icon: NativeTabGlyph) {
  return ({ focused }: { focused: boolean }): NativeBottomTabIcon => {
    if (Platform.OS === 'ios') {
      return {
        type: 'sfSymbol',
        name: focused ? icon.iosFocused ?? icon.ios : icon.ios,
      } as NativeBottomTabIcon;
    }

    return icon.android;
  };
}

type Props<ParamList extends ParamListBase> = {
  tabs: NativeTabItem<ParamList>[];
  initialRouteName?: Extract<keyof ParamList, string>;
};

export function NativeBottomTabs<ParamList extends ParamListBase>({
  tabs,
  initialRouteName,
}: Props<ParamList>) {
  const { colors } = useAppTheme();

  const screenOptions: NativeBottomTabNavigationOptions = {
    headerShown: false,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.textFaint,
    tabBarActiveIndicatorColor: colors.accentMuted,
    tabBarRippleColor: colors.accentMuted,
    tabBarLabelVisibilityMode: 'labeled',
    tabBarControllerMode: 'tabBar',
    tabBarMinimizeBehavior: 'onScrollDown',
    tabBarBlurEffect: 'systemDefault',
    lazy: false,
  };

  return (
    <Tab.Navigator
      id="MainTabs"
      initialRouteName={initialRouteName}
      screenOptions={screenOptions}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            title: tab.title,
            tabBarLabel: tab.title,
            tabBarIcon: nativeTabBarIcon(tab.icon),
            tabBarBadge: tab.badge,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
