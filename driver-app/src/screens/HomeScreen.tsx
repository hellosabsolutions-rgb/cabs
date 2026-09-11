import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { radius } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import { inrPlain, km } from '../data/format';
import type { MessageKey } from '../i18n/en';

type Props = CompositeScreenProps<
  NativeBottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const quickActions: {
  titleKey: MessageKey;
  icon: keyof typeof Ionicons.glyphMap;
  route: keyof RootStackParamList | keyof MainTabParamList;
  tint: string;
}[] = [
  { titleKey: 'tab.bookings', icon: 'calendar-outline', route: 'Bookings', tint: '#1687F5' },
  { titleKey: 'home.addFuel', icon: 'water-outline', route: 'AddFuel', tint: '#1687F5' },
  { titleKey: 'home.addExpense', icon: 'receipt-outline', route: 'AddExpense', tint: '#1687F5' },
  { titleKey: 'home.advance', icon: 'wallet-outline', route: 'AdvanceRequest', tint: '#1687F5' },
  { titleKey: 'home.digitalId', icon: 'id-card-outline', route: 'DigitalId', tint: '#1687F5' },
  { titleKey: 'home.sos', icon: 'warning-outline', route: 'Sos', tint: '#F15B4A' },
];

function greetingKey(hour: number): MessageKey {
  if (hour < 12) return 'home.goodMorning';
  if (hour < 17) return 'home.goodAfternoon';
  return 'home.goodEvening';
}

export function HomeScreen({ navigation }: Props) {
  const { colors, t } = useAppTheme();
  const session = useSession();
  const openDuty = session.duties.find((d) => !d.endedAt);
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

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
    []
  );

  const recent = [
    openDuty
      ? {
          id: openDuty.id,
          icon: 'time-outline' as const,
          title: t('home.dutyOpen'),
          subtitle: `${openDuty.startedAt} · ${km(openDuty.startOdo)}`,
          live: true,
        }
      : null,
    ...session.duties
      .filter((d) => d.endedAt)
      .slice(0, 1)
      .map((d) => ({
        id: d.id,
        icon: 'checkmark-circle-outline' as const,
        title: t('home.dutyClosed'),
        subtitle: `${d.endedAt} · ${d.km ?? 0} ${t('common.km')}`,
        live: false,
      })),
    ...session.fuels.slice(0, 1).map((f) => ({
      id: f.id,
      icon: 'water-outline' as const,
      title: t('home.addFuel'),
      subtitle: `${f.at} · ${f.litres} L · ${inrPlain(f.cost)}`,
      live: false,
    })),
  ].filter(Boolean) as {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    live: boolean;
  }[];

  return (
    <Screen inTab>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.flex}>
            <Text style={styles.hello}>{t(greetingKey(new Date().getHours()))}</Text>
            <Text style={styles.heroName}>{session.driver.name}</Text>
            <Text style={styles.heroMeta}>
              {today} · {session.driver.id}
            </Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.avatar}>
            {session.driver.photo ? (
              <Image source={{ uri: session.driver.photo }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: colors.accent }]}>{session.driver.initials}</Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.plateCard, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
          <View style={styles.plateRow}>
            <View style={styles.flex}>
              <Text style={styles.plateLabel}>{t('home.assignedVehicle')}</Text>
              <Text style={styles.plate}>{session.vehicle.reg}</Text>
              <Text style={styles.heroMeta}>
                {session.vehicle.model} · {session.trip.id}
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

        <View style={styles.heroStats}>
          {[
            { label: t('home.odometer'), value: session.odometer.toLocaleString('en-IN') },
            { label: t('home.todayKm'), value: String(session.todayKm) },
            { label: t('home.wallet'), value: inrPlain(session.walletRemaining), onPress: () => navigation.navigate('Wallet') },
          ].map((item) => (
            <Pressable key={item.label} style={styles.heroStat} onPress={item.onPress}>
              <Text style={styles.heroStatValue}>{item.value}</Text>
              <Text style={styles.heroStatLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => navigation.navigate(session.onDuty ? 'EndDuty' : 'StartDuty')}
          style={({ pressed }) => [
            styles.heroCta,
            session.onDuty && styles.heroCtaEnd,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={[styles.heroCtaText, session.onDuty && { color: '#FFFFFF' }]}>
            {session.onDuty ? t('home.endDuty') : t('home.startDuty')}
          </Text>
        </Pressable>
      </View>

      <SectionTitle title={t('home.quickActions')} />
      <View style={[styles.actions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {quickActions.map((item, index) => (
          <Pressable
            key={item.titleKey}
            onPress={() => navigation.navigate(item.route as never)}
            style={({ pressed }) => [
              styles.actionRow,
              index < quickActions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={[styles.actionIcon, { backgroundColor: item.tint === '#F15B4A' ? colors.dangerBg : colors.accentMuted }]}>
              <Ionicons name={item.icon} size={18} color={item.tint} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>{t(item.titleKey)}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
          </Pressable>
        ))}
      </View>

      <SectionTitle title={t('home.recent')} />
      <View style={[styles.timeline, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {recent.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.timelineRow,
              index < recent.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
            ]}
          >
            <View
              style={[
                styles.timelineIcon,
                { backgroundColor: item.live ? colors.accentMuted : colors.surfaceMuted },
              ]}
            >
              <Ionicons name={item.icon} size={16} color={item.live ? colors.accent : colors.textDim} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.timelineTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.timelineSub, { color: colors.textDim }]}>{item.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#1687F5',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  flex: { flex: 1 },
  hello: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
    fontWeight: '500',
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
    marginTop: 3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  avatarText: {
    fontWeight: '700',
    fontSize: 13,
  },
  plateCard: {
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
  },
  plateRow: {
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
  heroStats: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  heroStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  heroCta: {
    marginTop: 14,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCtaEnd: {
    backgroundColor: '#F15B4A',
  },
  heroCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1687F5',
  },
  actions: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  timeline: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  timelineSub: {
    fontSize: 13,
    marginTop: 2,
  },
});
