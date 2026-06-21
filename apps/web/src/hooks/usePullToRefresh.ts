import { useCallback, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  containerRef: React.RefObject<HTMLElement | null>;
}

export function usePullToRefresh({ onRefresh, containerRef }: UsePullToRefreshOptions) {
  const state = useRef({ pulling: false, startY: 0, currentY: 0, refreshing: false });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      const touch = e.touches[0];
      if (touch) state.current.startY = touch.clientY;
      state.current.pulling = true;
    }
  }, [containerRef]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!state.current.pulling || state.current.refreshing) return;
    const touch = e.touches[0];
    if (!touch) return;
    state.current.currentY = touch.clientY;
    const diff = state.current.currentY - state.current.startY;
    if (diff > 0) {
      const pullDist = Math.min(diff * 0.3, 60);
      document.documentElement.style.setProperty('--pull-height', `${pullDist}px`);
      document.documentElement.style.setProperty('--pull-opacity', `${Math.min(diff / 150, 1)}`);
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!state.current.pulling || state.current.refreshing) return;
    state.current.pulling = false;
    const diff = state.current.currentY - state.current.startY;
    document.documentElement.style.setProperty('--pull-height', '0px');
    document.documentElement.style.setProperty('--pull-opacity', '0');

    if (diff > 120) {
      state.current.refreshing = true;
      document.documentElement.style.setProperty('--pull-refreshing', '1');
      try {
        await onRefresh();
      } finally {
        state.current.refreshing = false;
        document.documentElement.style.setProperty('--pull-refreshing', '0');
      }
    }
  }, [onRefresh]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
