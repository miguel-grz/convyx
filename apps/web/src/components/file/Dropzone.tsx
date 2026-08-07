import { useCallback, useId } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import type { ToolManifest } from '@convyx/tool-contract';
import { cn } from '@/lib/cn';
import { validateFile } from '@/lib/validation';
import { Button } from '@/components/ui/button';

interface DropzoneProps {
  manifest: ToolManifest;
  onAccept: (files: File[]) => void;
  /** One message per rejected file, already written for a human to read. */
  onReject: (messages: string[]) => void;
  compact?: boolean;
  disabled?: boolean;
}

/**
 * The single upload surface for every tool. Accepted types, file count and the
 * size ceiling all come from the manifest, so no tool builds its own picker.
 */
export function Dropzone({ manifest, onAccept, onReject, compact, disabled }: DropzoneProps) {
  const labelId = useId();
  const multiple = manifest.files.max === null || manifest.files.max > 1;

  const handleDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      const problems: string[] = [];
      const good: File[] = [];

      for (const file of accepted) {
        const error = validateFile(file, manifest);
        if (error) problems.push(error.message);
        else good.push(file);
      }

      // react-dropzone rejects on its own `accept` rules; restate those in the
      // product's words rather than surfacing the library's.
      for (const rejection of rejected) {
        const error = validateFile(rejection.file, manifest);
        problems.push(error?.message ?? `“${rejection.file.name}” could not be added.`);
      }

      if (good.length > 0) onAccept(good);
      if (problems.length > 0) onReject(problems);
    },
    [manifest, onAccept, onReject],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleDrop,
    accept: manifest.accepts.mimeTypes,
    multiple,
    maxSize: manifest.maxFileSizeMB * 1024 * 1024,
    disabled,
    noClick: true,
    noKeyboard: true,
  });

  const extensions = Object.values(manifest.accepts.mimeTypes).flat().join(', ');

  return (
    <div
      {...getRootProps()}
      className={cn(
        'rounded-xl border-2 border-dashed text-center transition-colors duration-150',
        isDragActive ? 'border-brand bg-brand-soft' : 'border-line-strong bg-bg-raised/40',
        compact ? 'px-5 py-6' : 'px-6 py-12',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <input {...getInputProps()} aria-labelledby={labelId} />

      <UploadCloud
        aria-hidden
        className={cn(
          'mx-auto',
          compact ? 'size-6' : 'size-8',
          isDragActive ? 'text-brand' : 'text-fg-subtle',
        )}
      />

      <p id={labelId} className={cn('mt-3 font-medium', compact ? 'text-sm' : 'text-base')}>
        {isDragActive
          ? 'Drop to add'
          : `Drag and drop ${multiple ? 'your files' : 'your file'} here`}
      </p>

      <p className="text-fg-subtle mt-1 text-xs">
        {extensions} · up to {manifest.maxFileSizeMB} MB each
      </p>

      <Button
        variant="secondary"
        size={compact ? 'sm' : 'md'}
        className="mt-4"
        onClick={open}
        disabled={disabled}
      >
        Choose {multiple ? 'files' : 'a file'}
      </Button>
    </div>
  );
}
