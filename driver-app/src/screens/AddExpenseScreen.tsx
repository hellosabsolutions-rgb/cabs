import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
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
import { driverExpenseApi, type DriverExpenseApiItem } from '../services/api';
import { driverSocket } from '../services/socket';
import { appDialog } from '../dialog';

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

function mapStatus(status?: string): 'pending' | 'approved' | 'paid' {
  const value = (status || 'Pending').toLowerCase();
  if (value === 'paid') return 'paid';
  if (value === 'approved') return 'approved';
  return 'pending';
}

function receiptFromUrl(url?: string | null): Attachment | null {
  if (!url) return null;
  return {
    uri: url,
    name: 'receipt.jpg',
    mime: 'image/jpeg',
    kind: 'image',
  };
}

export function AddExpenseScreen({ navigation }: Props) {
  const [category, setCategory] = useState('Toll');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<Attachment | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [history, setHistory] = useState<DriverExpenseApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { colors, type, t } = useAppTheme();
  const session = useSession();

  const resetForm = () => {
    setEditingId(null);
    setCategory('Toll');
    setAmount('');
    setNote('');
    setFile(null);
    setExistingReceiptUrl(null);
  };

  const canEdit = (item: DriverExpenseApiItem) =>
    item.createdBy !== 'admin' && mapStatus(item.status) !== 'paid';

  const expenseTotals = useMemo(() => {
    let paid = 0;
    let due = 0;
    history.forEach((item) => {
      const amount = Number(item.amount) || 0;
      if (mapStatus(item.status) === 'paid') paid += amount;
      else due += amount;
    });
    return { paid, due };
  }, [history]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await driverExpenseApi.list();
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      // Keep last known list if the refresh fails.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const upsert = (raw: any) => {
      const item: DriverExpenseApiItem | undefined = raw?.expense || raw;
      if (!item?.id) return;
      setHistory((prev) => {
        if (prev.some((row) => row.id === item.id)) {
          return prev.map((row) => (row.id === item.id ? { ...row, ...item } : row));
        }
        return [item, ...prev];
      });
    };

    const onCreated = (data: any) => upsert(data);
    const onUpdated = (data: any) => upsert(data);
    const onDeleted = (data: any) => {
      const id = data?.expenseId || data?.id || data?.expense?.id;
      if (!id) return;
      setHistory((prev) => prev.filter((row) => row.id !== id));
      setEditingId((current) => (current === id ? null : current));
    };

    driverSocket.on('driver-expense:created', onCreated);
    driverSocket.on('driver-expense:updated', onUpdated);
    driverSocket.on('driver-expense:deleted', onDeleted);
    return () => {
      driverSocket.off('driver-expense:created', onCreated);
      driverSocket.off('driver-expense:updated', onUpdated);
      driverSocket.off('driver-expense:deleted', onDeleted);
    };
  }, []);

  const openEdit = (item: DriverExpenseApiItem) => {
    if (item.createdBy === 'admin') {
      appDialog.alert(t('nav.addExpense'), 'This expense was added by office. You can view it but cannot edit it.');
      return;
    }
    if (mapStatus(item.status) === 'paid') {
      appDialog.alert(t('nav.addExpense'), 'This expense is already paid. Ask office if it needs a change.');
      return;
    }
    setEditingId(item.id);
    setCategory(item.category || 'Other');
    setAmount(String(item.amount || ''));
    setNote(item.remarks || '');
    setExistingReceiptUrl(item.receipt || null);
    setFile(receiptFromUrl(item.receipt));
  };

  const resolveReceipt = () => {
    if (file?.uri && (file.uri.startsWith('http://') || file.uri.startsWith('https://'))) {
      return file.uri;
    }
    if (file?.base64) {
      return `data:${file.mime || 'image/jpeg'};base64,${file.base64}`;
    }
    return existingReceiptUrl;
  };

  const submit = async () => {
    const value = Number(amount);
    if (!value) {
      appDialog.alert(t('nav.addExpense'), t('common.required'));
      return;
    }
    if (!file && !existingReceiptUrl) {
      appDialog.alert(t('nav.addExpense'), t('common.photoNeeded'));
      return;
    }
    if (file?.kind === 'pdf') {
      appDialog.alert(t('nav.addExpense'), 'Please upload a photo of the receipt, not a PDF.');
      return;
    }

    setSaving(true);
    try {
      const receiptUrl = resolveReceipt();
      if (!receiptUrl || receiptUrl.startsWith('file:')) {
        throw new Error('Could not attach receipt photo.');
      }

      if (editingId) {
        const res = await driverExpenseApi.update(editingId, {
          category,
          amount: value,
          remarks: note.trim(),
          receipt: receiptUrl,
          vehicle: session.vehicle?.reg,
        });
        if (res.data) {
          setHistory((prev) => prev.map((row) => (row.id === res.data.id ? { ...row, ...res.data } : row)));
        }
        resetForm();
        appDialog.alert(t('nav.addExpense'), t('common.saved'));
      } else {
        const res = await driverExpenseApi.create({
          category,
          amount: value,
          remarks: note.trim(),
          receipt: receiptUrl,
          vehicle: session.vehicle?.reg,
        });
        if (res.data) {
          setHistory((prev) => (prev.some((row) => row.id === res.data.id) ? prev : [res.data, ...prev]));
        }
        session.addExpense({ category, amount: value, note, photo: true });
        appDialog.alert(t('nav.addExpense'), t('expense.saved'), [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      appDialog.alert(t('nav.addExpense'), err?.message || 'Could not save expense.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Text style={[type.body, { color: colors.textFaint, marginBottom: space.lg }]}>
        {editingId ? 'Update the expense you added. Office-paid entries stay locked.' : t('expense.sub')}
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
        <PrimaryButton
          title={t('common.cancel')}
          variant="secondary"
          onPress={() => {
            if (editingId) resetForm();
            else navigation.goBack();
          }}
          style={styles.flex}
        />
        <PrimaryButton
          title={saving ? 'Saving…' : editingId ? 'Save changes' : t('common.submit')}
          onPress={submit}
          style={styles.flex}
          disabled={saving}
        />
      </ButtonRow>

      <SectionTitle title={t('expense.history')} />
      {history.length > 0 ? (
        <View style={styles.totalsRow}>
          <Text style={[type.body, styles.paidText]}>Paid {inrPlain(expenseTotals.paid)}</Text>
          <Text style={[type.body, styles.dueText]}>Due {inrPlain(expenseTotals.due)}</Text>
        </View>
      ) : null}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : history.length === 0 ? (
        <Text style={[type.body, { color: colors.textFaint }]}>No expenses yet.</Text>
      ) : (
        history.map((item) => {
          const editable = canEdit(item);
          return (
            <ListRow
              key={item.id}
              icon="receipt-outline"
              title={`${item.category} · ${inrPlain(item.amount)}`}
              subtitle={`${item.date}${item.remarks ? ` · ${item.remarks}` : ''}${
                editable ? ' · Tap to edit' : item.createdBy === 'admin' ? ' · Office' : ''
              }`}
              onPress={() => openEdit(item)}
              trailing={
                <StatusBadge
                  label={t(`status.${mapStatus(item.status)}` as MessageKey)}
                  tone={statusTone(mapStatus(item.status))}
                />
              }
            />
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: { paddingVertical: 16, alignItems: 'center' },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  paidText: { color: '#22c55e', fontWeight: '700' },
  dueText: { color: '#eab308', fontWeight: '700' },
});
