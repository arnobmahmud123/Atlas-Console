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
  const active = hovered ?? points[0] ?? null;

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
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300">
          {hovered ? `${hovered.label}: ${formatValue(hovered.value)}` : `Total: ${formatValue(displayTotal)}`}
        </span>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-6">
        <div className="relative h-36 w-36">
          <div className="h-36 w-36 rounded-full shadow-[0_0_25px_rgba(59,130,246,0.25)]" style={{ background: gradient }} />
          <div className="absolute inset-[18px] flex items-center justify-center rounded-full border border-white/10 bg-slate-950/75 text-center">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Share</div>
              <div className="text-sm font-semibold text-white">
                {active ? `${((active.value / total) * 100).toFixed(1)}%` : '0.0%'}
              </div>
            </div>
          </div>
        </div>
        <div className="min-w-[160px] space-y-2 text-xs text-slate-300">
          {points.map((point, index) => (
            <div
              key={point.label}
              className={`bg-card-navy ui-surface flex items-center gap-2 rounded-full px-3 py-1 transition hover:border-white/30 hover:bg-white/5 ${
                hovered?.label === point.label ? 'ring-1 ring-white/15' : ''
              }`}
              onMouseEnter={() => setHovered(point)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartPalette[index % chartPalette.length] }} />
              <span className="flex-1">{point.label}</span>
              <span className="text-slate-400">{((point.value / total) * 100).toFixed(1)}%</span>
              <span className="text-white">{formatValue(point.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
