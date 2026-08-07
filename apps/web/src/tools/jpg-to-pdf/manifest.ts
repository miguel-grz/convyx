import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'jpg-to-pdf',
  transform: { from: 'JPG+', to: 'PDF' },
  name: 'JPG to PDF',
  category: 'pdf',
  summary: 'Turn images into a single PDF.',
  description:
    'Add photos or scans, order them, and get one PDF. Page size, orientation and margins are' +
    ' yours to set.',
  icon: 'file-image',
  keywords: ['image to pdf', 'png', 'photo', 'imagen a pdf'],
  processing: 'client',
  status: 'available',
  accepts: ACCEPTS.image,
  files: { min: 1, max: null },
  maxFileSizeMB: 100,
  output: OUTPUTS.pdf,
};

export default manifest;
