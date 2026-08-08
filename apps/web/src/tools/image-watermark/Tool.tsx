import { useEffect, useRef, useState } from 'react';
import { Droplet, ImagePlus, Loader2 } from 'lucide-react';
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
import handler, { type WatermarkOptions } from './handler';
import { renderMark, type MarkSpec } from './mark';
import { ANCHORS, placeMark, type Anchor } from './watermark';

const PREVIEW_HEIGHT = 300;

const ANCHOR_LABEL: Record<Anchor, string> = {
  'top-left': 'Top left',
  top: 'Top',
  'top-right': 'Top right',
  left: 'Left',
  center: 'Centre',
  right: 'Right',
  'bottom-left': 'Bottom left',
  bottom: 'Bottom',
  'bottom-right': 'Bottom right',
};

export default function ImageWatermarkTool({ manifest }: ToolComponentProps) {
  const run = useToolRun<WatermarkOptions>(manifest, handler);
  const file = run.files[0] ?? null;

  const [kind, setKind] = useState<'text' | 'logo'>('text');
  const [text, setText] = useState('© Convyx');
  const [colour, setColour] = useState<'white' | 'black'>('white');
  const [logo, setLogo] = useState<{ name: string; type: string; bytes: ArrayBuffer } | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [anchor, setAnchor] = useState<Anchor>('bottom-right');
  const [scale, setScale] = useState(22);
  const [margin, setMargin] = useState(4);
  const [opacity, setOpacity] = useState(60);

  const [base, setBase] = useState<ImageBitmap | null>(null);
  const [available, setAvailable] = useState(0);

  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isRunning = run.state === 'running';

  const mark: MarkSpec | null =
    kind === 'text'
      ? { kind: 'text', text, colour }
      : logo
        ? { kind: 'logo', name: logo.name, type: logo.type, bytes: logo.bytes }
        : null;

  const ready = kind === 'text' ? text.trim() !== '' : logo !== null;

  // Decoded once and kept, because the preview redraws on every slider move and
  // decoding a photo per frame would make the sliders feel broken.
  useEffect(() => {
    if (!file) {
      setBase(null);
      return;
    }

    let cancelled = false;
    let opened: ImageBitmap | null = null;

    void (async () => {
      try {
        opened = await decodeImage(await file.arrayBuffer(), file.name, file.type);
        if (cancelled) opened.close();
        else setBase(opened);
      } catch {
        // Naming a file that cannot be opened is the run's job.
        if (!cancelled) setBase(null);
      }
    })();

    return () => {
      cancelled = true;
      opened?.close();
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
  }, [file]);

  // The preview is drawn, not encoded. Nothing here produces a file, so moving
  // a slider costs one paint rather than a round trip through the encoder.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !base || !mark || !ready || available <= 0) return;

    let cancelled = false;

    void (async () => {
      const fit = Math.min(available / base.width, PREVIEW_HEIGHT / base.height, 1);
      const width = Math.max(Math.round(base.width * fit), 1);
      const height = Math.max(Math.round(base.height * fit), 1);

      let drawn: ImageBitmap | OffscreenCanvas;
      try {
        drawn = await renderMark(mark);
      } catch {
        return;
      }

      if (cancelled) return;

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) return;

      context.clearRect(0, 0, width, height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(base, 0, 0, width, height);

      // Placement is proportional, so running it against the preview's size
      // gives the same mark in the same place as the run will produce.
      const at = placeMark(
        { width, height },
        { width: drawn.width, height: drawn.height },
        { anchor, scale: scale / 100, margin: margin / 100 },
      );

      context.globalAlpha = opacity / 100;
      context.drawImage(drawn, at.x, at.y, at.width, at.height);
      context.globalAlpha = 1;

      if ('close' in drawn) drawn.close();
    })();

    return () => {
      cancelled = true;
    };
    // `mark` is rebuilt every render; its parts are the real dependencies.
  }, [base, available, kind, text, colour, logo, anchor, scale, margin, opacity, ready]);

  const chooseLogo = async (chosen: File | undefined) => {
    if (!chosen) return;

    setLogoError(null);

    try {
      const bytes = await chosen.arrayBuffer();
      // Opened once here so an unreadable logo is named now, rather than
      // failing later against every image in the batch.
      const probe = await decodeImage(bytes, chosen.name, chosen.type);
      probe.close();
      setLogo({ name: chosen.name, type: chosen.type, bytes });
    } catch {
      setLogo(null);
      setLogoError(`“${chosen.name}” could not be opened as an image.`);
    }
  };

  if (run.state === 'done' && run.result) {
    return (
      <ResultPanel
        manifest={manifest}
        result={run.result}
        inputBytes={run.files.reduce((sum, item) => sum + item.size, 0)}
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
          <div
            ref={frameRef}
            className="bg-bg-inset border-line flex items-center justify-center rounded-xl border p-3"
            style={{ minHeight: PREVIEW_HEIGHT + 24 }}
          >
            {base && ready ? (
              <canvas ref={canvasRef} className="max-w-full rounded" />
            ) : (
              <span className="text-fg-subtle text-sm">
                {!base ? 'Opening…' : 'Write some text, or choose a logo.'}
              </span>
            )}
          </div>

          <fieldset disabled={isRunning}>
            <legend className="text-fg-muted mb-2 text-sm font-medium">Watermark</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  { id: 'text', label: 'Text', help: 'Your name, a copyright line.' },
                  { id: 'logo', label: 'Logo', help: 'A PNG with a see-through background.' },
                ] as const
              ).map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-150',
                    kind === option.id
                      ? 'border-brand bg-brand-soft'
                      : 'border-line hover:border-line-strong',
                  )}
                >
                  <input
                    type="radio"
                    name="kind"
                    checked={kind === option.id}
                    onChange={() => setKind(option.id)}
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

          {kind === 'text' ? (
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="wm-text">Text</Label>
                <Input
                  id="wm-text"
                  value={text}
                  disabled={isRunning}
                  placeholder="© Your name"
                  onChange={(event) => setText(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wm-colour">Colour</Label>
                <div className="flex gap-2" id="wm-colour">
                  {(['white', 'black'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={isRunning}
                      onClick={() => setColour(option)}
                      aria-pressed={colour === option}
                      className={cn(
                        'h-10 rounded-lg border px-4 text-sm capitalize transition-colors duration-150',
                        colour === option
                          ? 'border-brand bg-brand-soft font-medium'
                          : 'border-line hover:border-line-strong',
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="wm-logo">Logo</Label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  id="wm-logo"
                  type="file"
                  accept="image/png,image/webp,image/jpeg"
                  disabled={isRunning}
                  onChange={(event) => void chooseLogo(event.target.files?.[0])}
                  className="file:border-line file:bg-bg-panel hover:file:border-line-strong text-fg-muted max-w-full text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border file:px-3 file:py-2 file:text-sm"
                />
                {logo && (
                  <span className="text-fg-subtle text-xs">{truncateFilename(logo.name, 28)}</span>
                )}
              </div>
              {logoError && <p className="text-danger text-xs">{logoError}</p>}
            </div>
          )}

          <fieldset disabled={isRunning}>
            <legend className="text-fg-muted mb-2 text-sm font-medium">Position</legend>
            <div className="grid w-fit grid-cols-3 gap-1.5">
              {ANCHORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAnchor(option)}
                  aria-pressed={anchor === option}
                  aria-label={ANCHOR_LABEL[option]}
                  title={ANCHOR_LABEL[option]}
                  className={cn(
                    'size-9 rounded-md border transition-colors duration-150',
                    anchor === option
                      ? 'border-brand bg-brand-soft'
                      : 'border-line hover:border-line-strong',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'mx-auto block size-2 rounded-full',
                      anchor === option ? 'bg-brand' : 'bg-fg-subtle/40',
                    )}
                  />
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                { id: 'scale', label: 'Size', value: scale, set: setScale, min: 5, max: 60 },
                { id: 'margin', label: 'Margin', value: margin, set: setMargin, min: 0, max: 20 },
                {
                  id: 'opacity',
                  label: 'Opacity',
                  value: opacity,
                  set: setOpacity,
                  min: 5,
                  max: 100,
                },
              ] as const
            ).map((slider) => (
              <div key={slider.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor={slider.id}>{slider.label}</Label>
                  <span className="text-fg-subtle text-xs tabular-nums">{slider.value}%</span>
                </div>
                <input
                  id={slider.id}
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  value={slider.value}
                  disabled={isRunning}
                  onChange={(event) => slider.set(Number(event.target.value))}
                  className="accent-brand h-10 w-full"
                />
              </div>
            ))}
          </div>

          {run.files.length > 1 && (
            <p className="text-fg-subtle text-xs">
              Size and margin are shares of each image&rsquo;s width, so all {run.files.length} get
              the same watermark rather than the same number of pixels.
            </p>
          )}
        </>
      )}

      {isRunning && <Progress value={run.progress} label={run.progressLabel} />}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="sm:flex-1"
          disabled={run.files.length === 0 || isRunning || !ready}
          onClick={() =>
            mark &&
            void run.run({
              mark,
              placement: { anchor, scale: scale / 100, margin: margin / 100 },
              opacity: opacity / 100,
            })
          }
        >
          {isRunning ? (
            <Loader2 className="animate-spin" />
          ) : kind === 'logo' ? (
            <ImagePlus />
          ) : (
            <Droplet />
          )}
          {isRunning
            ? 'Stamping…'
            : `Watermark ${run.files.length} ${run.files.length === 1 ? 'image' : 'images'}`}
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
