import type { ReactNode } from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/** An empty screen is an invitation to act, so it always ends in a next step. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <span className="bg-bg-raised text-fg-subtle flex size-12 items-center justify-center rounded-xl">
        <SearchX className="size-5" aria-hidden />
      </span>
      <p className="font-medium">{title}</p>
      {description && <p className="text-fg-muted max-w-sm text-sm text-pretty">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
