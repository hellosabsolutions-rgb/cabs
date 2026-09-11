import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
};

export function ListRow({ icon, title, subtitle, trailing, onPress }: Props) {
  const { colors, type } = useAppTheme();

  const rowStyle: ViewStyle[] = [
    styles.row,
    { backgroundColor: colors.surface, borderColor: colors.border },
  ];

  const body = (
    <>
      {icon ? (
        <View style={[styles.icon, { backgroundColor: colors.accentMuted }]}>
          <Ionicons name={icon} size={16} color={colors.accent} />
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text style={type.value}>{title}</Text>
        {subtitle ? <Text style={[type.meta, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...rowStyle, pressed && { opacity: 0.86 }]}>
        {body}
      </Pressable>
    );
  }

  return <View style={rowStyle}>{body}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: space.md,
    marginBottom: space.sm,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
});
