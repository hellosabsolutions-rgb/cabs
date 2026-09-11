import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';

type Props = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
};

export function Field({ label, hint, error, style, ...inputProps }: Props) {
  const { colors, type } = useAppTheme();

  return (
    <View style={{ gap: 6 }}>
      <Text style={type.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textFaint}
        {...inputProps}
        style={[
          {
            minHeight: 44,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.surfaceMuted,
            paddingHorizontal: space.md,
            fontSize: 15,
            color: colors.text,
          },
          inputProps.multiline && {
            minHeight: 96,
            textAlignVertical: 'top' as const,
            paddingTop: space.md,
          },
          style,
        ]}
      />
      {error ? (
        <Text style={{ fontSize: 12, color: colors.danger }}>{error}</Text>
      ) : hint ? (
        <Text style={type.meta}>{hint}</Text>
      ) : null}
    </View>
  );
}
