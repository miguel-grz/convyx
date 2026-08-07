/**
 * The contract every Convyx tool speaks.
 *
 * This package is the single source of truth shared by the web app and (from
 * phase 3 onwards) the API. A tool is described by data, never by code that
 * lives in the app shell: the router, the navigation, the catalog and the
 * search index are all derived from the manifests below.
 */

export const TOOL_CATEGORIES = ['pdf', 'image', 'audio', 'video', 'document', 'generator'] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export interface CategoryMeta {
  id: ToolCategory;
  label: string;
  /** Short line shown under the category heading in the catalog. */
  tagline: string;
  /** lucide-react icon name, kebab-case (see `lucide-react/dynamic`). */
  icon: string;
}

/**
 * Categories are data too — adding `audio` to the catalog is an entry here plus
 * a tool folder, with no change to the layout or the router.
 */
export const CATEGORY_META: Record<ToolCategory, CategoryMeta> = {
  pdf: {
    id: 'pdf',
    label: 'PDF',
    tagline: 'Merge, split, convert and secure PDF documents.',
    icon: 'file-text',
  },
  image: {
    id: 'image',
    label: 'Image',
    tagline: 'Convert, compress and edit images without losing quality.',
    icon: 'image',
  },
  audio: {
    id: 'audio',
    label: 'Audio',
    tagline: 'Convert and compress audio files.',
    icon: 'audio-lines',
  },
  video: {
    id: 'video',
    label: 'Video',
    tagline: 'Convert, compress and extract audio from video.',
    icon: 'video',
  },
  document: {
    id: 'document',
    label: 'Document',
    tagline: 'Convert between document and eBook formats.',
    icon: 'book-open',
  },
  generator: {
    id: 'generator',
    label: 'Generator',
    tagline: 'Create QR codes, barcodes and other assets.',
    icon: 'sparkles',
  },
};

/**
 * Where the work happens.
 *
 * `client` means the file never leaves the browser. That is the default and it
 * is a product promise, not an implementation detail — only reach for `server`
 * when the operation genuinely cannot be done well in WASM.
 */
export type ProcessingMode = 'client' | 'server';

/** `planned` tools appear in the catalog and roadmap but cannot be run yet. */
export type ToolStatus = 'available' | 'planned';

export interface AcceptSpec {
  /**
   * Mapping consumed directly by react-dropzone: mime type -> extensions.
   * Example: `{ 'application/pdf': ['.pdf'] }`
   */
  mimeTypes: Record<string, string[]>;
  /** Human readable list for the dropzone hint, e.g. "PDF". */
  label: string;
}

export interface FileCountSpec {
  min: number;
  /** `null` means unbounded (subject to the total size limit). */
  max: number | null;
}

export interface OutputSpec {
  /** A single file, or several files bundled into a zip archive. */
  kind: 'file' | 'archive';
  mimeType: string;
  extension: string;
}

/**
 * Presets so 25 manifests do not restate the same mime tables. A tool with an
 * unusual input still declares its own `AcceptSpec` inline.
 */
export const ACCEPTS = {
  pdf: {
    mimeTypes: { 'application/pdf': ['.pdf'] },
    label: 'PDF',
  },
  image: {
    mimeTypes: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/avif': ['.avif'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tif', '.tiff'],
    },
    label: 'image',
  },
  /** Formats the browser can reliably decode into a canvas. */
  raster: {
    mimeTypes: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    label: 'PNG, JPG or WEBP',
  },
  office: {
    mimeTypes: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.oasis.opendocument.text': ['.odt'],
      'application/vnd.oasis.opendocument.spreadsheet': ['.ods'],
      'application/vnd.oasis.opendocument.presentation': ['.odp'],
    },
    label: 'Office document',
  },
} satisfies Record<string, AcceptSpec>;

export const OUTPUTS = {
  pdf: { kind: 'file', mimeType: 'application/pdf', extension: '.pdf' },
  zip: { kind: 'archive', mimeType: 'application/zip', extension: '.zip' },
  png: { kind: 'file', mimeType: 'image/png', extension: '.png' },
  jpg: { kind: 'file', mimeType: 'image/jpeg', extension: '.jpg' },
  svg: { kind: 'file', mimeType: 'image/svg+xml', extension: '.svg' },
  docx: {
    kind: 'file',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: '.docx',
  },
  xlsx: {
    kind: 'file',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
  },
  pptx: {
    kind: 'file',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extension: '.pptx',
  },
} satisfies Record<string, OutputSpec>;

/**
 * What the tool turns one thing into.
 *
 * Every tool in this product is a transform, so the catalog is indexed by the
 * transform rather than by a name: you find a tool by what you have and what
 * you want. `+` marks a variable count, which is how merge (`PDF+ → PDF`) and
 * split (`PDF → PDF+`) read differently despite touching the same format.
 */
export interface TransformSpec {
  /** Short uppercase format token, e.g. `PDF`, `JPG`, `DOCX`, `PDF+`. */
  from: string;
  to: string;
  /** Set when `from` and `to` match, to say what actually changed. */
  note?: string;
}

export interface ToolManifest {
  /** Stable slug. Must equal the tool's folder name and is used as the URL. */
  id: string;
  transform: TransformSpec;
  name: string;
  category: ToolCategory;
  /** One line, shown on the catalog card. */
  summary: string;
  /** Two or three sentences, shown on the tool page. */
  description: string;
  /** lucide-react icon name, kebab-case (see `lucide-react/dynamic`). */
  icon: string;
  /** Extra search terms beyond the name and summary. */
  keywords: string[];
  processing: ProcessingMode;
  status: ToolStatus;
  accepts: AcceptSpec;
  files: FileCountSpec;
  maxFileSizeMB: number;
  output: OutputSpec;
  /** Server tools only: the API path the handler posts to. */
  endpoint?: string;
  /** Surfaced on the landing page. */
  featured?: boolean;
}

/** Progress in the 0..1 range, or `null` when the step is indeterminate. */
export type ProgressReporter = (progress: number | null, label?: string) => void;

export interface ToolRunInput<TOptions = Record<string, never>> {
  files: File[];
  options: TOptions;
  signal: AbortSignal;
  onProgress: ProgressReporter;
}

export interface ToolRunOutput {
  blob: Blob;
  filename: string;
}

export type ToolHandler<TOptions = Record<string, never>> = (
  input: ToolRunInput<TOptions>,
) => Promise<ToolRunOutput>;

/** Props the generic tool page passes to every `Tool.tsx`. */
export interface ToolComponentProps {
  manifest: ToolManifest;
}

/* -------------------------------------------------------------------------- */
/* Async jobs (server tools, phase 3+)                                        */
/* -------------------------------------------------------------------------- */

export type JobState = 'queued' | 'running' | 'succeeded' | 'failed' | 'expired';

export interface JobStatus {
  id: string;
  toolId: string;
  state: JobState;
  /** 0..1 when the worker can report it. */
  progress: number | null;
  /** Present when `state === 'succeeded'`. */
  resultUrl?: string;
  /** Present when `state === 'failed'`. */
  error?: ToolErrorPayload;
  /** ISO timestamp after which the server deletes every artifact of this job. */
  expiresAt: string;
}

/* -------------------------------------------------------------------------- */
/* Errors                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A closed set of failure reasons so the UI can always show something specific.
 * "Something went wrong" is never an acceptable message in this product.
 */
export const TOOL_ERROR_CODES = [
  'FILE_TOO_LARGE',
  'TOO_MANY_FILES',
  'TOO_FEW_FILES',
  'UNSUPPORTED_TYPE',
  'CORRUPT_FILE',
  'PASSWORD_REQUIRED',
  'WRONG_PASSWORD',
  'PROCESSING_FAILED',
  'CANCELLED',
  'NETWORK',
  'JOB_EXPIRED',
  'RATE_LIMITED',
] as const;

export type ToolErrorCode = (typeof TOOL_ERROR_CODES)[number];

export interface ToolErrorPayload {
  code: ToolErrorCode;
  /** Message written for the person using the app, not for a log file. */
  message: string;
  /** Optional next step, e.g. "Try removing the password first". */
  hint?: string;
}

export class ToolError extends Error implements ToolErrorPayload {
  readonly code: ToolErrorCode;
  readonly hint?: string;

  constructor(code: ToolErrorCode, message: string, options?: { hint?: string; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = 'ToolError';
    this.code = code;
    this.hint = options?.hint;
  }

  toPayload(): ToolErrorPayload {
    return { code: this.code, message: this.message, hint: this.hint };
  }
}
