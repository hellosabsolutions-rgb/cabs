import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { BlurView, type ExperimentalBlurMethod } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeProvider';

const BLUR_METHOD: ExperimentalBlurMethod = 'dimezisBlurViewSdk31Plus';
const IS_IOS = Platform.OS === 'ios';

function iosMajorVersion(): number {
  if (!IS_IOS) return 0;
  const major = parseInt(String(Platform.Version).split('.')[0], 10);
  return Number.isFinite(major) ? major : 0;
}

/** True only when device + runtime expose native Liquid Glass (iOS 26+). */
export const supportsLiquidGlass =
  IS_IOS &&
  iosMajorVersion() >= 26 &&
  (() => {
    try {
      return isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
    } catch {
      return false;
    }
  })();

/** iOS uses blur / liquid glass. Android uses solid native Material chrome. */
export const usesIosGlass = IS_IOS;

type Tone = 'dark' | 'light' | 'auto';

function resolveTone(tone: Tone, scheme: 'light' | 'dark'): 'dark' | 'light' {
  if (tone === 'auto') return scheme;
  return tone;
}

type SurfaceProps = {
  children: React.ReactNode;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  intensity?: number;
  overflow?: 'hidden' | 'visible';
};

function NativeAndroidSurface({
  children,
  style,
  borderRadius = 16,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
}) {
  const { colors, scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  return (
    <View
      style={[
        {
          borderRadius,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          elevation: 2,
        },
        isDark ? null : styles.androidLightShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

function IosGlassSurface({
  children,
  tone = 'auto',
  style,
  borderRadius = 16,
  intensity = 48,
}: SurfaceProps) {
  const { scheme } = useAppTheme();
  const resolved = resolveTone(tone, scheme);

  if (supportsLiquidGlass) {
    return (
      <GlassView
        colorScheme={resolved}
        glassEffectStyle="regular"
        style={[{ borderRadius, overflow: 'hidden' }, style]}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        {
          borderRadius,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: resolved === 'dark' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.7)',
          backgroundColor: resolved === 'dark' ? 'rgba(18,18,20,0.42)' : 'rgba(255,255,255,0.48)',
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={resolved === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        experimentalBlurMethod={BLUR_METHOD}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

/** Card / panel: liquid glass or blur on iOS, solid elevated surface on Android. */
export function GlassSurface({
  children,
  tone = 'auto',
  style,
  borderRadius = 16,
  intensity = 48,
}: SurfaceProps) {
  if (!usesIosGlass) {
    return (
      <NativeAndroidSurface style={style} borderRadius={borderRadius}>
        {children}
      </NativeAndroidSurface>
    );
  }
  return (
    <IosGlassSurface tone={tone} style={style} borderRadius={borderRadius} intensity={intensity}>
      {children}
    </IosGlassSurface>
  );
}

export const FrostedGlassCard = (props: SurfaceProps) => (
  <GlassSurface {...props} tone="dark" />
);

type GlassCircleButtonProps = {
  onPress: () => void;
  children?: React.ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  tone?: Tone;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  size?: number;
};

export function GlassCircleButton({
  onPress,
  children,
  icon,
  iconSize = 20,
  iconColor,
  tone = 'auto',
  disabled,
  style,
  accessibilityLabel,
  size = 42,
}: GlassCircleButtonProps) {
  const { colors, scheme } = useAppTheme();
  const resolved = resolveTone(tone, scheme);
  const glyphColor = iconColor ?? (resolved === 'dark' ? '#FFFFFF' : colors.text);
  const content = (
    <View style={styles.circleContent}>
      {icon ? <Ionicons name={icon} size={iconSize} color={glyphColor} /> : children}
    </View>
  );

  if (usesIosGlass && supportsLiquidGlass) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        hitSlop={6}
        style={({ pressed }) => [
          { width: size, height: size },
          { opacity: disabled ? 0.45 : pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
          style,
        ]}
      >
        <GlassView
          isInteractive
          colorScheme={resolved}
          glassEffectStyle="regular"
          style={[styles.circleGlass, { width: size, height: size, borderRadius: size / 2 }]}
        >
          {content}
        </GlassView>
      </Pressable>
    );
  }

  if (usesIosGlass) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        hitSlop={6}
        style={({ pressed }) => [
          styles.circleBlurWrap,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: resolved === 'dark' ? 'rgba(18, 18, 20, 0.62)' : 'rgba(255, 255, 255, 0.72)',
            borderColor: resolved === 'dark' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.85)',
            opacity: disabled ? 0.45 : pressed ? 0.78 : 1,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
          style,
        ]}
      >
        <BlurView
          intensity={42}
          tint={resolved === 'dark' ? 'dark' : 'light'}
          experimentalBlurMethod={BLUR_METHOD}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.blurSheen} />
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      android_ripple={{ color: 'rgba(0,0,0,0.12)', borderless: true, radius: size / 2 }}
      style={({ pressed }) => [
        styles.androidCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

type GlassPillProps = {
  children: React.ReactNode;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
};

export function GlassPill({
  children,
  tone = 'auto',
  style,
  onPress,
  selected,
  disabled,
}: GlassPillProps) {
  const { colors, scheme } = useAppTheme();
  const resolved = resolveTone(tone, scheme);
  const inner = <View style={styles.pillContent}>{children}</View>;

  if (onPress) {
    if (!usesIosGlass) {
      return (
        <Pressable
          onPress={onPress}
          disabled={disabled}
          android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false }}
          style={({ pressed }) => [
            styles.androidPill,
            {
              backgroundColor: selected ? colors.accent : colors.surfaceMuted,
              borderColor: selected ? colors.accent : colors.border,
              opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
            },
            style,
          ]}
        >
          {inner}
        </Pressable>
      );
    }

    if (supportsLiquidGlass) {
      return (
        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={({ pressed }) => [
            { opacity: disabled ? 0.5 : pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <GlassView
            isInteractive
            colorScheme={resolved}
            glassEffectStyle="regular"
            style={[styles.pillGlass, selected && styles.pillSelectedIos, style]}
          >
            {inner}
          </GlassView>
        </Pressable>
      );
    }

    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.pillBlurWrap,
          {
            backgroundColor: selected
              ? colors.accent
              : resolved === 'dark'
                ? 'rgba(18, 18, 20, 0.55)'
                : 'rgba(255, 255, 255, 0.55)',
            borderColor: selected
              ? colors.accent
              : resolved === 'dark'
                ? 'rgba(255, 255, 255, 0.22)'
                : 'rgba(255, 255, 255, 0.8)',
            opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
          },
          style,
        ]}
      >
        {!selected ? (
          <BlurView
            intensity={36}
            tint={resolved === 'dark' ? 'dark' : 'light'}
            experimentalBlurMethod={BLUR_METHOD}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {inner}
      </Pressable>
    );
  }

  if (!usesIosGlass) {
    return (
      <View
        style={[
          styles.androidPill,
          {
            backgroundColor: colors.surfaceMuted,
            borderColor: colors.border,
          },
          style,
        ]}
      >
        {inner}
      </View>
    );
  }

  if (supportsLiquidGlass) {
    return (
      <GlassView
        colorScheme={resolved}
        glassEffectStyle="regular"
        style={[styles.pillGlass, style]}
      >
        {inner}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        styles.pillBlurWrap,
        {
          backgroundColor: resolved === 'dark' ? 'rgba(18, 18, 20, 0.65)' : 'rgba(255, 255, 255, 0.75)',
          borderColor: resolved === 'dark' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.85)',
        },
        style,
      ]}
    >
      <BlurView
        intensity={40}
        tint={resolved === 'dark' ? 'dark' : 'light'}
        experimentalBlurMethod={BLUR_METHOD}
        style={StyleSheet.absoluteFill}
      />
      {inner}
    </View>
  );
}

type GlassButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type GlassButtonProps = {
  title: string;
  onPress: () => void;
  variant?: GlassButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  tone?: Tone;
};

export function GlassButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
  textStyle,
  tone = 'auto',
}: GlassButtonProps) {
  const { colors, scheme } = useAppTheme();
  const resolved = resolveTone(tone, scheme);
  const inactive = disabled || loading;
  const onAccent = variant === 'primary' || variant === 'danger';
  const labelColor =
    variant === 'primary'
      ? colors.accentText
      : variant === 'danger'
        ? '#FFFFFF'
        : variant === 'ghost'
          ? colors.accent
          : resolved === 'dark'
            ? '#FFFFFF'
            : colors.text;
  const iconColor = labelColor;

  const label = loading ? (
    <ActivityIndicator size="small" color={onAccent ? colors.accentText : colors.accent} />
  ) : (
    <View style={styles.buttonLabelRow}>
      {icon ? <Ionicons name={icon} size={17} color={iconColor} /> : null}
      <Text style={[styles.buttonText, { color: labelColor }, textStyle]}>{title}</Text>
    </View>
  );

  if (!usesIosGlass) {
    const bg =
      variant === 'primary'
        ? colors.accent
        : variant === 'danger'
          ? colors.danger
          : variant === 'ghost'
            ? 'transparent'
            : colors.surfaceMuted;
    return (
      <Pressable
        onPress={onPress}
        disabled={inactive}
        android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
        style={({ pressed }) => [
          styles.androidButton,
          {
            backgroundColor: bg,
            borderWidth: variant === 'secondary' ? StyleSheet.hairlineWidth : 0,
            borderColor: colors.border,
            opacity: inactive ? 0.5 : pressed ? 0.9 : 1,
            elevation: variant === 'ghost' ? 0 : variant === 'primary' ? 3 : 1,
          },
          style,
        ]}
      >
        {label}
      </Pressable>
    );
  }

  if (variant === 'primary' || variant === 'danger') {
    return (
      <Pressable
        onPress={onPress}
        disabled={inactive}
        style={({ pressed }) => [
          styles.iosFilledButton,
          {
            backgroundColor: variant === 'danger' ? colors.danger : colors.accent,
            opacity: inactive ? 0.5 : pressed ? 0.88 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
          style,
        ]}
      >
        {label}
      </Pressable>
    );
  }

  if (supportsLiquidGlass) {
    return (
      <Pressable
        onPress={onPress}
        disabled={inactive}
        style={({ pressed }) => [
          { opacity: inactive ? 0.5 : pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
          style,
        ]}
      >
        <GlassView
          isInteractive
          colorScheme={resolved}
          glassEffectStyle="regular"
          style={styles.iosGlassButton}
        >
          {label}
        </GlassView>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.iosBlurButton,
        {
          backgroundColor: resolved === 'dark' ? 'rgba(18,18,20,0.5)' : 'rgba(255,255,255,0.55)',
          borderColor: resolved === 'dark' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.8)',
          opacity: inactive ? 0.5 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      <BlurView
        intensity={40}
        tint={resolved === 'dark' ? 'dark' : 'light'}
        experimentalBlurMethod={BLUR_METHOD}
        style={StyleSheet.absoluteFill}
      />
      {label}
    </Pressable>
  );
}

type HeaderBarProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Screen header background: blur on iOS, solid on Android. */
export function GlassHeaderBar({ children, style }: HeaderBarProps) {
  const { colors, scheme } = useAppTheme();

  if (!usesIosGlass) {
    return (
      <View
        style={[
          {
            backgroundColor: colors.surface,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
            elevation: 3,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  if (supportsLiquidGlass) {
    return (
      <GlassView
        colorScheme={scheme}
        glassEffectStyle="regular"
        style={[{ overflow: 'hidden' }, style]}
      >
        <View style={styles.headerForeground}>{children}</View>
      </GlassView>
    );
  }

  return (
    <View
      style={[
        {
          overflow: 'hidden',
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: scheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        },
        style,
      ]}
    >
      <BlurView
        intensity={64}
        tint={scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        experimentalBlurMethod={BLUR_METHOD}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.headerForeground}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  androidLightShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  circleGlass: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circleBlurWrap: {
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidCircle: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  circleContent: {
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  pillGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  pillSelectedIos: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  pillBlurWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  androidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  pillContent: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonLabelRow: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  androidButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  iosFilledButton: {
    minHeight: 48,
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  iosGlassButton: {
    minHeight: 48,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  iosBlurButton: {
    minHeight: 48,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  headerForeground: {
    zIndex: 2,
  },
});
