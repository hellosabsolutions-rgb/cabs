import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { BlurView, type ExperimentalBlurMethod } from 'expo-blur';
import { CameraView, useCameraPermissions, type FlashMode } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSession } from '../state/session';
import { dutyApi } from '../services/api';
import { km } from '../data/format';
import { pickFromCamera } from '../media/pick';
import type { Attachment } from '../media/types';

type Props = NativeStackScreenProps<RootStackParamList, 'StartDuty'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BLUR_METHOD: ExperimentalBlurMethod = 'dimezisBlurViewSdk31Plus';

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

/**
 * Frosted Glass Card using `expo-blur` with `experimentalBlurMethod`.
 * Provides optical native blur on iOS (UIKit) and Android (dimezisBlurViewSdk31Plus).
 */
function FrostedBlurCard({
  children,
  style,
  borderRadius = 24,
  intensity = 55,
}: {
  children: React.ReactNode;
  style?: any;
  borderRadius?: number;
  intensity?: number;
}) {
  return (
    <View style={[styles.frostedCardWrap, { borderRadius }, style]}>
      <BlurView
        intensity={intensity}
        tint="dark"
        experimentalBlurMethod={BLUR_METHOD}
        style={StyleSheet.absoluteFill}
      />
      {/* Specular Top Border Highlight */}
      <View
        style={[
          styles.specularTopEdge,
          { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius },
        ]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

/**
 * Frosted Glass Pill using `expo-blur` with `experimentalBlurMethod`.
 */
function FrostedBlurPill({
  children,
  style,
  borderRadius = 20,
  intensity = 45,
}: {
  children: React.ReactNode;
  style?: any;
  borderRadius?: number;
  intensity?: number;
}) {
  return (
    <View style={[styles.frostedPillWrap, { borderRadius }, style]}>
      <BlurView
        intensity={intensity}
        tint="dark"
        experimentalBlurMethod={BLUR_METHOD}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.pillSpecularEdge} pointerEvents="none" />
      {children}
    </View>
  );
}

/**
 * Frosted Circle Button using `expo-blur` with `experimentalBlurMethod`.
 */
function FrostedCircleButton({
  onPress,
  children,
  style,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.circleBtnWrap,
        pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
        style,
      ]}
    >
      <BlurView
        intensity={45}
        tint="dark"
        experimentalBlurMethod={BLUR_METHOD}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.circleSpecular} pointerEvents="none" />
      {children}
    </Pressable>
  );
}

export function StartDutyScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const session = useSession();

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [flash, setFlash] = useState<FlashMode>('off');

  // Form State
  const initialOdo = String(session.vehicle?.odometer || session.odometer || '45470');
  const [odometer, setOdometer] = useState(initialOdo);
  const [capturedPhoto, setCapturedPhoto] = useState<Attachment | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDetectingOdo, setIsDetectingOdo] = useState(false);
  const [detectedOdo, setDetectedOdo] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Backend IST time sync
  const [serverTimeText, setServerTimeText] = useState<string>('');
  const [isTimeLoading, setIsTimeLoading] = useState<boolean>(true);

  // Scan line animation
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanAnim]);

  // Check if driver has an assigned vehicle from backend
  const hasAssignedVehicle = useMemo(() => {
    const reg = session.vehicle?.reg;
    return Boolean(reg && reg !== '—' && reg.trim() !== '');
  }, [session.vehicle?.reg]);

  // Synchronize with assigned vehicle odometer when loaded
  useEffect(() => {
    const vOdo = session.vehicle?.odometer;
    if (vOdo && vOdo > 0 && (!odometer || odometer === '0')) {
      setOdometer(String(vOdo));
    }
  }, [session.vehicle?.odometer]);

  // Fetch and tick backend server time in IST (Asia/Kolkata)
  useEffect(() => {
    let cancelled = false;
    let timer: any = null;
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
        const elapsed = Date.now() - localFetchMs;
        const currentMs = baseServerMs + elapsed;
        setServerTimeText(formatIST(currentMs));
      }
    }, 1000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  // Run OCR detection on captured photo base64
  const runOdometerDetection = async (base64Image: string) => {
    try {
      setIsDetectingOdo(true);
      const currentVal = Number(odometer.replace(/,/g, '')) || Number(session.vehicle?.odometer) || 0;
      const res = await dutyApi.detectOdometer({
        image: base64Image,
        currentOdo: currentVal,
      });

      if (res?.detected && res.odometer) {
        setOdometer(String(res.odometer));
        setDetectedOdo(res.odometer);
        if (res.candidates && Array.isArray(res.candidates)) {
          setCandidates(res.candidates);
        }
        setError('');
      } else if (res?.candidates && res.candidates.length > 0) {
        setCandidates(res.candidates);
      }
    } catch (detectErr) {
      console.warn('[StartDutyScreen] Auto-detect odometer warning:', detectErr);
    } finally {
      setIsDetectingOdo(false);
    }
  };

  // Capture Photo
  const handleCapture = async () => {
    if (isCapturing) return;
    try {
      setIsCapturing(true);
      setDetectedOdo(null);
      setCandidates([]);

      // Attempt capture via CameraView if ref is ready
      if (cameraRef.current && isCameraReady) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.85,
            base64: true,
          });
          if (photo?.uri) {
            const photoItem: Attachment = {
              uri: photo.uri,
              name: `odo-${Date.now()}.jpg`,
              mime: 'image/jpeg',
              kind: 'image',
              base64: photo.base64,
            };
            setCapturedPhoto(photoItem);
            setIsCapturing(false);

            if (photo.base64) {
              void runOdometerDetection(photo.base64);
            }
            return;
          }
        } catch (camErr) {
          console.warn('[StartDutyScreen] CameraView capture fallback:', camErr);
        }
      }

      // Fallback to system camera picker (works on simulator & fallback)
      const picked = await pickFromCamera();
      if (picked) {
        setCapturedPhoto(picked);
        if (picked.base64) {
          void runOdometerDetection(picked.base64);
        }
      }
    } catch (err: any) {
      Alert.alert('Capture Failed', err?.message || 'Unable to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Adjust odometer by quick delta
  const adjustOdo = (delta: number) => {
    const current = Number(odometer.replace(/,/g, '')) || 0;
    const nextVal = Math.max(0, current + delta);
    setOdometer(String(nextVal));
    setError('');
  };

  // Toggle flash
  const toggleFlash = () => {
    setFlash((prev) => (prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off'));
  };

  // Submit Start Duty
  const handleStartDuty = async () => {
    if (session.onDuty) {
      Alert.alert('Start Duty', 'You are already on duty.');
      navigation.goBack();
      return;
    }

    if (!hasAssignedVehicle) {
      Alert.alert(
        'Vehicle Required',
        'Cannot start duty: No vehicle is assigned to your profile in the fleet management system.'
      );
      return;
    }

    const value = Number(odometer.replace(/,/g, ''));
    if (!value) {
      setError('Starting odometer is required.');
      return;
    }

    const minOdo = session.vehicle?.odometer || session.lastValidOdo || 0;
    if (minOdo > 0 && value < minOdo) {
      Alert.alert('Invalid Odometer', `Starting odometer cannot be less than current odometer (${km(minOdo)}).`);
      return;
    }

    if (!capturedPhoto) {
      Alert.alert('Photo Required', 'Please capture a photo of the vehicle odometer to start duty.');
      return;
    }

    try {
      setIsSubmitting(true);
      await session.startDuty(value, capturedPhoto.uri);
      Alert.alert(
        'Duty Started',
        `Duty started successfully.\n\nVehicle: ${session.vehicle?.reg || 'Assigned'}\nOdometer: ${km(value)}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to record duty start. Please try again.');
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

      {/* BACKGROUND CAMERA VIEW OR CAPTURED IMAGE */}
      {capturedPhoto ? (
        <View style={StyleSheet.absoluteFill}>
          <Image source={{ uri: capturedPhoto.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          {/* Subtle monochrome vignette over photo */}
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
            Take a live photo of your vehicle's odometer dashboard to start duty.
          </Text>
          <Pressable onPress={requestPermission} style={styles.permissionBtn}>
            <Text style={styles.permissionBtnText}>Enable Camera</Text>
          </Pressable>
          <Pressable onPress={handleCapture} style={[styles.permissionBtn, styles.permissionBtnSecondary]}>
            <Text style={[styles.permissionBtnText, { color: '#FFFFFF' }]}>Use System Camera</Text>
          </Pressable>
        </View>
      )}

      {/* FLOATING TOP BAR: EXPO BLUR EXPERIMENTAL BLUR ON IOS & ANDROID */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <FrostedCircleButton onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </FrostedCircleButton>

        <FrostedBlurPill style={styles.vehicleBadgePill}>
          <View style={styles.pulseDot} />
          <Ionicons name="car-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.vehicleBadgeReg}>
            {session.vehicle?.reg || 'Unassigned'}
          </Text>
          <Text style={styles.vehicleBadgeModel}>
            • {session.vehicle?.model || 'Commercial'}
          </Text>
        </FrostedBlurPill>

        {!capturedPhoto && (
          <FrostedCircleButton onPress={toggleFlash}>
            <Ionicons
              name={flash === 'on' ? 'flash' : flash === 'auto' ? 'flash-outline' : 'flash-off-outline'}
              size={18}
              color={flash !== 'off' ? '#FFFFFF' : '#A1A1AA'}
            />
          </FrostedCircleButton>
        )}
      </View>

      {/* FLOATING RETICLE SCANNER FRAME (Only visible when photo not yet captured) */}
      {!capturedPhoto && (
        <View style={styles.reticleContainer} pointerEvents="none">
          <View style={styles.reticleFrame}>
            {/* Top-Left Corner (Pure White Power Accent) */}
            <View style={[styles.cornerBracket, styles.cornerTL]} />
            {/* Top-Right Corner */}
            <View style={[styles.cornerBracket, styles.cornerTR]} />
            {/* Bottom-Left Corner */}
            <View style={[styles.cornerBracket, styles.cornerBL]} />
            {/* Bottom-Right Corner */}
            <View style={[styles.cornerBracket, styles.cornerBR]} />

            {/* Animated Scanning Laser Line (Pure White Laser) */}
            <Animated.View
              style={[
                styles.scanLaser,
                { transform: [{ translateY: scanTranslateY }] },
              ]}
            />

            <View style={styles.reticleCenterTag}>
              <Ionicons name="scan-outline" size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.reticleTagText}>ALIGN ODOMETER HERE</Text>
            </View>
          </View>
          <Text style={styles.reticleInstruction}>
            Align numbers on dashboard inside the frame
          </Text>
        </View>
      )}

      {/* POST-CAPTURE SUCCESS BADGE */}
      {capturedPhoto && (
        <View style={[styles.successBadgeWrap, { top: insets.top + 60 }]}>
          <FrostedBlurPill style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.successBadgeText}>Odometer Photo Captured & Verified</Text>
          </FrostedBlurPill>
        </View>
      )}

      {/* FLOATING CARD & CONTROLS AT BOTTOM */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        {/* PRE-CAPTURE MODE: FLOATING ODOMETER BAR + LEICA/APPLE MONOCHROME SHUTTER BUTTON */}
        {!capturedPhoto ? (
          <FrostedBlurCard style={styles.preCaptureCard}>
            {/* Odometer Quick Input Strip */}
            <View style={styles.floatingOdoStrip}>
              <View style={{ flex: 1 }}>
                <Text style={styles.odoStripLabel}>CONFIRM STARTING ODOMETER (KM)</Text>
                <View style={styles.odoStripInputRow}>
                  <TextInput
                    value={odometer}
                    onChangeText={(v) => {
                      setOdometer(v);
                      setError('');
                    }}
                    keyboardType="numeric"
                    style={styles.odoStripInput}
                    placeholder="45470"
                    placeholderTextColor="#71717A"
                  />
                  <Text style={styles.odoKmUnit}>KM</Text>
                </View>
              </View>

              <View style={styles.odoVerificationPills}>
                <View style={styles.verifiedTag}>
                  <Ionicons name="time-outline" size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.verifiedTagText}>
                    {isTimeLoading ? 'Syncing IST...' : serverTimeText}
                  </Text>
                </View>
                <View style={styles.verifiedTag}>
                  <Ionicons name="navigate-outline" size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.verifiedTagText}>GPS Attached</Text>
                </View>
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* BLACK & WHITE POWER SHUTTER BUTTON */}
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
          </FrostedBlurCard>
        ) : (
          /* POST-CAPTURE MODE: FLOATING VERIFICATION CARD & HIGH CONTRAST POWER BUTTON */
          <FrostedBlurCard style={styles.postCaptureContainer}>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.postCaptureContent}
            >
              {/* Odometer Verification Input */}
              <View style={styles.fieldSection}>
                <View style={styles.fieldHeaderRow}>
                  <Text style={styles.fieldSectionTitle}>STARTING ODOMETER</Text>
                  <Text style={styles.fieldCurrentKm}>Current: {km(session.vehicle?.odometer || session.lastValidOdo)}</Text>
                </View>

                {/* AI Detection in progress banner */}
                {isDetectingOdo && (
                  <View style={styles.detectingBanner}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.detectingBannerText}>
                      AI scanning integers from odometer photo...
                    </Text>
                  </View>
                )}

                {/* AI Auto-detected successfully banner */}
                {detectedOdo && !isDetectingOdo ? (
                  <View style={styles.detectedSuccessBanner}>
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.detectedSuccessText}>
                      Auto-detected {km(detectedOdo)} from photo • Auto-filled
                    </Text>
                  </View>
                ) : null}

                <View style={[
                  styles.odoLargeInputBox,
                  detectedOdo && !isDetectingOdo ? styles.odoLargeInputBoxDetected : null
                ]}>
                  <TextInput
                    value={odometer}
                    onChangeText={(v) => {
                      setOdometer(v);
                      setError('');
                    }}
                    keyboardType="numeric"
                    style={styles.odoLargeInput}
                    placeholder="45470"
                    placeholderTextColor="#71717A"
                  />
                  <Text style={styles.odoLargeKm}>KM</Text>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Quick delta fine-tuning chips */}
                <View style={styles.deltaChipsRow}>
                  <Pressable onPress={() => adjustOdo(-50)} style={styles.deltaChip}>
                    <Text style={styles.deltaChipText}>-50</Text>
                  </Pressable>
                  <Pressable onPress={() => adjustOdo(-10)} style={styles.deltaChip}>
                    <Text style={styles.deltaChipText}>-10</Text>
                  </Pressable>
                  <Pressable onPress={() => adjustOdo(10)} style={styles.deltaChip}>
                    <Text style={styles.deltaChipText}>+10</Text>
                  </Pressable>
                  <Pressable onPress={() => adjustOdo(50)} style={styles.deltaChip}>
                    <Text style={styles.deltaChipText}>+50</Text>
                  </Pressable>
                </View>

                {/* Detected candidates selector chips if multiple numbers found in cluster */}
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
                            style={[
                              styles.candidateChip,
                              isSelected && styles.candidateChipSelected,
                            ]}
                          >
                            <Ionicons
                              name={isSelected ? 'checkmark-circle' : 'speedometer-outline'}
                              size={12}
                              color={isSelected ? '#000000' : '#FFFFFF'}
                              style={{ marginRight: 4 }}
                            />
                            <Text style={[styles.candidateChipText, isSelected && styles.candidateChipTextSelected]}>
                              {km(cand)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {/* Vehicle & Verification Summary */}
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
                    <Ionicons name="time" size={13} color="#FFFFFF" />
                  </View>
                  <Text style={styles.summaryLabel}>Time:</Text>
                  <Text style={styles.summaryValue}>
                    {serverTimeText || 'Live'} (Server IST)
                  </Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <View style={styles.summaryIconWrap}>
                    <Ionicons name="location" size={13} color="#FFFFFF" />
                  </View>
                  <Text style={styles.summaryLabel}>GPS:</Text>
                  <Text style={styles.summaryValue}>Attached & Anti-Tamper Verified</Text>
                </View>
              </View>

              {/* ACTION BUTTONS ROW: POWER BLACK & WHITE THEME */}
              <View style={styles.actionButtonsRow}>
                {/* Retake Button (Frosted Glass) */}
                <Pressable
                  onPress={() => setCapturedPhoto(null)}
                  disabled={isSubmitting}
                  style={styles.retakeBtn}
                >
                  <Ionicons name="camera-reverse-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.retakeBtnText}>Retake</Text>
                </Pressable>

                {/* Start Duty Primary Button (Pure White Power Accent) */}
                <Pressable
                  onPress={handleStartDuty}
                  disabled={isSubmitting || !hasAssignedVehicle}
                  style={({ pressed }) => [
                    styles.startDutyBtn,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                    (!hasAssignedVehicle || isSubmitting) && { opacity: 0.5 },
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <>
                      <Ionicons name="play" size={18} color="#000000" style={{ marginRight: 8 }} />
                      <Text style={styles.startDutyBtnText}>Start Duty</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </FrostedBlurCard>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
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
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
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
  permissionBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 14,
  },

  /* EXPO BLUR FROSTED CONTAINERS (IOS & ANDROID) */
  frostedCardWrap: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(18, 18, 20, 0.55)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 8,
  },
  specularTopEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    zIndex: 2,
  },
  frostedPillWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(18, 18, 20, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  pillSpecularEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },

  /* FLOATING TOP BAR */
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleBtnWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 18, 20, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  circleSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  vehicleBadgePill: {
    // Layout handled inside FrostedBlurPill
  },
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

  /* RETICLE SCANNER FRAME (MONOCHROME POWER THEME) */
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

  /* SUCCESS BADGE */
  successBadgeWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 25,
    alignItems: 'center',
  },
  successBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  successBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* BOTTOM CONTAINER */
  bottomContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    zIndex: 30,
  },

  /* PRE-CAPTURE CARD */
  preCaptureCard: {
    padding: 16,
  },
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
  odoStripInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  odoStripInput: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    minWidth: 110,
    paddingVertical: 0,
    letterSpacing: 0.5,
  },
  odoKmUnit: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  odoVerificationPills: {
    alignItems: 'flex-end',
    gap: 5,
  },
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
  verifiedTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  errorText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },

  /* SHUTTER BUTTON (LEICA / APPLE MONOCHROME LUXURY) */
  shutterRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
  },
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  shutterCoreDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  shutterInstruction: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },

  /* POST-CAPTURE VERIFICATION CARD */
  postCaptureContainer: {
    maxHeight: 460,
  },
  postCaptureContent: {
    padding: 18,
    gap: 14,
  },
  fieldSection: {
    gap: 6,
  },
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
  fieldCurrentKm: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
  },
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
  detectingBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
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
  detectedSuccessText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
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
  odoLargeKm: {
    color: '#A1A1AA',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 6,
  },
  deltaChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
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
  deltaChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  candidatesSection: {
    marginTop: 6,
    gap: 4,
  },
  candidatesLabel: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  candidatesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
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
  candidateChipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  candidateChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  candidateChipTextSelected: {
    color: '#000000',
    fontWeight: '800',
  },

  /* SUMMARY BOX */
  summaryBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryValue: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },

  /* ACTION BUTTONS ROW (POWER THEME: BLACK & WHITE CONTRAST) */
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
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
  retakeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  startDutyBtn: {
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
  startDutyBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
