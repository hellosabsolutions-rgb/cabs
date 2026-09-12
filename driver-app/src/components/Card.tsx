import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: Props) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: colors.border,
          padding: space.lg,
          gap: space.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
