import React, { useMemo, useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { PrimaryButton, ButtonRow } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { InfoRow } from '../components/InfoRow';
import { AttachmentPicker } from '../components/AttachmentPicker';
import { RootStackParamList } from '../navigation/types';
import { space, radius } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import { km } from '../data/format';
import { dutyApi } from '../services/api';
import type { Attachment } from '../media/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EndDuty'>;

function formatIST(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString('en-IN');
  }
}

export function EndDutyScreen({ navigation }: Props) {
  const { colors, type, t } = useAppTheme();
  const session = useSession();

  const startOdo = useMemo(() => {
    const activeDuty = session.duties.find((d) => !d.endedAt);
    if (activeDuty && activeDuty.startOdo > 0) return activeDuty.startOdo;
    return session.vehicle?.odometer || session.odometer || 0;
  }, [session.duties, session.vehicle?.odometer, session.odometer]);

  const initialEndOdo = session.vehicle?.odometer || session.odometer || startOdo || '';
  const [odometer, setOdometer] = useState(String(initialEndOdo));
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState<Attachment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Backend IST time synchronization
  const [serverTimeText, setServerTimeText] = useState<string>('');
  const [isTimeLoading, setIsTimeLoading] = useState<boolean>(true);

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
          baseServerMs = Date.now();
          localFetchMs = Date.now();
          setServerTimeText(`${formatIST(baseServerMs)} (IST)`);
          setIsTimeLoading(false);
        }
      }
    };

    fetchServerTime();

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

  const total = useMemo(() => {
    const end = Number(odometer.replace(/,/g, ''));
    if (!end) return 0;
    return Math.max(0, end - startOdo);
  }, [odometer, startOdo]);

  const submit = async () => {
    if (!session.onDuty) {
      Alert.alert(t('nav.endDuty'), t('endDuty.notOnDuty'));
      return;
    }
    const value = Number(odometer.replace(/,/g, ''));
    if (!value) {
      Alert.alert(t('nav.endDuty'), t('common.required'));
      return;
    }
    if (value < startOdo) {
      Alert.alert(t('nav.endDuty'), `${t('endDuty.needHigher')} (${t('endDuty.startOdometer')}: ${km(startOdo)})`);
      return;
    }
    if (!file) {
      Alert.alert(t('nav.endDuty'), t('common.photoNeeded'));
      return;
    }

    try {
      setIsSubmitting(true);
      await session.endDuty(value, remarks, file.uri);
      Alert.alert(
        t('nav.endDuty'),
        `Duty ended successfully.\n\nVehicle: ${session.vehicle?.reg || 'Assigned'}\nFinal Odometer: ${km(value)}\nDistance Run: ${km(total)}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to end duty. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const vehicleReg = session.vehicle?.reg && session.vehicle.reg !== '—'
    ? session.vehicle.reg
    : 'Assigned Vehicle';

  return (
    <Screen>
      <Text style={[type.body, { color: colors.textFaint, marginBottom: space.md }]}>
        {t('endDuty.sub')}
      </Text>

      {/* Live Server Time & Vehicle Verification Card */}
      <View
        style={[
          styles.timeCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSoft,
          },
        ]}
      >
        <View style={styles.timeCardHeader}>
          <View style={styles.clockIconWrap}>
            <Ionicons name="time-outline" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.meta, { color: colors.textDim }]}>
              Server Certified End Time
            </Text>
            {isTimeLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={[type.body, { color: colors.textFaint, marginLeft: 6 }]}>
                  Syncing with server clock...
                </Text>
              </View>
            ) : (
              <Text style={[type.section, { color: colors.text, marginTop: 2 }]}>
                {serverTimeText}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderSoft }]} />

        <View style={styles.vehicleRow}>
          <Ionicons name="car-outline" size={18} color={colors.textDim} />
          <Text style={[type.body, { color: colors.textDim, marginLeft: 6 }]}>
            Assigned Vehicle:
          </Text>
          <Text style={[type.section, { color: colors.text, marginLeft: 6 }]}>
            {vehicleReg}
          </Text>
        </View>
      </View>

      <Card>
        <InfoRow label={t('endDuty.startOdometer')} value={km(startOdo)} />
        <InfoRow label={t('endDuty.totalKm')} value={`${km(total)}`} />
        <Field
          label={t('endDuty.endOdometer')}
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="numeric"
          placeholder="e.g. 24850"
        />
        <Field
          label={t('endDuty.remarks')}
          value={remarks}
          onChangeText={setRemarks}
          placeholder="Any parking, toll, or route remarks"
          multiline
        />
        <AttachmentPicker label={t('endDuty.photo')} value={file} onChange={setFile} />
      </Card>

      <ButtonRow>
        <PrimaryButton
          title={t('common.cancel')}
          variant="secondary"
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
          style={styles.flex}
        />
        <PrimaryButton
          title={isSubmitting ? 'Ending Duty...' : t('endDuty.confirm')}
          onPress={submit}
          disabled={isSubmitting}
          style={styles.flex}
        />
      </ButtonRow>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  timeCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.md,
    marginBottom: space.lg,
  },
  timeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIconWrap: {
    marginRight: space.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: space.sm,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
