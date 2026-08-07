import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-rotate',
  transform: { from: 'PDF', to: 'PDF', note: 'rotated' },
  name: 'Rotate PDF',
  category: 'pdf',
  summary: 'Turn pages the right way up.',
  description:
    'Turn every page at once, or name just the ones you want. The rotation is written' +
    ' into the file, so it stays correct in every reader.',
  icon: 'rotate-cw',
  keywords: ['turn', 'orientation', 'landscape', 'rotar'],
  processing: 'client',
  status: 'available',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 100,
  output: OUTPUTS.pdf,
};

export default manifest;
