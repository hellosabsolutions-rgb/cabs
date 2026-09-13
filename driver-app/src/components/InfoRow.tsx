import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  const { colors, type } = useAppTheme();

  return (
    <View
      style={{
        gap: 2,
        paddingVertical: space.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.borderSoft,
      }}
    >
      <Text style={type.label}>{label}</Text>
      {typeof value === 'string' ? <Text style={type.value}>{value}</Text> : value}
    </View>
  );
}
