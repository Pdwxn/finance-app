import { useEffect, useRef } from 'react';

interface UseSwipeToDismissOptions {
  onDismiss: () => void;
  threshold?: number;
}

export function useSwipeToDismiss({ onDismiss, threshold = 100 }: UseSwipeToDismissOptions) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const onStart = (e: TouchEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;
      const touch = e.touches[0];
      if (!touch) return;
      startY = touch.clientY;
      isDragging = true;
      el.style.transition = 'none';
    };

    const onMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      if (!touch) return;
      currentY = touch.clientY;
      const diff = currentY - startY;
      if (diff > 0) {
        el.style.transform = `translateY(${Math.min(diff * 0.5, 200)}px)`;
        el.style.opacity = `${1 - Math.min(diff / threshold, 0.5)}`;
      }
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      const diff = currentY - startY;
      if (diff > threshold) {
        onDismiss();
      } else {
        el.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        el.style.transform = 'translateY(0)';
        el.style.opacity = '1';
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd);

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [onDismiss, threshold]);

  return ref;
}
