import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { PrimaryButton, ButtonRow } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { ChipSelect } from '../components/ChipSelect';
import { AttachmentPicker } from '../components/AttachmentPicker';
import { ListRow } from '../components/ListRow';
import { SectionTitle } from '../components/SectionTitle';
import { StatusBadge, statusTone } from '../components/StatusBadge';
import { RootStackParamList } from '../navigation/types';
import { space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import { inrPlain } from '../data/format';
import type { MessageKey } from '../i18n/en';
import type { Attachment } from '../media/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

const CATEGORIES: { id: string; key: MessageKey }[] = [
  { id: 'Toll', key: 'expense.toll' },
  { id: 'Food', key: 'expense.food' },
  { id: 'Parking', key: 'expense.parking' },
  { id: 'Repair', key: 'expense.repair' },
  { id: 'Loading', key: 'expense.loading' },
  { id: 'Maintenance', key: 'expense.maintenance' },
  { id: 'Other', key: 'expense.other' },
];

export function AddExpenseScreen({ navigation }: Props) {
  const [category, setCategory] = useState('Toll');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<Attachment | null>(null);
  const { colors, type, t } = useAppTheme();
  const session = useSession();

  const submit = () => {
    const value = Number(amount);
    if (!value) {
      Alert.alert(t('nav.addExpense'), t('common.required'));
      return;
    }
    if (!file) {
      Alert.alert(t('nav.addExpense'), t('common.photoNeeded'));
      return;
    }
    session.addExpense({ category, amount: value, note, photo: true });
    Alert.alert(t('nav.addExpense'), t('expense.saved'), [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <Screen>
      <Text style={[type.body, { color: colors.textFaint, marginBottom: space.lg }]}>
        {t('expense.sub')}
      </Text>

      <Card>
        <Text style={type.label}>{t('expense.category')}</Text>
        <ChipSelect
          value={category}
          onChange={setCategory}
          items={CATEGORIES.map((c) => ({ id: c.id, label: t(c.key) }))}
        />
        <Field label={t('expense.amount')} value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <Field label={t('expense.note')} value={note} onChangeText={setNote} multiline />
        <AttachmentPicker label={t('expense.photo')} value={file} onChange={setFile} />
      </Card>

      <ButtonRow>
        <PrimaryButton title={t('common.cancel')} variant="secondary" onPress={() => navigation.goBack()} style={styles.flex} />
        <PrimaryButton title={t('common.submit')} onPress={submit} style={styles.flex} />
      </ButtonRow>

      <SectionTitle title={t('expense.history')} />
      {session.expenses.map((item) => (
        <ListRow
          key={item.id}
          icon="receipt-outline"
          title={`${item.category} · ${inrPlain(item.amount)}`}
          subtitle={`${item.at}${item.note ? ` · ${item.note}` : ''}`}
          trailing={<StatusBadge label={t(`status.${item.status}` as MessageKey)} tone={statusTone(item.status)} />}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
