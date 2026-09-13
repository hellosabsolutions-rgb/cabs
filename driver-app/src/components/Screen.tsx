import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';
import { space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';

type Props = {
  children: React.ReactNode;
  header?: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  inTab?: boolean;
};

export function Screen({ children, header, scroll = true, style, inTab = false }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            header ? styles.contentWithHeader : undefined,
            inTab ? styles.tabContent : undefined,
            style,
          ]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <SafeAreaView
          style={[styles.safe, { backgroundColor: colors.bg }]}
          edges={
            header
              ? { left: true, right: true, bottom: !inTab }
              : inTab
              ? { top: true, left: true, right: true }
              : { top: true, bottom: true, left: true, right: true }
          }
        >
          <View
            style={[
              styles.content,
              header ? styles.contentWithHeader : undefined,
              inTab ? styles.tabContent : undefined,
              style,
            ]}
          >
            {children}
          </View>
        </SafeAreaView>
      )}
    </View>
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
  contentWithHeader: {
    paddingTop: space.md,
  },
  tabContent: {
    paddingBottom: 96,
  },
});
