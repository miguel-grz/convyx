import { ToolError, type ToolManifest } from '@convyx/tool-contract';
import { formatBytes } from './format';

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot > 0 ? filename.slice(dot).toLowerCase() : '';
}

function acceptedExtensions(manifest: ToolManifest): string[] {
  return Object.values(manifest.accepts.mimeTypes).flat();
}

/**
 * Browsers are inconsistent about `File.type` — it is empty for many files on
 * Linux and wrong for some on Windows — so the extension is the fallback, not
 * the other way around. This is a usability check; the server repeats it with
 * real content sniffing for server-side tools.
 */
export function isAcceptedType(file: File, manifest: ToolManifest): boolean {
  const declared = Object.keys(manifest.accepts.mimeTypes);
  if (file.type && declared.includes(file.type)) return true;

  return acceptedExtensions(manifest).includes(extensionOf(file.name));
}

/** Returns the first problem with a candidate file, or `null` if it is fine. */
export function validateFile(file: File, manifest: ToolManifest): ToolError | null {
  if (!isAcceptedType(file, manifest)) {
    return new ToolError(
      'UNSUPPORTED_TYPE',
      `“${file.name}” is not a ${manifest.accepts.label} file.`,
      { hint: `This tool accepts ${acceptedExtensions(manifest).join(', ')}.` },
    );
  }

  const limitBytes = manifest.maxFileSizeMB * 1024 * 1024;
  if (file.size > limitBytes) {
    return new ToolError(
      'FILE_TOO_LARGE',
      `“${file.name}” is ${formatBytes(file.size)}, over the ${manifest.maxFileSizeMB} MB limit.`,
      { hint: 'Try compressing it first, or split it into smaller files.' },
    );
  }

  if (file.size === 0) {
    return new ToolError('CORRUPT_FILE', `“${file.name}” is empty.`);
  }

  return null;
}

/** Validates the whole selection right before a run. */
export function validateSelection(files: File[], manifest: ToolManifest): ToolError | null {
  const { min, max } = manifest.files;

  if (files.length < min) {
    return new ToolError(
      'TOO_FEW_FILES',
      min === 1
        ? 'Add a file to get started.'
        : `This tool needs at least ${min} files — you have ${files.length}.`,
    );
  }

  if (max !== null && files.length > max) {
    return new ToolError(
      'TOO_MANY_FILES',
      `This tool takes at most ${max} ${max === 1 ? 'file' : 'files'} at a time.`,
      { hint: 'Remove the extra files and run it again.' },
    );
  }

  for (const file of files) {
    const problem = validateFile(file, manifest);
    if (problem) return problem;
  }

  return null;
}

/** Normalises anything thrown by a handler into something the UI can render. */
export function toToolError(cause: unknown): ToolError {
  if (cause instanceof ToolError) return cause;

  if (cause instanceof DOMException && cause.name === 'AbortError') {
    return new ToolError('CANCELLED', 'You stopped this run.');
  }

  return new ToolError('PROCESSING_FAILED', 'This file could not be processed.', {
    hint: 'It may be corrupt or protected. Try another file, or a different tool.',
    cause,
  });
}
