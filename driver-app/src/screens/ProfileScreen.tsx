import React, { useEffect, useRef } from 'react';
import { Alert, Animated, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { ScreenHeader, HeaderIconButton } from '../components/ScreenHeader';
import { SectionTitle } from '../components/SectionTitle';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { radius } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';

type Props = CompositeScreenProps<
  NativeBottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ProfileScreen({ navigation }: Props) {
  const { colors, t } = useAppTheme();
  const session = useSession();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!session.onDuty) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, session.onDuty]);

  const details = [
    { icon: 'call-outline' as const, label: t('profile.mobile'), value: session.driver.mobile, onPress: () => Linking.openURL(`tel:${session.driver.mobile.replace(/\s/g, '')}`) },
    { icon: 'card-outline' as const, label: t('profile.licence'), value: session.driver.licence },
    { icon: 'calendar-outline' as const, label: t('profile.licenceValidity'), value: session.driver.licenceValid },
    { icon: 'business-outline' as const, label: t('digitalId.agency'), value: session.driver.agency },
  ];

  const vehicle = [
    { label: t('profile.vehicleType'), value: session.vehicle.type },
    { label: t('profile.vehicleModel'), value: session.vehicle.model },
    { label: t('profile.vehicleId'), value: session.vehicle.id },
    { label: t('home.currentTrip'), value: session.trip.id },
  ];

  function signOut() {
    Alert.alert(t('profile.signOut'), t('profile.signOutHint'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.signOut'),
        style: 'destructive',
        onPress: () => {
          void session.signOut();
        },
      },
    ]);
  }

  return (
    <Screen inTab>
      <ScreenHeader
        title={t('profile.title')}
        right={
          <HeaderIconButton onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={18} color={colors.text} />
          </HeaderIconButton>
        }
      />

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.flex}>
            <Text style={styles.heroName}>{session.driver.name}</Text>
            <Text style={styles.heroMeta}>{session.driver.id}</Text>
          </View>
          <View style={styles.avatar}>
            {session.driver.photo ? (
              <Image source={{ uri: session.driver.photo }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: colors.accent }]}>{session.driver.initials}</Text>
            )}
          </View>
        </View>

        <View style={styles.heroPlate}>
          <View style={styles.flex}>
            <Text style={styles.plateLabel}>{t('profile.assignedVehicle')}</Text>
            <Text style={styles.plate}>{session.vehicle.reg}</Text>
            <Text style={styles.heroMeta}>
              {session.vehicle.model} · {session.driver.agency}
            </Text>
          </View>
          <View style={styles.livePill}>
            {session.onDuty ? (
              <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
            ) : (
              <View style={[styles.liveDot, { opacity: 0.4 }]} />
            )}
            <Text style={styles.liveText}>
              {session.onDuty ? t('home.onDuty') : t('home.offDuty')}
            </Text>
          </View>
        </View>
      </View>

      <SectionTitle title={t('profile.details')} />
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {details.map((item, index) => {
          const row = (
            <>
              <View style={[styles.rowIcon, { backgroundColor: colors.accentMuted }]}>
                <Ionicons name={item.icon} size={16} color={colors.accent} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.rowLabel, { color: colors.textFaint }]}>{item.label}</Text>
                <Text style={[styles.rowValue, { color: colors.text }]}>{item.value}</Text>
              </View>
              {item.onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textFaint} /> : null}
            </>
          );

          return item.onPress ? (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.row,
                index < details.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.borderSoft,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              {row}
            </Pressable>
          ) : (
            <View
              key={item.label}
              style={[
                styles.row,
                index < details.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.borderSoft,
                },
              ]}
            >
              {row}
            </View>
          );
        })}
      </View>

      <SectionTitle title={t('profile.vehicleDetails')} />
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {vehicle.map((item, index) => (
          <View
            key={item.label}
            style={[
              styles.metaRow,
              index < vehicle.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.borderSoft,
              },
            ]}
          >
            <Text style={[styles.rowLabel, { color: colors.textFaint }]}>{item.label}</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{item.value}</Text>
          </View>
        ))}
      </View>

      <SectionTitle title={t('profile.account')} />
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 8 }]}>
        <Pressable
          onPress={() => navigation.navigate('Documents')}
          style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
        >
          <View style={[styles.rowIcon, { backgroundColor: colors.accentMuted }]}>
            <Ionicons name="document-text-outline" size={16} color={colors.accent} />
          </View>
          <Text style={[styles.actionTitle, { color: colors.text }]}>{t('docs.title')}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
        </Pressable>
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.borderSoft, marginLeft: 58 }} />
        <Pressable
          onPress={() => navigation.navigate('DigitalId')}
          style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
        >
          <View style={[styles.rowIcon, { backgroundColor: colors.accentMuted }]}>
            <Ionicons name="id-card-outline" size={16} color={colors.accent} />
          </View>
          <Text style={[styles.actionTitle, { color: colors.text }]}>{t('profile.digitalId')}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
        </Pressable>
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.borderSoft, marginLeft: 58 }} />
        <Pressable onPress={signOut} style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}>
          <View style={[styles.rowIcon, { backgroundColor: colors.dangerBg }]}>
            <Ionicons name="log-out-outline" size={16} color={colors.danger} />
          </View>
          <Text style={[styles.actionTitle, { color: colors.danger }]}>{t('profile.signOut')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#1687F5',
    borderRadius: 16,
    padding: 16,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: { flex: 1 },
  heroName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
    marginTop: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  heroPlate: {
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  plateLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  plate: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  group: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  metaValue: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  actionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
