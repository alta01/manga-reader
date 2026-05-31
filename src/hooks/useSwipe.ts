import { useRef, type TouchEvent } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Minimum horizontal travel (px) to count as a swipe. */
  threshold?: number;
}

interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

/**
 * Touch-only swipe detection. Returns handlers to spread onto a container.
 *
 * A swipe fires only when horizontal travel exceeds `threshold` AND dominates
 * vertical travel, so vertical scrolling / pinch gestures aren't hijacked.
 * Mouse input is intentionally ignored — desktop uses keyboard + click zones.
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: SwipeOptions): SwipeHandlers {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart(e: TouchEvent) {
      // Ignore multi-touch (pinch-zoom etc.)
      if (e.touches.length !== 1) {
        start.current = null;
        return;
      }
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd(e: TouchEvent) {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const t = e.changedTouches[0];
      if (!t) return;

      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;

      if (Math.abs(dx) < threshold) return;
      if (Math.abs(dx) <= Math.abs(dy)) return; // mostly vertical → ignore

      if (dx < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    },
  };
}
