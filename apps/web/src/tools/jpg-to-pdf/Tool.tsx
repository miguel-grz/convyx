import { useState } from 'react';
import { FileImage, Loader2 } from 'lucide-react';
import type { ToolComponentProps } from '@convyx/tool-contract';
import { useToolRun } from '@/hooks/useToolRun';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dropzone } from '@/components/file/Dropzone';
import { FileList } from '@/components/file/FileList';
import { ResultPanel } from '@/components/file/ResultPanel';
import { ErrorState } from '@/components/feedback/ErrorState';
import handler, { type BuildOptions } from './handler';
import type { Orientation, PageSize } from './build';

const SIZES: Array<{ id: PageSize; label: string; help: string }> = [
  { id: 'fit', label: 'Fit the image', help: 'Each page matches its image exactly.' },
  { id: 'a4', label: 'A4', help: '210 × 297 mm' },
  { id: 'letter', label: 'Letter', help: '8.5 × 11 in' },
];

const ORIENTATIONS: Array<{ id: Orientation; label: string }> = [
  { id: 'auto', label: 'Match each image' },
  { id: 'portrait', label: 'Portrait' },
  { id: 'landscape', label: 'Landscape' },
];

export default function JpgToPdfTool({ manifest }: ToolComponentProps) {
  const [size, setSize] = useState<PageSize>('fit');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [margin, setMargin] = useState(24);
  const run = useToolRun<BuildOptions>(manifest, handler);

  const isRunning = run.state === 'running';

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

      {/* Order is the page order, so reordering has to be available. */}
      <FileList
        files={run.files}
        onRemove={run.removeFile}
        onMove={run.moveFile}
        disabled={isRunning}
      />

      {run.error && <ErrorState error={run.error.toPayload()} onDismiss={run.dismissError} />}

      {run.files.length > 0 && (
        <>
          <fieldset disabled={isRunning}>
            <legend className="text-fg-muted mb-2 text-sm font-medium">Page size</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {SIZES.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-150',
                    size === option.id
                      ? 'border-brand bg-brand-soft'
                      : 'border-line hover:border-line-strong',
                  )}
                >
                  <input
                    type="radio"
                    name="size"
                    checked={size === option.id}
                    onChange={() => setSize(option.id)}
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

          {/* Fitting the page to the image leaves nothing for these to control. */}
          {size !== 'fit' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="orientation">Orientation</Label>
                <select
                  id="orientation"
                  value={orientation}
                  disabled={isRunning}
                  onChange={(event) => setOrientation(event.target.value as Orientation)}
                  className="border-line-strong bg-bg-panel focus:border-brand h-10 w-full rounded-lg border px-3 text-sm"
                >
                  {ORIENTATIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor="margin">Margin</Label>
                  <span className="text-fg-subtle text-xs tabular-nums">{margin} pt</span>
                </div>
                <input
                  id="margin"
                  type="range"
                  min={0}
                  max={72}
                  step={4}
                  value={margin}
                  disabled={isRunning}
                  onChange={(event) => setMargin(Number(event.target.value))}
                  className="accent-brand h-10 w-full"
                />
              </div>
            </div>
          )}
        </>
      )}

      {isRunning && <Progress value={run.progress} label={run.progressLabel} />}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="sm:flex-1"
          disabled={run.files.length === 0 || isRunning}
          onClick={() => void run.run({ size, orientation, margin })}
        >
          {isRunning ? <Loader2 className="animate-spin" /> : <FileImage />}
          {isRunning
            ? 'Building…'
            : `Make a PDF from ${run.files.length} ${run.files.length === 1 ? 'image' : 'images'}`}
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
