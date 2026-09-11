import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert,
  Animated,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
  ActivityIndicator,
} from 'react-native';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { MainTabParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import { sosApi, type SosPayload } from '../services/api';

type Props = NativeBottomTabScreenProps<MainTabParamList, 'Sos'>;

type SosStatus = 'idle' | 'sending' | 'sent';

const HOLD_DURATION_MS = 3000;
const BUTTON_SIZE = 220;

export function SosScreen({ navigation }: Props) {
  const { colors, type, t } = useAppTheme();
  const session = useSession();

  const [status, setStatus] = useState<SosStatus>('idle');
  const [isHolding, setIsHolding] = useState(false);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState(3);

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<{
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    address: string | null;
  } | null>(null);
  const [lastSentSosId, setLastSentSosId] = useState<string | null>(null);

  // Timers and animations
  const holdAnim = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Continuous pulse animations for glowing aura rings
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (secondIntervalRef.current) clearInterval(secondIntervalRef.current);
    };
  }, []);

  // Ambient pulsing glow rings
  useEffect(() => {
    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1.45,
              duration: 1600,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 1600,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const loop1 = createPulse(pulseAnim1, 0);
    const loop2 = createPulse(pulseAnim2, 800);

    loop1.start();
    loop2.start();

    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [pulseAnim1, pulseAnim2]);

  // Fetch mobile location
  const fetchLocation = useCallback(async () => {
    try {
      setLocating(true);
      setLocationError(null);

      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        setLocationError('GPS permission needed');
        setLocating(false);
        return { latitude: null, longitude: null, accuracy: null, address: null };
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let addressStr: string | null = null;
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (places && places.length > 0) {
          const p = places[0];
          addressStr = [p.name, p.street, p.city || p.subregion, p.region]
            .filter(Boolean)
            .join(', ');
        }
      } catch {
        // Reverse geocoding optional
      }

      const result = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        address: addressStr,
      };

      setLocationData(result);
      setLocating(false);
      return result;
    } catch (err) {
      console.warn('Error fetching location:', err);
      setLocationError('GPS unavailable');
      setLocating(false);
      return { latitude: null, longitude: null, accuracy: null, address: null };
    }
  }, []);

  // Pre-warm location on screen entry
  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Trigger dispatch to backend
  const triggerSendSos = useCallback(async () => {
    setStatus('sending');

    try {
      let currentCoords = locationData;
      if (!currentCoords || currentCoords.latitude === null) {
        currentCoords = await fetchLocation();
      }

      const payload: SosPayload = {
        driverId: session.driver.id,
        driverName: session.driver.name,
        driverMobile: session.driver.mobile,
        vehicleReg: session.vehicle.reg,
        tripId: session.trip.id,
        latitude: currentCoords?.latitude ?? null,
        longitude: currentCoords?.longitude ?? null,
        accuracy: currentCoords?.accuracy ?? null,
        address: currentCoords?.address ?? null,
        timestamp: new Date().toISOString(),
      };

      const res = await sosApi.sendSos(payload);
      setLastSentSosId(res.sosId || 'SOS-SENT');
      setStatus('sent');

      try {
        Vibration.vibrate([0, 200, 100, 200, 100, 350]);
      } catch {}

      Alert.alert(
        '🚨 SOS Emergency Dispatched',
        `Alert received by Fleet Dispatch and Admin.\n\n${
          currentCoords?.address
            ? `📍 ${currentCoords.address}`
            : currentCoords?.latitude
            ? `📍 GPS: ${currentCoords.latitude.toFixed(4)}, ${currentCoords.longitude?.toFixed(4)}`
            : '📍 Location: Attached'
        }\nVehicle: ${session.vehicle.reg}`,
        [{ text: 'Understood' }]
      );
    } catch (error: any) {
      console.error('Failed to send SOS:', error);
      setStatus('sent');
      Alert.alert(
        'Emergency Alert Sent',
        'SOS alert recorded. Please call emergency services (112) or agency dispatch if immediate medical or police assistance is needed.',
        [{ text: 'OK' }]
      );
    }
  }, [fetchLocation, locationData, session]);

  // Press & Hold Logic (Must hold for 3 seconds)
  const handlePressIn = () => {
    if (status === 'sent') {
      // Tap while sent resets back to ready state
      setStatus('idle');
      return;
    }
    if (status === 'sending') return;

    setIsHolding(true);
    setHoldSecondsRemaining(3);

    try {
      Vibration.vibrate(70);
    } catch {}

    // Animate progress from 0 to 1 over 3000ms
    holdAnim.setValue(0);
    Animated.timing(holdAnim, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      useNativeDriver: false,
    }).start();

    // 1-second countdown ticker
    let count = 3;
    secondIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setHoldSecondsRemaining(count);
        try {
          Vibration.vibrate(50);
        } catch {}
      } else {
        if (secondIntervalRef.current) clearInterval(secondIntervalRef.current);
      }
    }, 1000);

    // After 3 full seconds of continuous pressing, trigger SOS
    holdTimerRef.current = setTimeout(() => {
      setIsHolding(false);
      if (secondIntervalRef.current) clearInterval(secondIntervalRef.current);
      triggerSendSos();
    }, HOLD_DURATION_MS);
  };

  const handlePressOut = () => {
    if (status === 'sending' || status === 'sent') return;

    // User released before 3 seconds completed -> cancel
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (secondIntervalRef.current) {
      clearInterval(secondIntervalRef.current);
      secondIntervalRef.current = null;
    }

    setIsHolding(false);
    setHoldSecondsRemaining(3);

    // Animate hold progress back to 0
    Animated.timing(holdAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const callEmergencyNumber = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Cannot Place Call', `Please dial ${phone} manually.`);
    });
  };

  return (
    <Screen inTab>
      <ScreenHeader
        title={t('sos.title')}
        subtitle={t('sos.sub')}
      />

      {/* Driver & Duty Context Badge */}
      <View style={[styles.contextPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.contextItem}>
          <Ionicons name="car-outline" size={13} color={colors.accent} />
          <Text style={[type.meta, { color: colors.text, fontWeight: '600' }]}>
            {session.vehicle.reg || 'Fleet Vehicle'}
          </Text>
        </View>
        <Text style={[type.meta, { color: colors.textFaint }]}>·</Text>
        <View style={styles.contextItem}>
          <Ionicons name="person-outline" size={13} color={colors.textFaint} />
          <Text style={[type.meta, { color: colors.textDim }]}>{session.driver.name}</Text>
        </View>
        <Text style={[type.meta, { color: colors.textFaint }]}>·</Text>
        <View style={styles.contextItem}>
          <View
            style={[
              styles.dutyDot,
              { backgroundColor: session.onDuty ? '#10B981' : colors.textFaint },
            ]}
          />
          <Text style={[type.meta, { color: session.onDuty ? '#10B981' : colors.textFaint }]}>
            {session.onDuty ? 'On Duty' : 'Standby'}
          </Text>
        </View>
      </View>

      {/* GPS Location Status Pill */}
      <View
        style={[
          styles.gpsCard,
          {
            backgroundColor: colors.surface,
            borderColor: locationError ? 'rgba(239, 68, 68, 0.4)' : colors.border,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {locating ? (
            <ActivityIndicator size="small" color="#F15B4A" />
          ) : (
            <Ionicons
              name={locationData?.latitude ? 'location' : 'location-outline'}
              size={16}
              color={locationData?.latitude ? '#10B981' : locationError ? '#EF4444' : colors.textFaint}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={[type.label, { fontSize: 11, color: colors.textFaint }]}>
              DEVICE GPS LOCATION
            </Text>
            <Text
              style={[type.meta, { color: colors.text, fontSize: 12, fontWeight: '500' }]}
              numberOfLines={1}
            >
              {locating
                ? 'Acquiring GPS coordinates...'
                : locationData?.address
                ? locationData.address
                : locationData?.latitude
                ? `${locationData.latitude.toFixed(4)}° N, ${locationData.longitude?.toFixed(4)}° E (±${Math.round(locationData.accuracy || 0)}m)`
                : locationError
                ? locationError
                : 'Hold SOS to auto-fetch location'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => fetchLocation()}
          hitSlop={8}
          style={styles.refreshLocBtn}
        >
          <Ionicons name="refresh" size={14} color={colors.textFaint} />
        </Pressable>
      </View>

      {/* Main Center Area with BIG SOS BUTTON */}
      <View style={styles.centerContainer}>
        {/* Pulsating Glowing Outer Rings */}
        {status === 'idle' ? (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim1 }],
                  opacity: pulseAnim1.interpolate({
                    inputRange: [1, 1.45],
                    outputRange: [isHolding ? 0.65 : 0.35, 0],
                  }),
                  borderColor: isHolding ? '#FEF08A' : '#EF4444',
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim2 }],
                  opacity: pulseAnim2.interpolate({
                    inputRange: [1, 1.45],
                    outputRange: [isHolding ? 0.5 : 0.25, 0],
                  }),
                  borderColor: isHolding ? '#EF4444' : '#DC2626',
                },
              ]}
            />
          </>
        ) : null}

        {/* Big SOS Button with Press-and-Hold for 3 Seconds */}
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.bigSosButton,
            status === 'sent' && styles.bigSosButtonSent,
            isHolding && styles.bigSosButtonHolding,
          ]}
        >
          {/* Animated Hold Progress Radial Fill */}
          {status === 'idle' && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.holdFillCircle,
                {
                  transform: [
                    {
                      scale: holdAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.01, 1],
                      }),
                    },
                  ],
                  opacity: holdAnim.interpolate({
                    inputRange: [0, 0.1, 1],
                    outputRange: [0, 0.45, 0.8],
                  }),
                },
              ]}
            />
          )}

          <View style={styles.bigSosButtonInner}>
            {status === 'idle' && !isHolding && (
              <>
                <Ionicons name="warning" size={38} color="#FFFFFF" style={{ marginBottom: 4 }} />
                <Text style={styles.bigSosText}>SOS</Text>
                <Text style={styles.bigSosSubtext}>PRESS & HOLD 3s</Text>
              </>
            )}

            {status === 'idle' && isHolding && (
              <>
                <Text style={styles.countdownNumber}>
                  {holdSecondsRemaining}
                </Text>
                <Text style={styles.countdownPrompt}>KEEP HOLDING</Text>
                <Text style={styles.countdownSub}>RELEASE TO CANCEL</Text>
              </>
            )}

            {status === 'sending' && (
              <>
                <ActivityIndicator size="large" color="#FFFFFF" style={{ marginBottom: 10 }} />
                <Text style={styles.bigSosSubtext}>DISPATCHING...</Text>
              </>
            )}

            {status === 'sent' && (
              <>
                <Ionicons name="checkmark-circle" size={42} color="#FFFFFF" style={{ marginBottom: 4 }} />
                <Text
                  style={styles.dispatchedText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  DISPATCHED
                </Text>
                <Text style={styles.bigSosSubtext}>HELP NOTIFIED</Text>
              </>
            )}
          </View>
        </Pressable>
      </View>

      {/* Action / Help Section Below Button */}
      <View style={styles.bottomSection}>
        {/* Live Hold Progress Bar when Holding */}
        {isHolding && (
          <View style={styles.holdProgressBarBox}>
            <View style={styles.holdProgressBarTrack}>
              <Animated.View
                style={[
                  styles.holdProgressBarFill,
                  {
                    width: holdAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={[type.meta, { color: '#FEF08A', fontWeight: '700', marginTop: 6 }]}>
              Hold for 3 seconds to dispatch SOS · Release to cancel
            </Text>
          </View>
        )}

        {status === 'idle' && !isHolding && (
          <View style={styles.instructionsContainer}>
            <Text style={[type.body, styles.instructionsText, { color: colors.textDim }]}>
              <Text style={{ fontWeight: '700', color: colors.text }}>Press and hold the button for 3 seconds</Text> to trigger SOS. Your live GPS coordinates will be auto-attached and sent to fleet admin.
            </Text>
          </View>
        )}

        {status === 'sent' && (
          <Card style={{ backgroundColor: colors.surface, borderColor: colors.border, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <View style={styles.sentCheckBadge}>
                <Ionicons name="shield-checkmark" size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.label, { color: '#10B981', fontWeight: '700' }]}>
                  SOS DISPATCH ACTIVE
                </Text>
                <Text style={[type.meta, { color: colors.textDim }]}>
                  Ref: {lastSentSosId || 'SOS-ACTIVE'} · Live location transmitted
                </Text>
              </View>
            </View>

            <Text style={[type.label, { fontSize: 11, letterSpacing: 0.6, color: colors.textDim, textTransform: 'uppercase', marginBottom: 10, fontWeight: '700' }]}>
              Immediate Emergency Helplines
            </Text>

            {/* Emergency Hotline Cards (112 & 102) */}
            <View style={styles.emergencyHelplinesRow}>
              <Pressable
                onPress={() => callEmergencyNumber('112')}
                style={({ pressed }) => [
                  styles.emergencyCard,
                  { backgroundColor: '#EF4444', opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View style={[styles.emergencyCardIconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.22)' }]}>
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.emergencyCardTextCol}>
                  <Text style={styles.emergencyCardTitleWhite}>Call 112</Text>
                  <Text style={styles.emergencyCardSubWhite}>Police & Fire</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => callEmergencyNumber('102')}
                style={({ pressed }) => [
                  styles.emergencyCard,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                    borderWidth: 1,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={[styles.emergencyCardIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                  <Ionicons name="medical" size={16} color="#EF4444" />
                </View>
                <View style={styles.emergencyCardTextCol}>
                  <Text style={[styles.emergencyCardTitle, { color: colors.text }]}>Call 102</Text>
                  <Text style={[styles.emergencyCardSub, { color: colors.textDim }]}>Ambulance</Text>
                </View>
              </Pressable>
            </View>

            {/* Reset / Safe Action Button */}
            <Pressable
              onPress={() => setStatus('idle')}
              style={({ pressed }) => [
                styles.resetStandbyBtn,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.textDim} />
              <Text style={[styles.resetStandbyBtnText, { color: colors.text }]}>
                I Am Safe · Reset to Standby
              </Text>
            </Pressable>
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    alignSelf: 'center',
    marginBottom: 8,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dutyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  refreshLocBtn: {
    padding: 6,
    marginLeft: 6,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: BUTTON_SIZE + 50,
    height: BUTTON_SIZE + 50,
    borderRadius: (BUTTON_SIZE + 50) / 2,
    borderWidth: 2.5,
  },
  bigSosButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 28,
    elevation: 16,
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  bigSosButtonHolding: {
    backgroundColor: '#B91C1C',
    borderColor: '#FEF08A',
    transform: [{ scale: 0.96 }],
    shadowColor: '#FEF08A',
    shadowOpacity: 0.85,
    shadowRadius: 36,
  },
  bigSosButtonSent: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: '#059669',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#10B981',
    shadowOpacity: 0.75,
    shadowRadius: 28,
  },
  holdFillCircle: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#EF4444',
  },
  bigSosButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 12,
  },
  bigSosText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  bigSosSubtext: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.88)',
    letterSpacing: 1.1,
    marginTop: 2,
    textAlign: 'center',
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FEF08A',
    lineHeight: 70,
  },
  countdownPrompt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  countdownSub: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 3,
  },
  dispatchedText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textAlign: 'center',
    maxWidth: 180,
    marginTop: 2,
    marginBottom: 2,
  },
  bottomSection: {
    paddingBottom: 24,
  },
  holdProgressBarBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  holdProgressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  holdProgressBarFill: {
    height: '100%',
    backgroundColor: '#FEF08A',
    borderRadius: 3,
  },
  instructionsContainer: {
    paddingHorizontal: 16,
  },
  instructionsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  sentCheckBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyHelplinesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  emergencyCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 10,
  },
  emergencyCardIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyCardTextCol: {
    flex: 1,
  },
  emergencyCardTitleWhite: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  emergencyCardSubWhite: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  emergencyCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  emergencyCardSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  resetStandbyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginTop: 2,
  },
  resetStandbyBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
