import React from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { GlassCircleButton, GlassHeaderBar } from './GlassChrome';

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  children?: React.ReactNode;
  containerStyle?: ViewStyle;
  compact?: boolean;
};

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
  const { colors } = useAppTheme();

  return (
    <View>
      <GlassCircleButton
        onPress={onPress}
        icon={icon}
        iconSize={size}
        iconColor={colors.text}
        accessibilityLabel={accessibilityLabel}
        size={38}
      >
        {icon ? undefined : children}
      </GlassCircleButton>
      {badge ? <View style={[styles.iconBadge, { backgroundColor: colors.danger }]} /> : null}
    </View>
  );
}

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
  const { colors } = useAppTheme();

  const androidStatus = StatusBar.currentHeight || 24;
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? androidStatus : 14);

  return (
    <GlassHeaderBar
      style={[
        styles.headerRoot,
        { paddingTop: topInset },
        containerStyle,
      ]}
    >
      <View style={[styles.mainRow, compact && styles.compactRow]}>
        {onBack ? (
          <GlassCircleButton
            onPress={onBack}
            icon={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
            iconSize={22}
            iconColor={colors.text}
            accessibilityLabel="Back"
            size={38}
            style={styles.backBtn}
          />
        ) : leftAction ? (
          <View style={styles.leftSlot}>{leftAction}</View>
        ) : null}

        <View style={styles.titleContainer}>
          <Text
            style={[compact ? styles.compactTitle : styles.largeTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textDim }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? <View style={styles.rightSlot}>{rightAction}</View> : null}
      </View>

      {children ? <View style={styles.childrenSlot}>{children}</View> : null}
    </GlassHeaderBar>
  );
}

const styles = StyleSheet.create({
  headerRoot: {
    width: '100%',
    paddingHorizontal: space.lg,
    paddingBottom: 12,
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
  iconBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
