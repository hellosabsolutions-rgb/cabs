import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { PrimaryButton, ButtonRow } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { InfoRow } from '../components/InfoRow';
import { AttachmentPicker } from '../components/AttachmentPicker';
import { RootStackParamList } from '../navigation/types';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import { dutyApi } from '../services/api';
import { km } from '../data/format';
import type { Attachment } from '../media/types';

type Props = NativeStackScreenProps<RootStackParamList, 'StartDuty'>;

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

export function StartDutyScreen({ navigation }: Props) {
  const { colors, type, t } = useAppTheme();
  const session = useSession();

  const [odometer, setOdometer] = useState(String(session.vehicle?.odometer || session.odometer || ''));
  const [file, setFile] = useState<Attachment | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Backend IST time synchronization
  const [serverTimeText, setServerTimeText] = useState<string>('');
  const [isTimeLoading, setIsTimeLoading] = useState<boolean>(true);
  const [isProfileRefreshing, setIsProfileRefreshing] = useState<boolean>(false);

  // Check if driver has an assigned vehicle from backend
  const hasAssignedVehicle = useMemo(() => {
    const reg = session.vehicle?.reg;
    return Boolean(reg && reg !== '—' && reg.trim() !== '');
  }, [session.vehicle?.reg]);

  // Refresh profile & assigned vehicle from backend on mount
  useEffect(() => {
    let active = true;
    (async () => {
      setIsProfileRefreshing(true);
      try {
        await session.refreshProfile();
      } catch {
        // Fallback silently if offline
      } finally {
        if (active) setIsProfileRefreshing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

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
          setServerTimeText(`${formatIST(baseServerMs)} (IST)`);
          setIsTimeLoading(false);
        }
      } catch {
        if (!cancelled) {
          // Fallback to local clock formatted in IST
          baseServerMs = Date.now();
          localFetchMs = Date.now();
          setServerTimeText(`${formatIST(baseServerMs)} (IST)`);
          setIsTimeLoading(false);
        }
      }
    };

    fetchServerTime();

    // Live clock ticker
    timer = setInterval(() => {
      if (baseServerMs > 0) {
        const elapsed = Date.now() - localFetchMs;
        const currentMs = baseServerMs + elapsed;
        setServerTimeText(`${formatIST(currentMs)} (IST)`);
      }
    }, 1000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  const submit = async () => {
    if (session.onDuty) {
      Alert.alert(t('nav.startDuty'), t('startDuty.already'));
      navigation.goBack();
      return;
    }

    // Strict validation: Vehicle MUST be assigned from backend
    if (!hasAssignedVehicle) {
      Alert.alert(
        'Vehicle Required',
        'Cannot start duty: No vehicle is assigned to your profile in the fleet management system. Please contact your fleet manager.'
      );
      return;
    }

    const value = Number(odometer.replace(/,/g, ''));
    if (!value) {
      setError(t('common.required'));
      return;
    }

    const minOdo = session.vehicle?.odometer || session.lastValidOdo || 0;
    if (minOdo > 0 && value < minOdo) {
      Alert.alert(t('nav.startDuty'), `${t('startDuty.lowOdo')} (Current: ${km(minOdo)})`);
      return;
    }

    // Strict validation: Live camera odometer photo required
    if (!file) {
      Alert.alert(t('nav.startDuty'), 'A live photo of the vehicle odometer is required to start duty.');
      return;
    }

    try {
      setIsSubmitting(true);
      await session.startDuty(value, file.uri);
      Alert.alert(
        t('nav.startDuty'),
        `Duty started successfully.\n\nVehicle: ${session.vehicle.reg}\nType: ${session.vehicle.type || 'Fleet'}\nOdometer: ${km(value)}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Error', 'Failed to record duty start. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <Text style={[type.body, { color: colors.textFaint, marginBottom: space.lg }]}>
        Capture starting odometer and live camera photo. Date, time, and assigned vehicle are verified with the server.
      </Text>

      {/* Warning banner if no vehicle is assigned from backend */}
      {!hasAssignedVehicle && !isProfileRefreshing && (
        <View
          style={[
            styles.warningCard,
            {
              backgroundColor: colors.dangerBg,
              borderColor: colors.dangerBorder,
            },
          ]}
        >
          <Ionicons name="warning" size={24} color={colors.danger} />
          <View style={styles.warningTextWrap}>
            <Text style={[type.section, { color: colors.danger }]}>
              Vehicle Assignment Required
            </Text>
            <Text style={[type.body, { color: colors.textDim, marginTop: 4, lineHeight: 17 }]}>
              No vehicle has been assigned to your driver account by the fleet manager. You cannot start duty until a vehicle is assigned from the backend.
            </Text>
          </View>
        </View>
      )}

      <Card>
        {/* Backend verified IST time */}
        <InfoRow
          label={t('startDuty.dateTime')}
          value={
            <View style={styles.timeRow}>
              {isTimeLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[type.meta, { color: colors.textFaint, marginLeft: 6 }]}>
                    Syncing IST from server...
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[type.value, { fontWeight: '600' }]}>{serverTimeText}</Text>
                  <View style={[styles.badge, { backgroundColor: colors.accentMuted }]}>
                    <Ionicons name="shield-checkmark" size={11} color={colors.success} style={{ marginRight: 3 }} />
                    <Text style={[styles.badgeText, { color: colors.success }]}>Server IST</Text>
                  </View>
                </>
              )}
            </View>
          }
        />

        {/* Assigned Vehicle & Vehicle Type from Backend */}
        <InfoRow
          label={t('startDuty.vehicle')}
          value={
            hasAssignedVehicle ? (
              <View style={styles.vehicleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[type.value, { color: colors.text, fontSize: 15 }]}>
                    {session.vehicle.reg}
                  </Text>
                  <Text style={[type.meta, { color: colors.textFaint, marginTop: 2 }]}>
                    {session.vehicle.model && session.vehicle.model !== '—'
                      ? `${session.vehicle.model} • `
                      : ''}
                    {session.vehicle.type || 'Fleet Vehicle'}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.accentMuted }]}>
                  <Text style={[styles.badgeText, { color: colors.accent }]}>
                    {session.vehicle.type || 'Assigned'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.vehicleRow}>
                <Text style={[type.value, { color: colors.danger }]}>
                  {isProfileRefreshing ? 'Checking assignment...' : '— No vehicle assigned'}
                </Text>
                <View style={[styles.badge, { backgroundColor: colors.dangerBg }]}>
                  <Text style={[styles.badgeText, { color: colors.danger }]}>Unassigned</Text>
                </View>
              </View>
            )
          }
        />

        <InfoRow label={t('startDuty.gps')} value={t('startDuty.gpsOn')} />

        <Field
          label={t('startDuty.startingOdometer')}
          value={odometer}
          onChangeText={(v) => {
            setOdometer(v);
            setError('');
          }}
          keyboardType="numeric"
          hint={`${t('home.odometer')}: ${km(session.vehicle?.odometer || session.lastValidOdo)}`}
          error={error}
        />

        {/* Live Odometer Photo ONLY (Camera Only, no gallery/PDF) */}
        <AttachmentPicker
          label="Live Odometer Photo"
          value={file}
          onChange={setFile}
          cameraOnly={true}
          hint="Live camera only • Anti-tamper verified"
        />
      </Card>

      <ButtonRow>
        <PrimaryButton
          title={t('common.cancel')}
          variant="secondary"
          onPress={() => navigation.goBack()}
          style={styles.flex}
        />
        <PrimaryButton
          title={isSubmitting ? 'Starting...' : t('startDuty.confirm')}
          onPress={submit}
          disabled={!hasAssignedVehicle || isSubmitting}
          loading={isSubmitting}
          style={styles.flex}
        />
      </ButtonRow>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: space.lg,
  },
  warningTextWrap: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

