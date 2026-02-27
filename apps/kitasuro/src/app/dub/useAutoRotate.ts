"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const INTERVAL = 4000; // ms between auto-advances
const PAUSE_AFTER_CLICK = 8000; // ms to pause after manual interaction

export function useAutoRotate(count: number) {
  const [active, setActive] = useState(0);
  const pausedUntil = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      setActive((prev) => (prev + 1) % count);
    }, INTERVAL);
    return () => clearInterval(id);
  }, [count]);

  const select = useCallback((index: number) => {
    setActive(index);
    pausedUntil.current = Date.now() + PAUSE_AFTER_CLICK;
  }, []);

  return { active, select };
}
