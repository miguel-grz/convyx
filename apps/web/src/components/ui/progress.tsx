import { cn } from '@/lib/cn';

export interface ProgressProps {
  /** 0..1, or `null` for work whose duration cannot be measured. */
  value: number | null;
  label?: string;
  className?: string;
}

export function Progress({ value, label, className }: ProgressProps) {
  const percent = value === null ? null : Math.round(Math.min(Math.max(value, 0), 1) * 100);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-fg-muted">{label ?? 'Working…'}</span>
        <span className="text-fg tabular-nums">{percent === null ? '' : `${percent}%`}</span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
        aria-label={label ?? 'Processing'}
        aria-valuetext={percent === null ? 'Working' : `${percent}%`}
        className="bg-bg-inset relative h-1.5 w-full overflow-hidden rounded-full"
      >
        {percent === null ? (
          <div className="bg-brand absolute inset-y-0 w-1/4 animate-[indeterminate_1.3s_ease-in-out_infinite] rounded-full" />
        ) : (
          <div
            className="bg-brand h-full rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
    </div>
  );
}
