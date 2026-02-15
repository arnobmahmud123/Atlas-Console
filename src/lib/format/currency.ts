export function formatCompactUsd(value: string | number) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return '$0.00';

  if (Math.abs(numeric) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2
    }).format(numeric);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numeric);
}

export function toFullUsd(value: string | number) {
  const raw = typeof value === 'number' ? value.toString() : value;
  return `$${raw}`;
}
