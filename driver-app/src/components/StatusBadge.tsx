import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export function statusTone(status: string): BadgeTone {
  if (status === 'approved' || status === 'paid' || status === 'settled' || status === 'uploaded') {
    return 'success';
  }
  if (status === 'rejected') return 'danger';
  if (status === 'pending') return 'warning';
  return 'accent';
}

export function StatusBadge({
  label,
  tone = 'neutral',
  dot,
}: {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
}) {
  const { colors } = useAppTheme();
  const map = {
    neutral: { bg: colors.surfaceMuted, fg: colors.textDim, mark: colors.textFaint },
    accent: { bg: colors.accentMuted, fg: colors.accent, mark: colors.accent },
    success: { bg: colors.accentMuted, fg: colors.success, mark: colors.success },
    warning: { bg: colors.warningBg, fg: colors.warning, mark: colors.warning },
    danger: { bg: colors.dangerBg, fg: colors.danger, mark: colors.danger },
  }[tone];

  return (
    <View style={[styles.wrap, { backgroundColor: map.bg }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: map.mark }]} /> : null}
      <Text style={[styles.text, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
