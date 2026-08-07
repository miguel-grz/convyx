import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'border-line-strong bg-bg-panel placeholder:text-fg-subtle focus:border-brand h-10 w-full rounded-lg border px-3 text-sm transition-colors duration-150 disabled:opacity-45',
          className,
        )}
        {...props}
      />
    );
  },
);

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-fg-muted block text-sm font-medium', className)} {...props} />;
}
