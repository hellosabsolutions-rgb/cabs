import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { GlassButton, GlassCircleButton, GlassPill, GlassSurface, supportsLiquidGlass, usesIosGlass } from '../components/GlassChrome';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import { API_BASE_URL } from '../constants/config';
import { BookingItem } from '../types/booking';
import { bookingApi } from '../services/api';
import { driverSocket } from '../services/socket';

type Props = NativeStackScreenProps<RootStackParamList, any>;

type FilterTab = 'today-tomorrow' | 'week' | 'month' | 'custom-date' | 'all';

function formatDisplayDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

function getRelativeDateLabel(dateStr: string): string {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';
  return formatDisplayDate(dateStr);
}

export function BookingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, scheme, t } = useAppTheme();
  const session = useSession();

  const [filter, setFilter] = useState<FilterTab>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await bookingApi.getMyBookings();
      if (res?.data && Array.isArray(res.data)) {
        const serverBookings: BookingItem[] = res.data.map((b: any) => ({
          id: b._id || b.id || `bk-${Math.random()}`,
          bookingNumber: b.bookingNumber || b.tripNumber || 'BK-LIVE',
          status: b.status || 'Scheduled',
          tripType: b.tripType || 'One-way (Single)',
          startDate: b.startDate || new Date().toISOString().split('T')[0],
          startTime: b.startTime || '09:00 AM',
          endDate: b.endDate,
          endTime: b.endTime,
          customerName: b.customerName || 'Passenger',
          customerPhone: b.customerPhone || '',
          passengersCount: b.passengersCount || 1,
          luggageCount: b.luggageCount || 0,
          pickupLocation: b.pickupLocation || 'Pickup Point',
          pickupLandmark: b.pickupLandmark,
          dropLocation: b.dropLocation || 'Drop Location',
          dropLandmark: b.dropLandmark,
          route: b.route || `${b.pickupLocation} → ${b.dropLocation}`,
          routeDistanceKm: Number(b.routeDistanceKm || 0),
          estimatedDurationMins: Number(b.estimatedDurationMins || 0),
          vehicle: b.vehicle || session.vehicle?.reg || '',
          vehicleModel: b.vehicleModel || 'Commercial Vehicle',
          driverName: b.driverName || session.driver?.name || '',
          totalAmount: Number(b.revenue || b.totalAmount || 0),
          advanceAmount: Number(b.advanceAmount || 0),
          pendingAmount: Number(b.pendingAmount || 0),
          paymentStatus: b.paymentStatus || 'Unpaid',
          specialRequests: b.specialRequests || '',
          notes: b.notes || b.paymentNotes || '',
          startOdometer: b.startOdometer,
          endOdometer: b.endOdometer,
          totalKmRun: b.totalKmRun,
        }));

        setBookings(serverBookings);
        return;
      }
      setBookings([]);
    } catch (err) {
      console.warn('[BookingsScreen] Server fetch error:', err);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.driver?.name, session.vehicle?.reg]);

  useEffect(() => {
    fetchBookings();

    const myName = () => (session.driver?.name || '').trim().toLowerCase();

    // ── booking:assigned ──────────────────────────────────────────────────
    // Server sends this both targeted (emitToDriver) AND via broadcastAll.
    // Only add/alert if the booking belongs to THIS driver.
    const unsubAssigned = driverSocket.on('booking:assigned', (data: any) => {
      console.log('⚡ [BookingsScreen] booking:assigned received:', data);
      const b = data?.booking || data;
      const bDriverName = (b?.driverName || '').trim().toLowerCase();
      const me = myName();

      // If driver name matches OR the event was targeted (no driverName filter needed
      // because server already targeted our socket room), show alert & refresh.
      if (!bDriverName || !me || bDriverName === me) {
        const bId = b?._id || b?.id;
        const bNumber = b?.bookingNumber || '';

        // Optimistic add: insert into list immediately so it appears without waiting for fetch
        if (b && bId) {
          setBookings((prev) => {
            const alreadyExists = prev.some(
              (item) => item.id === bId || item.bookingNumber === bNumber
            );
            if (alreadyExists) return prev;
            const newBooking: BookingItem = {
              id: bId,
              bookingNumber: bNumber || 'BK-NEW',
              status: b.status || 'Scheduled',
              tripType: b.tripType || 'One-way (Single)',
              startDate: b.startDate || new Date().toISOString().split('T')[0],
              startTime: b.startTime || '09:00 AM',
              endDate: b.endDate,
              endTime: b.endTime,
              customerName: b.customerName || 'Passenger',
              customerPhone: b.customerPhone || '',
              passengersCount: b.passengersCount || 1,
              luggageCount: b.luggageCount || 0,
              pickupLocation: b.pickupLocation || 'Pickup Point',
              pickupLandmark: b.pickupLandmark,
              dropLocation: b.dropLocation || 'Drop Location',
              dropLandmark: b.dropLandmark,
              route: b.route || `${b.pickupLocation || ''} → ${b.dropLocation || ''}`,
              routeDistanceKm: Number(b.routeDistanceKm || 0),
              estimatedDurationMins: Number(b.estimatedDurationMins || 0),
              vehicle: b.vehicle || '',
              vehicleModel: b.vehicleModel || 'Commercial Vehicle',
              driverName: b.driverName || '',
              totalAmount: Number(b.revenue || b.totalAmount || 0),
              advanceAmount: Number(b.advanceAmount || 0),
              pendingAmount: Number(b.pendingAmount || 0),
              paymentStatus: b.paymentStatus || 'Unpaid',
              specialRequests: b.specialRequests || '',
              notes: b.notes || '',
              startOdometer: b.startOdometer,
              endOdometer: b.endOdometer,
              totalKmRun: b.totalKmRun,
            };
            return [newBooking, ...prev];
          });
        }

        // Then fetch from server to get authoritative state
        fetchBookings();
      }
    });

    // ── booking:unassigned ────────────────────────────────────────────────
    // Server calls notifyDriverByName → emitToDriver (targeted), so this
    // event reaches ONLY the driver being unassigned. Remove immediately.
    const unsubUnassigned = driverSocket.on('booking:unassigned', (data: any) => {
      console.log('⚡ [BookingsScreen] booking:unassigned received:', data);
      const targetId = data?.bookingId || data?.id || data?.booking?._id;
      const targetNumber = data?.bookingNumber || data?.booking?.bookingNumber;

      // Immediately purge from UI (no name-match guard needed — server targeted us)
      setBookings((prev) =>
        prev.filter((b) => {
          if (targetId && (b.id === targetId || (b as any)._id === targetId)) return false;
          if (targetNumber && b.bookingNumber === targetNumber) return false;
          return true;
        })
      );

      fetchBookings();
    });

    // ── booking:updated ───────────────────────────────────────────────────
    const unsubUpdated = driverSocket.on('booking:updated', (data: any) => {
      console.log('⚡ [BookingsScreen] booking:updated received:', data);
      const b = data?.booking || data;
      if (b) {
        const bDriver = (b.driverName || b.driver || '').trim().toLowerCase();
        const me = myName();
        const isUnassigned =
          !bDriver ||
          bDriver === 'unassigned' ||
          bDriver === 'none' ||
          bDriver === '—';
        const isDifferentDriver = me && bDriver && bDriver !== me;

        // If unassigned or reassigned to another driver → remove immediately
        if (isUnassigned || isDifferentDriver) {
          const bId = b._id || b.id;
          setBookings((prev) =>
            prev.filter(
              (item) =>
                item.id !== bId &&
                (b._id ? item.id !== b._id : true) &&
                item.bookingNumber !== b.bookingNumber
            )
          );
        }
      }
      fetchBookings();
    });

    // ── booking:deleted ───────────────────────────────────────────────────
    const unsubDeleted = driverSocket.on('booking:deleted', (data: any) => {
      console.log('⚡ [BookingsScreen] booking:deleted received:', data);
      const targetId = data?.bookingId || data?.id;
      const targetNumber = data?.bookingNumber;
      setBookings((prev) =>
        prev.filter((b) => {
          if (targetId && (b.id === targetId || (b as any)._id === targetId)) return false;
          if (targetNumber && b.bookingNumber === targetNumber) return false;
          return true;
        })
      );
      fetchBookings();
    });

    // ── booking:completed ─────────────────────────────────────────────────
    const unsubCompleted = driverSocket.on('booking:completed', () => {
      fetchBookings();
    });

    // ── driver:any_change (catch-all) ─────────────────────────────────────
    // Debounce to avoid multiple rapid fetches when several events fire at once
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubAny = driverSocket.on('driver:any_change', () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchBookings();
      }, 500);
    });

    return () => {
      unsubAssigned();
      unsubUnassigned();
      unsubUpdated();
      unsubDeleted();
      unsubCompleted();
      unsubAny();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [fetchBookings, session.driver?.name]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  // Filter logic
  const filteredBookings = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfWeekStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
    const endOfWeekStr = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`;

    const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    if (filter === 'all') {
      return bookings;
    }
    if (filter === 'today-tomorrow') {
      const matched = bookings.filter((b) => b.status === 'Ongoing' || b.startDate === todayStr || b.startDate === tomorrowStr);
      return matched.length > 0 ? matched : bookings;
    }
    if (filter === 'week') {
      const matched = bookings.filter((b) => b.startDate >= startOfWeekStr && b.startDate <= endOfWeekStr);
      return matched.length > 0 ? matched : bookings;
    }
    if (filter === 'month') {
      const matched = bookings.filter((b) => b.startDate.startsWith(currentMonthPrefix));
      return matched.length > 0 ? matched : bookings;
    }
    if (filter === 'custom-date') {
      return bookings.filter((b) => b.startDate === selectedDate);
    }
    return bookings;
  }, [bookings, filter, selectedDate]);

  const totalFare = useMemo(
    () => filteredBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    [filteredBookings]
  );
  const totalPending = useMemo(
    () => filteredBookings.reduce((sum, b) => sum + (b.pendingAmount || 0), 0),
    [filteredBookings]
  );

  const callPassenger = (phone: string, name: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Cannot Call', `Unable to call ${name} at ${phone}. Please dial manually.`);
    });
  };

  const selectableDates = useMemo(() => {
    const dates: { dateStr: string; label: string; day: string; num: string }[] = [];
    const base = new Date();
    for (let i = -3; i <= 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dates.push({
        dateStr: str,
        label: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        day: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        num: String(d.getDate()),
      });
    }
    return dates;
  }, []);

  const isDark = scheme === 'dark';
  const subBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9';
  const filledChip = !usesIosGlass || !supportsLiquidGlass;
  const chipColor = (active: boolean) => (active && filledChip ? '#FFFFFF' : colors.text);

  return (
    <View style={[styles.screenWrap, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* TOP NATIVE REUSABLE HEADER */}
      <ScreenHeader
        title={t('tab.bookings') || 'Bookings'}
        subtitle="Scheduled & assigned trips"
        rightAction={
          <GlassPill>
            <Text style={[styles.tripCountBadgeText, { color: colors.accent }]}>
              {filteredBookings.length} {filteredBookings.length === 1 ? 'Trip' : 'Trips'}
            </Text>
          </GlassPill>
        }
      >

        {/* HORIZONTAL FILTER PILLS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterPillsRow}
        >
          {([
            { id: 'all' as const, label: `All Trips${bookings.length > 0 ? ` (${bookings.length})` : ''}` },
            { id: 'today-tomorrow' as const, label: 'Today & Tomorrow' },
            { id: 'week' as const, label: 'This Week' },
            { id: 'month' as const, label: 'This Month' },
          ]).map((tab) => {
            const active = filter === tab.id;
            return (
              <GlassPill key={tab.id} selected={active} onPress={() => setFilter(tab.id)}>
                <Text style={[styles.filterPillText, { color: chipColor(active) }]}>
                  {tab.label}
                </Text>
              </GlassPill>
            );
          })}

          <GlassPill selected={filter === 'custom-date'} onPress={() => setFilter('custom-date')}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={chipColor(filter === 'custom-date')}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.filterPillText, { color: chipColor(filter === 'custom-date') }]}>
              {filter === 'custom-date' ? formatDisplayDate(selectedDate) : 'Date'}
            </Text>
          </GlassPill>
        </ScrollView>

        {/* CUSTOM DATE HORIZONTAL SELECTOR STRIP */}
        {filter === 'custom-date' && (
          <View style={styles.dateSelectorStrip}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={selectableDates}
              keyExtractor={(item) => item.dateStr}
              contentContainerStyle={{ paddingHorizontal: 2, gap: 8 }}
              renderItem={({ item }) => {
                const isSelected = item.dateStr === selectedDate;
                return (
                  <GlassPill
                    selected={isSelected}
                    onPress={() => setSelectedDate(item.dateStr)}
                    style={styles.dateDayPill}
                  >
                    <View style={{ alignItems: 'center' }}>
                      <Text style={[styles.dateDayLabel, { color: isSelected && filledChip ? '#FFFFFF' : colors.textDim }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.dateDayNum, { color: chipColor(isSelected) }]}>
                        {item.num}
                      </Text>
                    </View>
                  </GlassPill>
                );
              }}
            />
          </View>
        )}

        {/* FINANCIAL SUMMARY KPI CARD */}
        <GlassSurface style={styles.kpiCard}>
          <View style={styles.kpiItem}>
            <Text style={[styles.kpiLabel, { color: colors.textDim }]}>Total Est. Fare</Text>
            <Text style={[styles.kpiValue, { color: colors.text }]}>
              ₹{totalFare.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.kpiDivider, { backgroundColor: subBorder }]} />
          <View style={styles.kpiItem}>
            <Text style={[styles.kpiLabel, { color: colors.textDim }]}>Pending Collect</Text>
            <Text style={[styles.kpiValue, { color: totalPending > 0 ? '#F59E0B' : '#10B981' }]}>
              ₹{totalPending.toLocaleString('en-IN')}
            </Text>
          </View>
        </GlassSurface>
      </ScreenHeader>

      {/* FULL-SCREEN BOOKINGS LIST */}
      <FlatList
        style={styles.flatList}
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 120 }, // Ensures last card always scrolls past bottom tab bar
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading && !refreshing ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.emptySubtitle, { color: colors.textDim, marginTop: 12 }]}>
                Loading assigned bookings...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#232933' : '#F1F5F9' }]}>
                <Ionicons name="calendar-outline" size={38} color={colors.textDim} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {bookings.length === 0 ? 'No Bookings Assigned' : 'No Trips Found'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textDim }]}>
                {bookings.length === 0
                  ? 'You currently have no bookings assigned. Real trips assigned by dispatch will appear here.'
                  : 'No bookings scheduled for the selected period.'}
              </Text>
              {bookings.length > 0 ? (
                <GlassButton
                  title={`View All Assigned Trips (${bookings.length})`}
                  onPress={() => setFilter('all')}
                  style={styles.emptyResetBtn}
                />
              ) : (
                <GlassButton
                  title="Refresh Bookings"
                  onPress={onRefresh}
                  style={styles.emptyResetBtn}
                />
              )}
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id, booking: item })}
            style={({ pressed }) => ({
              opacity: pressed ? 0.94 : 1,
              transform: [{ scale: pressed ? 0.992 : 1 }],
            })}
          >
          <GlassSurface style={styles.bookingCard}>
            {/* Top Row: Ref #, Trip Type & Status */}
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.refTag, { backgroundColor: isDark ? '#232933' : '#EFF6FF', borderColor: isDark ? '#334155' : '#DBEAFE' }]}>
                  <Text style={styles.refTagText}>{item.bookingNumber}</Text>
                </View>
                <View style={[styles.tripTypeTag, { backgroundColor: isDark ? '#232933' : '#F1F5F9' }]}>
                  <Text style={[styles.tripTypeTagText, { color: colors.textDim }]}>{item.tripType}</Text>
                </View>
              </View>

              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'Ongoing'
                    ? { backgroundColor: '#DCFCE7' }
                    : item.status === 'Completed'
                    ? { backgroundColor: '#DBEAFE' }
                    : { backgroundColor: '#FEF08A' },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        item.status === 'Ongoing'
                          ? '#15803D'
                          : item.status === 'Completed'
                          ? '#1D4ED8'
                          : '#854D0E',
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        item.status === 'Ongoing'
                          ? '#15803D'
                          : item.status === 'Completed'
                          ? '#1D4ED8'
                          : '#854D0E',
                    },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>

            {/* Schedule & Distance Banner */}
            <View style={styles.scheduleRow}>
              <View style={[styles.schedulePill, { backgroundColor: isDark ? '#232933' : '#F8FAFC' }]}>
                <Ionicons name="time-outline" size={13} color={colors.text} />
                <Text style={[styles.schedulePillText, { color: colors.text }]}>
                  {getRelativeDateLabel(item.startDate)} · {item.startTime}
                </Text>
              </View>
              <Text style={[styles.routeDistanceText, { color: colors.textDim }]}>
                ~{item.routeDistanceKm} km · {item.estimatedDurationMins} min
              </Text>
            </View>

            {/* Route Section: Visual Vertical Path */}
            <View style={styles.routeBox}>
              <View style={styles.routeLineCol}>
                <View style={styles.startGreenDot} />
                <View style={[styles.pathDottedLine, { borderColor: isDark ? '#475569' : '#CBD5E1' }]} />
                <View style={styles.endRedSquare} />
              </View>

              <View style={styles.routeLocationsCol}>
                {/* Pickup */}
                <View style={styles.locationItem}>
                  <Text style={styles.pickupLabel}>PICKUP</Text>
                  <Text style={[styles.locationAddress, { color: colors.text }]} numberOfLines={1}>
                    {item.pickupLocation}
                  </Text>
                  {item.pickupLandmark && (
                    <Text style={[styles.landmarkText, { color: colors.textDim }]} numberOfLines={1}>
                      Landmark: {item.pickupLandmark}
                    </Text>
                  )}
                </View>

                {/* Dropoff */}
                <View style={[styles.locationItem, { marginTop: 10 }]}>
                  <Text style={styles.dropLabel}>DROPOFF</Text>
                  <Text style={[styles.locationAddress, { color: colors.text }]} numberOfLines={1}>
                    {item.dropLocation}
                  </Text>
                  {item.dropLandmark && (
                    <Text style={[styles.landmarkText, { color: colors.textDim }]} numberOfLines={1}>
                      Landmark: {item.dropLandmark}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Card Divider */}
            <View style={[styles.divider, { backgroundColor: subBorder }]} />

            {/* Passenger, Fare & Call Action Row */}
            <View style={styles.cardFooterRow}>
              {/* Passenger Details */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.passengerName, { color: colors.text }]}>
                    {item.customerName || 'Guest Passenger'}
                  </Text>
                  <View style={[styles.guestCountPill, { backgroundColor: isDark ? '#232933' : '#F1F5F9' }]}>
                    <Ionicons name="people" size={11} color={colors.textDim} />
                    <Text style={[styles.guestCountText, { color: colors.textDim }]}>
                      {item.passengersCount}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.vehicleText, { color: colors.textDim }]}>
                  {item.vehicleModel || item.vehicle}
                </Text>
              </View>

              {/* Fare & Status */}
              <View style={{ alignItems: 'flex-end', marginRight: 6 }}>
                <Text style={[styles.farePrice, { color: colors.text }]}>
                  ₹{item.totalAmount.toLocaleString('en-IN')}
                </Text>
                {item.pendingAmount > 0 ? (
                  <Text style={[styles.fareStatusTag, { color: '#D97706' }]}>
                    Collect ₹{item.pendingAmount.toLocaleString('en-IN')}
                  </Text>
                ) : (
                  <Text style={[styles.fareStatusTag, { color: '#15803D' }]}>
                    Fully Paid
                  </Text>
                )}
              </View>

              {/* Quick Call Button */}
              <GlassCircleButton
                onPress={() => callPassenger(item.customerPhone, item.customerName)}
                icon="call"
                iconSize={15}
                iconColor="#2563EB"
                size={36}
                accessibilityLabel={`Call ${item.customerName}`}
              />
            </View>
          </GlassSurface>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrap: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  tripCountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  tripCountBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  filterScrollView: {
    marginHorizontal: -16,
    marginBottom: 8,
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8.5,
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateSelectorStrip: {
    paddingVertical: 4,
    marginBottom: 8,
  },
  dateDayPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 54,
  },
  dateDayLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateDayNum: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  kpiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  kpiItem: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 14,
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 240,
  },
  emptyResetBtn: {
    marginTop: 18,
    minWidth: 220,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  bookingCard: {
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  refTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  refTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.4,
  },
  tripTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderCurve: 'continuous',
  },
  tripTypeTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderCurve: 'continuous',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  schedulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderCurve: 'continuous',
  },
  schedulePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  routeDistanceText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  routeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  routeLineCol: {
    alignItems: 'center',
    width: 14,
    paddingTop: 4,
  },
  startGreenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  pathDottedLine: {
    width: 1,
    height: 36,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 3,
  },
  endRedSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },
  routeLocationsCol: {
    flex: 1,
  },
  locationItem: {},
  pickupLabel: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dropLabel: {
    color: '#EF4444',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  locationAddress: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 2,
  },
  landmarkText: {
    fontSize: 11.5,
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  guestCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderCurve: 'continuous',
  },
  guestCountText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  vehicleText: {
    fontSize: 11.5,
    marginTop: 2,
  },
  farePrice: {
    fontSize: 15,
    fontWeight: '900',
  },
  fareStatusTag: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
