import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, right }: Props) {
  const { colors, type } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={type.pageTitle}>{title}</Text>
          {subtitle ? (
            <Text style={[type.body, { color: colors.textFaint, marginTop: 4 }]}>{subtitle}</Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export function HeaderIconButton({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconBtn,
        { backgroundColor: colors.surfaceMuted, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
  },
  copy: {
    flex: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
