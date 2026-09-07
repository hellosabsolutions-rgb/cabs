import { useState, useCallback } from 'react';

/**
 * Hook to manage smooth slide-out and fade-out modal closing animation.
 * Delays parent `onClose()` by durationMs (default 260ms) while applying the 'closing' CSS class.
 */
export const useModalAnimation = (onClose?: () => void, durationMs = 260) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, durationMs);
  }, [onClose, isClosing, durationMs]);

  return { isClosing, handleClose };
};
