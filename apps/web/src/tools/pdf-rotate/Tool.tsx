import { useState } from 'react';
import { Loader2, RotateCw } from 'lucide-react';
import type { ToolComponentProps } from '@convyx/tool-contract';
import { useToolRun } from '@/hooks/useToolRun';
import { usePageCount } from '@/hooks/usePageCount';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dropzone } from '@/components/file/Dropzone';
import { FileList } from '@/components/file/FileList';
import { PageRangeField } from '@/components/file/PageRangeField';
import { ResultPanel } from '@/components/file/ResultPanel';
import { ErrorState } from '@/components/feedback/ErrorState';
import handler, { type RotateOptions } from './handler';
import type { RotationAngle } from './rotate';

const ANGLES: Array<{ value: RotationAngle; label: string }> = [
  { value: 90, label: '90° right' },
  { value: 180, label: 'Upside down' },
  { value: 270, label: '90° left' },
];

export default function RotatePdfTool({ manifest }: ToolComponentProps) {
  const [angle, setAngle] = useState<RotationAngle>(90);
  const [pages, setPages] = useState('');
  const [allPages, setAllPages] = useState(true);
  const run = useToolRun<RotateOptions>(manifest, handler);

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
            <legend className="text-fg-muted mb-2 text-sm font-medium">Turn the pages</legend>
            <div className="grid grid-cols-3 gap-2">
              {ANGLES.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors duration-150',
                    angle === option.value
                      ? 'border-brand bg-brand-soft'
                      : 'border-line hover:border-line-strong',
                  )}
                >
                  <input
                    type="radio"
                    name="angle"
                    value={option.value}
                    checked={angle === option.value}
                    onChange={() => setAngle(option.value)}
                    className="sr-only"
                  />
                  <RotateCw
                    aria-hidden
                    className={cn(
                      'size-5 transition-transform duration-300',
                      angle === option.value ? 'text-brand' : 'text-fg-subtle',
                      option.value === 180 && 'rotate-180',
                      option.value === 270 && '-scale-x-100',
                    )}
                  />
                  <span className="text-xs font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={allPages}
              disabled={isRunning}
              onChange={(event) => setAllPages(event.target.checked)}
              className="accent-brand size-4"
            />
            Turn every page
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
          onClick={() => void run.run({ angle, pages: allPages ? '' : pages })}
        >
          {isRunning ? <Loader2 className="animate-spin" /> : <RotateCw />}
          {isRunning ? 'Turning…' : 'Rotate PDF'}
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
