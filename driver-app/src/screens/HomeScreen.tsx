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
    tint: '#8B5CF6',
    bgLight: '#F5F3FF',
    bgDark: 'rgba(139, 92, 246, 0.18)',
  },
  {
    titleKey: 'home.advance',
    icon: 'wallet',
    route: 'AdvanceRequest',
    tint: '#10B981',
    bgLight: '#ECFDF5',
    bgDark: 'rgba(16, 185, 129, 0.18)',
  },
  {
    titleKey: 'home.digitalId',
    icon: 'id-card',
    route: 'DigitalId',
    tint: '#F59E0B',
    bgLight: '#FFFBEB',
    bgDark: 'rgba(245, 158, 11, 0.18)',
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
    return { key: 'home.goodMorning', icon: 'sunny', color: '#F59E0B' };
  }
  // Afternoon: 12:00 PM – 4:59 PM
  if (hour >= 12 && hour < 17) {
    return { key: 'home.goodAfternoon', icon: 'partly-sunny', color: '#EA580C' };
  }
  // Evening: 5:00 PM – 9:59 PM
  if (hour >= 17 && hour < 22) {
    return { key: 'home.goodEvening', icon: 'cloudy-night', color: '#8B5CF6' };
  }
  // Night / Late Night: 10:00 PM – 4:59 AM
  return { key: 'home.goodNight', icon: 'moon', color: '#6366F1' };
}

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, scheme, t } = useAppTheme();
  const isDark = scheme === 'dark';
  const session = useSession();
  const openDuty = session.duties.find((d) => !d.endedAt);
  const pulse = useRef(new Animated.Value(1)).current;
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <View style={[styles.screenWrap, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ─── BLINKIT / ZOMATO STYLE COOL TOP HEADER ─── */}
      <View
        style={[
          styles.topHeader,
          {
            paddingTop: Math.max(insets.top, 14),
            backgroundColor: isDark ? '#121212' : '#FFFFFF',
            borderBottomColor: isDark ? '#222222' : '#F0F0F0',
          },
        ]}
      >
        <View style={styles.headerRow}>
          {/* Left: Greeting pill + Driver Name + Agency/Location line */}
          <View style={styles.headerLeftCol}>
            <View
              style={[
                styles.greetingPill,
                {
                  backgroundColor: `${greeting.color}15`,
                  borderColor: `${greeting.color}35`,
                },
              ]}
            >
              <Ionicons name={greeting.icon} size={12} color={greeting.color} />
              <Text style={[styles.greetingPillText, { color: greeting.color }]}>
                {t(greeting.key)} 👋
              </Text>
            </View>

            <Text style={[styles.headerDriverName, { color: colors.text }]} numberOfLines={1}>
              {session.driver.name || 'Driver'}
            </Text>

            <Pressable
              style={styles.headerLocationRow}
              onPress={() => navigation.navigate('Profile')}
              hitSlop={8}
            >
              <Ionicons name="location-sharp" size={12} color="#1687F5" style={{ marginRight: 3 }} />
              <Text style={[styles.headerLocationText, { color: colors.textDim }]} numberOfLines={1}>
                {session.driver.agency || 'KABPRO Fleet'} · {session.driver.id || 'DRV'}
              </Text>
              <Ionicons name="chevron-down" size={11} color={colors.textFaint} style={{ marginLeft: 2 }} />
            </Pressable>
          </View>

          {/* Right: Duty Status Pill + Profile Avatar */}
          <View style={styles.headerRightCol}>
            {/* Live Duty Pill */}
            <Pressable
              onPress={() => navigation.navigate(session.onDuty ? 'EndDuty' : 'StartDuty')}
              style={[
                styles.headerDutyPill,
                session.onDuty
                  ? {
                      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.16)' : '#E8F5E9',
                      borderColor: isDark ? 'rgba(34, 197, 94, 0.35)' : '#C8E6C9',
                    }
                  : {
                      backgroundColor: isDark ? 'rgba(156, 163, 175, 0.12)' : '#F3F4F6',
                      borderColor: isDark ? 'rgba(156, 163, 175, 0.25)' : '#E5E7EB',
                    },
              ]}
            >
              <Animated.View
                style={[
                  styles.dutyDot,
                  {
                    backgroundColor: session.onDuty ? '#22C55E' : '#9CA3AF',
                    opacity: session.onDuty ? pulse : 0.6,
                  },
                ]}
              />
              <Text
                style={[
                  styles.headerDutyText,
                  { color: session.onDuty ? (isDark ? '#4ADE80' : '#16A34A') : colors.textDim },
                ]}
              >
                {session.onDuty ? t('home.onDuty') : t('home.offDuty')}
              </Text>
            </Pressable>

            {/* Avatar */}
            <Pressable
              onPress={() => navigation.navigate('Profile')}
              style={({ pressed }) => [
                styles.headerAvatarWrap,
                { borderColor: session.onDuty ? '#22C55E' : colors.border },
                pressed && { opacity: 0.8 },
              ]}
            >
              {session.driver.photo ? (
                <Image source={{ uri: session.driver.photo }} style={styles.headerAvatarImg} />
              ) : (
                <View style={[styles.headerAvatarFallback, { backgroundColor: colors.accent }]}>
                  <Text style={styles.headerAvatarInitials}>{session.driver.initials || 'SS'}</Text>
                </View>
              )}
              {session.onDuty && <View style={styles.avatarOnlineBadge} />}
            </Pressable>
          </View>
        </View>
      </View>

      {/* ─── SCROLLABLE CONTENT ─── */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollBody}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={isDark ? '#1E1E1E' : '#FFFFFF'}
          />
        }
      >
        {/* ─── COCKPIT CARD (No greetings, dedicated vehicle & shift cockpit) ─── */}
        <View style={styles.cockpitCard}>
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

            {/* Vehicle Type / Shift Status Pill inside card */}
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
              pressed && { opacity: 0.9 },
            ]}
          >
            <Ionicons
              name={session.onDuty ? 'power' : 'play'}
              size={16}
              color={session.onDuty ? '#FFFFFF' : '#1687F5'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.cockpitCtaText,
                session.onDuty ? { color: '#FFFFFF' } : { color: '#1687F5' },
              ]}
            >
              {session.onDuty ? t('home.endDuty') : t('home.startDuty')}
            </Text>
          </Pressable>
        </View>

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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenWrap: {
    flex: 1,
  },

  /* ─── BLINKIT / ZOMATO STYLE HEADER ─── */
  topHeader: {
    paddingHorizontal: space.lg,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeftCol: {
    flex: 1,
  },
  greetingPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 4,
  },
  greetingPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  headerDriverName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerLocationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerDutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dutyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  headerDutyText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  headerAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    position: 'relative',
  },
  headerAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarInitials: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
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

  /* ─── SCROLL CONTENT ─── */
  scrollBody: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: 96,
  },

  /* ─── COCKPIT CARD (Hero card without greetings) ─── */
  cockpitCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#1687F5',
    shadowColor: '#1687F5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
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
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cockpitTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cockpitDateText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '500',
  },
  cockpitPlate: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  cockpitSub: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  cockpitShiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  cockpitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cockpitShiftText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  /* Stats Row inside Card */
  cockpitStatsRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  cockpitStatTile: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cockpitStatValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  cockpitStatValue: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
  cockpitStatUnit: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontWeight: '600',
  },
  cockpitStatLabel: {
    color: 'rgba(255, 255, 255, 0.84)',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },

  /* Primary CTA inside Card */
  cockpitCta: {
    marginTop: 14,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cockpitCtaStart: {
    backgroundColor: '#FFFFFF',
  },
  cockpitCtaEnd: {
    backgroundColor: '#EF4444',
  },
  cockpitCtaText: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  /* ─── QUICK ACTIONS GRID ─── */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    marginTop: 6,
  },
  gridTile: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gridTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
    lineHeight: 16,
  },

  /* ─── RECENT ACTIVITY TIMELINE ─── */
  timeline: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 2,
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
    fontSize: 14.5,
    fontWeight: '600',
  },
  timelineSub: {
    fontSize: 12.5,
    marginTop: 2,
  },
});
