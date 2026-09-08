import React, { useEffect } from 'react';

/**
 * ModalAnimationController
 * Universally intercepts modal dismiss events (close button, cancel/close footer buttons,
 * and backdrop overlay clicks) across the application.
 * 
 * Instead of instantly unmounting, it applies the `.closing` class to trigger the
 * `modalSlideRightOut` animation (sliding the modal completely off-screen to the right),
 * and then allows React's onClose handler to unmount the modal smoothly.
 */
export const ModalAnimationController: React.FC = () => {
  useEffect(() => {
    const bypassSet = new WeakSet<HTMLElement>();

    const handleClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // If this click was triggered after our animation, let it proceed to React
      if (bypassSet.has(target)) {
        bypassSet.delete(target);
        return;
      }

      // Check if target is inside an open modal
      const overlay = target.closest('.modal-overlay, .opaque-glass-overlay') as HTMLElement | null;
      if (!overlay || overlay.classList.contains('closing')) return;

      const dialog = overlay.querySelector('.modal-dialog, .opaque-glass-dialog') as HTMLElement | null;
      if (!dialog || dialog.classList.contains('closing')) return;

      // 1. Did the user click directly on the backdrop (outside the dialog)?
      const isBackdropClick = target === overlay;

      // 2. Did the user click a close button (e.g. ✕ in header)?
      const isCloseBtn = Boolean(target.closest('.modal-close-btn, [aria-label="Close modal"]'));

      // 3. Did the user click a Cancel or Close secondary button?
      const text = target.textContent?.trim().toLowerCase() || '';
      const isCancelOrCloseBtn =
        (Boolean(target.closest('.modal-footer .btn-secondary, button.btn-secondary')) ||
         target.tagName === 'BUTTON') &&
        (target as HTMLButtonElement).type !== 'submit' &&
        (text === 'cancel' || text === 'close' || text === '✕' || text === '×');

      if (isBackdropClick || isCloseBtn || isCancelOrCloseBtn) {
        // Intercept click immediately before React handles it
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Apply closing classes to run slide out animation to the right
        overlay.classList.add('closing');
        dialog.classList.add('closing');

        // After animation completes, re-dispatch the click to let React run onClose
        setTimeout(() => {
          bypassSet.add(target);
          target.click();
        }, 270);
      }
    };

    // Handle Escape key press
    const handleKeyDownCapture = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const openOverlays = Array.from(
          document.querySelectorAll('.modal-overlay:not(.closing), .opaque-glass-overlay:not(.closing)')
        ) as HTMLElement[];

        const activeOverlay = openOverlays[openOverlays.length - 1];
        if (!activeOverlay) return;

        const dialog = activeOverlay.querySelector('.modal-dialog, .opaque-glass-dialog') as HTMLElement | null;
        const closeBtn = activeOverlay.querySelector('.modal-close-btn') as HTMLElement | null;

        if (dialog && !dialog.classList.contains('closing')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          activeOverlay.classList.add('closing');
          dialog.classList.add('closing');

          setTimeout(() => {
            if (closeBtn) {
              bypassSet.add(closeBtn);
              closeBtn.click();
            } else {
              bypassSet.add(activeOverlay);
              activeOverlay.click();
            }
          }, 270);
        }
      }
    };

    // Attach in capture phase on window so we intercept before React's bubbling handlers
    window.addEventListener('click', handleClickCapture, true);
    window.addEventListener('keydown', handleKeyDownCapture, true);

    return () => {
      window.removeEventListener('click', handleClickCapture, true);
      window.removeEventListener('keydown', handleKeyDownCapture, true);
    };
  }, []);

  return null;
};
