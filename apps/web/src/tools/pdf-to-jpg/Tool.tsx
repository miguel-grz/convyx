import { useState } from 'react';
import { ImageDown, Loader2 } from 'lucide-react';
import type { ToolComponentProps } from '@convyx/tool-contract';
import { useToolRun } from '@/hooks/useToolRun';
import { usePageCount } from '@/hooks/usePageCount';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dropzone } from '@/components/file/Dropzone';
import { FileList } from '@/components/file/FileList';
import { PageRangeField } from '@/components/file/PageRangeField';
import { ResultPanel } from '@/components/file/ResultPanel';
import { ErrorState } from '@/components/feedback/ErrorState';
import handler, { type ConvertOptions } from './handler';
import type { ImageFormat } from './renderer';

/** Named for what the output is for, not for the multiplier behind it. */
const QUALITIES: Array<{ scale: number; label: string; help: string }> = [
  { scale: 1, label: 'Screen', help: 'Smallest files' },
  { scale: 2, label: 'Good', help: 'Sharp on any screen' },
  { scale: 3, label: 'Print', help: 'Largest files' },
];

export default function PdfToJpgTool({ manifest }: ToolComponentProps) {
  const [pages, setPages] = useState('');
  const [allPages, setAllPages] = useState(true);
  const [scale, setScale] = useState(2);
  const [format, setFormat] = useState<ImageFormat>('jpg');
  const run = useToolRun<ConvertOptions>(manifest, handler);

  const file = run.files[0];
  const { pageCount, loading } = usePageCount(file);

  const isRunning = run.state === 'running';
  const ready = Boolean(file) && (allPages || pages.trim().length > 0);

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

      {file && (
        <>
          <fieldset disabled={isRunning}>
            <legend className="text-fg-muted mb-2 text-sm font-medium">Image quality</legend>
            <div className="grid grid-cols-3 gap-2">
              {QUALITIES.map((option) => (
                <label
                  key={option.scale}
                  className={cn(
                    'flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 transition-colors duration-150',
                    scale === option.scale
                      ? 'border-brand bg-brand-soft'
                      : 'border-line hover:border-line-strong',
                  )}
                >
                  <input
                    type="radio"
                    name="scale"
                    checked={scale === option.scale}
                    onChange={() => setScale(option.scale)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-fg-subtle text-xs">{option.help}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="format">Format</Label>
            <select
              id="format"
              value={format}
              disabled={isRunning}
              onChange={(event) => setFormat(event.target.value as ImageFormat)}
              className="border-line-strong bg-bg-panel focus:border-brand h-10 w-full rounded-lg border px-3 text-sm"
            >
              <option value="jpg">JPG — smaller files</option>
              <option value="png">PNG — sharper text, larger files</option>
            </select>
          </div>

          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={allPages}
              disabled={isRunning}
              onChange={(event) => setAllPages(event.target.checked)}
              className="accent-brand size-4"
            />
            Convert every page
          </label>

          {!allPages && (
            <PageRangeField
              value={pages}
              onChange={setPages}
              pageCount={pageCount}
              loading={loading}
              disabled={isRunning}
            />
          )}
        </>
      )}

      {isRunning && <Progress value={run.progress} label={run.progressLabel} />}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="sm:flex-1"
          disabled={!ready || isRunning}
          onClick={() =>
            void run.run({
              pages: allPages ? '' : pages,
              scale,
              format,
              // JPEG takes a quality; PNG ignores it, being lossless.
              quality: 0.92,
            })
          }
        >
          {isRunning ? <Loader2 className="animate-spin" /> : <ImageDown />}
          {isRunning ? 'Rendering…' : `Convert to ${format.toUpperCase()}`}
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
