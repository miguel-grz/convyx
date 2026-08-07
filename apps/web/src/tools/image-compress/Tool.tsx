import { useEffect, useRef, useState } from 'react';
import { Loader2, Minimize2 } from 'lucide-react';
import type { ToolComponentProps } from '@convyx/tool-contract';
import { useToolRun } from '@/hooks/useToolRun';
import { cn } from '@/lib/cn';
import { formatBytes, sizeDelta, truncateFilename } from '@/lib/format';
import { FORMAT_MIME, formatOf, type RasterFormat } from '@/lib/image/formats';
import { canEncode, decodeImage, encodeImage } from '@/lib/image/raster';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dropzone } from '@/components/file/Dropzone';
import { FileList } from '@/components/file/FileList';
import { ResultPanel } from '@/components/file/ResultPanel';
import { ErrorState } from '@/components/feedback/ErrorState';
import handler, { type CompressOptions } from './handler';

/** `null` keeps each image in the format it already is. */
const TARGETS: Array<{ id: 'keep' | 'webp'; label: string; help: string }> = [
  { id: 'keep', label: 'Keep each format', help: 'JPG stays JPG, PNG stays PNG.' },
  { id: 'webp', label: 'Switch to WEBP', help: 'Usually much smaller, especially for PNG.' },
];

interface Preview {
  url: string;
  bytes: number;
  /** The re-encoded copy was no smaller, so this image would come back as it is. */
  kept: boolean;
}

export default function ImageCompressTool({ manifest }: ToolComponentProps) {
  const [target, setTarget] = useState<'keep' | 'webp'>('keep');
  const [quality, setQuality] = useState(70);
  const run = useToolRun<CompressOptions>(manifest, handler);

  const format: RasterFormat | null = target === 'webp' ? 'webp' : null;
  const isRunning = run.state === 'running';
  const file = run.files[0] ?? null;
  const inputBytes = run.files.reduce((sum, item) => sum + item.size, 0);

  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const previewUrl = useRef<string | null>(null);

  const replacePreview = (next: Preview | null) => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = next?.url ?? null;
    setPreview(next);
  };

  useEffect(() => () => replacePreview(null), []);

  useEffect(() => {
    if (!file) {
      setOriginalUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // The preview is the whole point of a quality slider: a number means nothing
  // until you can see what it costs. It encodes at full size rather than at
  // display size, because the size it reports has to be the size you will get.
  useEffect(() => {
    if (!file) {
      replacePreview(null);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(() => {
      void (async () => {
        setPreviewing(true);

        try {
          const encodeAs = format ?? formatOf(file.name, file.type);
          if (!encodeAs || !(await canEncode(encodeAs))) {
            if (!cancelled) replacePreview(null);
            return;
          }

          const bitmap = await decodeImage(await file.arrayBuffer(), file.name, file.type);
          let bytes: Uint8Array<ArrayBuffer>;

          try {
            bytes = await encodeImage(bitmap, { format: encodeAs, quality: quality / 100 });
          } finally {
            bitmap.close();
          }

          if (cancelled) return;

          const blob = new Blob([bytes], { type: FORMAT_MIME[encodeAs] });
          replacePreview({
            url: URL.createObjectURL(blob),
            bytes: blob.size,
            kept: blob.size >= file.size,
          });
        } catch {
          // A file the browser cannot open is the run's problem to report, with
          // the name of the file. The preview just stays empty.
          if (!cancelled) replacePreview(null);
        } finally {
          if (!cancelled) setPreviewing(false);
        }
      })();
      // Long enough that dragging the slider does not queue an encode per pixel.
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [file, format, quality]);

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

  const saved = preview && file ? sizeDelta(file.size, preview.bytes) : null;

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
            <legend className="text-fg-muted mb-2 text-sm font-medium">Format</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {TARGETS.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-150',
                    target === option.id
                      ? 'border-brand bg-brand-soft'
                      : 'border-line hover:border-line-strong',
                  )}
                >
                  <input
                    type="radio"
                    name="target"
                    checked={target === option.id}
                    onChange={() => setTarget(option.id)}
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

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="quality">Quality</Label>
              <span className="text-fg-subtle text-xs tabular-nums">{quality}%</span>
            </div>
            <input
              id="quality"
              type="range"
              min={30}
              max={95}
              step={5}
              value={quality}
              disabled={isRunning}
              onChange={(event) => setQuality(Number(event.target.value))}
              className="accent-brand h-10 w-full"
            />
          </div>

          <div>
            <div className="text-fg-muted mb-2 flex items-baseline justify-between text-sm">
              <span>Before and after</span>
              {run.files.length > 1 && (
                <span className="text-fg-subtle text-xs">{truncateFilename(file.name, 28)}</span>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <figure className="border-line overflow-hidden rounded-lg border">
                <div className="bg-bg-inset flex h-44 items-center justify-center">
                  {originalUrl && (
                    <img
                      src={originalUrl}
                      alt=""
                      className="max-h-44 max-w-full object-contain"
                      draggable={false}
                    />
                  )}
                </div>
                <figcaption className="border-line flex items-baseline justify-between border-t px-3 py-2 text-xs">
                  <span className="text-fg-muted">Original</span>
                  <span className="tabular-nums">{formatBytes(file.size)}</span>
                </figcaption>
              </figure>

              <figure className="border-line overflow-hidden rounded-lg border">
                <div className="bg-bg-inset flex h-44 items-center justify-center">
                  {preview ? (
                    <img
                      src={preview.url}
                      alt=""
                      className="max-h-44 max-w-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-fg-subtle flex items-center gap-2 text-xs">
                      {previewing && <Loader2 className="size-3.5 animate-spin" />}
                      {previewing ? 'Compressing a copy…' : 'No preview for this image.'}
                    </span>
                  )}
                </div>
                <figcaption className="border-line flex items-baseline justify-between border-t px-3 py-2 text-xs">
                  <span className="text-fg-muted">At {quality}% quality</span>
                  {preview && (
                    <span className="tabular-nums">
                      {preview.kept ? (
                        <span className="text-fg-subtle">already smallest</span>
                      ) : (
                        <>
                          {formatBytes(preview.bytes)}
                          {saved !== null && saved < 0 && (
                            <span className="text-ok font-medium"> ({Math.abs(saved)}% off)</span>
                          )}
                        </>
                      )}
                    </span>
                  )}
                </figcaption>
              </figure>
            </div>

            <p className="text-fg-subtle mt-2 text-xs">
              {preview?.kept
                ? 'Compressing this one would make it bigger, so it comes back unchanged.'
                : 'Nothing is ever handed back larger than it went in.'}
            </p>
          </div>
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
          {isRunning ? <Loader2 className="animate-spin" /> : <Minimize2 />}
          {isRunning
            ? 'Compressing…'
            : `Compress ${run.files.length} ${run.files.length === 1 ? 'image' : 'images'}`}
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
