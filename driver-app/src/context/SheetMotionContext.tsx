import React, { createContext, useContext, useMemo } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useSheetCardBackdrop } from '../hooks/useSheetCardBackdrop';

type SheetMotion = {
  animatedIndex: SharedValue<number>;
  animatedPosition: SharedValue<number>;
};

const SheetMotionContext = createContext<SheetMotion | null>(null);

export function useSheetMotion(): SheetMotion {
  const ctx = useContext(SheetMotionContext);
  if (!ctx) {
    throw new Error('useSheetMotion must be used within SheetMotionProvider');
  }
  return ctx;
}

/** Scales the app behind Gorhom BottomSheetModal as the sheet is dragged. */
export function SheetMotionProvider({ children }: { children: React.ReactNode }) {
  const { height } = useWindowDimensions();
  const animatedIndex = useSharedValue(-1);
  const animatedPosition = useSharedValue(height);
  const { cardStyle, overlayStyle } = useSheetCardBackdrop({
    animatedIndex,
    animatedPosition,
    containerHeight: height,
  });

  const value = useMemo(
    () => ({ animatedIndex, animatedPosition }),
    [animatedIndex, animatedPosition]
  );

  return (
    <SheetMotionContext.Provider value={value}>
      <View style={styles.root}>
        <Animated.View style={[styles.card, cardStyle]} collapsable={false}>
          {children}
          <Animated.View pointerEvents="none" style={[styles.overlay, overlayStyle]} />
        </Animated.View>
      </View>
    </SheetMotionContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  card: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000000',
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
});
