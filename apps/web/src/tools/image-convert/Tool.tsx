import { useEffect, useState } from 'react';
import { Loader2, Repeat } from 'lucide-react';
import type { ToolComponentProps } from '@convyx/tool-contract';
import { useToolRun } from '@/hooks/useToolRun';
import { cn } from '@/lib/cn';
import { FORMAT_LABEL, RASTER_FORMATS, isLossy, type RasterFormat } from '@/lib/image/formats';
import { canEncode } from '@/lib/image/raster';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dropzone } from '@/components/file/Dropzone';
import { FileList } from '@/components/file/FileList';
import { ResultPanel } from '@/components/file/ResultPanel';
import { ErrorState } from '@/components/feedback/ErrorState';
import handler, { type ConvertOptions } from './handler';

const HELP: Record<RasterFormat, string> = {
  png: 'Lossless, keeps transparency.',
  jpg: 'Small photos, no transparency.',
  webp: 'Smaller than JPG, same quality.',
  avif: 'Smallest files, newest format.',
};

export default function ImageConvertTool({ manifest }: ToolComponentProps) {
  const [format, setFormat] = useState<RasterFormat>('webp');
  const [quality, setQuality] = useState(82);
  const run = useToolRun<ConvertOptions>(manifest, handler);

  // AVIF is the one format a browser may not be able to write. Asking up front
  // means the option is greyed out with a reason, rather than failing at the end
  // of a long run — or worse, coming back as a PNG that claims to be an AVIF.
  const [avifWritable, setAvifWritable] = useState(true);

  useEffect(() => {
    let current = true;
    void canEncode('avif').then((supported) => {
      if (current) setAvifWritable(supported);
    });
    return () => {
      current = false;
    };
  }, []);

  const isRunning = run.state === 'running';
  const inputBytes = run.files.reduce((sum, file) => sum + file.size, 0);

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

      {/* Order carries no meaning here, so it is not offered. */}
      <FileList files={run.files} onRemove={run.removeFile} disabled={isRunning} />

      {run.error && <ErrorState error={run.error.toPayload()} onDismiss={run.dismissError} />}

      {run.files.length > 0 && (
        <>
          <fieldset disabled={isRunning}>
            <legend className="text-fg-muted mb-2 text-sm font-medium">Convert to</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {RASTER_FORMATS.map((option) => {
                const unavailable = option === 'avif' && !avifWritable;

                return (
                  <label
                    key={option}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 transition-colors duration-150',
                      unavailable ? 'border-line cursor-not-allowed opacity-55' : 'cursor-pointer',
                      !unavailable && format === option
                        ? 'border-brand bg-brand-soft'
                        : !unavailable && 'border-line hover:border-line-strong',
                    )}
                  >
                    <input
                      type="radio"
                      name="format"
                      checked={format === option}
                      disabled={unavailable}
                      onChange={() => setFormat(option)}
                      className="accent-brand mt-0.5"
                    />
                    <span>
                      <span className="block text-sm font-medium">{FORMAT_LABEL[option]}</span>
                      <span className="text-fg-subtle block text-xs">
                        {unavailable ? 'This browser cannot write AVIF.' : HELP[option]}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* PNG is lossless: a quality control would imply a choice that is
              not there. */}
          {isLossy(format) && (
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="quality">Quality</Label>
                <span className="text-fg-subtle text-xs tabular-nums">{quality}%</span>
              </div>
              <input
                id="quality"
                type="range"
                min={40}
                max={100}
                step={2}
                value={quality}
                disabled={isRunning}
                onChange={(event) => setQuality(Number(event.target.value))}
                className="accent-brand h-10 w-full"
              />
              <p className="text-fg-subtle text-xs">
                Lower quality makes smaller files. Above 90 the difference is hard to see.
              </p>
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
          onClick={() => void run.run({ format, quality: quality / 100 })}
        >
          {isRunning ? <Loader2 className="animate-spin" /> : <Repeat />}
          {isRunning
            ? 'Converting…'
            : `Convert ${run.files.length} ${run.files.length === 1 ? 'image' : 'images'} to ${FORMAT_LABEL[format]}`}
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
