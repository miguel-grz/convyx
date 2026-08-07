import { CheckCircle2, Download, RotateCcw } from 'lucide-react';
import type { ToolManifest, ToolRunOutput } from '@convyx/tool-contract';
import { formatBytes, sizeDelta, truncateFilename } from '@/lib/format';
import { downloadBlob } from '@/lib/download';
import { Button } from '@/components/ui/button';

interface ResultPanelProps {
  manifest: ToolManifest;
  result: ToolRunOutput;
  /** Combined input size, used to show how much the file changed. */
  inputBytes?: number;
  onReset: () => void;
}

/** What you got, how big it is, and the one button that matters. */
export function ResultPanel({ manifest, result, inputBytes, onReset }: ResultPanelProps) {
  const delta = inputBytes ? sizeDelta(inputBytes, result.blob.size) : null;

  return (
    <div className="border-ok/25 bg-ok-soft/40 rounded-xl border p-6 text-center sm:p-8">
      <CheckCircle2 className="text-ok mx-auto size-9" aria-hidden />

      <h2 className="mt-4 text-xl">Your file is ready</h2>

      <p className="text-fg-muted mt-1.5 text-sm break-all">
        {truncateFilename(result.filename, 44)} · {formatBytes(result.blob.size)}
        {delta !== null && delta < 0 && (
          <span className="text-ok font-medium"> ({Math.abs(delta)}% smaller)</span>
        )}
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button size="lg" onClick={() => downloadBlob(result.blob, result.filename)}>
          <Download />
          Download
        </Button>
        <Button variant="secondary" size="lg" onClick={onReset}>
          <RotateCcw />
          Start over
        </Button>
      </div>

      <p className="text-fg-subtle mt-5 text-xs">
        {manifest.processing === 'client'
          ? 'This file only exists in this tab. Closing the page discards it.'
          : 'The copy on our server is already scheduled for deletion.'}
      </p>
    </div>
  );
}
