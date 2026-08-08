import { useCallback, useEffect, useRef, useState } from 'react';
import { Crop, Loader2, Maximize } from 'lucide-react';
import type { ToolComponentProps } from '@convyx/tool-contract';
import { useToolRun } from '@/hooks/useToolRun';
import { cn } from '@/lib/cn';
import { decodeImage } from '@/lib/image/raster';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dropzone } from '@/components/file/Dropzone';
import { FileList } from '@/components/file/FileList';
import { ResultPanel } from '@/components/file/ResultPanel';
import { ErrorState } from '@/components/feedback/ErrorState';
import handler, { type CropOptions } from './handler';
import { dragRect, fitRect, wholeImage, type Dimensions, type Handle, type Rect } from './crop';

/** Tall enough to work with, short enough that the controls stay on screen. */
const MAX_PREVIEW_HEIGHT = 420;

const RATIOS: Array<{ label: string; value: number | null }> = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
];

/** The eight grips, with where each sits on the selection and how it reads. */
const HANDLES: Array<{ id: Handle; position: string; cursor: string }> = [
  { id: 'nw', position: 'left-0 top-0', cursor: 'cursor-nwse-resize' },
  { id: 'n', position: 'left-1/2 top-0', cursor: 'cursor-ns-resize' },
  { id: 'ne', position: 'left-full top-0', cursor: 'cursor-nesw-resize' },
  { id: 'e', position: 'left-full top-1/2', cursor: 'cursor-ew-resize' },
  { id: 'se', position: 'left-full top-full', cursor: 'cursor-nwse-resize' },
  { id: 's', position: 'left-1/2 top-full', cursor: 'cursor-ns-resize' },
  { id: 'sw', position: 'left-0 top-full', cursor: 'cursor-nesw-resize' },
  { id: 'w', position: 'left-0 top-1/2', cursor: 'cursor-ew-resize' },
];

interface Drag {
  handle: Handle;
  rect: Rect;
  x: number;
  y: number;
}

export default function ImageCropTool({ manifest }: ToolComponentProps) {
  const run = useToolRun<CropOptions>(manifest, handler);
  const file = run.files[0] ?? null;

  const [url, setUrl] = useState<string | null>(null);
  const [source, setSource] = useState<Dimensions | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [ratio, setRatio] = useState<number | null>(null);
  const [available, setAvailable] = useState(0);

  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  const isRunning = run.state === 'running';

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // The selection is in source pixels, so the real size has to be read before
  // anything can be selected.
  useEffect(() => {
    if (!file) {
      setSource(null);
      setRect(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const bitmap = await decodeImage(await file.arrayBuffer(), file.name, file.type);
        const size = { width: bitmap.width, height: bitmap.height };
        bitmap.close();

        if (!cancelled) {
          setSource(size);
          setRect(wholeImage(size, ratio));
        }
      } catch {
        // Naming a file that cannot be opened is the run's job, not the preview's.
        if (!cancelled) setSource(null);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Only the file belongs here. The ratio is read once, to shape the opening
    // selection; changing it later reshapes what is already there rather than
    // decoding the image again.
  }, [file]);

  // The preview scales to whatever width it is given, so the drag has to know
  // the current one to turn pointer movement into source pixels.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setAvailable(entry.contentRect.width);
    });

    observer.observe(frame);
    return () => observer.disconnect();
  }, [url]);

  const scale =
    source && available > 0
      ? Math.min(available / source.width, MAX_PREVIEW_HEIGHT / source.height, 1)
      : 0;

  const chooseRatio = (value: number | null) => {
    setRatio(value);
    if (source && rect) setRect(fitRect(rect, source, value));
  };

  const onPointerDown = (handle: Handle) => (event: React.PointerEvent) => {
    if (!rect || isRunning) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { handle, rect, x: event.clientX, y: event.clientY };
  };

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || !source || scale === 0) return;

      setRect(
        dragRect(
          drag.rect,
          drag.handle,
          (event.clientX - drag.x) / scale,
          (event.clientY - drag.y) / scale,
          source,
          ratio,
        ),
      );
    },
    [ratio, scale, source],
  );

  const endDrag = () => {
    dragRef.current = null;
  };

  /** Typing in a field is the path that works without a pointer. */
  const edit = (key: keyof Rect) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!source || !rect) return;

    const value = Number(event.target.value);
    if (!Number.isFinite(value)) return;

    setRect(fitRect({ ...rect, [key]: value }, source, ratio));
  };

  if (run.state === 'done' && run.result) {
    return (
      <ResultPanel
        manifest={manifest}
        result={run.result}
        inputBytes={file?.size}
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

      <FileList files={run.files} onRemove={run.removeFile} disabled={isRunning} />

      {run.error && <ErrorState error={run.error.toPayload()} onDismiss={run.dismissError} />}

      {file && (
        <>
          <div ref={frameRef} className="bg-bg-inset border-line rounded-xl border p-3">
            {url && source && rect && scale > 0 ? (
              <div
                className="relative mx-auto touch-none overflow-hidden select-none"
                style={{ width: source.width * scale, height: source.height * scale }}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <img
                  src={url}
                  alt={`Preview of ${file.name}`}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  draggable={false}
                />

                {/* Pointer-only, and deliberately hidden from assistive
                    technology: the number fields below do the same job in a
                    form that works without a pointer at all. */}
                <div
                  aria-hidden
                  className="border-brand absolute border-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                  style={{
                    left: rect.x * scale,
                    top: rect.y * scale,
                    width: rect.width * scale,
                    height: rect.height * scale,
                  }}
                >
                  <div
                    className={cn('absolute inset-0', isRunning ? 'cursor-wait' : 'cursor-move')}
                    onPointerDown={onPointerDown('move')}
                  />

                  {HANDLES.map((handle) => (
                    <div
                      key={handle.id}
                      onPointerDown={onPointerDown(handle.id)}
                      className={cn(
                        'border-brand bg-bg-panel absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2',
                        handle.position,
                        !isRunning && handle.cursor,
                      )}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-fg-subtle flex h-44 items-center justify-center text-sm">
                {source === null && url ? 'This image could not be opened.' : 'Opening…'}
              </div>
            )}
          </div>

          <fieldset disabled={isRunning}>
            <legend className="text-fg-muted mb-2 text-sm font-medium">Aspect ratio</legend>
            <div className="flex flex-wrap gap-2">
              {RATIOS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => chooseRatio(option.value)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm transition-colors duration-150',
                    ratio === option.value
                      ? 'border-brand bg-brand-soft font-medium'
                      : 'border-line hover:border-line-strong',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          {rect && source && (
            <fieldset disabled={isRunning} className="space-y-3">
              <legend className="text-fg-muted mb-2 text-sm font-medium">Selection</legend>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="crop-x">Left</Label>
                  <Input id="crop-x" type="number" value={rect.x} onChange={edit('x')} min={0} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crop-y">Top</Label>
                  <Input id="crop-y" type="number" value={rect.y} onChange={edit('y')} min={0} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crop-w">Width</Label>
                  <Input
                    id="crop-w"
                    type="number"
                    value={rect.width}
                    onChange={edit('width')}
                    min={1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crop-h">Height</Label>
                  <Input
                    id="crop-h"
                    type="number"
                    value={rect.height}
                    onChange={edit('height')}
                    min={1}
                    // A locked ratio decides this one, so editing it would only
                    // fight the field next to it.
                    disabled={ratio !== null || isRunning}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-fg-subtle text-xs tabular-nums">
                  {source.width} × {source.height} → {rect.width} × {rect.height}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRect(wholeImage(source, ratio))}
                >
                  <Maximize />
                  Whole image
                </Button>
              </div>
            </fieldset>
          )}
        </>
      )}

      {isRunning && <Progress value={run.progress} label={run.progressLabel} />}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="sm:flex-1"
          disabled={!file || !rect || isRunning}
          onClick={() => rect && void run.run({ rect })}
        >
          {isRunning ? <Loader2 className="animate-spin" /> : <Crop />}
          {isRunning ? 'Cropping…' : 'Crop image'}
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
