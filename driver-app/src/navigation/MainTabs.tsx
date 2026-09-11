import React from 'react';
import { NativeBottomTabs, type NativeTabItem } from '../components/NativeBottomTabs';
import { HomeScreen } from '../screens/HomeScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { SosScreen } from '../screens/SosScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import type { MainTabParamList } from './types';
import { useAppTheme } from '../theme/ThemeProvider';

export function MainTabs() {
  const { t } = useAppTheme();

  const tabs: NativeTabItem<MainTabParamList>[] = [
    {
      name: 'Home',
      title: t('tab.home'),
      component: HomeScreen,
      icon: {
        ios: 'house',
        iosFocused: 'house.fill',
        android: { type: 'image', source: require('../assets/tabs/home.png') },
      },
    },
    {
      name: 'Bookings',
      title: t('tab.bookings') || 'Bookings',
      component: BookingsScreen,
      icon: {
        ios: 'calendar',
        iosFocused: 'calendar',
        android: { type: 'image', source: require('../assets/tabs/docs.png') },
      },
    },
    {
      name: 'Wallet',
      title: t('tab.wallet'),
      component: WalletScreen,
      icon: {
        ios: 'creditcard',
        iosFocused: 'creditcard.fill',
        android: { type: 'image', source: require('../assets/tabs/wallet.png') },
      },
    },
    {
      name: 'Sos',
      title: t('tab.sos'),
      component: SosScreen,
      icon: {
        ios: 'exclamationmark.triangle',
        iosFocused: 'exclamationmark.triangle.fill',
        android: { type: 'image', source: require('../assets/tabs/sos.png') },
      },
    },
    {
      name: 'Profile',
      title: t('tab.profile'),
      component: ProfileScreen,
      icon: {
        ios: 'person',
        iosFocused: 'person.fill',
        android: { type: 'image', source: require('../assets/tabs/profile.png') },
      },
    },
  ];

  return <NativeBottomTabs<MainTabParamList> tabs={tabs} initialRouteName="Home" />;
}
