'use client';

import { useState } from 'react';

type Point = { label: string; value: number };

type MiniChartProps = {
  title: string;
  points: Point[];
  color?: string;
};

export function MiniChart({ title, points, color = 'bg-cyan-300' }: MiniChartProps) {
  const max = Math.max(1, ...points.map(p => p.value));
  const [hovered, setHovered] = useState<Point | null>(null);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {hovered ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {hovered.label}: {hovered.value}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Hover bars</span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-7 gap-2">
        {points.map(point => (
          <div key={point.label} className="flex flex-col items-center gap-2 text-xs text-slate-400">
            <div className="group relative h-20 w-4 rounded-full bg-white/10">
              <div
                className={`absolute bottom-0 w-full rounded-full ${color} transition-all duration-300 group-hover:brightness-110`}
                style={{ height: `${Math.min(100, (point.value / max) * 100)}%` }}
                onMouseEnter={() => setHovered(point)}
                onMouseLeave={() => setHovered(null)}
              />
              <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-6 rounded-full border border-white/10 bg-black/70 px-2 py-0.5 text-[10px] text-slate-200 opacity-0 transition group-hover:opacity-100">
                {point.value}
              </div>
            </div>
            <span>{point.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
