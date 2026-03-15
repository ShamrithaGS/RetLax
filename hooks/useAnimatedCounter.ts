'use client';

import { useEffect, useRef, useState } from 'react';

export function useAnimatedCounter(
  targetValue: number,
  duration = 1200,
  enabled = true
): number {
  const [displayValue, setDisplayValue] = useState(0);
  const frameRef      = useRef<number | null>(null);
  const startTimeRef  = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const displayRef    = useRef(0);

  useEffect(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (!enabled) {
      displayRef.current = targetValue;
      setDisplayValue(targetValue);
      return;
    }

    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq.matches) {
        displayRef.current = targetValue;
        setDisplayValue(targetValue);
        return;
      }
    }

    startValueRef.current = displayRef.current;
    startTimeRef.current  = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed  = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); 
      const current  = Math.round(
        startValueRef.current + (targetValue - startValueRef.current) * eased
      );

      displayRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [targetValue, duration, enabled]);

  return displayValue;
}
