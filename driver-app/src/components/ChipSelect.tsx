import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';

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

  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[
              styles.chip,
              { borderColor: colors.border, backgroundColor: colors.bg },
              active && { backgroundColor: colors.accentMuted, borderColor: colors.accent },
            ]}
          >
            <Text
              style={[
                styles.text,
                { color: colors.textDim },
                active && { color: colors.accent, fontWeight: '600' },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
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
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
