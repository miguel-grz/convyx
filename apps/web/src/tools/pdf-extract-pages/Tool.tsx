import { useState } from 'react';
import { FileOutput, Loader2 } from 'lucide-react';
import type { ToolComponentProps } from '@convyx/tool-contract';
import { useToolRun } from '@/hooks/useToolRun';
import { usePageCount } from '@/hooks/usePageCount';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dropzone } from '@/components/file/Dropzone';
import { FileList } from '@/components/file/FileList';
import { PageRangeField } from '@/components/file/PageRangeField';
import { ResultPanel } from '@/components/file/ResultPanel';
import { ErrorState } from '@/components/feedback/ErrorState';
import handler, { type ExtractOptions } from './handler';

export default function ExtractPagesTool({ manifest }: ToolComponentProps) {
  const [pages, setPages] = useState('');
  const run = useToolRun<ExtractOptions>(manifest, handler);

  const file = run.files[0];
  const { pageCount, loading } = usePageCount(file);

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

      <FileList files={run.files} onRemove={run.removeFile} disabled={isRunning} />

      {run.error && <ErrorState error={run.error.toPayload()} onDismiss={run.dismissError} />}

      {file && (
        <PageRangeField
          value={pages}
          onChange={setPages}
          pageCount={pageCount}
          loading={loading}
          disabled={isRunning}
        />
      )}

      {isRunning && <Progress value={run.progress} label={run.progressLabel} />}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="sm:flex-1"
          disabled={!file || !pages.trim() || isRunning}
          onClick={() => void run.run({ pages })}
        >
          {isRunning ? <Loader2 className="animate-spin" /> : <FileOutput />}
          {isRunning ? 'Extracting…' : 'Extract pages'}
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
