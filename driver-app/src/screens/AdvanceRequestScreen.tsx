import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { PrimaryButton, ButtonRow } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { ListRow } from '../components/ListRow';
import { SectionTitle } from '../components/SectionTitle';
import { StatusBadge, statusTone } from '../components/StatusBadge';
import { RootStackParamList } from '../navigation/types';
import { space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import { inrPlain } from '../data/format';
import type { MessageKey } from '../i18n/en';

type Props = NativeStackScreenProps<RootStackParamList, 'AdvanceRequest'>;

export function AdvanceRequestScreen({ navigation }: Props) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const { colors, type, t } = useAppTheme();
  const session = useSession();

  const submit = () => {
    const value = Number(amount);
    if (!value || !reason.trim()) {
      Alert.alert(t('nav.advanceRequest'), t('common.required'));
      return;
    }
    session.addAdvance(value, reason.trim());
    Alert.alert(t('nav.advanceRequest'), t('advance.saved'), [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <Screen>
      <Text style={[type.body, { color: colors.textFaint, marginBottom: space.lg }]}>
        {t('advance.sub')}
      </Text>

      <Card>
        <Field label={t('advance.amount')} value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <Field label={t('advance.reason')} value={reason} onChangeText={setReason} multiline />
      </Card>

      <ButtonRow>
        <PrimaryButton title={t('common.cancel')} variant="secondary" onPress={() => navigation.goBack()} style={styles.flex} />
        <PrimaryButton title={t('common.submit')} onPress={submit} style={styles.flex} />
      </ButtonRow>

      <SectionTitle title={t('advance.history')} />
      {session.advances.map((item) => (
        <ListRow
          key={item.id}
          icon="cash-outline"
          title={inrPlain(item.amount)}
          subtitle={`${item.at} · ${item.reason}`}
          trailing={<StatusBadge label={t(`status.${item.status}` as MessageKey)} tone={statusTone(item.status)} />}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
