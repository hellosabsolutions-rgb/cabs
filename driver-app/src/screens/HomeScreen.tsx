import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { Ionicons } from '@expo/vector-icons';
import { SectionTitle } from '../components/SectionTitle';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { radius, space } from '../theme/colors';
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
  bgLight: string;
  bgDark: string;
}[] = [
  {
    titleKey: 'tab.bookings',
    icon: 'calendar',
    route: 'Bookings',
    tint: '#2563EB',
    bgLight: '#EFF6FF',
    bgDark: 'rgba(37, 99, 235, 0.18)',
  },
  {
    titleKey: 'home.addFuel',
    icon: 'water',
    route: 'AddFuel',
    tint: '#0284C7',
    bgLight: '#F0F9FF',
    bgDark: 'rgba(2, 132, 199, 0.18)',
  },
  {
    titleKey: 'home.addExpense',
    icon: 'receipt',
    route: 'AddExpense',
    tint: '#7C3AED',
    bgLight: '#F5F3FF',
    bgDark: 'rgba(124, 58, 237, 0.18)',
  },
  {
    titleKey: 'home.advance',
    icon: 'wallet',
    route: 'AdvanceRequest',
    tint: '#0D9488',
    bgLight: '#F0FDFA',
    bgDark: 'rgba(13, 148, 136, 0.18)',
  },
  {
    titleKey: 'home.digitalId',
    icon: 'id-card',
    route: 'DigitalId',
    tint: '#D97706',
    bgLight: '#FFFBEB',
    bgDark: 'rgba(217, 119, 6, 0.18)',
  },
  {
    titleKey: 'home.sos',
    icon: 'warning',
    route: 'Sos',
    tint: '#EF4444',
    bgLight: '#FEF2F2',
    bgDark: 'rgba(239, 68, 68, 0.18)',
  },
];

function getGreetingDetails(hour: number): {
  key: MessageKey;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
} {
  // Morning: 5:00 AM – 11:59 AM
  if (hour >= 5 && hour < 12) {
    return { key: 'home.goodMorning', icon: 'sunny', color: '#FDE047' };
  }
  // Afternoon: 12:00 PM – 4:59 PM
  if (hour >= 12 && hour < 17) {
    return { key: 'home.goodAfternoon', icon: 'partly-sunny', color: '#FED7AA' };
  }
  // Evening: 5:00 PM – 9:59 PM
  if (hour >= 17 && hour < 22) {
    return { key: 'home.goodEvening', icon: 'cloudy-night', color: '#DDD6FE' };
  }
  // Night / Late Night: 10:00 PM – 4:59 AM
  return { key: 'home.goodNight', icon: 'moon', color: '#C7D2FE' };
}

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, scheme, t } = useAppTheme();
  const isDark = scheme === 'dark';
  const session = useSession();
  const openDuty = session.duties.find((d) => !d.endedAt);
  const pulse = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const [refreshing, setRefreshing] = useState(false);
  const [scrolledPast, setScrolledPast] = useState(false);

  const topInset = Math.max(insets.top, 14);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await session.refreshProfile();
    } catch (err) {
      console.warn('Error refreshing home data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [session]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const y = event.nativeEvent.contentOffset.y;
        if (y > 65 && !scrolledPast) {
          setScrolledPast(true);
        } else if (y <= 65 && scrolledPast) {
          setScrolledPast(false);
        }
      },
    }
  );

  useEffect(() => {
    if (!session.onDuty) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
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

  const greeting = useMemo(() => getGreetingDetails(new Date().getHours()), []);

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

  const vehicleReg = session.vehicle?.reg && session.vehicle.reg !== '—' ? session.vehicle.reg : null;
  const vehicleModel = session.vehicle?.model && session.vehicle.model !== '—' ? session.vehicle.model : 'Fleet Vehicle';
  const tripLabel = session.trip?.id && session.trip.id !== '—' ? session.trip.id : 'Active Shift';

  // ─── STICKY HEADER INTERPOLATIONS ───
  const stickyBg = scrollY.interpolate({
    inputRange: [0, 50, 95],
    outputRange: ['rgba(255,255,255,0)', isDark ? 'rgba(18,22,30,0.85)' : 'rgba(255,255,255,0.85)', isDark ? '#12161E' : '#FFFFFF'],
    extrapolate: 'clamp',
  });

  const stickyBorder = scrollY.interpolate({
    inputRange: [0, 75],
    outputRange: ['transparent', isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'],
    extrapolate: 'clamp',
  });

  const stickyShadow = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 0.06],
    extrapolate: 'clamp',
  });

  const stickyContentOpacity = scrollY.interpolate({
    inputRange: [40, 85],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.screenWrap, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={scrolledPast ? (isDark ? 'light-content' : 'dark-content') : 'light-content'} />

      {/* ─── FLOATING NATIVE STICKY HEADER (TURNS WHITE / NATIVE ON SCROLL) ─── */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topInset,
            backgroundColor: stickyBg,
            borderBottomColor: stickyBorder,
            shadowOpacity: stickyShadow,
          },
        ]}
        pointerEvents={scrolledPast ? 'auto' : 'none'}
      >
        <Animated.View style={[styles.stickyHeaderContent, { opacity: stickyContentOpacity }]}>
          <View style={styles.flex}>
            <Text style={[styles.stickyDriverName, { color: colors.text }]} numberOfLines={1}>
              {session.driver.name || 'Driver'}
            </Text>
            <Text style={[styles.stickyMeta, { color: colors.textDim }]} numberOfLines={1}>
              {session.driver.agency || 'KABPRO Fleet'} · {session.driver.id || 'DRV'}
            </Text>
          </View>

          {/* Right: compact duty status + avatar */}
          <View style={styles.stickyRightRow}>
            <Pressable
              onPress={() => navigation.navigate(session.onDuty ? 'EndDuty' : 'StartDuty')}
              style={[
                styles.stickyDutyPill,
                {
                  backgroundColor: session.onDuty
                    ? (isDark ? 'rgba(34, 197, 94, 0.18)' : '#ECFDF5')
                    : (isDark ? 'rgba(156, 163, 175, 0.15)' : '#F3F4F6'),
                  borderColor: session.onDuty ? '#86EFAC' : '#E5E7EB',
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.dutyDot,
                  {
                    backgroundColor: session.onDuty ? '#16A34A' : '#9CA3AF',
                    opacity: session.onDuty ? pulse : 0.6,
                  },
                ]}
              />
              <Text
                style={[
                  styles.stickyDutyText,
                  { color: session.onDuty ? '#15803D' : colors.textDim },
                ]}
              >
                {session.onDuty ? t('home.onDuty') : t('home.offDuty')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('Profile')}
              style={[
                styles.stickyAvatarWrap,
                { borderColor: session.onDuty ? '#22C55E' : colors.border },
              ]}
            >
              {session.driver.photo ? (
                <Image source={{ uri: session.driver.photo }} style={styles.stickyAvatarImg} />
              ) : (
                <View style={[styles.stickyAvatarFallback, { backgroundColor: colors.accent }]}>
                  <Text style={styles.stickyAvatarInitials}>{session.driver.initials || 'SS'}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>

      {/* ─── SCROLLABLE CONTENT WITH INTEGRATED BLUE HERO GRADIENT ─── */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollBody}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={['#1687F5']}
            progressBackgroundColor="#FFFFFF"
            progressViewOffset={topInset + 10}
          />
        }
      >
        {/* ─── UNIFIED BLUE HERO (MERGED HEADER + COCKPIT) ─── */}
        <View
          style={[
            styles.heroContainer,
            {
              paddingTop: topInset + 6,
              backgroundColor: isDark ? '#0D4899' : '#1267DE',
            },
          ]}
        >
          {/* Ambient depth lighting accents (Pure React Native - no native modules needed) */}
          <View style={styles.ambientGlowTop} />
          <View style={styles.ambientGlowBottom} />

          {/* Header Row: Greeting pill, Driver Name, Location, Live Duty & Avatar */}
          <View style={styles.heroHeaderRow}>
            {/* Left Col */}
            <View style={styles.flex}>
              <View style={styles.heroGreetingPill}>
                <Ionicons name={greeting.icon} size={12} color={greeting.color} />
                <Text style={styles.heroGreetingText}>
                  {t(greeting.key)} 👋
                </Text>
              </View>

              <Text style={styles.heroDriverName} numberOfLines={1}>
                {session.driver.name || 'Driver'}
              </Text>

              <Pressable
                style={styles.heroLocationRow}
                onPress={() => navigation.navigate('Profile')}
                hitSlop={8}
              >
                <Ionicons name="location-sharp" size={12} color="#93C5FD" style={{ marginRight: 3 }} />
                <Text style={styles.heroLocationText} numberOfLines={1}>
                  {session.driver.agency || 'KABPRO Fleet'} · {session.driver.id || 'DRV'}
                </Text>
                <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.75)" style={{ marginLeft: 2 }} />
              </Pressable>
            </View>

            {/* Right Col */}
            <View style={styles.heroRightCol}>
              <Pressable
                onPress={() => navigation.navigate(session.onDuty ? 'EndDuty' : 'StartDuty')}
                style={styles.heroDutyPill}
              >
                <Animated.View
                  style={[
                    styles.dutyDot,
                    {
                      backgroundColor: session.onDuty ? '#4ADE80' : '#E2E8F0',
                      opacity: session.onDuty ? pulse : 0.7,
                    },
                  ]}
                />
                <Text style={styles.heroDutyText}>
                  {session.onDuty ? t('home.onDuty') : t('home.offDuty')}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('Profile')}
                style={styles.heroAvatarWrap}
              >
                {session.driver.photo ? (
                  <Image source={{ uri: session.driver.photo }} style={styles.heroAvatarImg} />
                ) : (
                  <View style={styles.heroAvatarFallback}>
                    <Text style={styles.heroAvatarInitials}>{session.driver.initials || 'SS'}</Text>
                  </View>
                )}
                {session.onDuty && <View style={styles.avatarOnlineBadge} />}
              </Pressable>
            </View>
          </View>

          {/* Cockpit Card Section - Seamlessly integrated inside hero */}
          <View style={styles.cockpitSection}>
            {/* Top Plate & Meta Row */}
            <View style={styles.cockpitTopRow}>
              <View style={styles.flex}>
                <View style={styles.cockpitTagRow}>
                  <View style={styles.cockpitTag}>
                    <Ionicons name="car-sport" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.cockpitTagText}>{t('home.assignedVehicle').toUpperCase()}</Text>
                  </View>
                  <Text style={styles.cockpitDateText}>{today}</Text>
                </View>

                <Text style={styles.cockpitPlate}>
                  {vehicleReg || '— —'}
                </Text>
                <Text style={styles.cockpitSub}>
                  {vehicleModel} · {tripLabel}
                </Text>
              </View>

              {/* Shift Status Pill */}
              <View style={styles.cockpitShiftBadge}>
                <View style={[styles.cockpitDot, { backgroundColor: session.onDuty ? '#4ADE80' : '#E2E8F0' }]} />
                <Text style={styles.cockpitShiftText}>
                  {session.onDuty ? 'Live Shift' : 'Standby'}
                </Text>
              </View>
            </View>

            {/* 3 Metric Cards */}
            <View style={styles.cockpitStatsRow}>
              {[
                {
                  label: t('home.odometer'),
                  value: session.odometer.toLocaleString('en-IN'),
                  unit: 'km',
                  onPress: undefined,
                },
                {
                  label: t('home.todayKm'),
                  value: String(session.todayKm),
                  unit: 'km',
                  onPress: undefined,
                },
                {
                  label: t('home.wallet'),
                  value: inrPlain(session.walletRemaining),
                  unit: '',
                  onPress: () => navigation.navigate('Wallet'),
                },
              ].map((item) => (
                <Pressable key={item.label} style={styles.cockpitStatTile} onPress={item.onPress}>
                  <View style={styles.cockpitStatValueRow}>
                    <Text style={styles.cockpitStatValue}>{item.value}</Text>
                    {item.unit ? <Text style={styles.cockpitStatUnit}>{item.unit}</Text> : null}
                  </View>
                  <Text style={styles.cockpitStatLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* End / Start Duty Primary Action Button */}
            <Pressable
              onPress={() => navigation.navigate(session.onDuty ? 'EndDuty' : 'StartDuty')}
              style={({ pressed }) => [
                styles.cockpitCta,
                session.onDuty ? styles.cockpitCtaEnd : styles.cockpitCtaStart,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Ionicons
                name={session.onDuty ? 'power' : 'play'}
                size={16}
                color={session.onDuty ? '#FFFFFF' : '#1367DF'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.cockpitCtaText,
                  session.onDuty ? { color: '#FFFFFF' } : { color: '#1367DF' },
                ]}
              >
                {session.onDuty ? t('home.endDuty') : t('home.startDuty')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ─── PAGE BODY (BELOW HERO) ─── */}
        <View style={styles.pageBody}>
          {/* ─── QUICK ACTIONS GRID ─── */}
          <SectionTitle title={t('home.quickActions')} />
          <View style={styles.gridContainer}>
            {quickActions.map((item) => {
              const isSos = item.titleKey === 'home.sos';
              return (
                <Pressable
                  key={item.titleKey}
                  onPress={() => navigation.navigate(item.route as never)}
                  style={({ pressed }) => [
                    styles.gridTile,
                    {
                      backgroundColor: isDark ? '#181818' : '#FFFFFF',
                      borderColor: isDark ? '#262626' : '#ECECEC',
                    },
                    pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
                  ]}
                >
                  {isSos && <View style={styles.sosAlertDot} />}
                  <View
                    style={[
                      styles.gridIconBox,
                      { backgroundColor: isDark ? item.bgDark : item.bgLight },
                    ]}
                  >
                    <Ionicons name={item.icon} size={22} color={item.tint} />
                  </View>
                  <Text
                    style={[styles.gridTitle, { color: colors.text }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                  >
                    {t(item.titleKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ─── RECENT TIMELINE ─── */}
          <SectionTitle title={t('home.recent')} />
          <View style={[styles.timeline, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {recent.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.timelineRow,
                  index < recent.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.borderSoft,
                  },
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenWrap: {
    flex: 1,
  },

  /* ─── STICKY HEADER ─── */
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: space.lg,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  stickyDriverName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  stickyMeta: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },
  stickyRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stickyDutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  stickyDutyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stickyAvatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyAvatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  stickyAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyAvatarInitials: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },

  /* ─── SCROLL CONTENT ─── */
  scrollBody: {
    paddingBottom: 96,
  },

  /* ─── UNIFIED BLUE HERO ─── */
  heroContainer: {
    width: '100%',
    paddingHorizontal: space.lg,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderCurve: 'continuous',
    shadowColor: '#0848AA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(6, 40, 105, 0.38)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  heroGreetingPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    marginBottom: 5,
  },
  heroGreetingText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  heroDriverName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  heroLocationText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 12,
    fontWeight: '500',
  },
  heroRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  heroDutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  heroDutyText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  dutyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  heroAvatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  heroAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  avatarOnlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  /* ─── COCKPIT SECTION INSIDE HERO ─── */
  cockpitSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  cockpitTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cockpitTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cockpitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderCurve: 'continuous',
  },
  cockpitTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cockpitDateText: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 11,
    fontWeight: '600',
  },
  cockpitPlate: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  cockpitSub: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  cockpitShiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  cockpitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cockpitShiftText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Stats Row inside Hero */
  cockpitStatsRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  cockpitStatTile: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    alignItems: 'center',
  },
  cockpitStatValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  cockpitStatValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  cockpitStatUnit: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '600',
  },
  cockpitStatLabel: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },

  /* Primary CTA inside Hero */
  cockpitCta: {
    marginTop: 14,
    height: 46,
    borderRadius: 14,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  cockpitCtaStart: {
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.18,
  },
  cockpitCtaEnd: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOpacity: 0.35,
  },
  cockpitCtaText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  /* ─── PAGE BODY (BELOW HERO) ─── */
  pageBody: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },

  /* ─── QUICK ACTIONS GRID ─── */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  gridTile: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
    position: 'relative',
  },
  sosAlertDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  gridIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  /* ─── RECENT TIMELINE ─── */
  timeline: {
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: space.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    gap: space.md,
  },
  timelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  timelineSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
