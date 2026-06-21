import { useEffect } from 'react';

interface UseSwipeToDeleteOptions {
  id: string;
  onDelete: (id: string) => void;
  threshold?: number;
}

export function useSwipeToDelete({ id, onDelete, threshold = 80 }: UseSwipeToDeleteOptions) {
  useEffect(() => {
    const el = document.querySelector(`[data-swipe-id="${id}"]`) as HTMLElement | null;
    if (!el) return;

    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let deleteRevealed = false;

    const onStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      startX = touch.clientX;
      currentX = startX;
      isDragging = true;
      el.style.transition = 'none';
    };

    const onMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      if (!touch) return;
      currentX = touch.clientX;
      const diff = startX - currentX;
      if (diff > 0) {
        const translateX = Math.min(diff, threshold + 60);
        el.style.transform = `translateX(-${translateX}px)`;
        deleteRevealed = diff >= threshold;
      }
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      el.style.transition = 'transform 0.2s ease';

      if (deleteRevealed) {
        el.style.transform = 'translateX(-60px)';
      } else {
        el.style.transform = 'translateX(0)';
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd);

    const handler = (e: Event) => {
      if (deleteRevealed) {
        e.preventDefault();
        onDelete(id);
      }
    };
    el.addEventListener('click', handler);

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('click', handler);
    };
  }, [id, onDelete, threshold]);
}

export function SwipeDeleteAction({ onDelete }: { onDelete: () => void }) {
  return (
    <div className="absolute right-0 top-0 bottom-0 flex items-center">
      <button
        onClick={onDelete}
        className="h-full w-14 flex items-center justify-center bg-[var(--color-danger)] text-white rounded-r-xl"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>
    </div>
  );
}
