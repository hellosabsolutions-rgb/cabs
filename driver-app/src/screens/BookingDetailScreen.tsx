import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { BookingItem } from '../types/booking';
import { GoogleMapView } from '../components/GoogleMapView';
import { useSession } from '../state/session';
import { bookingApi } from '../services/api';
import { driverSocket } from '../services/socket';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetail'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BookingDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useAppTheme();
  const { booking: initialBooking, bookingId } = route.params;
  const [booking, setBooking] = useState<BookingItem | null>(initialBooking || null);
  const session = useSession();

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [endOdometerInput, setEndOdometerInput] = useState(
    String(Math.max(session.odometer || 0, ((initialBooking?.startOdometer || 0) + (initialBooking?.routeDistanceKm || 0))))
  );
  const [completionNotes, setCompletionNotes] = useState('');

  const [expandedSection, setExpandedSection] = useState<'route' | 'requests' | 'payment' | null>('route');

  // Parallax Draggable Bottom Sheet Snap Points
  const SNAP_TOP = insets.top + 52;
  const SNAP_MID = SCREEN_HEIGHT * 0.44;
  const SNAP_LOW = SCREEN_HEIGHT - 175;

  const translateY = useRef(new Animated.Value(SNAP_MID)).current;
  const currentSnap = useRef<'top' | 'mid' | 'low'>('mid');
  const lastGestureY = useRef(SNAP_MID);
  const startY = useRef(SNAP_MID);

  useEffect(() => {
    const id = translateY.addListener(({ value }) => {
      lastGestureY.current = value;
    });
    return () => {
      translateY.removeListener(id);
    };
  }, [translateY]);

  const snapTo = (target: number, nextState: 'top' | 'mid' | 'low') => {
    currentSnap.current = nextState;
    Animated.spring(translateY, {
      toValue: target,
      useNativeDriver: true,
      damping: 24,
      mass: 0.8,
      stiffness: 220,
    }).start();
  };

  const toggleSnapPoint = () => {
    if (currentSnap.current === 'mid') {
      snapTo(SNAP_TOP, 'top');
    } else if (currentSnap.current === 'top') {
      snapTo(SNAP_MID, 'mid');
    } else {
      snapTo(SNAP_MID, 'mid');
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: () => {
          translateY.stopAnimation();
          startY.current = lastGestureY.current;
        },
        onPanResponderMove: (_, gestureState) => {
          const nextY = Math.max(SNAP_TOP, Math.min(SNAP_LOW + 40, startY.current + gestureState.dy));
          translateY.setValue(nextY);
        },
        onPanResponderRelease: (_, gestureState) => {
          // If barely moved (tap), toggle snap point
          if (Math.abs(gestureState.dy) < 8 && Math.abs(gestureState.dx) < 8) {
            toggleSnapPoint();
            return;
          }

          const currentPos = startY.current + gestureState.dy;
          let target = SNAP_MID;
          let nextState: 'top' | 'mid' | 'low' = 'mid';

          if (gestureState.vy < -0.35) {
            // Flick up
            if (currentSnap.current === 'low') {
              target = SNAP_MID;
              nextState = 'mid';
            } else {
              target = SNAP_TOP;
              nextState = 'top';
            }
          } else if (gestureState.vy > 0.35) {
            // Flick down
            if (currentSnap.current === 'top') {
              target = SNAP_MID;
              nextState = 'mid';
            } else {
              target = SNAP_LOW;
              nextState = 'low';
            }
          } else {
            // Nearest snap point
            const dTop = Math.abs(currentPos - SNAP_TOP);
            const dMid = Math.abs(currentPos - SNAP_MID);
            const dLow = Math.abs(currentPos - SNAP_LOW);
            const minD = Math.min(dTop, dMid, dLow);

            if (minD === dTop) {
              target = SNAP_TOP;
              nextState = 'top';
            } else if (minD === dMid) {
              target = SNAP_MID;
              nextState = 'mid';
            } else {
              target = SNAP_LOW;
              nextState = 'low';
            }
          }

          snapTo(target, nextState);
        },
      }),
    [SNAP_TOP, SNAP_MID, SNAP_LOW]
  );

  useEffect(() => {
    if (!booking?.id) return;

    const onUpdated = (data: any) => {
      const b = data?.booking || data;
      if (b && (b.id === booking.id || b._id === booking.id || b.bookingNumber === booking.bookingNumber)) {
        const bDriver = (b.driverName || b.driver || '').trim().toLowerCase();
        const myName = (session.driver?.name || '').trim().toLowerCase();
        const isUnassigned = !bDriver || bDriver === 'unassigned' || bDriver === 'none' || bDriver === '—';
        const isDifferentDriver = myName && bDriver && bDriver !== myName;

        if (isUnassigned || isDifferentDriver) {
          Alert.alert(
            'Booking Unassigned',
            'This booking is no longer assigned to you by dispatch.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }

        setBooking((prev) =>
          prev
            ? {
                ...prev,
                ...b,
                status: b.status || prev.status,
                vehicle: b.vehicle || prev.vehicle,
                driverName: b.driverName || b.driver || prev.driverName,
              }
            : null
        );
      }
    };

    const onUnassigned = (data: any) => {
      const targetId = data?.bookingId || data?.id || data?._id || data?.booking?._id;
      const targetNumber = data?.bookingNumber || data?.booking?.bookingNumber;
      if (
        (targetId && (targetId === booking.id || targetId === (booking as any)._id)) ||
        (targetNumber && targetNumber === booking.bookingNumber)
      ) {
        Alert.alert(
          'Booking Unassigned',
          'This booking was unassigned from you by dispatch.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    };

    const onDeleted = (data: any) => {
      const targetId = data?.bookingId || data?.id;
      const targetNumber = data?.bookingNumber;
      if (
        (targetId && (targetId === booking.id || targetId === (booking as any)._id)) ||
        (targetNumber && targetNumber === booking.bookingNumber)
      ) {
        Alert.alert(
          'Booking Removed',
          'This booking has been cancelled or removed by dispatch.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    };

    driverSocket.on('booking:updated', onUpdated);
    driverSocket.on('booking:completed', onUpdated);
    driverSocket.on('booking:unassigned', onUnassigned);
    driverSocket.on('booking:deleted', onDeleted);

    return () => {
      driverSocket.off('booking:updated', onUpdated);
      driverSocket.off('booking:completed', onUpdated);
      driverSocket.off('booking:unassigned', onUnassigned);
      driverSocket.off('booking:deleted', onDeleted);
    };
  }, [booking?.id, navigation]);

  const handleStartTrip = () => {
    if (!booking) return;
    Alert.alert(
      'Start Trip',
      `Ready to start trip to ${booking.dropLocation} for ${booking.customerName || 'passenger'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Trip',
          style: 'default',
          onPress: async () => {
            if (!booking) return;
            setIsUpdatingStatus(true);
            try {
              const res = await bookingApi.updateStatus(booking.id, {
                status: 'Ongoing',
                startOdometer: booking.startOdometer || session.odometer || 0,
              });
              if (res.success && res.data) {
                setBooking((prev) => (prev ? { ...prev, ...res.data, status: 'Ongoing' } : null));
              } else {
                setBooking((prev) => (prev ? { ...prev, status: 'Ongoing' } : null));
              }
              Alert.alert('Trip Started', 'Trip is now active in transit. Dashboard has been notified.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not start trip.');
            } finally {
              setIsUpdatingStatus(false);
            }
          },
        },
      ]
    );
  };

  const handleConfirmComplete = async () => {
    if (!booking) return;
    const odoNum = Number(endOdometerInput);
    if (isNaN(odoNum) || odoNum <= 0) {
      Alert.alert('Invalid Odometer', 'Please enter a valid ending odometer reading.');
      return;
    }
    if (booking.startOdometer && odoNum < booking.startOdometer) {
      Alert.alert(
        'Invalid Reading',
        `End odometer (${odoNum} km) cannot be less than start odometer (${booking.startOdometer} km).`
      );
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await bookingApi.updateStatus(booking.id, {
        status: 'Completed',
        endOdometer: odoNum,
        notes: completionNotes.trim()
          ? `${booking.notes ? booking.notes + ' | ' : ''}${completionNotes.trim()}`
          : booking.notes,
      });

      if (res.success && res.data) {
        setBooking((prev) => (prev ? { ...prev, ...res.data, status: 'Completed', endOdometer: odoNum } : null));
      } else {
        setBooking((prev) => (prev ? { ...prev, status: 'Completed', endOdometer: odoNum } : null));
      }
      setIsCompleteModalOpen(false);
      Alert.alert('Trip Completed', 'Booking marked as completed. Dashboard synced in real time.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not complete trip.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!booking) {
    return (
      <View style={[styles.fallbackContainer, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.textDim }}>Booking not found.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.fallbackBackBtn}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const openNavigation = () => {
    const origin = encodeURIComponent(booking.pickupLocation);
    const destination = encodeURIComponent(booking.dropLocation);
    const googleMapsAppUrl = `comgooglemaps://?saddr=${origin}&daddr=${destination}&directionsmode=driving`;
    const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    const appleMapsUrl = `maps://?saddr=${origin}&daddr=${destination}&dirflg=d`;

    Linking.canOpenURL(googleMapsAppUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(googleMapsAppUrl);
        } else if (Platform.OS === 'ios') {
          Linking.canOpenURL(appleMapsUrl)
            .then((appleSupported) => {
              if (appleSupported) {
                Linking.openURL(appleMapsUrl);
              } else {
                Linking.openURL(googleMapsWebUrl);
              }
            })
            .catch(() => Linking.openURL(googleMapsWebUrl));
        } else {
          Linking.openURL(googleMapsWebUrl);
        }
      })
      .catch(() => Linking.openURL(googleMapsWebUrl));
  };

  const callPassenger = () => {
    if (!booking.customerPhone) {
      Alert.alert('No Phone', 'No contact number available for this passenger.');
      return;
    }
    Linking.openURL(`tel:${booking.customerPhone}`).catch(() => {
      Alert.alert('Cannot Call', `Please dial ${booking.customerPhone} manually.`);
    });
  };

  const smsPassenger = () => {
    if (!booking.customerPhone) return;
    Linking.openURL(`sms:${booking.customerPhone}`).catch(() => {
      Alert.alert('Cannot SMS', 'Could not open messaging app.');
    });
  };

  const isDark = scheme === 'dark';
  const cardBg = isDark ? '#1E232B' : '#FFFFFF';
  const cardBorder = isDark ? '#2D333D' : '#F1F3F5';
  const sheetBg = isDark ? '#14181F' : '#FFFFFF';
  const mutedText = isDark ? '#94A3B8' : '#64748B';
  const primaryText = isDark ? '#F8FAFC' : '#0F172A';
  const rowDivider = isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9';
  const rowHoverBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC';

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {/* FULL-SCREEN LIVE GOOGLE MAP (EXTENDING ALL THE WAY UNDER STATUS BAR) */}
      <View style={styles.mapBackgroundWrapper}>
        <GoogleMapView
          pickupLocation={booking.pickupLocation}
          dropLocation={booking.dropLocation}
          style={styles.mapImage}
          routeDistanceKm={booking.routeDistanceKm}
          estimatedDurationMins={booking.estimatedDurationMins}
          topOffset={insets.top + 58}
        />
      </View>

      {/* FLOATING TOP BAR: IOS LIQUID GLASS vs ANDROID NORMAL BUTTON */}
      <Pressable
        onPress={() => navigation.goBack()}
        android_ripple={{ color: 'rgba(0,0,0,0.12)', borderless: true }}
        style={({ pressed }) => [
          styles.floatingBackBtn,
          {
            top: insets.top + 8,
            backgroundColor: Platform.OS === 'ios'
              ? (isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.72)')
              : (isDark ? '#1E293B' : '#FFFFFF'),
            borderColor: Platform.OS === 'ios'
              ? (isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.85)')
              : (isDark ? '#334155' : '#E2E8F0'),
            borderWidth: Platform.OS === 'ios' ? 1.5 : 1,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        {Platform.OS === 'ios' && <View style={styles.liquidGlossHighlight} />}
        <Ionicons
          name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
          size={Platform.OS === 'ios' ? 22 : 20}
          color={primaryText}
        />
      </Pressable>

      {/* FLOATING ROUTE DISTANCE/ETA BADGE: IOS LIQUID GLASS vs ANDROID NORMAL BADGE */}
      <View
        style={[
          styles.floatingRouteBadge,
          {
            top: insets.top + 8,
            backgroundColor: Platform.OS === 'ios'
              ? (isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.75)')
              : (isDark ? '#1E293B' : '#FFFFFF'),
            borderColor: Platform.OS === 'ios'
              ? (isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.85)')
              : (isDark ? '#334155' : '#E2E8F0'),
            borderWidth: Platform.OS === 'ios' ? 1.5 : 1,
          },
        ]}
      >
        {Platform.OS === 'ios' && <View style={styles.routeBadgeGloss} />}
        <View style={styles.routeBadgeDot} />
        <Text style={[styles.floatingRouteBadgeText, { color: primaryText }]}>
          {booking.routeDistanceKm} km · ~{booking.estimatedDurationMins} min
        </Text>
      </View>

      {/* PARALLAX DRAGGABLE BOTTOM SHEET CARD */}
      <Animated.View
        style={[
          styles.bottomSheetCard,
          {
            backgroundColor: sheetBg,
            borderColor: cardBorder,
            shadowColor: '#000',
            transform: [{ translateY }],
          },
        ]}
      >
        {/* DRAGGABLE HEADER / HANDLE BAR WITH PAN RESPONDER */}
        <View {...panResponder.panHandlers} style={styles.dragHeaderArea}>
          <Pressable
            onPress={toggleSnapPoint}
            hitSlop={{ top: 16, bottom: 16, left: 60, right: 60 }}
            style={styles.handleBarWrap}
          >
            <View style={[styles.handleBar, { backgroundColor: isDark ? '#475569' : '#CBD5E1' }]} />
          </Pressable>

          {/* 1. PASSENGER PROFILE ROW */}
          <View style={styles.passengerProfileRow}>
            {/* Avatar */}
            <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#334155' : '#EEF2F6' }]}>
              <Ionicons name="person" size={24} color={isDark ? '#94A3B8' : '#475569'} />
            </View>

            {/* Name & Rating */}
            <View style={styles.passengerTextCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.passengerNameText, { color: primaryText }]} numberOfLines={1}>
                  {booking.customerName || 'Guest Passenger'}
                </Text>
                <View style={[styles.ratingTag, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                  <Ionicons name="star" size={11} color="#F59E0B" />
                  <Text style={[styles.ratingTagText, { color: primaryText }]}>4.8</Text>
                </View>
              </View>
              <Text style={[styles.passengerRoleText, { color: mutedText }]}>
                Passenger · {booking.passengersCount} {booking.passengersCount === 1 ? 'Guest' : 'Guests'}
              </Text>
            </View>

            {/* Circular Quick Action Buttons (Chat & Call) */}
            <View style={styles.profileActionsRow}>
              <Pressable
                onPress={smsPassenger}
                android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
                style={({ pressed }) => [
                  styles.circleActionBtn,
                  Platform.OS === 'ios'
                    ? {
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        opacity: pressed ? 0.7 : 1,
                      }
                    : {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                        borderWidth: 1,
                        opacity: pressed ? 0.85 : 1,
                      },
                ]}
              >
                <Ionicons name="chatbubble-ellipses" size={18} color={primaryText} />
              </Pressable>

              <Pressable
                onPress={callPassenger}
                android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
                style={({ pressed }) => [
                  styles.circleActionBtn,
                  Platform.OS === 'ios'
                    ? {
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        opacity: pressed ? 0.7 : 1,
                      }
                    : {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                        borderWidth: 1,
                        opacity: pressed ? 0.85 : 1,
                      },
                ]}
              >
                <Ionicons name="call" size={17} color={primaryText} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* INNER SCROLLABLE CONTENT */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 120, 160) }}
        >

          {/* Divider */}
          <View style={[styles.sheetDivider, { backgroundColor: rowDivider }]} />

          {/* 2. DROP-OFF DESTINATION & STATUS */}
          <View style={styles.destinationRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.destinationTitle, { color: primaryText }]} numberOfLines={2}>
                Drop-off at {booking.dropLocation}
              </Text>
              <Text style={[styles.destinationSub, { color: mutedText }]} numberOfLines={1}>
                {booking.dropLandmark ? `${booking.dropLandmark} · ` : ''}Scheduled Trip
              </Text>
            </View>

            {/* Status Pill Badge (e.g. In Transit / Scheduled) */}
            <View
              style={[
                styles.statusYellowBadge,
                booking.status === 'Ongoing'
                  ? { backgroundColor: '#FEF08A' }
                  : booking.status === 'Completed'
                  ? { backgroundColor: '#BBF7D0' }
                  : { backgroundColor: '#FEF08A' },
              ]}
            >
              <Ionicons
                name={booking.status === 'Ongoing' ? 'navigate' : 'radio-button-on'}
                size={12}
                color={booking.status === 'Completed' ? '#15803D' : '#854D0E'}
              />
              <Text
                style={[
                  styles.statusYellowText,
                  { color: booking.status === 'Completed' ? '#15803D' : '#854D0E' },
                ]}
              >
                {booking.status === 'Ongoing' ? 'In Transit' : booking.status}
              </Text>
            </View>
          </View>

          {/* 3. TIMELINE PROGRESS TRACKER (Matching Image 2) */}
          <View style={styles.progressTrackerContainer}>
            <View style={styles.progressLineTrack}>
              {/* Completed Line */}
              <View
                style={[
                  styles.progressLineFill,
                  { width: booking.status === 'Completed' ? '100%' : '50%' },
                ]}
              />

              {/* Start Dot */}
              <View style={[styles.progressDot, styles.progressDotStart]} />

              {/* Quarter Dot */}
              <View style={[styles.progressDot, styles.progressDotQuarter]} />

              {/* Active Milestone Vehicle Pin Badge */}
              <View style={styles.progressVehiclePin}>
                <Ionicons name="car" size={13} color="#78350F" />
              </View>

              {/* Three-quarter Dot */}
              <View
                style={[
                  styles.progressDot,
                  styles.progressDotThreeQuarter,
                  { backgroundColor: isDark ? '#334155' : '#CBD5E1' },
                ]}
              />

              {/* End Dot */}
              <View
                style={[
                  styles.progressDot,
                  styles.progressDotEnd,
                  { backgroundColor: isDark ? '#334155' : '#CBD5E1' },
                ]}
              />
            </View>

            {/* Time Labels */}
            <View style={styles.progressTimesRow}>
              <Text style={[styles.progressTimeLabel, { color: mutedText }]}>
                {booking.startTime}
              </Text>
              <Text style={[styles.progressTimeLabel, { color: mutedText }]}>
                {booking.endTime || '04:20 pm'}
              </Text>
            </View>
          </View>

          {/* 4. TRIP LIFECYCLE ACTION BUTTON */}
          {booking.status === 'Scheduled' && (
            <Pressable
              onPress={handleStartTrip}
              disabled={isUpdatingStatus}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              style={({ pressed }) => [
                styles.primaryLifecycleBtn,
                {
                  backgroundColor: '#059669',
                  opacity: pressed || isUpdatingStatus ? 0.85 : 1,
                  borderRadius: Platform.OS === 'ios' ? 14 : 8,
                },
              ]}
            >
              {isUpdatingStatus ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="play-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryLifecycleBtnText}>Start Trip (Pick Up Passenger)</Text>
                </>
              )}
            </Pressable>
          )}

          {booking.status === 'Ongoing' && (
            <Pressable
              onPress={() => {
                setEndOdometerInput(
                  String(
                    Math.max(
                      session.odometer || 0,
                      (booking.startOdometer || 0) + (booking.routeDistanceKm || 0)
                    )
                  )
                );
                setIsCompleteModalOpen(true);
              }}
              disabled={isUpdatingStatus}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              style={({ pressed }) => [
                styles.primaryLifecycleBtn,
                {
                  backgroundColor: '#D97706',
                  opacity: pressed || isUpdatingStatus ? 0.85 : 1,
                  borderRadius: Platform.OS === 'ios' ? 14 : 8,
                },
              ]}
            >
              {isUpdatingStatus ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryLifecycleBtnText}>Complete Trip & Enter Odometer</Text>
                </>
              )}
            </Pressable>
          )}

          {booking.status === 'Completed' && (
            <View
              style={[
                styles.completedBanner,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                  borderColor: '#10B981',
                  borderRadius: Platform.OS === 'ios' ? 14 : 8,
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={[styles.completedBannerText, { color: isDark ? '#34D399' : '#065F46' }]}>
                Trip Completed Successfully
              </Text>
            </View>
          )}

          {/* 5. TURN-BY-TURN NAVIGATION BUTTON */}
          <Pressable
            onPress={openNavigation}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            style={({ pressed }) => [
              styles.startNavigationBtn,
              Platform.OS === 'ios'
                ? {
                    borderRadius: 14,
                    shadowColor: '#2563EB',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.35,
                    shadowRadius: 12,
                    opacity: pressed ? 0.88 : 1,
                  }
                : {
                    borderRadius: 8,
                    elevation: 2,
                    opacity: pressed ? 0.92 : 1,
                  },
            ]}
          >
            <Ionicons name="navigate" size={16} color="#FFFFFF" />
            <Text style={styles.startNavigationBtnText}>
              Start Navigation · Google Maps
            </Text>
          </Pressable>

          {/* 5. TAPPABLE DETAIL ACCORDION ROWS (Matching Image 2) */}
          <View style={[styles.accordionContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {/* ROW 1: Order / Trip & Route Details */}
            <Pressable
              onPress={() => setExpandedSection(expandedSection === 'route' ? null : 'route')}
              style={[
                styles.accordionRow,
                { borderBottomColor: rowDivider, backgroundColor: expandedSection === 'route' ? rowHoverBg : 'transparent' },
              ]}
            >
              <View style={styles.accordionLeft}>
                <View style={[styles.accordionIconWrap, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                  <Ionicons name="document-text" size={16} color={primaryText} />
                </View>
                <Text style={[styles.accordionTitle, { color: primaryText }]}>
                  Trip & Route Details
                </Text>
              </View>
              <Ionicons
                name={expandedSection === 'route' ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={mutedText}
              />
            </Pressable>

            {expandedSection === 'route' && (
              <View style={[styles.expandedContent, { borderBottomColor: rowDivider }]}>
                {/* Pickup details */}
                <View style={styles.routeItemRow}>
                  <View style={styles.greenCircle} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailItemLabel, { color: '#10B981' }]}>PICKUP LOCATION</Text>
                    <Text style={[styles.detailItemValue, { color: primaryText }]}>
                      {booking.pickupLocation}
                    </Text>
                    {booking.pickupLandmark && (
                      <Text style={[styles.detailItemSub, { color: mutedText }]}>
                        Landmark: {booking.pickupLandmark}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Dropoff details */}
                <View style={[styles.routeItemRow, { marginTop: 10 }]}>
                  <View style={styles.redCircle} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailItemLabel, { color: '#EF4444' }]}>DROPOFF LOCATION</Text>
                    <Text style={[styles.detailItemValue, { color: primaryText }]}>
                      {booking.dropLocation}
                    </Text>
                    {booking.dropLandmark && (
                      <Text style={[styles.detailItemSub, { color: mutedText }]}>
                        Landmark: {booking.dropLandmark}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Vehicle & Trip Specs */}
                <View style={styles.specsRow}>
                  <View style={[styles.specChip, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: cardBorder }]}>
                    <Ionicons name="car-outline" size={13} color={colors.accent} />
                    <Text style={[styles.specChipText, { color: primaryText }]}>
                      {booking.vehicleModel || booking.vehicle}
                    </Text>
                  </View>
                  <View style={[styles.specChip, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: cardBorder }]}>
                    <Ionicons name="repeat" size={13} color={colors.accent} />
                    <Text style={[styles.specChipText, { color: primaryText }]}>
                      {booking.tripType}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ROW 2: Special Requests & Notes */}
            <Pressable
              onPress={() => setExpandedSection(expandedSection === 'requests' ? null : 'requests')}
              style={[
                styles.accordionRow,
                { borderBottomColor: rowDivider, backgroundColor: expandedSection === 'requests' ? rowHoverBg : 'transparent' },
              ]}
            >
              <View style={styles.accordionLeft}>
                <View style={[styles.accordionIconWrap, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                  <Ionicons name="chatbubbles" size={16} color={primaryText} />
                </View>
                <Text style={[styles.accordionTitle, { color: primaryText }]}>
                  Customer Requests & Notes
                </Text>
              </View>
              <Ionicons
                name={expandedSection === 'requests' ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={mutedText}
              />
            </Pressable>

            {expandedSection === 'requests' && (
              <View style={[styles.expandedContent, { borderBottomColor: rowDivider }]}>
                <View style={[styles.noteCallout, { backgroundColor: isDark ? '#1E293B' : '#FFFBEB', borderColor: isDark ? '#334155' : '#FDE68A' }]}>
                  <Ionicons name="information-circle" size={16} color="#D97706" style={{ marginTop: 1 }} />
                  <Text style={[styles.noteCalloutText, { color: isDark ? '#F1F5F9' : '#92400E' }]}>
                    {booking.specialRequests || 'No special requests submitted.'}
                  </Text>
                </View>

                {booking.notes && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.dispatchLabel, { color: mutedText }]}>DISPATCH REMARKS:</Text>
                    <Text style={[styles.dispatchBody, { color: primaryText }]}>{booking.notes}</Text>
                  </View>
                )}

                {/* Luggage spec */}
                <View style={[styles.specsRow, { marginTop: 8 }]}>
                  <View style={[styles.specChip, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: cardBorder }]}>
                    <Ionicons name="briefcase-outline" size={13} color={colors.accent} />
                    <Text style={[styles.specChipText, { color: primaryText }]}>
                      {booking.luggageCount || 2} Bags Luggage
                    </Text>
                  </View>
                  <View style={[styles.specChip, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: cardBorder }]}>
                    <Ionicons name="people-outline" size={13} color={colors.accent} />
                    <Text style={[styles.specChipText, { color: primaryText }]}>
                      {booking.passengersCount} Passengers
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ROW 3: Payment Details */}
            <Pressable
              onPress={() => setExpandedSection(expandedSection === 'payment' ? null : 'payment')}
              style={[
                styles.accordionRow,
                { borderBottomColor: rowDivider, backgroundColor: expandedSection === 'payment' ? rowHoverBg : 'transparent' },
              ]}
            >
              <View style={styles.accordionLeft}>
                <View style={[styles.accordionIconWrap, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                  <Ionicons name="card" size={16} color={primaryText} />
                </View>
                <Text style={[styles.accordionTitle, { color: primaryText }]}>
                  Payment Details
                </Text>
              </View>
              <Ionicons
                name={expandedSection === 'payment' ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={mutedText}
              />
            </Pressable>

            {expandedSection === 'payment' && (
              <View style={[styles.expandedContent, { borderBottomColor: rowDivider }]}>
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, { color: mutedText }]}>Total Agreed Fare</Text>
                  <Text style={[styles.paymentValue, { color: primaryText }]}>
                    ₹{booking.totalAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, { color: mutedText }]}>Advance Received</Text>
                  <Text style={[styles.paymentValue, { color: '#10B981' }]}>
                    - ₹{booking.advanceAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.sheetDivider, { backgroundColor: rowDivider, marginVertical: 6 }]} />
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabelBold, { color: primaryText }]}>Balance to Collect</Text>
                  <Text
                    style={[
                      styles.paymentBalanceBold,
                      { color: booking.pendingAmount > 0 ? '#F59E0B' : '#10B981' },
                    ]}
                  >
                    ₹{booking.pendingAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            )}

            {/* ROW 4: Support & Dispatch */}
            <Pressable
              onPress={() => {
                Linking.openURL('tel:112').catch(() => {
                  Alert.alert('Support Helpline', 'Please contact fleet dispatch via your agency phone.');
                });
              }}
              style={styles.accordionRow}
            >
              <View style={styles.accordionLeft}>
                <View style={[styles.accordionIconWrap, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                  <Ionicons name="help-buoy" size={16} color={primaryText} />
                </View>
                <Text style={[styles.accordionTitle, { color: primaryText }]}>
                  Support & Dispatch
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={mutedText} />
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>

      {/* COMPLETE TRIP & ENTER END ODOMETER MODAL */}
      <Modal
        visible={isCompleteModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCompleteModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setIsCompleteModalOpen(false)} />
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: primaryText }]}>Complete Trip</Text>
                <Text style={[styles.modalSubtitle, { color: mutedText }]}>
                  {booking.bookingNumber} · {booking.route}
                </Text>
              </View>
              <Pressable
                onPress={() => setIsCompleteModalOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color={mutedText} />
              </Pressable>
            </View>

            <View style={[styles.modalDivider, { backgroundColor: rowDivider }]} />

            {/* Start Odometer reference */}
            <View style={styles.modalFieldRow}>
              <Text style={[styles.modalLabel, { color: mutedText }]}>Start Odometer</Text>
              <Text style={[styles.modalValueBold, { color: primaryText }]}>
                {booking.startOdometer?.toLocaleString('en-IN') || 0} km
              </Text>
            </View>

            {/* End Odometer Input */}
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.modalInputLabel, { color: primaryText }]}>
                Ending Odometer Reading (km) *
              </Text>
              <TextInput
                value={endOdometerInput}
                onChangeText={setEndOdometerInput}
                keyboardType="numeric"
                placeholder="e.g. 45280"
                placeholderTextColor={mutedText}
                style={[
                  styles.modalTextInput,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: primaryText,
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
              />
              {Number(endOdometerInput) > (booking.startOdometer || 0) && (
                <Text style={{ fontSize: 11.5, color: '#10B981', marginTop: 4, fontWeight: '600' }}>
                  Total Trip Distance: {Number(endOdometerInput) - (booking.startOdometer || 0)} km
                </Text>
              )}
            </View>

            {/* Trip Notes */}
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.modalInputLabel, { color: primaryText }]}>
                Remarks / Toll / Parking Notes (Optional)
              </Text>
              <TextInput
                value={completionNotes}
                onChangeText={setCompletionNotes}
                placeholder="e.g. Toll paid ₹120, passenger dropped safely"
                placeholderTextColor={mutedText}
                multiline
                numberOfLines={3}
                style={[
                  styles.modalTextInputMultiline,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: primaryText,
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
              />
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setIsCompleteModalOpen(false)}
                style={[styles.modalCancelBtn, { borderColor: cardBorder }]}
              >
                <Text style={[styles.modalCancelBtnText, { color: mutedText }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmComplete}
                disabled={isUpdatingStatus}
                style={[styles.modalSubmitBtn, { opacity: isUpdatingStatus ? 0.7 : 1 }]}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                    <Text style={styles.modalSubmitBtnText}>Confirm Completion</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackBackBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  mapBackgroundWrapper: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  floatingBackBtn: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.28,
          shadowRadius: 14,
        }
      : {
          elevation: 4,
        }),
  },
  liquidGlossHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  floatingRouteBadge: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    zIndex: 50,
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        }
      : {
          elevation: 3,
        }),
  },
  routeBadgeGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  routeBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F59E0B',
  },
  floatingRouteBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bottomSheetCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: SCREEN_HEIGHT,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 14,
    zIndex: 20,
  },
  dragHeaderArea: {
    paddingBottom: 4,
  },
  handleBarWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
  },
  passengerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerTextCol: {
    flex: 1,
  },
  passengerNameText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  ratingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  passengerRoleText: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  profileActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDivider: {
    height: 1,
    marginVertical: 12,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  destinationTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  destinationSub: {
    fontSize: 12.5,
    marginTop: 3,
  },
  statusYellowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusYellowText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrackerContainer: {
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  progressLineTrack: {
    position: 'relative',
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 1.5,
    marginVertical: 12,
    justifyContent: 'center',
  },
  progressLineFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#F59E0B',
    borderRadius: 1.5,
  },
  progressDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: -2.5,
  },
  progressDotStart: {
    left: 0,
    backgroundColor: '#F59E0B',
  },
  progressDotQuarter: {
    left: '25%',
    backgroundColor: '#F59E0B',
  },
  progressVehiclePin: {
    position: 'absolute',
    left: '50%',
    marginLeft: -13,
    top: -11.5,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FDE047',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  progressDotThreeQuarter: {
    left: '75%',
  },
  progressDotEnd: {
    right: 0,
  },
  progressTimesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTimeLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  startNavigationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    marginBottom: 16,
  },
  startNavigationBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  accordionContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accordionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accordionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  routeItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  greenCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginTop: 4,
  },
  redCircle: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#EF4444',
    marginTop: 4,
  },
  detailItemLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailItemValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  detailItemSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  specChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noteCallout: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  noteCalloutText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  dispatchLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dispatchBody: {
    fontSize: 12,
    marginTop: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  paymentLabel: {
    fontSize: 13,
  },
  paymentValue: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  paymentLabelBold: {
    fontSize: 14,
    fontWeight: '700',
  },
  paymentBalanceBold: {
    fontSize: 16,
    fontWeight: '900',
  },
  primaryLifecycleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryLifecycleBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  completedBannerText: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    marginVertical: 14,
  },
  modalFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalLabel: {
    fontSize: 13,
  },
  modalValueBold: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalInputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalTextInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  modalTextInputMultiline: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    minHeight: 65,
    textAlignVertical: 'top',
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
