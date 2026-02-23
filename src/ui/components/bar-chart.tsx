'use client';

type BarChartProps = {
  title: string;
  values: number[];
  color?: string;
};

export function BarChart({ title, values, color = 'from-cyan-400 to-blue-500' }: BarChartProps) {
  const max = Math.max(1, ...values);
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-card-steel ui-surface rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300">
          Weekly
        </span>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="grid grid-cols-7 gap-2">
        {values.map((value, index) => (
          <div key={`${title}-${index}`} className="flex flex-col items-center gap-2 text-xs text-slate-400">
            <div className="relative h-24 w-4 rounded-full border border-white/10 bg-white/10">
              <div
                className={`absolute bottom-0 w-full rounded-full bg-gradient-to-t ${color} shadow-[0_0_14px_rgba(59,130,246,0.35)] transition-all duration-500 hover:brightness-110`}
                style={{ height: `${Math.min(100, (value / max) * 100)}%` }}
                title={`${value}`}
              />
            </div>
            <span className="text-[10px] text-slate-400">{labels[index] ?? `D${index + 1}`}</span>
            <span className="font-medium text-slate-300">{value}</span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
