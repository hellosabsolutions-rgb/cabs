import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { RootStackParamList } from '../navigation/types';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import { StatusBadge } from '../components/StatusBadge';

type Props = NativeStackScreenProps<RootStackParamList, 'DigitalId'>;

export function DigitalIdScreen(_props: Props) {
  const { colors, type, t } = useAppTheme();
  const session = useSession();

  return (
    <Screen>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.banner, { backgroundColor: colors.accent }]}>
          <Text style={styles.brand}>KABPRO</Text>
          <Text style={styles.brandSub}>{t('digitalId.driver')}</Text>
        </View>
        <View style={styles.body}>
          <View style={[styles.avatar, { backgroundColor: colors.accentMuted }]}>
            <Text style={[styles.avatarText, { color: colors.accent }]}>{session.driver.initials}</Text>
          </View>
          <Text style={type.pageTitle}>{session.driver.name}</Text>
          <Text style={[type.meta, { marginTop: 2 }]}>{session.driver.id}</Text>
          <View style={{ marginTop: 10 }}>
            <StatusBadge
              label={session.onDuty ? t('home.onDuty') : t('home.offDuty')}
              tone={session.onDuty ? 'success' : 'neutral'}
              dot
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Row label={t('digitalId.vehicle')} value={session.vehicle.reg} />
          <Row label={t('digitalId.licence')} value={session.driver.licence} />
          <Row label={t('digitalId.validTill')} value={session.driver.licenceValid} />
          <Row label={t('digitalId.agency')} value={session.driver.agency} />
        </View>
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { type } = useAppTheme();
  return (
    <View style={styles.row}>
      <Text style={type.label}>{label}</Text>
      <Text style={type.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  banner: {
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  brandSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  body: {
    alignItems: 'center',
    padding: space.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
    marginTop: -4,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: space.lg,
  },
  row: {
    alignSelf: 'stretch',
    marginBottom: 10,
    gap: 2,
  },
});
