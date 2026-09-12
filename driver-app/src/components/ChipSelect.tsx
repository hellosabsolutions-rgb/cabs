import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { GlassPill, supportsLiquidGlass, usesIosGlass } from './GlassChrome';

type Item = { id: string; label: string };

export function ChipSelect({
  items,
  value,
  onChange,
}: {
  items: Item[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { colors } = useAppTheme();
  const filled = !usesIosGlass || !supportsLiquidGlass;

  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <GlassPill key={item.id} selected={active} onPress={() => onChange(item.id)}>
            <Text
              style={[
                styles.text,
                { color: active && filled ? '#FFFFFF' : active ? colors.text : colors.textDim },
                active && { fontWeight: '700' },
              ]}
            >
              {item.label}
            </Text>
          </GlassPill>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
