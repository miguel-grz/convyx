import { useId, useMemo } from 'react';
import { ToolError } from '@convyx/tool-contract';
import { countPages, parsePageRanges } from '@/lib/pageRanges';
import { cn } from '@/lib/cn';
import { Input, Label } from '@/components/ui/input';

interface PageRangeFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** `null` while the document is still being read. */
  pageCount: number | null;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
}

/**
 * The page selector, shared by every tool that works on part of a document.
 *
 * It validates as you type and says what the selection covers — "12 of 40
 * pages" — because the alternative is finding out you typed `50-60` into a
 * 40-page document only after asking for the work. The message is advisory
 * here, not an alert: nothing has failed yet, and a half-typed range is a
 * normal state, not an error.
 */
export function PageRangeField({
  value,
  onChange,
  pageCount,
  loading,
  disabled,
  label = 'Pages',
}: PageRangeFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;

  const status = useMemo(() => {
    if (pageCount === null) return null;
    if (!value.trim()) return null;

    try {
      const selected = countPages(parsePageRanges(value, pageCount));
      return {
        ok: true as const,
        text: `${selected} of ${pageCount} ${pageCount === 1 ? 'page' : 'pages'} selected`,
      };
    } catch (cause) {
      return {
        ok: false as const,
        text: cause instanceof ToolError ? cause.message : 'That selection is not valid.',
      };
    }
  }, [value, pageCount]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-fg-subtle text-xs">
          {loading
            ? 'Reading the document…'
            : pageCount !== null && `${pageCount} ${pageCount === 1 ? 'page' : 'pages'}`}
        </span>
      </div>

      <Input
        id={id}
        value={value}
        disabled={disabled}
        inputMode="numeric"
        // A fixed example of the syntax. Deriving it from the page count
        // produced nonsense on short documents — "12-3" on a three-page file.
        placeholder="1-3, 7, 12-"
        aria-describedby={messageId}
        aria-invalid={status?.ok === false}
        onChange={(event) => onChange(event.target.value)}
      />

      <p
        id={messageId}
        aria-live="polite"
        className={cn('text-xs', status?.ok === false ? 'text-danger' : 'text-fg-subtle')}
      >
        {status?.text ?? 'One page like 4, a range like 2-6, or 9- for everything from page 9 on.'}
      </p>
    </div>
  );
}
