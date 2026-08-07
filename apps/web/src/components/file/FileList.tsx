import { ArrowDown, ArrowUp, FileIcon, X } from 'lucide-react';
import { formatBytes, truncateFilename } from '@/lib/format';
import { Button } from '@/components/ui/button';

interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
  /** Omit to hide reordering for tools where order carries no meaning. */
  onMove?: (from: number, to: number) => void;
  disabled?: boolean;
}

/**
 * Order matters for tools like merge, so reordering uses buttons rather than
 * drag alone: it works with a keyboard and on touch, and it is announced by
 * screen readers.
 */
export function FileList({ files, onRemove, onMove, disabled }: FileListProps) {
  if (files.length === 0) return null;

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div>
      <div className="text-fg-muted mb-2 flex items-center justify-between text-sm">
        <span>
          {files.length} {files.length === 1 ? 'file' : 'files'} added
        </span>
        <span className="tabular-nums">{formatBytes(totalBytes)}</span>
      </div>

      <ul className="divide-line border-line divide-y overflow-hidden rounded-xl border">
        {files.map((file, index) => (
          <li
            key={`${file.name}-${file.lastModified}-${index}`}
            className="bg-bg-panel flex items-center gap-3 p-2.5"
          >
            {onMove ? (
              <span className="text-fg-subtle w-5 shrink-0 text-center text-sm tabular-nums">
                {index + 1}
              </span>
            ) : (
              <FileIcon className="text-fg-subtle size-4 shrink-0" aria-hidden />
            )}

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm" title={file.name}>
                {truncateFilename(file.name, 40)}
              </span>
              <span className="text-fg-subtle block text-xs tabular-nums">
                {formatBytes(file.size)}
              </span>
            </span>

            {onMove && (
              <span className="flex shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Move ${file.name} up`}
                  disabled={disabled || index === 0}
                  onClick={() => onMove(index, index - 1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Move ${file.name} down`}
                  disabled={disabled || index === files.length - 1}
                  onClick={() => onMove(index, index + 1)}
                >
                  <ArrowDown />
                </Button>
              </span>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="hover:text-danger size-8 shrink-0"
              aria-label={`Remove ${file.name}`}
              disabled={disabled}
              onClick={() => onRemove(index)}
            >
              <X />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
