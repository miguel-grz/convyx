import { useState } from 'react';
import { Loader2, Scissors } from 'lucide-react';
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
import handler, { type SplitOptions } from './handler';
import type { SplitMode } from './split';

const MODES: Array<{ id: SplitMode; label: string; help: string }> = [
  { id: 'ranges', label: 'By range', help: 'One file per range you write.' },
  { id: 'every-page', label: 'Every page', help: 'One file per page in the document.' },
];

export default function SplitPdfTool({ manifest }: ToolComponentProps) {
  const [mode, setMode] = useState<SplitMode>('ranges');
  const [ranges, setRanges] = useState('');
  const run = useToolRun<SplitOptions>(manifest, handler);

  const file = run.files[0];
  const { pageCount, loading } = usePageCount(file);

  const isRunning = run.state === 'running';
  const ready = Boolean(file) && (mode === 'every-page' || ranges.trim().length > 0);

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
            <legend className="text-fg-muted mb-2 text-sm font-medium">How to split</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODES.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-150',
                    mode === option.id
                      ? 'border-brand bg-brand-soft'
                      : 'border-line hover:border-line-strong',
                  )}
                >
                  <input
                    type="radio"
                    name="split-mode"
                    value={option.id}
                    checked={mode === option.id}
                    onChange={() => setMode(option.id)}
                    className="accent-brand mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="text-fg-subtle block text-xs">{option.help}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {mode === 'ranges' && (
            <PageRangeField
              label="Ranges"
              value={ranges}
              onChange={setRanges}
              pageCount={pageCount}
              loading={loading}
              disabled={isRunning}
            />
          )}

          {mode === 'every-page' && pageCount !== null && (
            <p className="text-fg-subtle text-xs">
              You will get {pageCount} {pageCount === 1 ? 'file' : 'files'}, bundled in a zip.
            </p>
          )}
        </>
      )}

      {isRunning && <Progress value={run.progress} label={run.progressLabel} />}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="sm:flex-1"
          disabled={!ready || isRunning}
          onClick={() => void run.run({ mode, ranges })}
        >
          {isRunning ? <Loader2 className="animate-spin" /> : <Scissors />}
          {isRunning ? 'Splitting…' : 'Split PDF'}
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
