'use client';

import { useMemo, useState } from 'react';

type Point = { label: string; value: number };

type CircleChartProps = {
  title: string;
  points: Point[];
  colors?: string[];
};

const palette = [
  '#34d399',
  '#60a5fa',
  '#f59e0b',
  '#a78bfa',
  '#22d3ee',
  '#f97316',
  '#f472b6',
  '#4ade80',
  '#38bdf8',
  '#facc15'
];

export function CircleChart({ title, points, colors }: CircleChartProps) {
  const [hovered, setHovered] = useState<Point | null>(null);
  const chartPalette = colors && colors.length > 0 ? colors : palette;

  const displayTotal = useMemo(() => points.reduce((sum, point) => sum + point.value, 0), [points]);
  const total = displayTotal || 1;
  const formatValue = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const gradient = useMemo(() => {
    let acc = 0;
    const stops = points.map((point, index) => {
      const start = acc;
      const pct = (point.value / total) * 100;
      acc += pct;
      const color = chartPalette[index % chartPalette.length];
      return `${color} ${start}% ${acc}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }, [points, total]);

  return (
    <div className="bg-card-navy ui-surface rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="bg-card-indigo ui-surface rounded-full px-3 py-1 text-xs text-slate-300">
          {hovered ? `${hovered.label}: ${formatValue(hovered.value)}` : `Total: ${formatValue(displayTotal)}`}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-6">
        <div className="relative h-40 w-40">
          <div
            className="h-full w-full rounded-full shadow-[0_0_30px_rgba(34,211,238,0.15)]"
            style={{ background: gradient }}
          />
          <div className="absolute inset-4 rounded-full border border-white/10 bg-slate-950/80 backdrop-blur">
            <div className="flex h-full w-full flex-col items-center justify-center text-center">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Total</p>
              <p className="text-2xl font-semibold text-white">{formatValue(displayTotal)}</p>
            </div>
          </div>
        </div>

        <div className="min-w-[180px] space-y-2 text-xs text-slate-300">
          {points.map((point, index) => (
            <div
              key={point.label}
              className="bg-card-steel ui-surface flex items-center gap-2 rounded-full px-3 py-1 transition hover:border-white/30 hover:bg-white/5"
              onMouseEnter={() => setHovered(point)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: chartPalette[index % chartPalette.length] }}
              />
              <span className="flex-1">{point.label}</span>
              <span className="text-white">{formatValue(point.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
