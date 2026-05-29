import { useEffect } from 'react';

interface KeyboardNavOptions {
  onNext: () => void;
  onPrev: () => void;
  /** Optional escape / back handler (e.g. return to library). */
  onBack?: () => void;
  enabled?: boolean;
}

/**
 * Desktop keyboard navigation. ArrowRight / Space / PageDown advance;
 * ArrowLeft / PageUp go back; Escape triggers `onBack`.
 *
 * Listeners are attached to `window` and cleaned up on unmount or when the
 * latest handlers change.
 */
export function useKeyboardNav({
  onNext,
  onPrev,
  onBack,
  enabled = true,
}: KeyboardNavOptions): void {
  useEffect(() => {
    if (!enabled) return;

    function handle(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          onPrev();
          break;
        case 'Escape':
          if (onBack) {
            e.preventDefault();
            onBack();
          }
          break;
      }
    }

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onNext, onPrev, onBack, enabled]);
}
