import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'image-rotate',
  transform: { from: 'PNG', to: 'PNG', note: 'rotated' },
  name: 'Rotate image',
  category: 'image',
  summary: 'Rotate or flip images.',
  description:
    'Turn in 90° steps or flip horizontally and vertically. Applies to a whole batch at once.',
  icon: 'flip-horizontal',
  keywords: ['flip', 'mirror', 'turn', 'voltear'],
  processing: 'client',
  status: 'available',
  accepts: ACCEPTS.raster,
  files: { min: 1, max: null },
  maxFileSizeMB: 50,
  output: OUTPUTS.zip,
};

export default manifest;
