'use client';

import { useEffect, useMemo, useState } from 'react';

type CountUpProps = {
  value: number;
  durationMs?: number;
  format?: 'number' | 'currency';
  currency?: string;
};

export function CountUp({ value, durationMs = 900, format = 'number', currency = 'USD' }: CountUpProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const from = display;
    const to = value;

    function step(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min(1, (ts - start) / durationMs);
      const next = from + (to - from) * progress;
      setDisplay(next);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [value, durationMs]);

  const formatter = useMemo(() => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
      });
    }
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  }, [format, currency]);

  return <span>{formatter.format(display)}</span>;
}
