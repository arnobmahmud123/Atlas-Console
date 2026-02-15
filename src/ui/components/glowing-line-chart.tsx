'use client';

import { useId, useMemo } from 'react';

type GlowingLineChartProps = {
  title: string;
  values: number[];
  accent?: string;
};

export function GlowingLineChart({ title, values, accent = '#22d3ee' }: GlowingLineChartProps) {
  const uid = useId().replace(/:/g, '');
  const lineGradientId = `line-gradient-${uid}`;
  const areaGradientId = `area-gradient-${uid}`;
  const glowId = `glow-${uid}`;

  const points = useMemo(() => {
    const max = Math.max(1, ...values);
    return values.map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const y = 100 - (value / max) * 100;
      return { x, y, value };
    });
  }, [values]);

  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = `${path} L 100 100 L 0 100 Z`;

  return (
    <div className="bg-card-steel ui-surface rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-xs text-slate-400">7 day trend</span>
      </div>
      <div className="mt-4">
        <svg viewBox="0 0 100 100" className="h-40 w-full">
          <defs>
            <linearGradient id={lineGradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
              <stop offset="50%" stopColor={accent} stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
            </linearGradient>
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d={areaPath} fill={`url(#${areaGradientId})`}>
            <animate attributeName="opacity" from="0" to="1" dur="700ms" fill="freeze" />
          </path>
          <path
            d={path}
            fill="none"
            stroke={`url(#${lineGradientId})`}
            strokeWidth="2.5"
            filter={`url(#${glowId})`}
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset="100"
          >
            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1200ms" fill="freeze" />
          </path>
          {points.map((point, index) => (
            <g key={`${point.x}-${index}`} className="group">
              <circle cx={point.x} cy={point.y} r="4.5" fill="transparent" />
              <circle cx={point.x} cy={point.y} r="1.8" fill={accent}>
                <animate attributeName="opacity" from="0" to="1" dur="900ms" begin={`${index * 0.08}s`} fill="freeze" />
              </circle>
              <rect
                x={Math.max(1, point.x - 7)}
                y={Math.max(1, point.y - 15)}
                width="14"
                height="8"
                rx="2"
                className="fill-slate-900/90 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              />
              <text
                x={point.x}
                y={Math.max(6, point.y - 10)}
                textAnchor="middle"
                fontSize="3"
                className="fill-slate-100 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              >
                {point.value}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
