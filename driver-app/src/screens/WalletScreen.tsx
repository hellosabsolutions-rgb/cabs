import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeBottomTabScreenProps } from '@react-navigation/bottom-tabs/unstable';
import { Ionicons } from '@expo/vector-icons';
import { ListRow } from '../components/ListRow';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionTitle } from '../components/SectionTitle';
import { MainTabParamList } from '../navigation/types';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import { inr, inrPlain } from '../data/format';

type Props = NativeBottomTabScreenProps<MainTabParamList, 'Wallet'>;

export function WalletScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const { colors, scheme, t } = useAppTheme();
  const isDark = scheme === 'dark';
  const session = useSession();
  const advances = session.txns.filter((txn) => txn.amount > 0).reduce((sum, txn) => sum + txn.amount, 0);
  const spent = session.txns.filter((txn) => txn.amount < 0).reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

  return (
    <View style={[styles.screenWrap, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ─── NATIVE CLEAN TOP HEADER ─── */}
      <ScreenHeader
        title={t('wallet.title') || 'Wallet'}
        subtitle={t('wallet.sub') || 'Driver balance & shift ledger'}
        rightAction={
          <View style={[styles.headerBadge, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.18)' : '#EFF6FF' }]}>
            <Ionicons name="wallet" size={14} color="#2563EB" style={{ marginRight: 4 }} />
            <Text style={styles.headerBadgeText}>{inrPlain(session.walletRemaining)}</Text>
          </View>
        }
      />

      {/* ─── SCROLLABLE CONTENT ─── */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollBody}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
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
        <View style={[styles.txnsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {session.txns.map((txn, index) => (
            <View
              key={txn.id}
              style={[
                styles.txnRowWrap,
                index < session.txns.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.borderSoft,
                },
              ]}
            >
              <ListRow
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
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenWrap: { flex: 1 },


  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
  },
  headerBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2563EB',
  },

  /* ─── SCROLL BODY ─── */
  scrollBody: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: 96,
  },
  balanceCard: {
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    padding: space.lg,
    marginBottom: space.md,
    shadowColor: '#1687F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.6,
  },
  balanceMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  metrics: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: 6,
  },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
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
  txnsCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  txnRowWrap: {
    paddingHorizontal: 4,
  },
  txnRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rowAmount: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
