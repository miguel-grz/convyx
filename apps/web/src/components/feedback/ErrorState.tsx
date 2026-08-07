import { AlertTriangle, X } from 'lucide-react';
import type { ToolErrorPayload } from '@convyx/tool-contract';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error: ToolErrorPayload;
  onDismiss?: () => void;
}

/**
 * Errors name what happened and, where one exists, what to do next. The closed
 * `ToolErrorCode` set exists so there is always something specific to say.
 *
 * `role="alert"` is why this is inline rather than a toast: a failure should
 * reach a screen reader the moment it happens, beside the control that caused it.
 */
export function ErrorState({ error, onDismiss }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="border-danger/30 bg-danger-soft/60 flex items-start gap-3 rounded-xl border p-4"
    >
      <AlertTriangle className="text-danger mt-0.5 size-5 shrink-0" aria-hidden />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{error.message}</p>
        {error.hint && <p className="text-fg-muted mt-1 text-sm">{error.hint}</p>}
      </div>

      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          <X />
        </Button>
      )}
    </div>
  );
}
