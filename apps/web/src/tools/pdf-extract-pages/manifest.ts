import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-extract-pages',
  transform: { from: 'PDF', to: 'PDF', note: 'fewer pages' },
  name: 'Extract PDF pages',
  category: 'pdf',
  summary: 'Pull specific pages out into a new PDF.',
  description:
    'Type a page range like 1-3, 7, 12- and get exactly those pages as a new document. The' +
    ' original file is left untouched.',
  icon: 'file-output',
  keywords: ['select', 'pages', 'subset', 'extraer'],
  processing: 'client',
  status: 'planned',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 100,
  output: OUTPUTS.pdf,
};

export default manifest;
