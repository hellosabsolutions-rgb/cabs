import React from 'react';
import { View, ViewStyle } from 'react-native';
import { space } from '../theme/colors';
import { GlassButton } from './GlassChrome';

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
  return (
    <GlassButton
      title={title}
      onPress={onPress}
      variant={variant}
      disabled={disabled}
      loading={loading}
      style={style}
    />
  );
}

export function ButtonRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>{children}</View>;
}
