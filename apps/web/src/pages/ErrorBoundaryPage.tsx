import { Link, useRouteError } from 'react-router-dom';
import { AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonVariants } from '@/components/ui/button-variants';

/**
 * Last line of defence for a crash the tool UI did not catch. A tool chunk that
 * failed to load is the likeliest cause, so reloading is the first action.
 */
export function ErrorBoundaryPage() {
  const error = useRouteError();
  const detail = error instanceof Error ? error.message : null;

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col items-center justify-center gap-5 px-4 text-center">
      <AlertOctagon className="text-danger size-9" aria-hidden />

      <div className="space-y-2">
        <h1 className="text-2xl">Something broke on our side</h1>
        <p className="text-fg-muted text-sm text-pretty">
          Your files were not affected — nothing was uploaded. Reloading usually fixes it.
        </p>
        {detail && (
          <p className="text-fg-subtle bg-bg-raised border-line mt-4 rounded-lg border p-3 text-left font-mono text-xs break-all">
            {detail}
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className={buttonVariants()} onClick={() => window.location.reload()}>
          Reload the page
        </button>
        <Link to="/" className={cn(buttonVariants({ variant: 'secondary' }))}>
          Go home
        </Link>
      </div>
    </div>
  );
}
