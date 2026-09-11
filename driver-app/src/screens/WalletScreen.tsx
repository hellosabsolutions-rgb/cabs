import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { ListRow } from '../components/ListRow';
import { SectionTitle } from '../components/SectionTitle';
import { MainTabParamList } from '../navigation/types';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import { inr, inrPlain } from '../data/format';

type Props = NativeBottomTabScreenProps<MainTabParamList, 'Wallet'>;

export function WalletScreen(_props: Props) {
  const { colors, t } = useAppTheme();
  const session = useSession();
  const advances = session.txns.filter((txn) => txn.amount > 0).reduce((sum, txn) => sum + txn.amount, 0);
  const spent = session.txns.filter((txn) => txn.amount < 0).reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

  return (
    <Screen inTab>
      <ScreenHeader title={t('wallet.title')} subtitle={t('wallet.sub')} />

      <View style={[styles.balanceCard, { backgroundColor: colors.accent }]}>
        <Text style={styles.balanceLabel}>{t('wallet.remaining')}</Text>
        <Text style={[styles.balanceValue, { color: colors.accentText }]}>
          {inrPlain(session.walletRemaining)}
        </Text>
        <Text style={styles.balanceMeta}>
          {t('wallet.summary', {
            opening: inrPlain(session.walletOpening),
            advances: inrPlain(advances),
            spent: inrPlain(spent),
          })}
        </Text>
      </View>

      <View style={styles.metrics}>
        <View style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: colors.text }]}>{inrPlain(advances)}</Text>
          <Text style={[styles.metricLabel, { color: colors.textFaint }]}>{t('wallet.advanceReceived')}</Text>
        </View>
        <View style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: colors.text }]}>{inrPlain(spent)}</Text>
          <Text style={[styles.metricLabel, { color: colors.textFaint }]}>{t('wallet.spent')}</Text>
        </View>
      </View>

      <SectionTitle title={t('wallet.transactions')} />
      {session.txns.map((txn) => (
        <ListRow
          key={txn.id}
          icon={txn.amount > 0 ? 'arrow-down-outline' : 'arrow-up-outline'}
          title={txn.label}
          subtitle={`${txn.at} · ${t('wallet.ref', { id: txn.ref })}`}
          trailing={
            <View style={styles.txnRight}>
              <Text style={[styles.rowAmount, { color: txn.amount >= 0 ? colors.success : colors.text }]}>
                {inr(txn.amount)}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textFaint }}>{inrPlain(txn.running)}</Text>
            </View>
          }
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    borderRadius: radius.xl,
    padding: space.lg,
    marginBottom: space.md,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: -0.6,
  },
  balanceMeta: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  metrics: {
    flexDirection: 'row',
    gap: space.sm,
  },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.md,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  txnRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rowAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
});
