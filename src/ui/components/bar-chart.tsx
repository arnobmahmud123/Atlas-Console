'use client';

type BarChartProps = {
  title: string;
  values: number[];
  color?: string;
};

export function BarChart({ title, values, color = 'from-cyan-400 to-blue-500' }: BarChartProps) {
  const max = Math.max(1, ...values);

  return (
    <div className="bg-card-steel ui-surface rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-xs text-slate-400">Weekly</span>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-2">
        {values.map((value, index) => (
          <div key={`${title}-${index}`} className="flex flex-col items-center gap-2 text-xs text-slate-400">
            <div className="h-24 w-3 rounded-full bg-white/10">
              <div
                className={`h-full w-full rounded-full bg-gradient-to-t ${color} shadow-[0_0_12px_rgba(59,130,246,0.35)]`}
                style={{ height: `${Math.min(100, (value / max) * 100)}%` }}
                title={`${value}`}
              />
            </div>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
