import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-ocr',
  transform: { from: 'PDF', to: 'PDF', note: 'searchable' },
  name: 'OCR PDF',
  category: 'pdf',
  summary: 'Make a scanned PDF searchable.',
  description:
    'Runs Tesseract over each page and layers the recognised text behind the original scan,' +
    ' so the document looks identical but you can select and search it.',
  icon: 'scan-text',
  keywords: ['scan', 'text', 'searchable', 'tesseract'],
  processing: 'server',
  status: 'planned',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 100,
  output: OUTPUTS.pdf,
  endpoint: '/api/v1/tools/pdf-ocr',
  featured: true,
};

export default manifest;
