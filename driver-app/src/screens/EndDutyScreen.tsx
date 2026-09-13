import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
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
import { CameraView, useCameraPermissions, type FlashMode } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSession } from '../state/session';
import { dutyApi } from '../services/api';
import { km } from '../data/format';
import { pickFromCamera } from '../media/pick';
import type { Attachment } from '../media/types';
import { FrostedGlassCard, GlassButton, GlassCircleButton, GlassPill } from '../components/GlassChrome';

type Props = NativeStackScreenProps<RootStackParamList, 'EndDuty'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatIST(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString('en-IN');
  }
}

export function EndDutyScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const session = useSession();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [flash, setFlash] = useState<FlashMode>('off');

  const startOdo = useMemo(() => {
    const activeDuty = session.duties.find((d) => !d.endedAt);
    if (activeDuty && activeDuty.startOdo > 0) return activeDuty.startOdo;
    return session.vehicle?.odometer || session.odometer || 0;
  }, [session.duties, session.vehicle?.odometer, session.odometer]);

  const initialEndOdo = String(session.vehicle?.odometer || session.odometer || startOdo || '');
  const [odometer, setOdometer] = useState(initialEndOdo);
  const [remarks, setRemarks] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<Attachment | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDetectingOdo, setIsDetectingOdo] = useState(false);
  const [detectedOdo, setDetectedOdo] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [serverTimeText, setServerTimeText] = useState('');
  const [isTimeLoading, setIsTimeLoading] = useState(true);

  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanAnim]);

  const hasAssignedVehicle = useMemo(() => {
    const reg = session.vehicle?.reg;
    return Boolean(reg && reg !== '—' && reg.trim() !== '');
  }, [session.vehicle?.reg]);

  const totalKm = useMemo(() => {
    const end = Number(odometer.replace(/,/g, ''));
    if (!end) return 0;
    return Math.max(0, end - startOdo);
  }, [odometer, startOdo]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    let baseServerMs = 0;
    let localFetchMs = Date.now();

    const fetchServerTime = async () => {
      try {
        const res = await dutyApi.getServerTime();
        if (!cancelled && res?.timestamp) {
          baseServerMs = res.timestamp;
          localFetchMs = Date.now();
          setServerTimeText(formatIST(baseServerMs));
          setIsTimeLoading(false);
        }
      } catch {
        if (!cancelled) {
          baseServerMs = Date.now();
          localFetchMs = Date.now();
          setServerTimeText(formatIST(baseServerMs));
          setIsTimeLoading(false);
        }
      }
    };

    fetchServerTime();
    timer = setInterval(() => {
      if (baseServerMs > 0) {
        setServerTimeText(formatIST(baseServerMs + (Date.now() - localFetchMs)));
      }
    }, 1000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  const runOdometerDetection = async (base64Image: string) => {
    try {
      setIsDetectingOdo(true);
      const currentVal = Number(odometer.replace(/,/g, '')) || startOdo || 0;
      const res = await dutyApi.detectOdometer({
        image: base64Image,
        currentOdo: currentVal,
      });

      if (res?.detected && res.odometer) {
        setOdometer(String(res.odometer));
        setDetectedOdo(res.odometer);
        if (Array.isArray(res.candidates)) setCandidates(res.candidates);
        setError('');
      } else if (res?.candidates?.length) {
        setCandidates(res.candidates);
      }
    } catch (detectErr) {
      console.warn('[EndDutyScreen] Auto-detect odometer warning:', detectErr);
    } finally {
      setIsDetectingOdo(false);
    }
  };

  const handleCapture = async () => {
    if (isCapturing) return;
    try {
      setIsCapturing(true);
      setDetectedOdo(null);
      setCandidates([]);

      if (cameraRef.current && isCameraReady) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.85,
            base64: true,
          });
          if (photo?.uri) {
            const photoItem: Attachment = {
              uri: photo.uri,
              name: `odo-end-${Date.now()}.jpg`,
              mime: 'image/jpeg',
              kind: 'image',
              base64: photo.base64,
            };
            setCapturedPhoto(photoItem);
            setIsCapturing(false);
            if (photo.base64) void runOdometerDetection(photo.base64);
            return;
          }
        } catch (camErr) {
          console.warn('[EndDutyScreen] CameraView capture fallback:', camErr);
        }
      }

      const picked = await pickFromCamera();
      if (picked) {
        setCapturedPhoto(picked);
        if (picked.base64) void runOdometerDetection(picked.base64);
      }
    } catch (err: any) {
      Alert.alert('Capture Failed', err?.message || 'Unable to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const adjustOdo = (delta: number) => {
    const current = Number(odometer.replace(/,/g, '')) || 0;
    setOdometer(String(Math.max(0, current + delta)));
    setError('');
  };

  const toggleFlash = () => {
    setFlash((prev) => (prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off'));
  };

  const handleEndDuty = async () => {
    if (!session.onDuty) {
      Alert.alert('End Duty', 'You are not currently on duty.');
      navigation.goBack();
      return;
    }

    if (!hasAssignedVehicle) {
      Alert.alert(
        'Vehicle Required',
        'Cannot end duty: No vehicle is assigned to your profile in the fleet management system.'
      );
      return;
    }

    const value = Number(odometer.replace(/,/g, ''));
    if (!value) {
      setError('Ending odometer is required.');
      return;
    }
    if (value < startOdo) {
      Alert.alert('Invalid Odometer', `Ending odometer cannot be less than start (${km(startOdo)}).`);
      return;
    }
    if (!capturedPhoto) {
      Alert.alert('Photo Required', 'Please capture a photo of the vehicle odometer to end duty.');
      return;
    }

    try {
      setIsSubmitting(true);
      await session.endDuty(value, remarks, capturedPhoto.uri);
      Alert.alert(
        'Duty Ended',
        `Duty ended successfully.\n\nVehicle: ${session.vehicle?.reg || 'Assigned'}\nFinal Odometer: ${km(value)}\nDistance Run: ${km(totalKm)}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to record duty end. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-75, 75],
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {capturedPhoto ? (
        <View style={StyleSheet.absoluteFill}>
          <Image source={{ uri: capturedPhoto.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={[styles.photoVignette, { paddingTop: insets.top, paddingBottom: insets.bottom }]} />
        </View>
      ) : permission?.granted ? (
        <View style={StyleSheet.absoluteFill}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            flash={flash}
            onCameraReady={() => setIsCameraReady(true)}
          />
          <View style={[styles.cameraVignette, { paddingTop: insets.top, paddingBottom: insets.bottom }]} />
        </View>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.permissionFallback]}>
          <Ionicons name="camera-outline" size={54} color="#A1A1AA" />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionSub}>
            Take a live photo of your vehicle's odometer dashboard to end duty.
          </Text>
          <Pressable onPress={requestPermission} style={styles.permissionBtn}>
            <Text style={styles.permissionBtnText}>Enable Camera</Text>
          </Pressable>
          <Pressable onPress={handleCapture} style={[styles.permissionBtn, styles.permissionBtnSecondary]}>
            <Text style={[styles.permissionBtnText, { color: '#FFFFFF' }]}>Use System Camera</Text>
          </Pressable>
        </View>
      )}

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <GlassCircleButton
          onPress={() => navigation.goBack()}
          icon="chevron-back"
          iconSize={22}
          tone="dark"
          accessibilityLabel="Go back"
        />

        <GlassPill tone="dark" style={styles.vehicleBadgePill}>
          <View style={styles.pulseDot} />
          <Ionicons name="car-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.vehicleBadgeReg}>{session.vehicle?.reg || 'Unassigned'}</Text>
          <Text style={styles.vehicleBadgeModel}>• {session.vehicle?.model || 'Commercial'}</Text>
        </GlassPill>

        {!capturedPhoto ? (
          <GlassCircleButton
            onPress={toggleFlash}
            icon={flash === 'on' ? 'flash' : flash === 'auto' ? 'flash-outline' : 'flash-off-outline'}
            iconSize={18}
            iconColor={flash !== 'off' ? '#FFFFFF' : '#A1A1AA'}
            tone="dark"
            accessibilityLabel="Toggle flash"
          />
        ) : (
          <View style={{ width: 42 }} />
        )}
      </View>

      {!capturedPhoto && (
        <View style={styles.reticleContainer} pointerEvents="none">
          <View style={styles.reticleFrame}>
            <View style={[styles.cornerBracket, styles.cornerTL]} />
            <View style={[styles.cornerBracket, styles.cornerTR]} />
            <View style={[styles.cornerBracket, styles.cornerBL]} />
            <View style={[styles.cornerBracket, styles.cornerBR]} />
            <Animated.View style={[styles.scanLaser, { transform: [{ translateY: scanTranslateY }] }]} />
            <View style={styles.reticleCenterTag}>
              <Ionicons name="scan-outline" size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.reticleTagText}>ALIGN ODOMETER HERE</Text>
            </View>
          </View>
          <Text style={styles.reticleInstruction}>Align numbers on dashboard inside the frame</Text>
        </View>
      )}

      {capturedPhoto && (
        <View style={[styles.successBadgeWrap, { top: insets.top + 60 }]}>
          <GlassPill tone="dark" style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.successBadgeText}>Odometer Photo Captured & Verified</Text>
          </GlassPill>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        {!capturedPhoto ? (
          <FrostedGlassCard style={styles.preCaptureCard}>
            <View style={styles.floatingOdoStrip}>
              <View style={{ flex: 1 }}>
                <Text style={styles.odoStripLabel}>CONFIRM ENDING ODOMETER (KM)</Text>
                <View style={styles.odoStripInputRow}>
                  <TextInput
                    value={odometer}
                    onChangeText={(v) => {
                      setOdometer(v);
                      setError('');
                    }}
                    keyboardType="numeric"
                    style={styles.odoStripInput}
                    placeholder={String(startOdo || 45470)}
                    placeholderTextColor="#71717A"
                  />
                  <Text style={styles.odoKmUnit}>KM</Text>
                </View>
              </View>

              <View style={styles.odoVerificationPills}>
                <View style={styles.verifiedTag}>
                  <Ionicons name="flag-outline" size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.verifiedTagText}>Start {km(startOdo)}</Text>
                </View>
                <View style={styles.verifiedTag}>
                  <Ionicons name="time-outline" size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.verifiedTagText}>
                    {isTimeLoading ? 'Syncing IST...' : serverTimeText}
                  </Text>
                </View>
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.shutterRow}>
              <Pressable
                onPress={handleCapture}
                disabled={isCapturing}
                style={({ pressed }) => [
                  styles.shutterOuterRing,
                  pressed && { transform: [{ scale: 0.94 }] },
                ]}
              >
                {isCapturing ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <View style={styles.shutterInnerCircle}>
                    <View style={styles.shutterCoreDot} />
                  </View>
                )}
              </Pressable>
              <Text style={styles.shutterInstruction}>Tap shutter to capture photo</Text>
            </View>
          </FrostedGlassCard>
        ) : (
          <FrostedGlassCard style={styles.postCaptureContainer}>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.postCaptureContent}
            >
              <View style={styles.fieldSection}>
                <View style={styles.fieldHeaderRow}>
                  <Text style={styles.fieldSectionTitle}>ENDING ODOMETER</Text>
                  <Text style={styles.fieldCurrentKm}>Start: {km(startOdo)} · Run: {km(totalKm)}</Text>
                </View>

                {isDetectingOdo && (
                  <View style={styles.detectingBanner}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.detectingBannerText}>
                      AI scanning integers from odometer photo...
                    </Text>
                  </View>
                )}

                {detectedOdo && !isDetectingOdo ? (
                  <View style={styles.detectedSuccessBanner}>
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.detectedSuccessText}>
                      Auto-detected {km(detectedOdo)} from photo • Auto-filled
                    </Text>
                  </View>
                ) : null}

                <View
                  style={[
                    styles.odoLargeInputBox,
                    detectedOdo && !isDetectingOdo ? styles.odoLargeInputBoxDetected : null,
                  ]}
                >
                  <TextInput
                    value={odometer}
                    onChangeText={(v) => {
                      setOdometer(v);
                      setError('');
                    }}
                    keyboardType="numeric"
                    style={styles.odoLargeInput}
                    placeholder={String(startOdo || 45470)}
                    placeholderTextColor="#71717A"
                  />
                  <Text style={styles.odoLargeKm}>KM</Text>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.deltaChipsRow}>
                  {[-50, -10, 10, 50].map((delta) => (
                    <Pressable key={delta} onPress={() => adjustOdo(delta)} style={styles.deltaChip}>
                      <Text style={styles.deltaChipText}>
                        {delta > 0 ? `+${delta}` : delta}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {candidates.length > 1 && (
                  <View style={styles.candidatesSection}>
                    <Text style={styles.candidatesLabel}>Detected in cluster photo (tap to choose):</Text>
                    <View style={styles.candidatesRow}>
                      {candidates.map((cand) => {
                        const isSelected = Number(odometer.replace(/,/g, '')) === cand;
                        return (
                          <Pressable
                            key={cand}
                            onPress={() => {
                              setOdometer(String(cand));
                              setDetectedOdo(cand);
                              setError('');
                            }}
                            style={[styles.candidateChip, isSelected && styles.candidateChipSelected]}
                          >
                            <Ionicons
                              name={isSelected ? 'checkmark-circle' : 'speedometer-outline'}
                              size={12}
                              color={isSelected ? '#000000' : '#FFFFFF'}
                              style={{ marginRight: 4 }}
                            />
                            <Text
                              style={[
                                styles.candidateChipText,
                                isSelected && styles.candidateChipTextSelected,
                              ]}
                            >
                              {km(cand)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.remarksBox}>
                <Text style={styles.fieldSectionTitle}>REMARKS (OPTIONAL)</Text>
                <TextInput
                  value={remarks}
                  onChangeText={setRemarks}
                  placeholder="Parking, toll, or route notes"
                  placeholderTextColor="#71717A"
                  multiline
                  style={styles.remarksInput}
                />
              </View>

              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryIconWrap}>
                    <Ionicons name="car-sport" size={13} color="#FFFFFF" />
                  </View>
                  <Text style={styles.summaryLabel}>Vehicle:</Text>
                  <Text style={styles.summaryValue}>
                    {session.vehicle?.reg || 'Unassigned'} ({session.vehicle?.model || 'Fleet'})
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <View style={styles.summaryIconWrap}>
                    <Ionicons name="speedometer" size={13} color="#FFFFFF" />
                  </View>
                  <Text style={styles.summaryLabel}>Distance:</Text>
                  <Text style={styles.summaryValue}>{km(totalKm)} this duty</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <View style={styles.summaryIconWrap}>
                    <Ionicons name="time" size={13} color="#FFFFFF" />
                  </View>
                  <Text style={styles.summaryLabel}>Time:</Text>
                  <Text style={styles.summaryValue}>{serverTimeText || 'Live'} (Server IST)</Text>
                </View>
              </View>

              <View style={styles.actionButtonsRow}>
                <GlassButton
                  title="Retake"
                  icon="camera-reverse-outline"
                  variant="secondary"
                  onPress={() => setCapturedPhoto(null)}
                  disabled={isSubmitting}
                  style={styles.flexBtn}
                  tone="dark"
                />
                <Pressable
                  onPress={handleEndDuty}
                  disabled={isSubmitting || !hasAssignedVehicle}
                  style={({ pressed }) => [
                    styles.endDutyBtn,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                    (!hasAssignedVehicle || isSubmitting) && { opacity: 0.5 },
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <>
                      <Ionicons name="stop" size={18} color="#000000" style={{ marginRight: 8 }} />
                      <Text style={styles.endDutyBtnText}>End Duty</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </FrostedGlassCard>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  photoVignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  cameraVignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  permissionFallback: {
    backgroundColor: '#09090B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginTop: 16 },
  permissionSub: {
    color: '#A1A1AA',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '85%',
    lineHeight: 18,
  },
  permissionBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  permissionBtnSecondary: {
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginTop: 10,
  },
  permissionBtnText: { color: '#000000', fontWeight: '800', fontSize: 14 },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleBadgePill: {},
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  vehicleBadgeReg: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vehicleBadgeModel: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 3,
  },
  reticleContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  reticleFrame: {
    width: SCREEN_WIDTH * 0.82,
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 10,
  },
  scanLaser: {
    width: '90%',
    height: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 8,
  },
  reticleCenterTag: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  reticleTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  reticleInstruction: {
    color: '#E4E4E7',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  successBadgeWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 25,
    alignItems: 'center',
  },
  successBadge: { paddingHorizontal: 16, paddingVertical: 8 },
  successBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  bottomContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    zIndex: 30,
  },
  preCaptureCard: { padding: 16 },
  floatingOdoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  odoStripLabel: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  odoStripInputRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  odoStripInput: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    minWidth: 110,
    paddingVertical: 0,
    letterSpacing: 0.5,
  },
  odoKmUnit: { color: '#A1A1AA', fontSize: 14, fontWeight: '700', marginLeft: 4 },
  odoVerificationPills: { alignItems: 'flex-end', gap: 5 },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  verifiedTagText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  errorText: { color: '#F87171', fontSize: 11, fontWeight: '600', marginTop: 6 },
  shutterRow: { alignItems: 'center', justifyContent: 'center', paddingTop: 14 },
  shutterOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  shutterInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCoreDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  shutterInstruction: { color: '#A1A1AA', fontSize: 12, fontWeight: '600', marginTop: 8 },
  postCaptureContainer: { maxHeight: 500 },
  postCaptureContent: { padding: 18, gap: 14 },
  fieldSection: { gap: 6 },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldSectionTitle: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fieldCurrentKm: { color: '#71717A', fontSize: 11, fontWeight: '600' },
  detectingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 4,
  },
  detectingBannerText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', flex: 1 },
  detectedSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 4,
  },
  detectedSuccessText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', flex: 1 },
  odoLargeInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  odoLargeInputBoxDetected: {
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  odoLargeInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  odoLargeKm: { color: '#A1A1AA', fontSize: 16, fontWeight: '800', marginLeft: 6 },
  deltaChipsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  deltaChip: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  candidatesSection: { marginTop: 6, gap: 4 },
  candidatesLabel: { color: '#A1A1AA', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  candidatesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  candidateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  candidateChipSelected: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  candidateChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  candidateChipTextSelected: { color: '#000000', fontWeight: '800' },
  remarksBox: { gap: 6 },
  remarksInput: {
    minHeight: 64,
    textAlignVertical: 'top',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: { color: '#A1A1AA', fontSize: 11, fontWeight: '700' },
  summaryValue: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)' },
  actionButtonsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  flexBtn: { flex: 1 },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 14,
    borderRadius: 16,
  },
  retakeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  endDutyBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  endDutyBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
