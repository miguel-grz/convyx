import { cn } from '@/lib/cn';

/** Two chevrons closing on a file's edge — a conversion, drawn. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="bg-brand text-brand-fg flex size-7 items-center justify-center rounded-lg">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="size-4"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 6 5.5 12 10 18" />
          <path d="m14 6 4.5 6-4.5 6" opacity={0.5} />
        </svg>
      </span>
      <span className="text-[1.0625rem] font-semibold tracking-[-0.02em]">Convyx</span>
    </span>
  );
}
