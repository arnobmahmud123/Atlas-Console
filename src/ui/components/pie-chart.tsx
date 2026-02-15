'use client';

import { useMemo, useState } from 'react';

type Point = { label: string; value: number };

type PieChartProps = {
  title: string;
  points: Point[];
  colors?: string[];
};

const palette = ['#22d3ee', '#60a5fa', '#34d399', '#f59e0b', '#f472b6', '#a78bfa'];

export function PieChart({ title, points, colors }: PieChartProps) {
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
  }, [points, total, chartPalette]);

  return (
    <div className="bg-card-steel ui-surface rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-xs text-slate-400">
          {hovered ? `${hovered.label}: ${formatValue(hovered.value)}` : `Total: ${formatValue(displayTotal)}`}
        </span>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-6">
        <div className="h-36 w-36 rounded-full shadow-[0_0_25px_rgba(59,130,246,0.25)]" style={{ background: gradient }} />
        <div className="min-w-[160px] space-y-2 text-xs text-slate-300">
          {points.map((point, index) => (
            <div
              key={point.label}
              className="bg-card-navy ui-surface flex items-center gap-2 rounded-full px-3 py-1 transition hover:border-white/30 hover:bg-white/5"
              onMouseEnter={() => setHovered(point)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartPalette[index % chartPalette.length] }} />
              <span className="flex-1">{point.label}</span>
              <span className="text-white">{formatValue(point.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
