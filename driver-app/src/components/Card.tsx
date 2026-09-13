import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { radius, space } from '../theme/colors';
import { GlassSurface } from './GlassChrome';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: Props) {
  return (
    <GlassSurface
      borderRadius={radius.lg}
      style={[{ padding: space.lg, gap: space.md }, style]}
    >
      {children}
    </GlassSurface>
  );
}
