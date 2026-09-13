import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  const { type } = useAppTheme();
  return (
    <View style={styles.row}>
      <Text style={type.section}>{title}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xl,
    marginBottom: space.sm,
  },
});
