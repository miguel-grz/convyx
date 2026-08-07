import { useState } from 'react';
import { Loader2, Merge } from 'lucide-react';
import type { ToolComponentProps } from '@convyx/tool-contract';
import { useToolRun } from '@/hooks/useToolRun';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dropzone } from '@/components/file/Dropzone';
import { FileList } from '@/components/file/FileList';
import { ResultPanel } from '@/components/file/ResultPanel';
import { ErrorState } from '@/components/feedback/ErrorState';
import handler, { type MergeOptions } from './handler';

export default function MergePdfTool({ manifest }: ToolComponentProps) {
  const [filename, setFilename] = useState('');
  const run = useToolRun<MergeOptions>(manifest, handler);

  const isRunning = run.state === 'running';
  const inputBytes = run.files.reduce((sum, file) => sum + file.size, 0);
  const missing = Math.max(manifest.files.min - run.files.length, 0);

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

      <FileList
        files={run.files}
        onRemove={run.removeFile}
        onMove={run.moveFile}
        disabled={isRunning}
      />

      {run.error && <ErrorState error={run.error.toPayload()} onDismiss={run.dismissError} />}

      {run.files.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="merge-filename">Name your file</Label>
          <div className="flex items-center gap-2">
            <Input
              id="merge-filename"
              value={filename}
              disabled={isRunning}
              placeholder="merged"
              onChange={(event) => setFilename(event.target.value)}
            />
            <span className="text-fg-subtle text-sm">.pdf</span>
          </div>
        </div>
      )}

      {isRunning && <Progress value={run.progress} label={run.progressLabel} />}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="sm:flex-1"
          disabled={missing > 0 || isRunning}
          onClick={() => void run.run({ filename })}
        >
          {isRunning ? <Loader2 className="animate-spin" /> : <Merge />}
          {isRunning
            ? 'Merging…'
            : missing > 0
              ? `Add ${missing} more ${missing === 1 ? 'PDF' : 'PDFs'}`
              : `Merge ${run.files.length} PDFs`}
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
