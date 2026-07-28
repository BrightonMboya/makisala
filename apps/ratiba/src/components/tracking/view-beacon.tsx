'use client';

import { useEffect, useRef } from 'react';

interface ViewBeaconProps {
  kind: 'proposal' | 'invoice';
  id: string;
}

// Renders nothing. Logs a view on mount and reports time-on-page via
// sendBeacon when the tab is hidden/closed. Fires from a real browser render,
// so link-preview bots (which fetch HTML but don't execute JS) never trigger it.
export function ViewBeacon({ kind, id }: ViewBeaconProps) {
  const viewIdRef = useRef<string | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    startedAtRef.current = Date.now();

    fetch('/api/track/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, id, format: 'html', referrer: document.referrer || null }),
    })
      .then((res) => res.json())
      .then((data) => {
        viewIdRef.current = data?.viewId ?? null;
      })
      .catch(() => {});

    const reportDuration = () => {
      if (!viewIdRef.current) return;
      const durationSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
      const payload = JSON.stringify({ viewId: viewIdRef.current, durationSeconds });
      navigator.sendBeacon?.(
        '/api/track/view/duration',
        new Blob([payload], { type: 'application/json' }),
      );
      viewIdRef.current = null; // avoid a second report if both listeners fire
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') reportDuration();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', reportDuration);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', reportDuration);
    };
  }, [kind, id]);

  return null;
}
