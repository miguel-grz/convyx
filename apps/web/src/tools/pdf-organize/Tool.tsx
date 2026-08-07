import { useEffect, useState } from 'react';
import { LayoutGrid, Loader2, Undo2 } from 'lucide-react';
import type { ToolComponentProps } from '@convyx/tool-contract';
import { useToolRun } from '@/hooks/useToolRun';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dropzone } from '@/components/file/Dropzone';
import { FileList } from '@/components/file/FileList';
import { ResultPanel } from '@/components/file/ResultPanel';
import { ErrorState } from '@/components/feedback/ErrorState';
import handler, { type OrganizeOptions } from './handler';
import { useThumbnails, type PagePreview } from './useThumbnails';
import { PageGrid, type PageState } from './PageGrid';

const asPageStates = (pages: PagePreview[]): PageState[] =>
  pages.map((page) => ({ ...page, removed: false }));

export default function OrganizePdfTool({ manifest }: ToolComponentProps) {
  const run = useToolRun<OrganizeOptions>(manifest, handler);
  const file = run.files[0];
  const thumbnails = useThumbnails(file);

  const [pages, setPages] = useState<PageState[]>([]);

  // The grid is derived from the previews, then owned by the user's edits.
  useEffect(() => setPages(asPageStates(thumbnails.pages)), [thumbnails.pages]);

  const isRunning = run.state === 'running';
  const kept = pages.filter((page) => !page.removed);
  const removedCount = pages.length - kept.length;
  const reordered = kept.some((page, index) => page.pageNumber !== index + 1);
  const touched = removedCount > 0 || reordered;

  if (run.state === 'done' && run.result) {
    return <ResultPanel manifest={manifest} result={run.result} onReset={run.reset} />;
  }

  return (
    <div className="space-y-4">
      <Dropzone
        manifest={manifest}
        compact={run.files.length > 0}
        disabled={isRunning}
        onAccept={run.addFiles}
        onReject={run.reportNotices}
      />

      {run.notices.length > 0 && (
        <ErrorState
          error={{ code: 'UNSUPPORTED_TYPE', message: run.notices.join(' ') }}
          onDismiss={run.dismissNotices}
        />
      )}

      <FileList files={run.files} onRemove={run.removeFile} disabled={isRunning} />

      {run.error && <ErrorState error={run.error.toPayload()} onDismiss={run.dismissError} />}
      {thumbnails.error && <ErrorState error={thumbnails.error} />}

      {thumbnails.loading && <Progress value={thumbnails.progress} label="Drawing the pages…" />}

      {pages.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-fg-muted text-sm">
              {kept.length} {kept.length === 1 ? 'page' : 'pages'} kept
              {removedCount > 0 && `, ${removedCount} removed`}
            </p>

            <Button
              variant="ghost"
              size="sm"
              disabled={!touched || isRunning}
              onClick={() => setPages(asPageStates(thumbnails.pages))}
            >
              <Undo2 />
              Reset order
            </Button>
          </div>

          <p className="text-fg-subtle text-xs">
            Drag a page to move it, or use the arrows. Removed pages can be brought back.
          </p>

          <PageGrid pages={pages} onChange={setPages} disabled={isRunning} />
        </>
      )}

      {isRunning && <Progress value={run.progress} label={run.progressLabel} />}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="sm:flex-1"
          disabled={kept.length === 0 || !touched || isRunning}
          onClick={() => void run.run({ order: kept.map((page) => page.pageNumber) })}
        >
          {isRunning ? <Loader2 className="animate-spin" /> : <LayoutGrid />}
          {isRunning
            ? 'Rebuilding…'
            : touched
              ? `Save ${kept.length} ${kept.length === 1 ? 'page' : 'pages'}`
              : 'Move or remove a page first'}
        </Button>

        {isRunning && (
          <Button variant="secondary" size="lg" onClick={run.cancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
