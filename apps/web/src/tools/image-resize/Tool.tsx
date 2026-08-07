import { useEffect, useState } from 'react';
import { Loader2, Scaling } from 'lucide-react';
import type { ToolComponentProps } from '@convyx/tool-contract';
import { useToolRun } from '@/hooks/useToolRun';
import { cn } from '@/lib/cn';
import { truncateFilename } from '@/lib/format';
import { decodeImage } from '@/lib/image/raster';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dropzone } from '@/components/file/Dropzone';
import { FileList } from '@/components/file/FileList';
import { ResultPanel } from '@/components/file/ResultPanel';
import { ErrorState } from '@/components/feedback/ErrorState';
import handler, { type ResizeOptions } from './handler';
import { targetSize, type Dimensions, type ResizeSpec } from './resize';

const MODES: Array<{ id: 'percent' | 'pixels'; label: string; help: string }> = [
  { id: 'percent', label: 'By percentage', help: 'Every image shrinks by the same share.' },
  { id: 'pixels', label: 'By pixels', help: 'Give a width, a height, or both.' },
];

/** An empty or nonsensical field is no constraint, not a zero. */
function toDimension(value: string): number | null {
  const parsed = Number(value);
  return value.trim() !== '' && Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

export default function ImageResizeTool({ manifest }: ToolComponentProps) {
  const [mode, setMode] = useState<'percent' | 'pixels'>('percent');
  const [percent, setPercent] = useState(50);
  const [width, setWidth] = useState('1200');
  const [height, setHeight] = useState('');
  const [keepAspect, setKeepAspect] = useState(true);
  const run = useToolRun<ResizeOptions>(manifest, handler);

  const isRunning = run.state === 'running';
  const file = run.files[0] ?? null;
  const inputBytes = run.files.reduce((sum, item) => sum + item.size, 0);

  const spec: ResizeSpec =
    mode === 'percent'
      ? { mode: 'percent', percent }
      : {
          mode: 'pixels',
          width: toDimension(width),
          height: toDimension(height),
          keepAspect,
        };

  const unset = spec.mode === 'pixels' && spec.width === null && spec.height === null;

  // The size of the first image, so the controls can show what they will do
  // rather than leaving people to work it out from a percentage.
  const [source, setSource] = useState<Dimensions | null>(null);

  useEffect(() => {
    if (!file) {
      setSource(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const bitmap = await decodeImage(await file.arrayBuffer(), file.name, file.type);
        if (!cancelled) setSource({ width: bitmap.width, height: bitmap.height });
        bitmap.close();
      } catch {
        // A file that cannot be opened is the run's problem to name.
        if (!cancelled) setSource(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file]);

  if (run.state === 'done' && run.result) {
    return (
      <ResultPanel
        manifest={manifest}
        result={run.result}
        inputBytes={inputBytes}
        onReset={run.reset}
      />
    );
  }

  const result = source && !unset ? targetSize(source, spec) : null;

  // The line under the preview talks about every file except the one being
  // measured, so it is singular exactly when there are two.
  const rest = run.files.length - 1;
  const alone = rest === 1;
  const others = alone ? 'The other one scales' : `The other ${rest} scale`;
  const othersFit = alone ? 'The other one fits' : `The other ${rest} fit`;
  const othersSet = alone ? 'The other one is set' : `The other ${rest} are set`;
  const theirOwn = alone ? 'its own' : 'their own';

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
            <legend className="text-fg-muted mb-2 text-sm font-medium">Resize</legend>
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
                    name="mode"
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

          {mode === 'percent' ? (
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="percent">Scale</Label>
                <span className="text-fg-subtle text-xs tabular-nums">{percent}%</span>
              </div>
              <input
                id="percent"
                type="range"
                min={5}
                max={100}
                step={5}
                value={percent}
                disabled={isRunning}
                onChange={(event) => setPercent(Number(event.target.value))}
                className="accent-brand h-10 w-full"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="Any"
                    value={width}
                    disabled={isRunning}
                    onChange={(event) => setWidth(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="Any"
                    value={height}
                    disabled={isRunning}
                    onChange={(event) => setHeight(event.target.value)}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={keepAspect}
                  disabled={isRunning}
                  onChange={(event) => setKeepAspect(event.target.checked)}
                  className="accent-brand size-4"
                />
                <span>
                  Keep proportions{' '}
                  <span className="text-fg-subtle text-xs">
                    {keepAspect
                      ? 'each image fits inside what you give, undistorted'
                      : 'images are stretched to the exact size'}
                  </span>
                </span>
              </label>
            </div>
          )}

          <div className="border-line bg-bg-inset rounded-lg border px-3 py-2.5 text-sm">
            {unset ? (
              <span className="text-fg-subtle">Give a width or a height to resize by pixels.</span>
            ) : (
              <>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-fg-subtle text-xs">{truncateFilename(file.name, 26)}</span>
                  {source && result ? (
                    <span className="tabular-nums">
                      {source.width} × {source.height}
                      <span className="text-fg-subtle mx-1.5">→</span>
                      <span className="font-medium">
                        {result.width} × {result.height}
                      </span>
                    </span>
                  ) : (
                    <span className="text-fg-subtle">measuring…</span>
                  )}
                </div>

                {run.files.length > 1 && (
                  <p className="text-fg-subtle mt-1 text-xs">
                    {spec.mode === 'percent'
                      ? `${others} to ${percent}% of ${theirOwn} size.`
                      : keepAspect
                        ? `${othersFit} inside the same box, keeping ${theirOwn} shape.`
                        : `${othersSet} to the same exact size.`}
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}

      {isRunning && <Progress value={run.progress} label={run.progressLabel} />}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="sm:flex-1"
          disabled={run.files.length === 0 || isRunning || unset}
          onClick={() => void run.run({ spec })}
        >
          {isRunning ? <Loader2 className="animate-spin" /> : <Scaling />}
          {isRunning
            ? 'Resizing…'
            : `Resize ${run.files.length} ${run.files.length === 1 ? 'image' : 'images'}`}
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
