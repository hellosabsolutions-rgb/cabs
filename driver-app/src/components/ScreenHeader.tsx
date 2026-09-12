import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  children?: React.ReactNode; // e.g., filter pills or sub-bars
  containerStyle?: ViewStyle;
  compact?: boolean;
};

/**
 * Reusable Icon Button designed for native headers (e.g., Settings, Back, Call, Info)
 */
export function HeaderIconButton({
  onPress,
  icon,
  size = 20,
  children,
  badge,
  accessibilityLabel,
}: {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  children?: React.ReactNode;
  badge?: boolean;
  accessibilityLabel?: string;
}) {
  const { colors, scheme } = useAppTheme();
  const isDark = scheme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.iconBtn,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      {icon ? <Ionicons name={icon} size={size} color={colors.text} /> : children}
      {badge && <View style={[styles.iconBadge, { backgroundColor: colors.danger }]} />}
    </Pressable>
  );
}

/**
 * Modern Native Glass Screen Header
 * Designed for iOS & Android with dynamic safe area handling,
 * sleek glassmorphic elevation, and production-grade typography.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  leftAction,
  rightAction,
  children,
  containerStyle,
  compact = false,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useAppTheme();
  const isDark = scheme === 'dark';

  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 12 : 14);

  return (
    <View
      style={[
        styles.headerRoot,
        {
          paddingTop: topInset,
          backgroundColor: isDark ? 'rgba(18, 22, 28, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)',
        },
        containerStyle,
      ]}
    >
      <View style={[styles.mainRow, compact && styles.compactRow]}>
        {/* Left section: Back button or custom left action */}
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons
              name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
              size={24}
              color={colors.text}
            />
          </Pressable>
        ) : leftAction ? (
          <View style={styles.leftSlot}>{leftAction}</View>
        ) : null}

        {/* Title & Subtitle */}
        <View style={styles.titleContainer}>
          <Text
            style={[
              compact ? styles.compactTitle : styles.largeTitle,
              { color: colors.text },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, { color: colors.textDim }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Right action slot (Buttons, Badges, etc.) */}
        {rightAction ? (
          <View style={styles.rightSlot}>{rightAction}</View>
        ) : null}
      </View>

      {/* Sub-header content (Filters, Search, Tabs) */}
      {children ? <View style={styles.childrenSlot}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRoot: {
    width: '100%',
    paddingHorizontal: space.lg,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 100,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  compactRow: {
    minHeight: 38,
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftSlot: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  largeTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  compactTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  childrenSlot: {
    marginTop: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
