import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

type Params = {
  animatedIndex: SharedValue<number>;
  animatedPosition?: SharedValue<number>;
  containerHeight?: number;
};

/**
 * Zomato/Swiggy-style card transform driven by a Gorhom sheet's live
 * index/position (UI-thread worklets, no React state).
 *
 * Closed (index -1): identity
 * Dragging: interpolated
 * Open (index 0+): scale ~0.94, overlay ~0.52, rounded corners
 */
export function useSheetCardBackdrop({
  animatedIndex,
  animatedPosition,
  containerHeight = 0,
}: Params) {
  const closedY = containerHeight;
  const openY = containerHeight * 0.08;

  const cardStyle = useAnimatedStyle(() => {
    const index = animatedIndex.value;
    const pos = animatedPosition?.value ?? 0;
    const usePosition = containerHeight > 0 && pos > 1;

    const scale = usePosition
      ? interpolate(pos, [openY, closedY], [0.94, 1], Extrapolation.CLAMP)
      : interpolate(index, [-1, 0, 1], [1, 0.955, 0.94], Extrapolation.CLAMP);

    const translateY = usePosition
      ? interpolate(pos, [openY, closedY], [-12, 0], Extrapolation.CLAMP)
      : interpolate(index, [-1, 0, 1], [0, -8, -12], Extrapolation.CLAMP);

    const borderRadius = usePosition
      ? interpolate(pos, [openY, closedY], [24, 0], Extrapolation.CLAMP)
      : interpolate(index, [-1, 0, 1], [0, 20, 24], Extrapolation.CLAMP);

    return {
      transform: [{ translateY }, { scale }],
      borderRadius,
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    const index = animatedIndex.value;
    const pos = animatedPosition?.value ?? 0;
    const usePosition = containerHeight > 0 && pos > 1;

    const opacity = usePosition
      ? interpolate(pos, [openY, closedY], [0.52, 0], Extrapolation.CLAMP)
      : interpolate(index, [-1, 0, 1], [0, 0.42, 0.52], Extrapolation.CLAMP);

    return { opacity };
  });

  return { cardStyle, overlayStyle };
}
