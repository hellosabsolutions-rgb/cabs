import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { PrimaryButton, ButtonRow } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { InfoRow } from '../components/InfoRow';
import { AttachmentPicker } from '../components/AttachmentPicker';
import { RootStackParamList } from '../navigation/types';
import { space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import { km } from '../data/format';
import type { Attachment } from '../media/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EndDuty'>;

export function EndDutyScreen({ navigation }: Props) {
  const { colors, type, t } = useAppTheme();
  const session = useSession();
  const startOdo = session.duties.find((d) => !d.endedAt)?.startOdo ?? session.odometer;
  const [odometer, setOdometer] = useState(String(session.odometer));
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState<Attachment | null>(null);

  const total = useMemo(() => {
    const end = Number(odometer.replace(/,/g, ''));
    if (!end) return 0;
    return Math.max(0, end - startOdo);
  }, [odometer, startOdo]);

  const submit = () => {
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
      Alert.alert(t('nav.endDuty'), t('endDuty.needHigher'));
      return;
    }
    if (!file) {
      Alert.alert(t('nav.endDuty'), t('common.photoNeeded'));
      return;
    }
    session.endDuty(value, remarks);
    Alert.alert(t('nav.endDuty'), t('endDuty.ended'), [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <Screen>
      <Text style={[type.body, { color: colors.textFaint, marginBottom: space.lg }]}>
        {t('endDuty.sub')}
      </Text>

      <Card>
        <InfoRow label={t('endDuty.startOdometer')} value={km(startOdo)} />
        <InfoRow label={t('endDuty.totalKm')} value={`${total} ${t('common.km')}`} />
        <Field
          label={t('endDuty.endOdometer')}
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="numeric"
        />
        <Field
          label={t('endDuty.remarks')}
          value={remarks}
          onChangeText={setRemarks}
          multiline
        />
        <AttachmentPicker label={t('endDuty.photo')} value={file} onChange={setFile} />
      </Card>

      <ButtonRow>
        <PrimaryButton title={t('common.cancel')} variant="secondary" onPress={() => navigation.goBack()} style={styles.flex} />
        <PrimaryButton title={t('endDuty.confirm')} onPress={submit} style={styles.flex} />
      </ButtonRow>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
