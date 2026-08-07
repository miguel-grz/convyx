import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ToolError,
  ToolHandler,
  ToolManifest,
  ToolRunOutput,
} from '@convyx/tool-contract';
import { toToolError, validateSelection } from '@/lib/validation';

export type RunState = 'idle' | 'running' | 'done' | 'error';

interface UseToolRunResult<TOptions> {
  files: File[];
  addFiles: (incoming: File[]) => void;
  removeFile: (index: number) => void;
  moveFile: (from: number, to: number) => void;

  state: RunState;
  progress: number | null;
  progressLabel: string | undefined;
  result: ToolRunOutput | null;
  error: ToolError | null;
  /** Non-fatal problems, e.g. two of five dropped files were the wrong type. */
  notices: string[];
  reportNotices: (messages: string[]) => void;

  run: (options: TOptions) => Promise<void>;
  cancel: () => void;
  reset: () => void;
  dismissError: () => void;
  dismissNotices: () => void;
}

/**
 * Everything a tool page needs to go from "no files" to "here is your result".
 *
 * Tools own their options and their handler; this hook owns the selection, the
 * lifecycle, cancellation and error normalisation, so 26 tools do not each
 * reinvent that state machine.
 */
export function useToolRun<TOptions>(
  manifest: ToolManifest,
  handler: ToolHandler<TOptions>,
): UseToolRunResult<TOptions> {
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<RunState>('idle');
  const [progress, setProgress] = useState<number | null>(null);
  const [progressLabel, setProgressLabel] = useState<string | undefined>();
  const [result, setResult] = useState<ToolRunOutput | null>(null);
  const [error, setError] = useState<ToolError | null>(null);
  const [notices, setNotices] = useState<string[]>([]);

  const controllerRef = useRef<AbortController | null>(null);

  // A run that outlives its page would keep working for nothing.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const addFiles = useCallback(
    (incoming: File[]) => {
      setError(null);
      setResult(null);
      setState('idle');
      setFiles((current) => {
        const single = manifest.files.max === 1;
        const next = single ? incoming.slice(-1) : [...current, ...incoming];
        return manifest.files.max === null ? next : next.slice(0, manifest.files.max);
      });
    },
    [manifest.files.max],
  );

  const reportNotices = useCallback((messages: string[]) => {
    setNotices(messages);
  }, []);

  const removeFile = useCallback((index: number) => {
    setResult(null);
    setState('idle');
    setFiles((current) => current.filter((_, i) => i !== index));
  }, []);

  const moveFile = useCallback((from: number, to: number) => {
    setFiles((current) => {
      if (to < 0 || to >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      if (moved) next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState('idle');
    setProgress(null);
    setProgressLabel(undefined);
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setFiles([]);
    setState('idle');
    setProgress(null);
    setProgressLabel(undefined);
    setResult(null);
    setError(null);
    setNotices([]);
  }, []);

  const run = useCallback(
    async (options: TOptions) => {
      const invalid = validateSelection(files, manifest);
      if (invalid) {
        setError(invalid);
        setState('error');
        return;
      }

      const controller = new AbortController();
      controllerRef.current = controller;

      setState('running');
      setError(null);
      setResult(null);
      setProgress(null);
      setProgressLabel(undefined);

      try {
        const output = await handler({
          files,
          options,
          signal: controller.signal,
          onProgress: (value, label) => {
            if (controller.signal.aborted) return;
            setProgress(value);
            setProgressLabel(label);
          },
        });

        if (controller.signal.aborted) return;

        setResult(output);
        setState('done');
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(toToolError(cause));
        setState('error');
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
    [files, handler, manifest],
  );

  return {
    files,
    addFiles,
    removeFile,
    moveFile,
    state,
    progress,
    progressLabel,
    result,
    error,
    notices,
    reportNotices,
    run,
    cancel,
    reset,
    dismissError: () => setError(null),
    dismissNotices: () => setNotices([]),
  };
}
