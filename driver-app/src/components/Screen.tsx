import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';
import { space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  inTab?: boolean;
};

export function Screen({ children, scroll = true, style, inTab = false }: Props) {
  const { colors } = useAppTheme();

  if (scroll) {
    return (
      <ScrollView
        style={[styles.flex, { backgroundColor: colors.bg }]}
        contentContainerStyle={[styles.content, inTab && styles.tabContent, style]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={inTab ? { top: true, left: true, right: true } : { top: true, bottom: true, left: true, right: true }}
    >
      <View style={[styles.content, inTab && styles.tabContent, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
  },
  tabContent: {
    paddingBottom: 96,
  },
});
