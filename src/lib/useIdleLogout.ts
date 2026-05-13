import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'wheel',
];

/** Milliseconds of no user input before idle logout. `0` = feature disabled. */
export function resolveIdleLogoutMs(): number {
  const raw = import.meta.env.VITE_IDLE_LOGOUT_MINUTES;
  let minutes = 15;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number.parseFloat(raw.trim());
    if (Number.isFinite(n)) minutes = n;
  }
  if (minutes <= 0) return 0;
  return Math.round(minutes * 60 * 1000);
}

type UseIdleLogoutOptions = {
  enabled: boolean;
  idleMs: number;
  onIdle: () => void;
};

/**
 * Calls `onIdle` after `idleMs` with no window activity (mouse, keyboard, scroll, touch).
 * Uses a periodic check so background-tab throttling does not indefinitely delay logout.
 */
export function useIdleLogout({ enabled, idleMs, onIdle }: UseIdleLogoutOptions): void {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled || idleMs <= 0) return;

    firedRef.current = false;
    let lastActivity = Date.now();

    const mark = () => {
      lastActivity = Date.now();
    };

    const maybeIdle = () => {
      if (firedRef.current) return;
      if (Date.now() - lastActivity >= idleMs) {
        firedRef.current = true;
        onIdleRef.current();
      }
    };

    const intervalMs = Math.min(15_000, Math.max(5_000, Math.floor(idleMs / 4)));
    const interval = window.setInterval(maybeIdle, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') maybeIdle();
    };

    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, mark, { passive: true } as AddEventListenerOptions);
    }
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, mark);
      }
    };
  }, [enabled, idleMs]);
}
