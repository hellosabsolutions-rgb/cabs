import React, { useCallback, useMemo } from 'react';
import { Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  useBottomSheetSpringConfigs,
  type BottomSheetBackdropProps,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { useSheetMotion } from '../context/SheetMotionContext';

type Props = Omit<
  BottomSheetModalProps,
  'animatedIndex' | 'animatedPosition' | 'animationConfigs' | 'backdropComponent'
> & {
  backgroundColor: string;
  handleColor?: string;
  sheetStyle?: StyleProp<ViewStyle>;
};

export const AppBottomSheetModal = React.forwardRef<BottomSheetModal, Props>(
  function AppBottomSheetModal(
    {
      backgroundColor,
      handleColor = '#CBD5E1',
      sheetStyle,
      backgroundStyle,
      handleIndicatorStyle,
      children,
      snapPoints,
      ...rest
    },
    ref
  ) {
    const { animatedIndex, animatedPosition } = useSheetMotion();
    const animationConfigs = useBottomSheetSpringConfigs({
      damping: 26,
      stiffness: 240,
      mass: 0.85,
      overshootClamping: false,
    });

    const points = useMemo(() => snapPoints, [snapPoints]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.01}
          pressBehavior="close"
        />
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={points}
        animatedIndex={animatedIndex}
        animatedPosition={animatedPosition}
        animationConfigs={animationConfigs}
        enablePanDownToClose
        enableDismissOnClose
        enableDynamicSizing={false}
        enableOverDrag
        overDragResistanceFactor={2.5}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        backgroundStyle={[
          styles.background,
          { backgroundColor },
          backgroundStyle,
        ]}
        handleIndicatorStyle={[
          styles.handle,
          { backgroundColor: handleColor },
          handleIndicatorStyle,
        ]}
        style={[styles.shadow, sheetStyle]}
        {...rest}
      >
        {children}
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 18,
  },
});
