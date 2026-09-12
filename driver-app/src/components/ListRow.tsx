import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from './GlassChrome';
import { space } from '../theme/colors';
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

  const inner = <View style={styles.rowInner}>{body}</View>;

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.86 }]}>
        <GlassSurface>{inner}</GlassSurface>
      </Pressable>
    );
  }

  return (
    <View style={styles.wrap}>
      <GlassSurface>{inner}</GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.sm,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 12,
    paddingHorizontal: space.md,
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
