import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { buttonVariants } from '@/components/ui/button-variants';
import { EmptyState } from '@/components/feedback/EmptyState';
import { usePageMeta } from '@/hooks/usePageMeta';

export function NotFoundPage() {
  usePageMeta({ title: 'Page not found — Convyx' });

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6">
      <EmptyState
        title="We could not find that page"
        description="The tool you are looking for may have been renamed, or it may not exist yet."
        action={
          <Link to="/tools" className={cn(buttonVariants({ variant: 'secondary' }))}>
            Browse all tools
          </Link>
        }
      />
    </div>
  );
}
