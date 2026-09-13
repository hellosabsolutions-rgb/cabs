import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeProvider';
import { radius } from '../theme/colors';
import { inferDialogVariant, registerDialogHost } from './appDialog';
import type {
  ConfirmOptions,
  DialogApi,
  DialogButton,
  DialogOptions,
  DialogVariant,
} from './types';

type QueuedDialog = DialogOptions & {
  id: number;
  resolve: (button: DialogButton | null) => void;
};

const VARIANT_ICON: Record<DialogVariant, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle',
  success: 'checkmark-circle',
  warning: 'warning',
  error: 'close-circle',
  confirm: 'help-circle',
  danger: 'alert-circle',
};

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const { colors, scheme, t } = useAppTheme();
  const [current, setCurrent] = useState<QueuedDialog | null>(null);
  const [visible, setVisible] = useState(false);
  const currentRef = useRef<QueuedDialog | null>(null);
  const queueRef = useRef<QueuedDialog[]>([]);
  const closingRef = useRef(false);
  const nextId = useRef(1);
  const overlay = useRef(new Animated.Value(0)).current;
  const card = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    overlay.stopAnimation();
    card.stopAnimation();
    overlay.setValue(0);
    card.setValue(0);
    Animated.parallel([
      Animated.timing(overlay, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(card, {
        toValue: 1,
        damping: 18,
        stiffness: 240,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [card, overlay]);

  const animateOut = useCallback(
    (done: () => void) => {
      Animated.parallel([
        Animated.timing(overlay, {
          toValue: 0,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(card, {
          toValue: 0,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) done();
      });
    },
    [card, overlay]
  );

  const presentNext = useCallback(
    (item: QueuedDialog | null) => {
      currentRef.current = item;
      setCurrent(item);
      if (item) {
        setVisible(true);
        requestAnimationFrame(animateIn);
      } else {
        setVisible(false);
      }
    },
    [animateIn]
  );

  const enqueue = useCallback((options: DialogOptions) => {
    return new Promise<DialogButton | null>((resolve) => {
      const item: QueuedDialog = {
        ...options,
        id: nextId.current++,
        resolve,
      };
      if (!currentRef.current && !closingRef.current) {
        presentNext(item);
      } else {
        queueRef.current.push(item);
      }
    });
  }, [presentNext]);

  const finish = useCallback(
    (button: DialogButton | null) => {
      const active = currentRef.current;
      if (!active || closingRef.current) return;
      closingRef.current = true;
      const onPress = button?.onPress;
      animateOut(() => {
        active.resolve(button);
        closingRef.current = false;
        const next = queueRef.current.shift() ?? null;
        presentNext(next);
        if (onPress) void onPress();
      });
    },
    [animateOut, presentNext]
  );

  const resolvedButtons = useMemo(() => {
    if (!current) return [];
    if (current.buttons && current.buttons.length > 0) return current.buttons;
    return [{ text: t('common.ok') }];
  }, [current, t]);

  const variant: DialogVariant = current
    ? current.variant ?? inferDialogVariant(current.title, current.message, resolvedButtons)
    : 'info';

  const dismissable =
    current?.dismissable ?? resolvedButtons.some((button) => button.style === 'cancel');

  const handleDismiss = useCallback(() => {
    const cancel = resolvedButtons.find((button) => button.style === 'cancel');
    if (cancel) {
      finish(cancel);
      return;
    }
    if (resolvedButtons.length === 1) {
      finish(resolvedButtons[0]);
      return;
    }
    if (dismissable) finish(null);
  }, [dismissable, finish, resolvedButtons]);

  const api = useMemo<DialogApi>(
    () => ({
      show: (options) => enqueue(options),
      alert: (title, message, buttons, options) =>
        enqueue({
          title,
          message,
          buttons,
          variant: options?.variant,
          dismissable: options?.dismissable,
        }),
      confirm: ({ title, message, confirmText, cancelText, destructive }: ConfirmOptions) =>
        enqueue({
          title,
          message,
          variant: destructive ? 'danger' : 'confirm',
          dismissable: true,
          buttons: [
            { text: cancelText || t('common.cancel'), style: 'cancel' },
            {
              text: confirmText || t('common.confirm'),
              style: destructive ? 'destructive' : 'default',
            },
          ],
        }).then((pressed) => Boolean(pressed) && pressed?.style !== 'cancel'),
    }),
    [enqueue, t]
  );

  useEffect(() => {
    registerDialogHost(api);
    return () => registerDialogHost(null);
  }, [api]);

  const iconColor =
    variant === 'success'
      ? colors.success
      : variant === 'error' || variant === 'danger'
        ? colors.danger
        : variant === 'warning'
          ? colors.warning
          : colors.accent;

  const iconBg =
    variant === 'success'
      ? scheme === 'dark'
        ? '#12353C'
        : '#E6F7FB'
      : variant === 'error' || variant === 'danger'
        ? colors.dangerBg
        : variant === 'warning'
          ? colors.warningBg
          : colors.accentMuted;

  const stacked = resolvedButtons.length > 2;

  return (
    <>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={handleDismiss}
      >
        <View style={styles.root} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.overlay,
                {
                  opacity: overlay,
                  backgroundColor: scheme === 'dark' ? 'rgba(0,0,0,0.62)' : 'rgba(12,16,24,0.46)',
                },
              ]}
            />
          </Pressable>

          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.cardWrap,
              {
                opacity: card,
                transform: [
                  {
                    scale: card.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.92, 1],
                    }),
                  },
                  {
                    translateY: card.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View
              onStartShouldSetResponder={() => true}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                <Ionicons name={VARIANT_ICON[variant]} size={28} color={iconColor} />
              </View>

              {current?.title ? (
                <Text style={[styles.title, { color: colors.text }]}>{current.title}</Text>
              ) : null}

              {current?.message ? (
                <Text style={[styles.message, { color: colors.textDim }]}>{current.message}</Text>
              ) : null}

              <View style={[styles.actions, stacked && styles.actionsStacked]}>
                {resolvedButtons.map((button, index) => {
                  const isDestructive = button.style === 'destructive';
                  const isCancel = button.style === 'cancel';
                  const filled = !stacked && !isCancel;
                  const backgroundColor = filled
                    ? isDestructive
                      ? colors.danger
                      : colors.accent
                    : stacked && isDestructive
                      ? colors.dangerBg
                      : colors.surfaceMuted;
                  const textColor = filled
                    ? '#FFFFFF'
                    : isDestructive
                      ? colors.danger
                      : isCancel
                        ? colors.textDim
                        : colors.text;

                  return (
                    <Pressable
                      key={`${button.text}-${index}`}
                      onPress={() => finish(button)}
                      style={({ pressed }) => [
                        stacked ? styles.actionStacked : styles.action,
                        {
                          backgroundColor,
                          opacity: pressed ? 0.86 : 1,
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                        },
                      ]}
                    >
                      <Text style={[styles.actionLabel, { color: textColor }]}>{button.text}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 18,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    marginTop: 20,
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  actionsStacked: {
    flexDirection: 'column',
  },
  action: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
  },
  actionStacked: {
    minHeight: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
});
