import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import { API_BASE_URL } from '../constants/config';
import { BookingItem, generateMockBookings } from '../types/booking';

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

  const [filter, setFilter] = useState<FilterTab>('today-tomorrow');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [bookings, setBookings] = useState<BookingItem[]>(() => generateMockBookings());
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const driverName = session.driver.name;
      const res = await fetch(`${API_BASE_URL}/bookings?search=${encodeURIComponent(driverName || '')}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          const serverBookings: BookingItem[] = json.data.map((b: any) => ({
            id: b._id || b.id || `bk-${Math.random()}`,
            bookingNumber: b.bookingNumber || b.tripNumber || 'BK-LIVE',
            status: b.status || 'Scheduled',
            tripType: b.tripType || 'One-way (Single)',
            startDate: b.startDate || new Date().toISOString().split('T')[0],
            startTime: b.startTime || '09:00 AM',
            endDate: b.endDate,
            endTime: b.endTime,
            customerName: b.customerName || 'Passenger',
            customerPhone: b.customerPhone || '+91 98000 00000',
            passengersCount: b.passengersCount || 2,
            luggageCount: b.luggageCount || 2,
            pickupLocation: b.pickupLocation || 'Pickup Point',
            pickupLandmark: b.pickupLandmark,
            dropLocation: b.dropLocation || 'Drop Location',
            dropLandmark: b.dropLandmark,
            route: b.route || `${b.pickupLocation} → ${b.dropLocation}`,
            routeDistanceKm: b.routeDistanceKm || 24,
            estimatedDurationMins: b.estimatedDurationMins || 40,
            vehicle: b.vehicle || session.vehicle.reg || 'TRP-8841',
            vehicleModel: b.vehicleModel || 'Toyota Innova Crysta',
            driverName: b.driverName || session.driver.name,
            totalAmount: Number(b.revenue || b.totalAmount || 0),
            advanceAmount: Number(b.advanceAmount || 0),
            pendingAmount: Number(b.pendingAmount || 0),
            paymentStatus: b.paymentStatus || 'Unpaid',
            specialRequests: b.notes || b.specialRequests || 'Standard commercial trip request.',
            notes: b.paymentNotes || b.notes,
          }));

          const mock = generateMockBookings();
          const existingIds = new Set(serverBookings.map((sb) => sb.bookingNumber));
          const combined = [...serverBookings, ...mock.filter((m) => !existingIds.has(m.bookingNumber))];
          setBookings(combined);
          return;
        }
      }
    } catch {
      // Fallback
    }
    setBookings(generateMockBookings());
  }, [session.driver.name, session.vehicle.reg]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

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

    if (filter === 'today-tomorrow') {
      return bookings.filter((b) => b.startDate === todayStr || b.startDate === tomorrowStr);
    }
    if (filter === 'week') {
      return bookings.filter((b) => b.startDate >= startOfWeekStr && b.startDate <= endOfWeekStr);
    }
    if (filter === 'month') {
      return bookings.filter((b) => b.startDate.startsWith(currentMonthPrefix));
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
  const cardBg = isDark ? '#1C2129' : '#FFFFFF';
  const cardBorder = isDark ? '#2B323D' : '#EDF2F7';
  const subBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9';

  return (
    <View style={[styles.screenWrap, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* TOP NATIVE REUSABLE HEADER */}
      <ScreenHeader
        title={t('tab.bookings') || 'Bookings'}
        subtitle="Scheduled & assigned trips"
        rightAction={
          <View style={[styles.tripCountBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF' }]}>
            <Text style={[styles.tripCountBadgeText, { color: '#2563EB' }]}>
              {filteredBookings.length} {filteredBookings.length === 1 ? 'Trip' : 'Trips'}
            </Text>
          </View>
        }
      >

        {/* HORIZONTAL FILTER PILLS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterPillsRow}
        >
          <Pressable
            onPress={() => setFilter('today-tomorrow')}
            style={[
              styles.filterPill,
              {
                backgroundColor: filter === 'today-tomorrow' ? colors.accent : isDark ? '#232933' : '#F1F5F9',
                borderColor: filter === 'today-tomorrow' ? colors.accent : cardBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: filter === 'today-tomorrow' ? '#FFFFFF' : colors.text },
              ]}
            >
              Today & Tomorrow
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter('week')}
            style={[
              styles.filterPill,
              {
                backgroundColor: filter === 'week' ? colors.accent : isDark ? '#232933' : '#F1F5F9',
                borderColor: filter === 'week' ? colors.accent : cardBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: filter === 'week' ? '#FFFFFF' : colors.text },
              ]}
            >
              This Week
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter('month')}
            style={[
              styles.filterPill,
              {
                backgroundColor: filter === 'month' ? colors.accent : isDark ? '#232933' : '#F1F5F9',
                borderColor: filter === 'month' ? colors.accent : cardBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: filter === 'month' ? '#FFFFFF' : colors.text },
              ]}
            >
              This Month
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter('custom-date')}
            style={[
              styles.filterPill,
              {
                backgroundColor: filter === 'custom-date' ? colors.accent : isDark ? '#232933' : '#F1F5F9',
                borderColor: filter === 'custom-date' ? colors.accent : cardBorder,
              },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={13}
              color={filter === 'custom-date' ? '#FFFFFF' : colors.text}
              style={{ marginRight: 5 }}
            />
            <Text
              style={[
                styles.filterPillText,
                { color: filter === 'custom-date' ? '#FFFFFF' : colors.text },
              ]}
            >
              {filter === 'custom-date' ? formatDisplayDate(selectedDate) : 'Date'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter('all')}
            style={[
              styles.filterPill,
              {
                backgroundColor: filter === 'all' ? colors.accent : isDark ? '#232933' : '#F1F5F9',
                borderColor: filter === 'all' ? colors.accent : cardBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: filter === 'all' ? '#FFFFFF' : colors.text },
              ]}
            >
              All Trips
            </Text>
          </Pressable>
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
                  <Pressable
                    onPress={() => setSelectedDate(item.dateStr)}
                    style={[
                      styles.dateDayPill,
                      {
                        backgroundColor: isSelected ? colors.accent : cardBg,
                        borderColor: isSelected ? colors.accent : cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateDayLabel,
                        { color: isSelected ? '#FFFFFF' : colors.textDim },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.dateDayNum,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {item.num}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        )}

        {/* FINANCIAL SUMMARY KPI CARD */}
        <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
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
        </View>
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
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#232933' : '#F1F5F9' }]}>
              <Ionicons name="calendar-outline" size={38} color={colors.textDim} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Trips Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textDim }]}>
              No bookings scheduled for the selected period.
            </Text>
            <Pressable
              onPress={() => setFilter('today-tomorrow')}
              style={[styles.emptyResetBtn, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.emptyResetBtnText}>View Today & Tomorrow</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id, booking: item })}
            style={({ pressed }) => [
              styles.bookingCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
                opacity: pressed ? 0.94 : 1,
                transform: [{ scale: pressed ? 0.992 : 1 }],
              },
            ]}
          >
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
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  callPassenger(item.customerPhone, item.customerName);
                }}
                style={({ pressed }) => [
                  styles.callButton,
                  { backgroundColor: isDark ? '#232933' : '#F1F5F9', opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="call" size={15} color="#2563EB" />
              </Pressable>
            </View>
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
    borderRadius: 12,
    borderWidth: 1,
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
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  bookingCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
