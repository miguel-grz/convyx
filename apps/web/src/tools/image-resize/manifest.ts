import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'image-resize',
  transform: { from: 'PNG', to: 'PNG', note: 'resized' },
  name: 'Resize image',
  category: 'image',
  summary: 'Change dimensions by pixels or percentage.',
  description:
    'Resize one image or a whole batch, with the aspect ratio locked by default. Give a width,' +
    ' a height or both, and every image fits inside it without being stretched.',
  icon: 'scaling',
  keywords: ['scale', 'dimensions', 'width', 'redimensionar'],
  processing: 'client',
  status: 'available',
  accepts: ACCEPTS.raster,
  files: { min: 1, max: null },
  maxFileSizeMB: 50,
  output: OUTPUTS.zip,
};

export default manifest;
