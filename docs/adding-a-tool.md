# Adding a tool

Four files in one folder. No edits anywhere else — not the router, not the
navigation, not the catalog, not the search index.

We will add "Rotate PDF" as the example.

## 1. Create the folder

The folder name is the tool's id and its URL, so `pdf-rotate` becomes
`/tools/pdf-rotate`. The registry enforces that they match.

```
apps/web/src/tools/pdf-rotate/
```

## 2. `manifest.ts` — what it is

```ts
import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-rotate', // must equal the folder name
  transform: { from: 'PDF', to: 'PDF', note: 'rotated' },
  name: 'Rotate PDF',
  category: 'pdf',
  summary: 'Turn pages the right way up.',
  description: 'Rotate every page at once or pick individual pages…',
  icon: 'rotate-cw', // kebab-case lucide name
  keywords: ['turn', 'orientation', 'landscape'],
  processing: 'client',
  status: 'available',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 100,
  output: OUTPUTS.pdf,
};

export default manifest;
```

`transform` is what the catalog indexes on — people look for a tool by what they
have and what they want. Add a `note` whenever `from` and `to` are the same
format, otherwise ten PDF tools all read `PDF → PDF` and none of them are
distinguishable.

Set `status: 'planned'` to list a tool in the catalog before it works. Planned
tools need no other file; the generic tool page renders a "not built yet" state.

## 3. `rotate.ts` — what it does

Plain function, no DOM, no worker. This is the part that gets tested.

```ts
import { PDFDocument, degrees } from 'pdf-lib';
import { ToolError, type ProgressReporter } from '@convyx/tool-contract';

export async function rotatePdf(
  bytes: ArrayBuffer,
  angle: number,
  report: ProgressReporter,
): Promise<ArrayBuffer> {
  const document = await PDFDocument.load(bytes);
  const pages = document.getPages();

  pages.forEach((page, index) => {
    report(index / pages.length, 'Rotating pages');
    page.setRotation(degrees(page.getRotation().angle + angle));
  });

  return new Uint8Array(await document.save()).buffer;
}
```

Throw `ToolError` with a specific code for anything a user can cause. The
`ToolErrorCode` union exists so the UI never has to say "something went wrong" —
if none of the codes fits your failure, add one to the contract rather than
falling back to a generic message.

## 4. `worker.ts` — where it runs

Only for work heavy enough to stutter the main thread. A three-line shell:

```ts
import { expose } from '@/workers/expose';
import { rotatePdf } from './rotate';

expose<{ bytes: ArrayBuffer; angle: number }, ArrayBuffer>(
  ({ bytes, angle }, { report }) => rotatePdf(bytes, angle, report),
  (result) => [result],
);
```

## 5. `handler.ts` — the glue

```ts
import type { ToolHandler } from '@convyx/tool-contract';
import { runInWorker } from '@/workers/runInWorker';
import { stripExtension } from '@/lib/format';

export interface RotateOptions {
  angle: number;
}

const handler: ToolHandler<RotateOptions> = async ({ files, options, signal, onProgress }) => {
  const [file] = files;
  const bytes = await file!.arrayBuffer();

  const result = await runInWorker<{ bytes: ArrayBuffer; angle: number }, ArrayBuffer>(
    () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    { bytes, angle: options.angle },
    { signal, onProgress, transfer: [bytes] },
  );

  return {
    blob: new Blob([result], { type: 'application/pdf' }),
    filename: `${stripExtension(file!.name)}-rotated.pdf`,
  };
};

export default handler;
```

For a server tool, skip the worker: post to `manifest.endpoint` and poll the job
endpoint instead.

## 6. `Tool.tsx` — what it looks like

`useToolRun` owns the file selection, the run lifecycle, cancellation and error
normalisation. Your component owns the options and the layout.

```tsx
import { useState } from 'react';
import type { ToolComponentProps } from '@convyx/tool-contract';
import { useToolRun } from '@/hooks/useToolRun';
import { Dropzone } from '@/components/file/Dropzone';
import { FileList } from '@/components/file/FileList';
import { ResultPanel } from '@/components/file/ResultPanel';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import handler, { type RotateOptions } from './handler';

export default function RotatePdfTool({ manifest }: ToolComponentProps) {
  const [angle, setAngle] = useState(90);
  const run = useToolRun<RotateOptions>(manifest, handler);

  if (run.state === 'done' && run.result) {
    return <ResultPanel manifest={manifest} result={run.result} onReset={run.reset} />;
  }

  return (
    <div className="space-y-4">
      <Dropzone manifest={manifest} onAccept={run.addFiles} onReject={run.reportNotices} />
      <FileList files={run.files} onRemove={run.removeFile} />
      {run.error && <ErrorState error={run.error.toPayload()} onDismiss={run.dismissError} />}
      {run.state === 'running' && <Progress value={run.progress} label={run.progressLabel} />}
      <Button size="lg" onClick={() => void run.run({ angle })}>
        Rotate
      </Button>
    </div>
  );
}
```

Reuse the shared components. If a tool needs an upload surface that `Dropzone`
cannot express, change `Dropzone` — a bespoke picker in one tool is how 26 tools
end up looking like 26 different products.

## 7. `rotate.test.ts`

Test the logic module, not the component. Build real input with pdf-lib, run it,
reopen the output and assert on it — a result that cannot be reopened is not a
PDF, it is bytes.

## That is all

```bash
pnpm test        # registry invariants + your logic
pnpm typecheck
pnpm dev
```

The tool now has a route, a catalog card, a search entry, a spot in the category
nav, and a line on the privacy page.
