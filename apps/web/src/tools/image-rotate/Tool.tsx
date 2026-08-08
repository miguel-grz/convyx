import { useEffect, useRef, useState } from 'react';
import { FlipHorizontal, FlipVertical, Loader2, RotateCcw, RotateCw, Undo2 } from 'lucide-react';
import type { ToolComponentProps } from '@convyx/tool-contract';
import { useToolRun } from '@/hooks/useToolRun';
import { truncateFilename } from '@/lib/format';
import { decodeImage } from '@/lib/image/raster';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dropzone } from '@/components/file/Dropzone';
import { FileList } from '@/components/file/FileList';
import { ResultPanel } from '@/components/file/ResultPanel';
import { ErrorState } from '@/components/feedback/ErrorState';
import handler, { type RotateOptions } from './handler';
import {
  flip,
  isUpright,
  orientedSize,
  previewTransform,
  turn,
  UPRIGHT,
  type Orientation,
} from './rotate';

const PREVIEW_HEIGHT = 260;

export default function ImageRotateTool({ manifest }: ToolComponentProps) {
  const run = useToolRun<RotateOptions>(manifest, handler);
  const file = run.files[0] ?? null;

  const [orientation, setOrientation] = useState<Orientation>(UPRIGHT);
  const [url, setUrl] = useState<string | null>(null);
  const [source, setSource] = useState<{ width: number; height: number } | null>(null);
  const [available, setAvailable] = useState(0);

  const frameRef = useRef<HTMLDivElement>(null);
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

  // The preview needs the real size to reserve the right box: a quarter turn
  // makes a wide image tall, and a transform does not move the layout with it.
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
        // Naming a file that cannot be opened is the run's job.
        if (!cancelled) setSource(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setAvailable(entry.contentRect.width);
    });

    observer.observe(frame);
    return () => observer.disconnect();
  }, [url]);

  if (run.state === 'done' && run.result) {
    return (
      <ResultPanel
        manifest={manifest}
        result={run.result}
        inputBytes={run.files.reduce((sum, item) => sum + item.size, 0)}
        onReset={() => {
          setOrientation(UPRIGHT);
          run.reset();
        }}
      />
    );
  }

  const oriented = source ? orientedSize(source, orientation) : null;
  const scale =
    source && oriented && available > 0
      ? Math.min(available / oriented.width, PREVIEW_HEIGHT / oriented.height, 1)
      : 0;

  const actions = [
    { label: 'Rotate left', icon: RotateCcw, apply: () => setOrientation(turn(orientation, -90)) },
    { label: 'Rotate right', icon: RotateCw, apply: () => setOrientation(turn(orientation, 90)) },
    {
      label: 'Flip across',
      icon: FlipHorizontal,
      apply: () => setOrientation(flip(orientation, 'horizontal')),
    },
    {
      label: 'Flip down',
      icon: FlipVertical,
      apply: () => setOrientation(flip(orientation, 'vertical')),
    },
  ];

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
          <div
            ref={frameRef}
            className="bg-bg-inset border-line flex items-center justify-center rounded-xl border p-3"
            style={{ minHeight: PREVIEW_HEIGHT + 24 }}
          >
            {url && source && oriented && scale > 0 ? (
              // The preview is the source image under a CSS transform. Turning
              // is instant and exact, so re-encoding one to look at would only
              // add a wait to a decision that is already made by eye.
              <div
                className="relative flex items-center justify-center"
                style={{ width: oriented.width * scale, height: oriented.height * scale }}
              >
                <img
                  src={url}
                  alt={`Preview of ${file.name}`}
                  draggable={false}
                  className="max-w-none transition-transform duration-200"
                  style={{
                    width: source.width * scale,
                    height: source.height * scale,
                    transform: previewTransform(orientation),
                  }}
                />
              </div>
            ) : (
              <span className="text-fg-subtle text-sm">
                {source === null && url ? 'This image could not be opened.' : 'Opening…'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant="secondary"
                disabled={isRunning}
                onClick={action.apply}
              >
                <action.icon />
                {action.label}
              </Button>
            ))}

            <Button
              variant="ghost"
              disabled={isRunning || isUpright(orientation)}
              onClick={() => setOrientation(UPRIGHT)}
            >
              <Undo2 />
              Reset
            </Button>
          </div>

          {source && oriented && (
            <p className="text-fg-subtle text-xs tabular-nums">
              {run.files.length > 1 && (
                <span className="mr-1.5">{truncateFilename(file.name, 24)}</span>
              )}
              {source.width} × {source.height}
              {oriented.width !== source.width && (
                <> → {`${oriented.width} × ${oriented.height}`}</>
              )}
              {run.files.length > 1 && (
                <span className="ml-1.5">
                  · the same turn goes to all {run.files.length} images.
                </span>
              )}
            </p>
          )}
        </>
      )}

      {isRunning && <Progress value={run.progress} label={run.progressLabel} />}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="sm:flex-1"
          disabled={run.files.length === 0 || isRunning || isUpright(orientation)}
          onClick={() => void run.run({ orientation })}
        >
          {isRunning ? <Loader2 className="animate-spin" /> : <RotateCw />}
          {isRunning
            ? 'Turning…'
            : isUpright(orientation)
              ? 'Choose a turn or a flip'
              : `Apply to ${run.files.length} ${run.files.length === 1 ? 'image' : 'images'}`}
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
