import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: Props) {
  const { colors } = useAppTheme();
  const onAccent = variant === 'primary' || variant === 'danger';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && { backgroundColor: colors.accent },
        variant === 'secondary' && {
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.border,
        },
        variant === 'danger' && { backgroundColor: colors.danger },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={onAccent ? colors.accentText : colors.accent} />
      ) : (
        <Text
          style={[
            styles.text,
            onAccent && { color: colors.accentText },
            variant === 'secondary' && { color: colors.text, fontWeight: '500' },
            variant === 'ghost' && { color: colors.accent },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function ButtonRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.86,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.lg,
  },
});
